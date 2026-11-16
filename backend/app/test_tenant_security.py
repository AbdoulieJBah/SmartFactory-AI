"""Tenant and demo regression checks against an isolated database, never live data."""
import pytest
from auth import create_access_token
from database import get_db
from models import Company, User, UserCompany, Product
import main

@pytest.fixture
def tenants(client):
    session_gen = main.app.dependency_overrides[get_db]()
    db = next(session_gen)
    a, b = Company(name='Tenant A'), Company(name='Tenant B')
    db.add_all([a,b]); db.flush()
    users = {}
    for name, role, company in [('viewer','Viewer',a),('manager','Plant Manager',a),('admin','Company Admin',a),('other','Plant Manager',b),('root','Super Admin',a)]:
        user=User(full_name=name,email=f'{name}@example.com',password_hash='not-a-login-hash',role=role)
        db.add(user); db.flush()
        db.add(UserCompany(user_id=user.id,company_id=company.id,role=role))
        users[name]=user
    pa=Product(company_id=a.id,sku='A-1',name='A product')
    pb=Product(company_id=b.id,sku='B-1',name='B product')
    db.add_all([pa,pb]); db.commit()
    headers={k:{'Authorization':'Bearer '+create_access_token({'user_id':v.id,'role':v.role})} for k,v in users.items()}
    yield db,a,b,users,headers,pa,pb
    session_gen.close()

@pytest.mark.parametrize('actor',['viewer','manager','admin'])
def test_company_detail_is_tenant_scoped(client,tenants,actor):
    db,a,b,users,h,pa,pb=tenants
    assert client.get(f'/companies/{a.id}',headers=h[actor]).status_code==200
    assert client.get(f'/companies/{b.id}',headers=h[actor]).status_code==404

@pytest.mark.parametrize('path',['/companies/','/companies/assignments/all','/users/'])
def test_management_lists_do_not_leak_other_tenant(client,tenants,path):
    db,a,b,users,h,pa,pb=tenants
    response=client.get(path,headers=h['manager'])
    assert response.status_code==200
    rows=response.json()
    if path=='/companies/': assert {r['id'] for r in rows}=={a.id}
    elif path=='/users/': assert users['other'].id not in {r['id'] for r in rows}
    else: assert all(r['company_id']==a.id for r in rows)

@pytest.mark.parametrize('method,path,payload',[
 ('post','/products/',{'sku':'INJECT','name':'Forbidden'}),
 ('put','/products/{id}',{'sku':'CHANGED','name':'Forbidden'}),
 ('delete','/products/{id}',None),
 ('post','/companies/assign-user',{'user_id':1,'company_id':1,'role':'Super Admin'}),
])
def test_viewer_cannot_write(client,tenants,method,path,payload):
    db,a,b,users,h,pa,pb=tenants
    before=[(p.id,p.sku,p.name) for p in db.query(Product).order_by(Product.id)]
    memberships=db.query(UserCompany).count()
    response=client.request(method,path.format(id=pa.id),headers=h['viewer'],json=payload)
    assert response.status_code==403
    db.expire_all()
    assert [(p.id,p.sku,p.name) for p in db.query(Product).order_by(Product.id)]==before
    assert db.query(UserCompany).count()==memberships

def test_viewer_reads_only_own_products(client,tenants):
    db,a,b,users,h,pa,pb=tenants
    r=client.get('/products/',headers=h['viewer'])
    assert r.status_code==200
    assert {p['id'] for p in r.json()}=={pa.id}
    assert client.get(f'/products/{pb.id}',headers=h['viewer']).status_code==404

def test_role_downgrade_applies_to_existing_token(client,tenants):
    db,a,b,users,h,pa,pb=tenants
    users['manager'].role='Viewer'; db.commit()
    r=client.post('/products/',headers=h['manager'],json={'sku':'NEW','name':'Blocked'})
    assert r.status_code==403
    assert db.query(Product).filter(Product.sku=='NEW').count()==0

def test_super_admin_retains_company_visibility(client,tenants):
    db,a,b,users,h,pa,pb=tenants
    assert client.get(f'/companies/{b.id}',headers=h['root']).status_code==200
    assert {r['id'] for r in client.get('/companies/',headers=h['root']).json()}=={a.id,b.id}

@pytest.mark.parametrize('actor', ['viewer', 'manager', 'admin'])
def test_global_audit_log_not_available_to_tenant_users(client, tenants, actor):
    db,a,b,users,h,pa,pb=tenants
    assert client.get('/audit-logs/', headers=h[actor]).status_code == 403

def test_super_admin_can_read_global_audit_log(client, tenants):
    db,a,b,users,h,pa,pb=tenants
    assert client.get('/audit-logs/', headers=h['root']).status_code == 200

@pytest.mark.parametrize('path', ['/companies/', '/companies/assignments/all', '/users/'])
def test_unassigned_manager_cannot_read_tenant_lists(client, tenants, path):
    db,a,b,users,h,pa,pb=tenants
    db.query(UserCompany).filter(UserCompany.user_id == users['manager'].id).delete()
    db.commit()
    response = client.get(path, headers=h['manager'])
    assert response.status_code == 200
    assert response.json() == []

def test_foreign_product_cannot_be_changed_by_manager(client, tenants):
    db,a,b,users,h,pa,pb=tenants
    original = (pb.name, pb.sku)
    response = client.put(f'/products/{pb.id}', headers=h['manager'],
                          json={'sku': 'STOLEN', 'name': 'Changed'})
    assert response.status_code == 404
    assert client.delete(f'/products/{pb.id}', headers=h['manager']).status_code == 404
    db.refresh(pb)
    assert (pb.name, pb.sku) == original

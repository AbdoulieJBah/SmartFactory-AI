import pytest
from sqlalchemy import select
from database import get_db
from auth import verify_password
from demo_admin import provision_demo, rotate_password, DEMO_COMPANY
from models import Base, User, Company, UserCompany, Product
import main

PASSWORD = 'synthetic-test-password-12345'

@pytest.fixture
def db(client):
    generator = main.app.dependency_overrides[get_db]()
    session = next(generator)
    yield session
    generator.close()


def test_demo_login_read_and_write_denial(client, db):
    user = provision_demo(db, 'demo@example.com', PASSWORD)
    db.commit()
    assert user.role == 'Viewer'
    login = client.post('/auth/login-json', json={'email': user.email, 'password': PASSWORD})
    assert login.status_code == 200
    headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
    products = client.get('/products/', headers=headers)
    assert products.status_code == 200
    assert len(products.json()) == 3
    for path in ['/dashboard/', '/inventory/', '/reports/executive', '/forecasting/', '/oee/']:
        assert client.get(path, headers=headers).status_code == 200
    assert client.post('/products/', headers=headers, json={'sku':'BAD','name':'Bad'}).status_code == 403
    assert client.get('/audit-logs/', headers=headers).status_code == 403
    before = {t.name: db.execute(select(t)).all() for t in Base.metadata.sorted_tables if t.name != 'users'}
    provision_demo(db, user.email, PASSWORD + '-new')
    db.commit()
    assert {t.name: db.execute(select(t)).all() for t in Base.metadata.sorted_tables if t.name != 'users'} == before
    assert verify_password(PASSWORD + '-new', user.password_hash)


def test_demo_never_repurposes_admin(client, db):
    user = User(email='admin@example.com', full_name='Administrator', role='Super Admin', password_hash='unchanged')
    db.add(user)
    db.commit()
    with pytest.raises(ValueError):
        provision_demo(db, user.email, PASSWORD)
    assert user.password_hash == 'unchanged'
    assert user.role == 'Super Admin'
    assert db.query(Company).filter_by(name=DEMO_COMPANY).count() == 0


def test_demo_refuses_additional_memberships(client, db):
    user = provision_demo(db, 'demo@example.com', PASSWORD)
    other = Company(name='Private company')
    db.add(other)
    db.flush()
    db.add(UserCompany(user_id=user.id, company_id=other.id, role='Viewer'))
    db.commit()
    before = user.password_hash
    with pytest.raises(ValueError):
        provision_demo(db, user.email, PASSWORD + '-changed')
    assert user.password_hash == before


def test_rotation_changes_password_not_role_or_business_data(client, db):
    user = provision_demo(db, 'demo@example.com', PASSWORD)
    db.commit()
    rotate_password(db, user.email, PASSWORD + '-rotated')
    db.commit()
    assert not verify_password(PASSWORD, user.password_hash)
    assert verify_password(PASSWORD + '-rotated', user.password_hash)
    assert user.role == 'Viewer'
    assert db.query(Product).count() == 3


def test_registration_can_be_disabled(client, db, monkeypatch):
    monkeypatch.setenv('ALLOW_REGISTRATION', 'false')
    response = client.post('/auth/register', json={
        'full_name':'Blocked', 'email':'blocked@example.com',
        'password':PASSWORD, 'company_name':'Blocked company',
    })
    assert response.status_code == 403
    assert db.query(User).count() == 0
    assert db.query(Company).count() == 0


def test_untrusted_vercel_origin_is_rejected(client):
    response = client.options('/products/', headers={
        'Origin':'https://untrusted-example.vercel.app',
        'Access-Control-Request-Method':'GET',
    })
    assert response.status_code == 400
    assert 'access-control-allow-origin' not in response.headers


def test_trusted_origin_is_allowed(client):
    response = client.options('/products/', headers={
        'Origin':'https://smart-factory-ai-seven.vercel.app',
        'Access-Control-Request-Method':'GET',
    })
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'https://smart-factory-ai-seven.vercel.app'


def test_health_checks_database(client):
    assert client.get('/health').json() == {'status': 'ok'}


def test_health_hides_database_errors(client):
    class FailedDatabase:
        def execute(self, query):
            raise RuntimeError('private connection details')
    previous = main.app.dependency_overrides[get_db]
    main.app.dependency_overrides[get_db] = lambda: FailedDatabase()
    try:
        response = client.get('/health')
        assert response.status_code == 503
        assert response.json() == {'detail': 'Database unavailable'}
    finally:
        main.app.dependency_overrides[get_db] = previous


@pytest.mark.parametrize('secret', ['', 'CHANGE_THIS_SECRET_KEY', 'change-this-secret-key-before-production'])
def test_unsafe_signing_keys_are_rejected(secret):
    import os
    import subprocess
    import sys
    from pathlib import Path
    result = subprocess.run([sys.executable, '-c', 'import config'],
                            cwd=Path(__file__).parent,
                            env={**os.environ, 'SECRET_KEY': secret}, capture_output=True, text=True)
    assert result.returncode != 0
    assert 'Set SECRET_KEY' in result.stderr

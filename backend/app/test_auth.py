from conftest import register_and_login


def test_register_creates_company_and_admin(client):
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "Password123!",
            "company_name": "Jane Foods Ltd",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["role"] == "Company Admin"
    assert body["company"]["name"] == "Jane Foods Ltd"


def test_duplicate_email_rejected(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!",
        "company_name": "Jane Foods Ltd",
    }

    client.post("/auth/register", json=payload)
    response = client.post(
        "/auth/register",
        json={**payload, "company_name": "Another Company"},
    )

    assert response.status_code == 400


def test_duplicate_company_name_rejected(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!",
        "company_name": "Jane Foods Ltd",
    }

    client.post("/auth/register", json=payload)
    response = client.post(
        "/auth/register",
        json={**payload, "email": "someone-else@example.com"},
    )

    assert response.status_code == 400


def test_wrong_password_rejected(client):
    register_and_login(client, "jane@example.com", "Jane Foods Ltd")

    response = client.post(
        "/auth/login-json",
        json={"email": "jane@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_new_user_can_access_business_endpoints(client):
    token = register_and_login(client, "jane@example.com", "Jane Foods Ltd")

    unauthenticated = client.get("/products/")
    assert unauthenticated.status_code == 401

    authenticated = client.get(
        "/products/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert authenticated.status_code == 200

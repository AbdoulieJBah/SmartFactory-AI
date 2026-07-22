from conftest import register_and_login


def test_company_admin_cannot_assign_subscription_to_other_company(client):
    token_a = register_and_login(client, "a@example.com", "Company A")
    register_and_login(client, "b@example.com", "Company B")

    # Company A's admin (company_id=1) targeting Company B (company_id=2).
    response = client.post(
        "/subscriptions/assign/2/1",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    assert response.status_code == 403


def test_company_admin_can_assign_subscription_for_own_company(client):
    token_a = register_and_login(client, "a@example.com", "Company A")

    response = client.post(
        "/subscriptions/assign/1/1",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    # Company exists (id=1, just registered) but plan_id=1 hasn't been
    # seeded in this test DB, so the ownership check should pass and the
    # request should fail later on the plan lookup, not on authorization.
    assert response.status_code == 404
    assert response.json()["detail"] == "Plan not found"

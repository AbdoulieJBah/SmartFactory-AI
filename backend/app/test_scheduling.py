from conftest import register_and_login


def test_create_schedule_rejects_missing_fields(client):
    token = register_and_login(client, "jane@example.com", "Jane Foods Ltd")

    response = client.post(
        "/scheduling/",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_create_schedule_with_valid_payload(client):
    token = register_and_login(client, "jane@example.com", "Jane Foods Ltd")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/scheduling/",
        json={
            "schedule_date": "2026-08-01",
            "start_time": "08:00",
            "end_time": "12:00",
        },
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["schedule_date"] == "2026-08-01"
    assert body["conflict_status"] == "Clear"

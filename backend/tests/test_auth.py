"""Authentication (JWT in HttpOnly cookie) and role-based authorization."""
from tests.conftest import login


def test_login_sets_httponly_cookie_and_no_token_in_body(client):
    r = login(client, "juan", "Juan1234!")
    assert r.status_code == 200
    assert "access_token" in r.cookies
    assert "httponly" in r.headers["set-cookie"].lower()
    assert "access_token" not in r.json()


def test_wrong_password_returns_401(client):
    r = login(client, "juan", "wrong-password")
    assert r.status_code == 401
    assert r.json()["detail"] == "Credenciales incorrectas"


def test_me_without_cookie_returns_401(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_returns_user_without_password_hash(user):
    r = user.get("/api/v1/auth/me")
    assert r.status_code == 200
    assert r.json()["username"] == "juan"
    assert "hashed_password" not in r.json()


def test_bearer_header_is_not_accepted(client):
    token = login(client, "juan", "Juan1234!").cookies["access_token"]
    client.cookies.clear()
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_public_registration_always_creates_role_user(client):
    r = client.post("/api/v1/auth/register", json={
        "username": "ana", "full_name": "Ana Test",
        "email": "ana@example.com", "password": "Password123!",
    })
    assert r.status_code == 201
    assert r.json()["role"] == "user"


def test_duplicate_registration_returns_409(client):
    data = {"username": "juan", "full_name": "Otro Juan",
            "email": "otro@example.com", "password": "Password123!"}
    assert client.post("/api/v1/auth/register", json=data).status_code == 409


def test_regular_user_on_admin_route_returns_403(user):
    assert user.get("/api/v1/auth/admin/usuarios").status_code == 403


def test_admin_on_admin_route_returns_200(admin):
    r = admin.get("/api/v1/auth/admin/usuarios")
    assert r.status_code == 200
    assert {u["username"] for u in r.json()} >= {"admin", "juan"}


def test_logout_clears_session(user):
    user.post("/api/v1/auth/logout")
    assert user.get("/api/v1/auth/me").status_code == 401


def test_deactivated_user_cannot_log_in(admin):
    ids = {u["username"]: u["id"] for u in admin.get("/api/v1/auth/admin/usuarios").json()}
    assert admin.post(f"/api/v1/auth/admin/usuarios/{ids['juan']}/desactivar").status_code == 200
    admin.cookies.clear()
    r = login(admin, "juan", "Juan1234!")
    assert r.status_code == 400

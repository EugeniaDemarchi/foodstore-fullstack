"""Test configuration.

Tests run against a real PostgreSQL database (the same engine used in
production), not SQLite. The connection string comes from TEST_DATABASE_URL
and defaults to a local `food_store_test` database. In CI, a PostgreSQL
service container provides it (see .github/workflows/ci.yml).

Each test starts from a clean schema with the seed data loaded
(units of measure + users `admin` and `juan`).
"""
import os

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/food_store_test",
)
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-with-at-least-32-chars")

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.database import engine
from app.main import app
from app.seed import run_seed


@pytest.fixture()
def client():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    run_seed()
    with TestClient(app) as c:
        yield c


def login(client: TestClient, username: str, password: str):
    """Logs in; on success the client stores the access_token cookie."""
    return client.post("/api/v1/auth/token", data={"username": username, "password": password})


@pytest.fixture()
def admin(client):
    assert login(client, "admin", "Admin1234!").status_code == 200
    return client


@pytest.fixture()
def user(client):
    assert login(client, "juan", "Juan1234!").status_code == 200
    return client

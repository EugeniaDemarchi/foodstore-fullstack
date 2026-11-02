"""Orders: total computed on the server, transactional rollback (Unit of Work)."""
from tests.test_catalog import create_category, create_product


def test_user_creates_order_and_total_is_computed_by_server(admin):
    cat = create_category(admin)
    p1 = create_product(admin, cat["id"], "Muzzarella", 1000.0)
    p2 = create_product(admin, cat["id"], "Napolitana", 1250.5)
    r = admin.post("/pedidos/", json={"detalles": [
        {"producto_id": p1["id"], "cantidad": 2},
        {"producto_id": p2["id"], "cantidad": 1},
    ]})
    assert r.status_code == 201, r.text
    assert r.json()["total"] == 3250.5
    assert len(r.json()["detalles"]) == 2


def test_order_with_missing_product_rolls_back_everything(admin):
    cat = create_category(admin)
    p1 = create_product(admin, cat["id"])
    r = admin.post("/pedidos/", json={"detalles": [
        {"producto_id": p1["id"], "cantidad": 1},
        {"producto_id": 99999, "cantidad": 1},
    ]})
    assert r.status_code == 404
    # Unit of Work: the order header created before the error must not persist.
    assert admin.get("/pedidos/").json() == []


def test_empty_order_returns_422(admin):
    assert admin.post("/pedidos/", json={"detalles": []}).status_code == 422


def test_repeated_product_in_order_returns_422(admin):
    cat = create_category(admin)
    p = create_product(admin, cat["id"])
    r = admin.post("/pedidos/", json={"detalles": [
        {"producto_id": p["id"], "cantidad": 1},
        {"producto_id": p["id"], "cantidad": 2},
    ]})
    assert r.status_code == 422


def test_invalid_order_status_returns_422(admin):
    cat = create_category(admin)
    p = create_product(admin, cat["id"])
    pedido = admin.post("/pedidos/", json={"detalles": [{"producto_id": p["id"], "cantidad": 1}]}).json()
    assert admin.put(f"/pedidos/{pedido['id']}", json={"estado": "volando"}).status_code == 422

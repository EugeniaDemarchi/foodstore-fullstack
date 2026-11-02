"""Categories and products: CRUD, validation, soft delete and permissions."""


def create_category(client, nombre="Pizzas"):
    r = client.post("/categorias/", json={"nombre": nombre, "descripcion": "test"})
    assert r.status_code == 201, r.text
    return r.json()


def create_product(client, categoria_id, nombre="Muzzarella", precio=1000.0):
    r = client.post("/productos/", json={
        "nombre": nombre, "precio_base": precio, "categoria_ids": [categoria_id],
    })
    assert r.status_code == 201, r.text
    return r.json()


def test_endpoints_require_session(client):
    assert client.get("/categorias/").status_code == 401


def test_admin_creates_and_reads_category(admin):
    cat = create_category(admin)
    r = admin.get(f"/categorias/{cat['id']}")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Pizzas"


def test_regular_user_cannot_create_category(user):
    r = user.post("/categorias/", json={"nombre": "Postres"})
    assert r.status_code == 403


def test_blank_category_name_returns_422(admin):
    assert admin.post("/categorias/", json={"nombre": "   "}).status_code == 422


def test_soft_deleted_category_is_hidden(admin):
    cat = create_category(admin)
    assert admin.delete(f"/categorias/{cat['id']}").status_code == 204
    assert admin.get(f"/categorias/{cat['id']}").status_code == 404


def test_category_list_is_paginated(admin):
    for i in range(3):
        create_category(admin, f"Cat {i}")
    r = admin.get("/categorias/")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, dict)
    assert len(next(v for v in body.values() if isinstance(v, list))) == 3


def test_product_requires_at_least_one_category(admin):
    r = admin.post("/productos/", json={"nombre": "Fugazzeta", "precio_base": 900, "categoria_ids": []})
    assert r.status_code == 422


def test_negative_price_returns_422(admin):
    cat = create_category(admin)
    r = admin.post("/productos/", json={"nombre": "X", "precio_base": -1, "categoria_ids": [cat["id"]]})
    assert r.status_code == 422


def test_product_is_linked_to_its_category(admin):
    cat = create_category(admin)
    prod = create_product(admin, cat["id"])
    r = admin.get(f"/categorias/{cat['id']}/productos")
    assert r.status_code == 200
    assert [p["id"] for p in r.json()] == [prod["id"]]

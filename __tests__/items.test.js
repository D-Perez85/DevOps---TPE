/**
 * @jest-environment node
 */
const request = require("supertest");
const app = require("../app");

describe("API /items", () => {
  beforeEach(async () => {
    await request(app).post("/__reset");
  });

  test("GET /items devuelve lista vacía", async () => {
    const res = await request(app).get("/items");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("POST /items crea un item válido", async () => {
    const newItem = { name: "Lapicera", price: 10.5, stock: 100 };
    const res = await request(app).post("/items").send(newItem);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(newItem);
  });

  test("POST /items falla si faltan campos", async () => {
    const res = await request(app).post("/items").send({ name: "Lapicera" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

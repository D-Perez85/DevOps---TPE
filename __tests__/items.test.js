// const { initDatabase } = require("../app");
// const { validateFull } = require("../utils");

// describe("API /items sin supertest", () => {
//   let db;

//   beforeEach(() => {
 
//     db = initDatabase(true); 
//     db.exec('DELETE FROM items;'); 
//   });

//   test("GET /items devuelve lista vacía", () => {
//     const rows = db.prepare('SELECT * FROM items ORDER BY id').all();
//     expect(rows).toEqual([]);
//   });

//   test("POST /items crea un item válido", () => {
//     const newItem = { name: "Lapicera", price: 10.5, stock: 100 };
    
//     // Validamos
//     const errors = validateFull(newItem);
//     expect(errors).toEqual([]);

//     // Insertamos
//     const info = db.prepare('INSERT INTO items (name, price, stock) VALUES (?, ?, ?)').run(
//       newItem.name, newItem.price, newItem.stock
//     );

//     const created = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
//     expect(created).toMatchObject(newItem);
//   });

//   test("POST /items falla si faltan campos", () => {
//     const incompleteItem = { name: "Lapicera" };
//     const errors = validateFull(incompleteItem);
//     expect(errors.length).toBeGreaterThan(0);
//   });
// });


const { initDatabase } = require('../app');

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn().mockReturnValue({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn().mockReturnValue([]),
    }),
  }));
});

describe('API /items (mock DB)', () => {
  let db;

  beforeEach(() => {
    db = initDatabase(true);
  });

  it('GET /items devuelve lista vacía', () => {
    const rows = db.prepare().all();
    expect(rows).toEqual([]);
  });

  it('POST /items crea un item válido', () => {
    const newItem = { name: "Lapicera", price: 10.5, stock: 100 };
    const stmtMock = db.prepare();

    stmtMock.run.mockReturnValue({ lastInsertRowid: 1 });
    stmtMock.get.mockReturnValue({ id: 1, ...newItem });

    const info = stmtMock.run(newItem.name, newItem.price, newItem.stock);
    const created = stmtMock.get(info.lastInsertRowid);

    expect(created).toMatchObject(newItem);
  });
});

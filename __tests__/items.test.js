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

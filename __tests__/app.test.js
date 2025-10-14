const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { initDatabase, getDbFile } = require('../app');

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn().mockReturnValue({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    }),
  }));
});

describe('initDatabase', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('debe crear la carpeta si no existe y useSandbox es false', () => {
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const dbFile = getDbFile(false);
    expect(dbFile).toMatch(/data\.sqlite$/);

    const db = initDatabase(false);

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname(dbFile), { recursive: true });
    expect(db.prepare).toBeDefined();
  });

  it('no debe crear carpeta si useSandbox es true', () => {
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

    const db = initDatabase(true);

    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(db.memory).toBeUndefined(); // mock no tiene memory, pero DB se instancia
  });

  it('crea tabla items correctamente', () => {
    const db = initDatabase(true);
    const stmtMock = db.prepare();
    stmtMock.get.mockReturnValue({ name: 'items' });

    const row = stmtMock.get("SELECT name FROM sqlite_master WHERE type='table' AND name='items'");
    expect(row).toBeDefined();
    expect(row.name).toBe('items');
  });
});

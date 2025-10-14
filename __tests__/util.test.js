const { validateFull, validatePartial } = require('../utils');

describe('validateFull', () => {
  it('debe validar campos completos correctamente', () => {
    expect(validateFull({ name: "", price: 10, stock: 1 })).toContain("name requerido (string no vacío)");
    expect(validateFull({ name: "Item", price: NaN, stock: 1 })).toContain("price requerido (number)");
    expect(validateFull({ name: "Item", price: 10, stock: -1 })).toContain("stock requerido (entero >= 0)");
  });
});

describe('validatePartial', () => {
  it('debe validar parcialmente', () => {
    expect(validatePartial({ name: "" })).toContain("name debe ser string no vacío");
    expect(validatePartial({ price: NaN })).toContain("price debe ser number");
    expect(validatePartial({ stock: -5 })).toContain("stock debe ser entero >= 0");
  });
});

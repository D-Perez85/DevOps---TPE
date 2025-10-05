const { validateFull } = require("../utils"); 

test("Nombre vacío debe fallar", () => {
  const errors = validateFull({ name: "", price: 10, stock: 1 });
  expect(errors).toContain("name requerido (string no vacío)");
});

test("Precio NaN debe fallar", () => {
  const errors = validateFull({ name: "Item", price: NaN, stock: 1 });
  expect(errors).toContain("price requerido (number)");
});

test("Stock negativo debe fallar", () => {
  const errors = validateFull({ name: "Item", price: 10, stock: -5 });
  expect(errors).toContain("stock requerido (entero >= 0)");
});

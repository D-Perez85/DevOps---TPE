
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.validateFormData = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
 
  return function validateFormData({ name, price, stock } = {}) {
    const errors = {};

 
    if (typeof name !== "string" || !name.trim()) {
      errors.name = "Campo obligatorio";
    }

    
    if (price === undefined || price === null || price === "") {
      errors.price = "Ingrese un número válido";
    } else {
      const p = Number(price);
      if (Number.isNaN(p)) {
        errors.price = "Ingrese un número válido";
      }
    }

 
    if (stock === undefined || stock === null || stock === "") {
      errors.stock = "Ingrese un número entero válido";
    } else {
      const s = Number(stock);
 
      if (!Number.isFinite(s) || !Number.isInteger(s) || s < 0) {
        errors.stock = "Ingrese un número entero válido";
      }
    }

    return errors;
  };
});

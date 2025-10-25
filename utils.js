const validateFull = (body) => {
  const errors = [];
  if (typeof body.name !== 'string' || !body.name.trim())
    errors.push('name requerido (string no vacío)');
  if (typeof body.price !== 'number' || Number.isNaN(body.price))
    errors.push('price requerido (number)');
  if (!Number.isInteger(body.stock) || body.stock < 0)
    errors.push('stock requerido (entero >= 0)');
  return errors;
};

const validatePartial = (body) => {
  const errors = [];
  if ('name' in body && (typeof body.name !== 'string' || !body.name.trim()))
    errors.push('name debe ser string no vacío');
  if ('price' in body && (typeof body.price !== 'number' || Number.isNaN(body.price)))
    errors.push('price debe ser number');
  if ('stock' in body && (!Number.isInteger(body.stock) || body.stock < 0))
    errors.push('stock debe ser entero >= 0');
  return errors;
};
module.exports = { validateFull, validatePartial };



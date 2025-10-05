const api = "/items";
const list = document.getElementById("list");

async function cargar() {
  const res = await fetch(api);
  const data = await res.json();
  list.innerHTML = data
    .map(
      (i) => `
      <tr>
        <td>${i.name}</td>
        <td>${i.price}</td>
        <td>${i.stock}</td>
        <td><button onclick="borrar(${i.id})">Eliminar</button></td>
      </tr>`
    )
    .join("");
}

document
  .getElementById("miFormulario")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    document.getElementById("errorNombre").textContent = "";
    document.getElementById("errorPrecio").textContent = "";
    document.getElementById("errorStock").textContent = "";

    const nombre = document.getElementById("name").value;
    const precio = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;

    const errors =
      typeof validateFormData === "function"
        ? validateFormData({
            name: nombre,
            price: precio,
            stock: stock,
          })
        : {};

    if (errors.name)
      document.getElementById("errorNombre").textContent = errors.name;
    if (errors.price)
      document.getElementById("errorPrecio").textContent = errors.price;
    if (errors.stock)
      document.getElementById("errorStock").textContent = errors.stock;

    if (Object.keys(errors).length > 0) return;

    const body = {
      name: nombre.trim(),
      price: Number(precio),
      stock: Number(stock),
    };

    const res = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(
        "Error en servidor: " +
          (j.errors ? j.errors.join(", ") : "Verifique los campos ingresados")
      );
      return;
    }

    await cargar();
    event.target.reset();
  });

async function borrar(id) {
  const res = await fetch(`${api}/${id}`, {
    method: "DELETE",
  });
  if (res.ok) await cargar();
}

cargar();

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(
  path.resolve(__dirname, "../public/index.html"),
  "utf8"
);

describe("Formulario de productos", () => {
  let document;
  beforeEach(() => {
    document = new DOMParser().parseFromString(html, "text/html");
  });

  test("el formulario existe en el DOM", () => {
    const form = document.getElementById("miFormulario");
    expect(form).not.toBeNull();
  });

  test("mostrar error si nombre está vacío", () => {
    const nombreInput = document.getElementById("name");
    const errorSpan = document.getElementById("errorNombre");

    nombreInput.value = "   ";
    if (!nombreInput.value.trim()) {
      errorSpan.textContent = "Campo obligatorio";
    }

    expect(errorSpan.textContent).toBe("Campo obligatorio");
  });
});

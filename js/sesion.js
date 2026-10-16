/* =====================================================================
   SESIÓN: se ejecuta en TODAS las páginas.
   Revisa quién está conectado y arregla el menú de arriba.
   ===================================================================== */

const usuario = usuarioActual();                                  // null si nadie inició sesión
const registrado = usuario ? estaRegistrado(usuario.id) : false;  // ¿completó el registro?
const esVendedor = usuario ? vendedorDe(usuario.id) !== null : false;

// "Cotizador" solo aparece si ya te registraste (cliente o vendedor).
$("navCot").hidden = !registrado;
// "Mi taller" solo aparece para los vendedores.
$("navTaller").hidden = !esVendedor;
$("navAcc").textContent = usuario ? "Mi cuenta" : "Cuenta";

// Páginas protegidas: si no cumples, te mandan a la página de cuenta.
const pagina = document.body.dataset.page;
if ((pagina === "cotizador" && !registrado) || (pagina === "taller" && !esVendedor)) {
  location.replace("cuenta.html");
}

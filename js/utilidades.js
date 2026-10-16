/* =====================================================================
   UTILIDADES: funciones pequeñas que se usan en todas las páginas.
   ===================================================================== */

// Atajo: $("miId") es lo mismo que document.getElementById("miId").
function $(id) {
  return document.getElementById(id);
}

// Hace "seguro" un texto antes de pegarlo en el HTML (evita que alguien
// escriba código dentro de su nombre, por ejemplo).
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
}

// Formato de pesos colombianos: 12500 -> $12.500
function pesos(n) {
  return "$" + Math.round(n).toLocaleString("es-CO");
}

// Convierte a número; si no es válido o es negativo, devuelve 0.
function numero(valor) {
  const n = Number(valor);
  return isFinite(n) && n >= 0 ? n : 0;
}

// Lee el número escrito en un campo (input) por su id.
function leerNumero(id) {
  return numero($(id).value);
}

// Texto con las estrellas de un vendedor, por ejemplo: ★★★★☆ 4.2 (5 reseñas)
function textoResena(clave) {
  const r = promedioDe(clave);               // viene de almacenamiento.js
  if (r.cantidad === 0) return "Sin reseñas todavía";
  const llenas = Math.round(r.promedio);
  let estrellas = "";
  for (let i = 1; i <= 5; i++) estrellas += i <= llenas ? "\u2605" : "\u2606";
  return estrellas + " " + r.promedio.toFixed(1) + " (" + r.cantidad + (r.cantidad === 1 ? " reseña)" : " reseñas)");
}

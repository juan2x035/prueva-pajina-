/* =====================================================================
   ALMACENAMIENTO: todo lo que la página guarda vive en el navegador
   (localStorage). Los datos no salen de tu equipo y se pierden si
   borras los datos del sitio.

   localStorage solo guarda TEXTO, por eso usamos:
     JSON.stringify(objeto)  -> convierte un objeto en texto
     JSON.parse(texto)       -> convierte el texto en objeto otra vez

   Estructura de lo que se guarda (una sola "base de datos" llamada bd):
     usuarios    { idUsuario: { correo, clave } }
     sesion      id del usuario que inició sesión
     perfiles    { idUsuario: { nombre, tel, rol } }
     vendedores  { idUsuario: { nombre, nota, hora, margen, tel, mat } }
     resenas     { idUsuario: { votos, contactos, favoritos } }
   ===================================================================== */

const CLAVE_BD = "cotizador3d";

// Vendedores de ejemplo: siempre existen y no se guardan en localStorage.
// hora = precio por hora de impresión, margen = % de ganancia,
// mat = precio por kilo de cada material.
const VENDEDORES_EJEMPLO = {
  pedro:   { nombre: "Pedro",   nota: "Más económico en tiempo",  hora: 2500, margen: 15, tel: "11111111111",
             mat: { PLA: 65000, PETG: 78000, ABS: 82000, TPU: 115000 } },
  enrique: { nombre: "Enrique", nota: "Mejor precio en material", hora: 4000, margen: 20, tel: "22222222222",
             mat: { PLA: 55000, PETG: 65000, ABS: 70000, TPU: 95000 } }
};

/* ---------- Leer y guardar todo ---------- */

function leerBD() {
  let bd = {};
  try { bd = JSON.parse(localStorage.getItem(CLAVE_BD)) || {}; } catch (e) { bd = {}; }
  bd.usuarios = bd.usuarios || {};
  bd.perfiles = bd.perfiles || {};
  bd.vendedores = bd.vendedores || {};
  bd.resenas = bd.resenas || {};
  return bd;
}

function guardarBD(bd) {
  localStorage.setItem(CLAVE_BD, JSON.stringify(bd));
}

/* ---------- Cuentas ---------- */

// Convierte la contraseña en un código (hash) para no guardarla escrita tal cual.
// "async/await" se usa porque el navegador tarda un instante en calcularlo.
async function cifrar(texto) {
  if (window.crypto && crypto.subtle) {
    const datos = new TextEncoder().encode(texto);
    const hash = await crypto.subtle.digest("SHA-256", datos);
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  // Respaldo simple si el navegador no tiene "crypto".
  return texto.split("").reduce(function (h, c) { return (h * 31 + c.charCodeAt(0)) | 0; }, 7).toString();
}

function buscarIdPorCorreo(bd, correo) {
  for (const id in bd.usuarios) {
    if (bd.usuarios[id].correo === correo) return id;
  }
  return null;
}

// Devuelve { id, correo } del usuario con sesión iniciada, o null si no hay.
function usuarioActual() {
  const bd = leerBD();
  const usuario = bd.usuarios[bd.sesion];
  return usuario ? { id: bd.sesion, correo: usuario.correo } : null;
}

async function crearCuenta(correo, clave) {
  const bd = leerBD();
  correo = correo.toLowerCase();
  if (buscarIdPorCorreo(bd, correo)) throw new Error("Ese correo ya está registrado.");
  const id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  bd.usuarios[id] = { correo: correo, clave: await cifrar(clave) };
  bd.sesion = id;                       // al crear la cuenta, también inicia sesión
  guardarBD(bd);
}

async function iniciarSesion(correo, clave) {
  const bd = leerBD();
  const id = buscarIdPorCorreo(bd, correo.toLowerCase());
  if (!id || bd.usuarios[id].clave !== await cifrar(clave)) throw new Error("Correo o contraseña incorrectos.");
  bd.sesion = id;
  guardarBD(bd);
}

function cerrarSesion() {
  const bd = leerBD();
  delete bd.sesion;
  guardarBD(bd);
}

// Borra todo lo de esa persona: cuenta, perfil, vendedor, reseñas y favoritos.
function borrarCuenta(id) {
  const bd = leerBD();
  delete bd.usuarios[id];
  delete bd.perfiles[id];
  delete bd.vendedores[id];
  delete bd.resenas[id];
  delete bd.sesion;
  guardarBD(bd);
}

/* ---------- Perfiles y vendedores ---------- */

function perfilDe(id) { return leerBD().perfiles[id] || null; }
function vendedorDe(id) { return leerBD().vendedores[id] || null; }

function guardarPerfil(id, perfil) {
  const bd = leerBD();
  bd.perfiles[id] = perfil;
  guardarBD(bd);
}

function guardarVendedor(id, vendedor) {
  const bd = leerBD();
  bd.vendedores[id] = vendedor;
  guardarBD(bd);
}

function borrarVendedor(id) {
  const bd = leerBD();
  delete bd.vendedores[id];
  guardarBD(bd);
}

// Está registrado quien ya completó el formulario (como cliente o como vendedor).
function estaRegistrado(id) {
  return perfilDe(id) !== null || vendedorDe(id) !== null;
}

// Junta los de ejemplo con los registrados. Los registrados usan la clave "u_" + id.
function todosLosVendedores() {
  const lista = {};
  for (const clave in VENDEDORES_EJEMPLO) lista[clave] = VENDEDORES_EJEMPLO[clave];
  const registrados = leerBD().vendedores;
  for (const id in registrados) lista["u_" + id] = registrados[id];
  return lista;
}

/* ---------- Reseñas, contactos y favoritos de cada persona ---------- */

// votos:     { claveVendedor: estrellas (1 a 5) }
// contactos: { claveVendedor: true }  -> solo se califica a quien contactaste
// favoritos: { claveVendedor: true }  -> los que aparecen en el cotizador
function datosSocial(id) {
  const r = leerBD().resenas[id] || {};
  return { votos: r.votos || {}, contactos: r.contactos || {}, favoritos: r.favoritos || {} };
}

function guardarSocial(id, datos) {
  const bd = leerBD();
  bd.resenas[id] = datos;
  guardarBD(bd);
}

// Promedio de estrellas que le dieron todas las personas a un vendedor.
function promedioDe(clave) {
  const bd = leerBD();
  let suma = 0, cantidad = 0;
  for (const id in bd.resenas) {
    const estrellas = (bd.resenas[id].votos || {})[clave];
    if (estrellas) { suma += estrellas; cantidad++; }
  }
  return { promedio: cantidad ? suma / cantidad : 0, cantidad: cantidad };
}

/* =====================================================================
   COTIZADOR (cotizador.html)
   - Solo ofrece tus vendedores favoritos (más el que elegiste en la lista).
   - La calculadora es opcional: se activa con el interruptor.
   - "Contactar" abre un chat; desde ahí puedes calificar al vendedor.
   ===================================================================== */

const vendedores = todosLosVendedores();
const vendedorElegido = new URLSearchParams(location.search).get("v");   // viene de ?v=... en la dirección
const social = registrado ? datosSocial(usuario.id) : { votos: {}, contactos: {}, favoritos: {} };
const mensajes = {};          // mensajes del chat de cada vendedor (no se guardan)

let actual = null;            // clave del vendedor seleccionado
let manual = false;           // ¿está activada la cotización manual?
let chatAbierto = false;
let calificando = false;

/* ---------- Vendedores disponibles ---------- */

function clavesDisponibles() {
  const lista = Object.keys(vendedores).filter(function (clave) { return social.favoritos[clave]; });
  if (vendedorElegido && vendedores[vendedorElegido] && lista.indexOf(vendedorElegido) < 0) lista.push(vendedorElegido);
  return lista;
}

function llenarSelectores() {
  const lista = clavesDisponibles();
  $("sinFavoritos").hidden = lista.length > 0;
  $("contenido").hidden = lista.length === 0;
  if (lista.length === 0) return false;

  if (lista.indexOf(actual) < 0) actual = lista.indexOf(vendedorElegido) >= 0 ? vendedorElegido : lista[0];

  $("vendedor").innerHTML = lista.map(function (clave) {
    return '<option value="' + esc(clave) + '">' + esc(vendedores[clave].nombre) + "</option>";
  }).join("");
  $("vendedor").value = actual;

  // El selector de material junta los materiales de todos los vendedores disponibles.
  const materiales = {};
  lista.forEach(function (clave) { for (const m in vendedores[clave].mat) materiales[m] = true; });
  $("material").innerHTML = Object.keys(materiales).map(function (m) {
    return '<option value="' + esc(m) + '">' + esc(m) + "</option>";
  }).join("");
  return true;
}

/* ---------- Cálculo del precio ---------- */

// Devuelve el desglose, o null si el vendedor no ofrece ese material.
function calcular(v) {
  const material = $("material").value;
  if (v.mat[material] === undefined) return null;
  const horas = leerNumero("horas") + leerNumero("minutos") / 60;
  const cantidad = Math.max(1, leerNumero("cantidad"));

  const costoTiempo = horas * v.hora * cantidad;                                  // horas x precio por hora
  const costoMaterial = leerNumero("gramos") * v.mat[material] / 1000 * cantidad; // gramos x precio por kg / 1000
  const margen = (costoTiempo + costoMaterial) * v.margen / 100;                  // ganancia del vendedor
  return { tiempo: costoTiempo, material: costoMaterial, margen: margen,
           total: costoTiempo + costoMaterial + margen, cantidad: cantidad };
}

/* ---------- Dibujar la pantalla ---------- */

function dibujar() {
  const v = vendedores[actual];
  const c = calcular(v);

  $("nombre").textContent = v.nombre;
  $("resenaVendedor").textContent = textoResena(actual);

  // Todo lo "manual" solo se ve con el interruptor activado.
  $("manual").hidden = !manual;
  $("resultado").hidden = !manual;
  $("comparacion").hidden = !manual;
  if (!manual) return;

  $("sinMaterial").hidden = c !== null;
  $("sinMaterial").textContent = v.nombre + " no ofrece " + $("material").value + ".";
  $("costoTiempo").textContent = c ? pesos(c.tiempo) : "—";
  $("costoMaterial").textContent = c ? pesos(c.material) : "—";
  $("costoMargen").textContent = c ? pesos(c.margen) : "—";
  $("total").textContent = c ? pesos(c.total) : "—";
  dibujarComparacion();
}

// Compara el total de todos los vendedores disponibles y marca el más barato.
function dibujarComparacion() {
  const totales = [];
  clavesDisponibles().forEach(function (clave) {
    const c = calcular(vendedores[clave]);
    if (c) totales.push({ nombre: vendedores[clave].nombre, total: c.total });
  });
  const menor = Math.min.apply(null, totales.map(function (t) { return t.total; }));
  $("listaComparacion").innerHTML = totales.map(function (t) {
    return '<div class="linea' + (t.total === menor ? " mejor" : "") + '"><span>' + esc(t.nombre) +
           (t.total === menor ? " (más barato)" : "") + "</span><b>" + pesos(t.total) + "</b></div>";
  }).join("");
}

/* ---------- Chat y calificación ---------- */

function mensajeInicial(v) {
  const c = calcular(v);
  if (!manual || !c) return "Hola " + v.nombre + ", quiero cotizar una impresión 3D.";
  return "Hola " + v.nombre + ", quiero cotizar una impresión 3D: material " + $("material").value + ", " +
         Math.floor(leerNumero("horas")) + " h " + Math.round(leerNumero("minutos")) + " min, " +
         leerNumero("gramos") + " g, cantidad " + c.cantidad + ". Estimado: " + pesos(c.total) + " COP.";
}

function dibujarChat() {
  $("chat").hidden = !chatAbierto;
  if (!chatAbierto) return;
  $("chatTitulo").textContent = "Chat con " + vendedores[actual].nombre;
  let html = "";
  (mensajes[actual] || []).forEach(function (texto) { html += '<div class="mensaje">' + esc(texto) + "</div>"; });
  $("chatMensajes").innerHTML = html;
  $("cajaEstrellas").hidden = !calificando;
  if (calificando) dibujarEstrellas();
}

function dibujarEstrellas() {
  const miVoto = social.votos[actual] || 0;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += '<button type="button" class="estrella' + (i <= miVoto ? " marcada" : "") + '" data-n="' + i + '">&#9733;</button>';
  }
  html += '<span class="nota"> ' + (miVoto ? "Tu calificación: " + miVoto : "Califica a este vendedor") + "</span>";
  $("cajaEstrellas").innerHTML = html;
}

function contactar() {
  const v = vendedores[actual];
  if (manual && calcular(v) === null) return;        // no ofrece ese material
  $("telefono").textContent = "WhatsApp de " + v.nombre + ": " + v.tel;
  if (!mensajes[actual]) mensajes[actual] = [mensajeInicial(v)];
  social.contactos[actual] = true;                   // ahora sí puedes calificarlo
  guardarSocial(usuario.id, social);
  chatAbierto = true;
  calificando = false;
  dibujarChat();
}

function enviarMensaje() {
  const texto = $("chatTexto").value.trim();
  if (!texto) return;
  mensajes[actual].push(texto);
  $("chatTexto").value = "";
  dibujarChat();
  $("chatMensajes").scrollTop = $("chatMensajes").scrollHeight;
}

/* ---------- Eventos: qué pasa cuando el usuario hace algo ---------- */

function iniciar() {
  if (!llenarSelectores()) return;                  // sin favoritos no hay nada más que hacer

  $("vendedor").addEventListener("change", function () {
    actual = $("vendedor").value;
    chatAbierto = false;
    $("telefono").textContent = "";
    dibujar();
    dibujarChat();
  });
  $("interruptor").addEventListener("change", function () { manual = $("interruptor").checked; dibujar(); });
  ["material", "horas", "minutos", "gramos", "cantidad"].forEach(function (id) {
    $(id).addEventListener("input", dibujar);
  });

  $("contactar").addEventListener("click", contactar);
  $("chatEnviar").addEventListener("click", enviarMensaje);
  $("chatTexto").addEventListener("keydown", function (e) { if (e.key === "Enter") enviarMensaje(); });
  $("chatCerrar").addEventListener("click", function () { chatAbierto = false; dibujarChat(); });
  $("calificar").addEventListener("click", function () { calificando = !calificando; dibujarChat(); });

  // Clic en una estrella: guarda la calificación (clic en la misma estrella la quita).
  $("cajaEstrellas").addEventListener("click", function (e) {
    const boton = e.target.closest("[data-n]");
    if (!boton || !social.contactos[actual]) return;
    const n = Number(boton.dataset.n);
    if (social.votos[actual] === n) delete social.votos[actual];
    else social.votos[actual] = n;
    guardarSocial(usuario.id, social);
    dibujarEstrellas();
    $("resenaVendedor").textContent = textoResena(actual);
  });

  dibujar();
}

if (registrado) iniciar();

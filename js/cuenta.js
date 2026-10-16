/* =====================================================================
   CUENTA (cuenta.html)
   Tres estados: sin sesión (entrar o crear cuenta), con sesión pero sin
   registro (formulario) y registrado (editar, cerrar sesión o borrar).
   ===================================================================== */

let modo = "entrar";                 // "entrar" o "crear"
let confirmandoBorrado = false;

function mostrarMensaje(id, texto, ok) {
  $(id).textContent = texto;
  $(id).className = "aviso " + (ok ? "ok" : "error");
}

// Muestra u oculta los campos que solo usan los vendedores.
function alternarRol() {
  const vendedor = $("rol").value === "vendedor";
  $("datosVendedor").hidden = !vendedor;
  $("datosPrecios").hidden = !vendedor || vendedorDe(usuario.id) !== null;   // quien ya es vendedor edita precios en "Mi taller"
}

function dibujar() {
  $("acceso").hidden = usuario !== null;
  $("registro").hidden = usuario === null;
  $("cerrar").hidden = usuario === null;

  if (!usuario) {
    $("estado").innerHTML = '<h2>Tu cuenta</h2><p class="suave" style="margin:0">Inicia sesión o crea una cuenta para registrarte como cliente o vendedor.</p>';
    return;
  }
  const vendedor = vendedorDe(usuario.id);
  const perfil = perfilDe(usuario.id);
  let texto = "aún no te has registrado. Completa el formulario de abajo.";
  if (vendedor) texto = "registrado como vendedor: <b>" + esc(vendedor.nombre) + "</b>.";
  else if (perfil) texto = "registrado como cliente: <b>" + esc(perfil.nombre) + "</b>.";
  $("estado").innerHTML = '<h2>Tu cuenta</h2><p class="suave" style="margin:0">' + esc(usuario.correo) + " — " + texto + "</p>";
  $("tituloRegistro").textContent = perfil || vendedor ? "Editar mi registro" : "Registro";
  $("borrar").hidden = !(perfil || vendedor);

  // Rellena el formulario con lo que ya hay guardado.
  $("rol").value = vendedor ? "vendedor" : "cliente";
  $("nombre").value = perfil ? perfil.nombre : "";
  $("tel").value = perfil ? perfil.tel : "";
  $("nota").value = vendedor ? vendedor.nota : "";
  alternarRol();
}

/* ---------- Iniciar sesión / crear cuenta ---------- */

function cambiarModo(nuevo) {
  modo = nuevo;
  $("pestanaEntrar").classList.toggle("activa", modo === "entrar");
  $("pestanaCrear").classList.toggle("activa", modo === "crear");
  $("entrar").textContent = modo === "entrar" ? "Iniciar sesión" : "Crear cuenta";
  mostrarMensaje("mensajeAcceso", "", true);
}
$("pestanaEntrar").addEventListener("click", function () { cambiarModo("entrar"); });
$("pestanaCrear").addEventListener("click", function () { cambiarModo("crear"); });

$("entrar").addEventListener("click", async function () {
  const correo = $("correo").value.trim();
  const clave = $("clave").value;
  if (!correo || clave.length < 6) return mostrarMensaje("mensajeAcceso", "Escribe tu correo y una contraseña de mínimo 6 caracteres.", false);
  try {
    if (modo === "entrar") await iniciarSesion(correo, clave);
    else await crearCuenta(correo, clave);
    location.reload();                              // recarga para que el menú se actualice
  } catch (error) {
    mostrarMensaje("mensajeAcceso", error.message, false);
  }
});

$("cerrar").addEventListener("click", function () {
  cerrarSesion();
  location.href = "index.html";
});

/* ---------- Guardar el registro ---------- */

$("rol").addEventListener("change", alternarRol);

$("guardar").addEventListener("click", function () {
  const rol = $("rol").value;
  const nombre = $("nombre").value.trim();
  const tel = $("tel").value.replace(/\D/g, "");          // deja solo los dígitos
  const vendedorActual = vendedorDe(usuario.id);

  // 1. Validar antes de guardar nada.
  if (!nombre) return mostrarMensaje("mensajeRegistro", "Escribe un nombre.", false);
  if (tel.length < 10) return mostrarMensaje("mensajeRegistro", "Escribe un WhatsApp válido con indicativo.", false);

  const materiales = {};
  [["PLA", "pla"], ["PETG", "petg"], ["ABS", "abs"], ["TPU", "tpu"]].forEach(function (par) {
    if (leerNumero(par[1]) > 0) materiales[par[0]] = leerNumero(par[1]);
  });
  if (rol === "vendedor" && !vendedorActual) {
    if (leerNumero("hora") === 0) return mostrarMensaje("mensajeRegistro", "Indica el precio por hora.", false);
    if (Object.keys(materiales).length === 0) return mostrarMensaje("mensajeRegistro", "Indica el precio de al menos un material.", false);
  }

  // 2. Guardar.
  guardarPerfil(usuario.id, { nombre: nombre, tel: tel, rol: rol });
  if (rol === "vendedor") {
    guardarVendedor(usuario.id, {
      nombre: nombre, nota: $("nota").value.trim(), tel: tel,
      hora:   vendedorActual ? vendedorActual.hora   : leerNumero("hora"),
      margen: vendedorActual ? vendedorActual.margen : leerNumero("margen"),
      mat:    vendedorActual ? vendedorActual.mat    : materiales
    });
    location.href = "taller.html";                 // los vendedores siguen en su taller
  } else {
    borrarVendedor(usuario.id);
    location.href = "cotizador.html";              // los clientes siguen al cotizador
  }
});

// Borrar la cuenta pide pulsar dos veces (así no se borra por accidente).
$("borrar").addEventListener("click", function () {
  if (!confirmandoBorrado) {
    confirmandoBorrado = true;
    $("borrar").textContent = "Toca otra vez para confirmar el borrado";
    setTimeout(function () { confirmandoBorrado = false; $("borrar").textContent = "Borrar mi cuenta"; }, 5000);
    return;
  }
  borrarCuenta(usuario.id);
  location.href = "index.html";
});

dibujar();

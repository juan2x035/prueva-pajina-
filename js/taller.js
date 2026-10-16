/* =====================================================================
   MI TALLER (taller.html) - solo para vendedores
   Aquí cada vendedor cambia su precio por hora, su margen y su lista de
   materiales con el precio por kilo.
   ===================================================================== */

if (esVendedor) {
  const vendedor = vendedorDe(usuario.id);
  const materiales = Object.assign({}, vendedor.mat);   // copia para editar; no se guarda hasta pulsar "Guardar"

  function mostrarMensaje(texto, ok) {
    $("mensaje").textContent = texto;
    $("mensaje").className = "aviso " + (ok ? "ok" : "error");
  }

  function dibujarMateriales() {
    let html = "";
    for (const nombre in materiales) {
      html += '<div class="fila-material"><div><label>' + esc(nombre) + " (COP/kg)</label>" +
              '<input type="number" min="0" step="1000" data-material="' + esc(nombre) + '" value="' + materiales[nombre] + '"></div>' +
              '<button type="button" class="btn peligro" data-quitar="' + esc(nombre) + '">Quitar</button></div>';
    }
    $("materiales").innerHTML = html || '<p class="suave">Aún no tienes materiales.</p>';
  }

  // Al escribir un precio, se actualiza la copia (sin volver a dibujar para no perder el cursor).
  $("materiales").addEventListener("input", function (e) {
    const nombre = e.target.dataset.material;
    if (nombre !== undefined) materiales[nombre] = numero(e.target.value);
  });

  $("materiales").addEventListener("click", function (e) {
    const nombre = e.target.dataset.quitar;
    if (nombre === undefined) return;
    delete materiales[nombre];
    dibujarMateriales();
  });

  $("agregar").addEventListener("click", function () {
    const nombre = $("nuevoNombre").value.trim().slice(0, 20);
    if (!nombre) return mostrarMensaje("Escribe el nombre del material.", false);
    if (materiales[nombre] !== undefined) return mostrarMensaje("Ese material ya existe.", false);
    materiales[nombre] = leerNumero("nuevoPrecio");
    $("nuevoNombre").value = "";
    $("nuevoPrecio").value = "";
    mostrarMensaje("Material agregado. Recuerda guardar los cambios.", true);
    dibujarMateriales();
  });

  $("guardar").addEventListener("click", function () {
    if (leerNumero("hora") === 0) return mostrarMensaje("Indica el precio por hora.", false);
    if (Object.keys(materiales).length === 0) return mostrarMensaje("Agrega al menos un material.", false);
    vendedor.hora = leerNumero("hora");
    vendedor.margen = Math.min(200, leerNumero("margen"));
    vendedor.mat = materiales;
    guardarVendedor(usuario.id, vendedor);
    mostrarMensaje("Cambios guardados. Los clientes ya ven tus nuevos precios.", true);
  });

  $("hora").value = vendedor.hora;
  $("margen").value = vendedor.margen;
  dibujarMateriales();
}

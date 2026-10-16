/* =====================================================================
   VENDEDORES (vendedores.html)
   Muestra la lista con precios y estrellas. Quien está registrado puede
   marcar favoritos y pasar al cotizador con el vendedor elegido.
   ===================================================================== */

function dibujarVendedores() {
  const vendedores = todosLosVendedores();
  const social = registrado ? datosSocial(usuario.id) : { favoritos: {} };
  let html = "";

  for (const clave in vendedores) {
    const v = vendedores[clave];
    const esMio = registrado && clave === "u_" + usuario.id;
    const esRegistrado = clave.indexOf("u_") === 0;

    // Una fila de tabla por cada material que ofrece.
    let filas = "<tr><td>Precio por hora</td><td>" + pesos(v.hora) + "</td></tr>" +
                "<tr><td>Margen</td><td>" + v.margen + "%</td></tr>";
    for (const material in v.mat) {
      filas += "<tr><td>" + esc(material) + " por kg</td><td>" + pesos(v.mat[material]) + "</td></tr>";
    }

    // Botones: dependen de si estás registrado y de si el perfil es el tuyo.
    let botones = "";
    if (!registrado) {
      botones = '<a class="btn" href="cuenta.html">Regístrate para cotizar</a>';
    } else if (!esMio) {
      const marcado = social.favoritos[clave];
      botones = '<button type="button" class="btn claro' + (marcado ? " activo" : "") + '" data-fav="' + esc(clave) + '">' +
                (marcado ? "Quitar de favoritos" : "Agregar a favoritos") + "</button>" +
                '<a class="btn" href="cotizador.html?v=' + encodeURIComponent(clave) + '">Cotizar con ' + esc(v.nombre) + "</a>";
    }

    html += '<div class="tarjeta">' +
              "<h2>" + esc(v.nombre) + (esRegistrado ? '<span class="insignia">' + (esMio ? "Tú" : "Registrado") + "</span>" : "") + "</h2>" +
              '<p class="suave" style="margin:0">' + esc(v.nota) + "</p>" +
              '<div class="estrellas">' + esc(textoResena(clave)) + "</div>" +
              '<table>' + filas + "</table>" + botones +
            "</div>";
  }
  $("lista").innerHTML = html;
}

// Un solo "oyente" para todos los botones de favorito de la lista.
$("lista").addEventListener("click", function (e) {
  const boton = e.target.closest("[data-fav]");
  if (!boton || !registrado) return;
  const social = datosSocial(usuario.id);
  const clave = boton.dataset.fav;
  if (social.favoritos[clave]) delete social.favoritos[clave];
  else social.favoritos[clave] = true;
  guardarSocial(usuario.id, social);
  dibujarVendedores();
});

dibujarVendedores();

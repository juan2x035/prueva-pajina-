# Cotizador de impresión 3D

Página web hecha solo con HTML, CSS y JavaScript (sin librerías ni servidor).
Las cuentas, los vendedores, las reseñas y los favoritos se guardan en el navegador (localStorage).

## Cómo abrirla
- Abre `index.html` con doble clic, o con la extensión Live Server de VS Code.
- Para publicarla en Vercel: sube la carpeta a GitHub, impórtala en vercel.com con "Framework: Other". No necesita configuración.

## Qué hace cada archivo

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Inicio |
| `cotizador.html` | Cotizador (solo para registrados) |
| `vendedores.html` | Lista de vendedores, favoritos y estrellas |
| `cuenta.html` | Crear cuenta, iniciar sesión y registrarse como cliente o vendedor |
| `taller.html` | Mi taller: precios y materiales (solo vendedores) |
| `css/estilos.css` | Todos los estilos, ordenados por secciones |
| `js/utilidades.js` | Funciones pequeñas que usan todas las páginas |
| `js/almacenamiento.js` | Guarda y lee datos en localStorage |
| `js/sesion.js` | Revisa quién inició sesión y arregla el menú |
| `js/cotizador.js`, `vendedores.js`, `cuenta.js`, `taller.js` | La lógica de cada página |

## Cómo estudiar el código (orden sugerido)
1. `js/utilidades.js`: funciones cortas, una cosa cada una.
2. `js/almacenamiento.js`: cómo se guardan los datos (JSON + localStorage).
3. `js/sesion.js`: cómo el menú cambia según quién eres.
4. `vendedores.js` y luego `cuenta.js`.
5. `cotizador.js`: el más largo, está dividido en bloques comentados.

Ideas que vas a ver: variables (`const`, `let`), funciones, `if`, ciclos `for`, objetos, listas,
eventos (`addEventListener`), y cómo JavaScript cambia el HTML con `innerHTML` y `textContent`.

## Cosas que puedes cambiar fácil
- Colores: variables al inicio de `css/estilos.css`.
- Vendedores de ejemplo y sus teléfonos: `VENDEDORES_EJEMPLO` en `js/almacenamiento.js`.

## Límites (es una demostración)
- Los datos viven solo en el navegador y el equipo donde se registraron.
  Si se borran los datos del sitio, se pierde todo.
- La contraseña se guarda cifrada, pero una página real necesita un servidor y una base de datos.
- El chat solo muestra tus mensajes; no hay respuestas del vendedor.

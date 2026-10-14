# Cotizador de impresión 3D

Sitio estático (HTML + CSS + JavaScript) con cuentas y vendedores guardados en Supabase.

## Estructura
- `index.html` inicio
- `cotizador.html` cotizador
- `vendedores.html` lista de vendedores
- `cuenta.html` inicio de sesión, registro y borrado de cuenta
- `taller.html` Mi taller (precios y materiales; solo vendedores)
- `css/estilos.css` estilos de todas las páginas
- `js/app.js` lógica de todas las páginas
- `js/api.js` guardado de datos (modo demostración o Supabase)
- `js/config.js` datos de conexión a Supabase
- `supabase.sql` tablas y reglas de seguridad

## Modo demostración (sin configurar nada)
Si `js/config.js` está vacío, la página funciona sola: las cuentas, los registros de vendedores y sus precios se guardan en el navegador (localStorage). Sirve para exponer en un solo equipo. Los datos no se comparten entre dispositivos y se pierden si se borra el caché del navegador.

## 1. Crear la base de datos (solo si quieres cuentas reales compartidas) (Supabase, plan gratis)
1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor**, pega el contenido de `supabase.sql` y pulsa **Run**.
3. Ve a **Authentication > Providers > Email** y desactiva **Confirm email** (así las cuentas nuevas entran de una vez; útil para la exposición).
4. Ve a **Project Settings > API** y copia **Project URL** y **anon public key** en `js/config.js`.

## 2. Publicar en Vercel
1. Sube la carpeta a un repositorio de GitHub.
2. En https://vercel.com elige **Add New > Project** e importa el repositorio.
3. Framework Preset: **Other**. No necesita comando de build ni carpeta de salida.
4. Cuando termine, copia la URL que te da Vercel y ponla en Supabase en **Authentication > URL Configuration > Site URL**.

## Probar en local
Abre `index.html` con la extensión Live Server de VS Code o ponlo en `htdocs` de XAMPP.
Sin llenar `js/config.js` la página funciona, pero la pestaña Cuenta avisa que falta conectar la base de datos.

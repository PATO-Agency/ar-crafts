# AR Crafts

Landing de demostración de AR Crafts, mantenida por PATO Agency. Usa contenido fixture: el CMS, el contacto comercial y la aprobación visual final siguen pendientes.

## Desarrollo

Requiere Node.js 22.12 o superior y npm 10 o superior.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:3000. No se necesitan credenciales para la demo local.

## Revisión visual

Recomendado: ventana de 1440 × 900, zoom 100%. Recarga arriba y observa seis segundos para apreciar la entrada de la mariposa y sus destellos. Baja lentamente: el hero permanece visible mientras crece el follaje y gira el aro. Las ramas y hojas siguen la posición del scroll, también al retroceder. En Inspiración, observa la transición pieza → detalle → manos y recorre el tramo en sentido inverso.

La demo usa la política de movimiento `always`, por decisión expresa de revisión: reproduce animaciones incluso con reduced motion activo, sin modificar esa preferencia del navegador. La política `system` conserva su fallback. Sin JavaScript o ante un fallo de inicialización, el contenido permanece visible.

## Verificación

```sh
npm run lint
npm run typecheck
npm run format:check
npm test
npm run check:secrets
npm run test:e2e
```

Los comandos `assets:botanical` y `assets:butterfly` requieren los SVG originales y referencias de diseño conservados localmente. Los vectores preparados y recursos necesarios para ejecutar la web sí están incluidos.

## Vercel

Proyecto dedicado `ar-crafts-demo`, preparado para conectar a `PATO-Agency/ar-crafts`. Configuración de proyecto:

- Root Directory: `apps/web`, incluyendo fuentes fuera de esa carpeta.
- Node.js: `22.x`.
- Instalación: `cd ../.. && npm ci --no-fund`.
- Build: `npm run build` desde `apps/web` (solo web).
- Configuración de demo en `apps/web/vercel.json`: `AR_REMOTE_DEMO=enabled`, `AR_CONTENT_SOURCE=fixture`, `PATO_SITE_VISIBILITY=internal`.

El modo remoto admite únicamente la landing y sus recursos. Bloquea las APIs de CMS, preview y revalidación; no activa contacto, servicios editoriales ni indexación. No requiere secretos ni publicar Studio.

Los archivos `.env`, informes internos, capturas de auditoría, dependencias y compilados quedan fuera de Git. `.env.example` contiene únicamente variables vacías y valores locales de ejemplo. El lock de dependencias se conserva para instalaciones reproducibles.

# AR Crafts

Landing de AR Crafts, mantenida por PATO Agency. La demo usa fixture; el entorno editorial protegido usa Sanity. Contacto comercial y contenido definitivo siguen pendientes.

Consulta [ENTREGA.md](ENTREGA.md) para reproducir la versión y completar accesos y titularidad. La fuente editorial se mantiene en `editorial`; `main` conserva la demo. Web y Studio comparten este repositorio.

## Desarrollo

Requiere Node.js 22.12 o superior y npm 10 o superior.

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:3000. No se necesitan credenciales para la demo local.

## Revisión visual

El contexto vigente de la landing está en [PRODUCT.md](apps/web/PRODUCT.md) y su identidad, componentes, responsive y movimiento actuales en [DESIGN.md](apps/web/DESIGN.md). El usuario aprobó la sincronización de galería, las optimizaciones de movimiento y el hero móvil B. El 6 de octubre de 2026 comunicó revisión física en iPhone/Safari y Android/Chrome y aceptó la validación disponible para actualizar esta demo. Se conserva el recorrido de escritorio de 225vh.

Verificación de la demo publicada: 175 pruebas unitarias; Chrome 72/72 y WebKit 71/72 E2E. Firefox está bloqueado al arrancar en el entorno Windows utilizado. WebKit conserva un fallo de navegación secuencial con Tab; no se probó teclado en Safari físico. Estas limitaciones quedaron aceptadas para esa actualización, sin acreditar compatibilidad completa ni conformidad de accesibilidad. El cierre editorial posterior cuenta con 304 tests unitarios, 63 comprobaciones de layout/movimiento y 13 de cookies en Chrome; no sustituye los pendientes de otros motores. Los informes y capturas detallados permanecen como evidencia interna local en `plans/` y `docs/delivery/`; no son requisitos de instalación.

Recomendado: ventana de 1440 × 900, zoom 100%. Recarga arriba y observa seis segundos para apreciar la entrada de la mariposa y sus destellos. Baja lentamente: el hero permanece visible mientras crece el follaje y gira el aro. Las ramas y hojas siguen la posición del scroll, también al retroceder. En Inspiración, observa la transición pieza → detalle → manos y recorre el tramo en sentido inverso.

Desde el 9 de octubre de 2026, por decisión expresa del usuario, toda la landing usa la política de movimiento `always`: demo, contenido editorial publicado y vista previa reproducen animaciones incluso con reduced motion activo, sin modificar la preferencia del navegador. La política `system` permanece disponible internamente como fallback opcional, pero no se selecciona por la fuente de contenido. Sin JavaScript o ante un fallo de inicialización, el contenido permanece visible.

## Verificación

El 2026-10-06 se comprobó el proyecto Sanity propio `dbk6sgbx`, dataset privado `ar-crafts-editorial-test`, Studio local y [web editorial protegida](https://ar-crafts-editorial.vercel.app). Guardado, Presentation, salida de preview, publicación y retirada se verificaron con datos de prueba y entregas reales. El 2026-10-07 se comprobó el reintento automático real del mismo mensaje, HTTP 503 → 200 y HTML actualizado. La validación técnica T8 (evidencia interna local: `plans/007-validacion-t8.md`) está verificada técnicamente con contenido de prueba: caída sin caché 8/8 y despliegue editorial protegido 5/5 comprobados; comprobación focalizada alojada 11/11 satisfactoria. T1 y T9 siguen pendientes de contenido definitivo y aprobación humana; no hay lanzamiento comercial. Consulta el [runbook de CMS](apps/studio/AR-CRAFTS-CMS-RUNBOOK.md) y la [plantilla alojada](config/ar-crafts-editorial-hosted.env.example). La herramienta histórica de VicaFoods no verifica AR Crafts. La aprobación de diseño del fixture no aprueba contenido editorial nuevo.

```sh
npm run check
npm run format:check
npm run legal:check
npm test
npx playwright test --project=chrome
```

`npm test` genera también los fixtures de layout editorial en `tests/.generated/`. Chrome E2E usa Google Chrome instalado. Para ejecutar los tres motores con `npm run test:e2e`, instalar primero Firefox y WebKit mediante `npx playwright install firefox webkit`; registrar cualquier limitación de arranque del equipo.

Los comandos `assets:botanical` y `assets:butterfly` requieren los SVG originales y referencias de diseño conservados localmente. Los vectores preparados y recursos necesarios para ejecutar la web sí están incluidos.

## Vercel

Demo: https://ar-crafts-demo.vercel.app. Proyecto dedicado `ar-crafts-demo`, conectado a `PATO-Agency/ar-crafts`; los pushes a `main` generan despliegues. Configuración de proyecto:

- Root Directory: `apps/web`, incluyendo fuentes fuera de esa carpeta.
- Node.js: `22.x`.
- Instalación: `cd ../.. && npm ci --no-fund`.
- Build: `npm run build` desde `apps/web` (solo web).
- `apps/web/vercel.json` es común y neutral. Variables del proyecto demo: `AR_REMOTE_DEMO=enabled`, `AR_CONTENT_SOURCE=fixture`, `PATO_SITE_VISIBILITY=internal`.

El modo remoto admite únicamente la landing y sus recursos. Bloquea las APIs de CMS, preview y revalidación; no activa contacto, servicios editoriales ni indexación. No requiere secretos ni publicar Studio.

El flujo de entrega conecta el proyecto independiente `ar-crafts-editorial` a la rama de producción `editorial`, manteniendo `main` en el proyecto demo. Verificar y registrar el enlace Git y su despliegue antes de declararlos completados. Ambos usan la configuración común neutral; sus variables de proyecto seleccionan la fuente. La URL principal editorial admite lectura sin cuenta de Vercel; los otros despliegues conservan Standard Protection y el webhook `https://ar-crafts-editorial.vercel.app/api/revalidate/sanity`. El preparador `tooling/prepare-vercel-editorial.mjs` y `config/vercel.ar-crafts-editorial.json` conservan el procedimiento manual histórico. Los accesos privados de automatización y Presentation son distintos. El usuario autorizó guardar el segundo en el dataset privado; sus lectores autorizados pueden utilizarlo. No copiar esos valores a documentación o variables públicas. Studio se publica separadamente en Sanity; Git/Vercel no publica el editor ni el contenido del dataset.

Los cuatro textos canónicos y el índice de `docs/legal` se versionan selectivamente y se sincronizan con el JSON de ejecución mediante `npm run legal:sync` / `npm run legal:check`. Siguen siendo borradores con identidad y jurisdicción pendientes. Los archivos `.env`, informes internos, capturas de auditoría, dependencias y compilados quedan fuera de Git. `.env.example` contiene únicamente variables vacías y valores locales de ejemplo. El lock de dependencias se conserva para instalaciones reproducibles.

## Acceso de revisión para el cliente · 9 de octubre de 2026

Por solicitud del usuario, https://ar-crafts-editorial.vercel.app/ permite revisar el contenido publicado sin cuenta de Vercel desde otro dispositivo. Standard Protection protege las otras URLs de despliegue. La demo https://ar-crafts-demo.vercel.app/ también se revisa sin cuenta. Ambas conservan noindex y contacto por confirmar.

Este acceso solo permite consultar la web. Studio y el dataset privado conservan sus permisos; la entrada a borradores exige un secreto válido y el webhook conserva firma y validación de origen. PATO_HOSTED_INTERNAL_PREVIEW=authenticated permanece como configuración heredada del runtime y no autentica a los lectores de la URL principal. La invitación del cliente a Studio sigue pendiente. Los textos, fechas y fotografías de stock del CMS continúan siendo datos de ensayo, y las políticas legales son borradores.

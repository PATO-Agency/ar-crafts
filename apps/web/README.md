# Web de AR Crafts

Next.js App Router sirve la landing. `AR_CONTENT_SOURCE=fixture` es la demo por defecto; `sanity` usa exclusivamente el proyecto/dataset configurado para AR Crafts. Los nombres `@pato-food/*` identifican infraestructura compartida y no autorizan reutilizar datos o credenciales de VicaFoods.

El 2026-10-06 se comprobó conexión real con `dbk6sgbx/ar-crafts-editorial-test`, dataset privado. La web editorial está en `https://ar-crafts-editorial.vercel.app`, separada de la demo, con protección de Vercel en todos los despliegues. Sigue el [runbook de CMS](../studio/AR-CRAFTS-CMS-RUNBOOK.md) y las plantillas [local](../../config/ar-crafts-editorial.env.example) y [alojada](../../config/ar-crafts-editorial-hosted.env.example). La configuración anterior a la creación del proyecto era preparación, no evidencia integrada.

## Lectura y preview

- `AR_CONTENT_SOURCE=sanity` requiere `SANITY_PROJECT_ID`, `SANITY_DATASET` y `SANITY_READ_TOKEN` privado. Las consultas se validan mediante `@ar-crafts/content`. La lectura normal acepta únicamente documentos aprobados.
- La solicitud normal utiliza `published`, incluso en desarrollo. Solo Draft Mode explícito en `internal + sanity` habilita `drafts`, sin CDN ni caché publicado. La lectura automática de drafts de la implementación heredada no gobierna AR Crafts.
- `/api/draft/enable` admite loopback en desarrollo, secreto manual privado de al menos 32 caracteres o Preview URL Secret de Sanity. Solo redirige a `/`. La cookie manual dura 30 minutos; Presentation en producción usa HttpOnly/Secure/SameSite=None/Partitioned de una hora.
- `/api/draft/disable` expira por separado las cookies ordinaria y particionada en producción. Se corrigió la persistencia real de la cookie de Presentation al salir; 13 comprobaciones en Chrome alojado verificaron entrada, flags, salida y lectura publicada. Ambas rutas emiten cabeceras privadas y no indexables. Las unidades con dobles se distinguen de esa ejecución real.
- Studio configura Presentation; la web limita `frame-ancestors` a `PATO_STUDIO_ORIGIN` y al opcional `PATO_HOSTED_STUDIO_ORIGIN`. Cuando se configura Studio alojado, incluye además el ancestro exacto `https://www.sanity.io` para el Dashboard anidado; sin comodines. Studio alojado: [ar-crafts-editorial-test.sanity.studio](https://ar-crafts-editorial-test.sanity.studio/). Handshake e iframe comprobados con la sesión actual y el bypass exclusivo autorizado de Presentation. No hay puente live editing/overlays: refrescar la vista tras guardar; «Continue anyway» permite continuar sin esa conexión. La cuenta propia del cliente se verifica por separado.

## Contenido e imágenes

Son editables hero, Nuestra esencia, talleres, ediciones, materiales, Inspiración y FAQ. Ediciones: instantes con offset, `America/Lima` y filtrado de vencidas antes del límite. Materiales: ocultos excluidos, destacados primero y no disponibles visibles con su estado.

Los opcionales vacíos conservan estados pendientes. Una imagen suministrada necesita archivo, alt y tipo; la lectura publicada muestra únicamente fotografías con derechos confirmados. Inspiración aprobada requiere fotografía autorizada. El runtime rechaza contratos inválidos; un CMS fallido muestra el estado informativo existente sin sustituirlo por la demo.

`next.config.ts` permite imágenes de Sanity solo para el proyecto/dataset configurado. `CraftArtwork` conserva dimensiones y fallback. Mariposa y follaje siguen siendo recursos locales. Titularidad, dimensiones, peso, formatos y animación de fotos reales requieren revisión de ingestión; un booleano no acredita esos controles.

## Actualización y despliegue

`POST /api/revalidate/sanity` verifica firmas de `@sanity/webhook`, headers oficiales de origen/operación, idempotency key y payload publicado `{ "_id": "…", "_type": "arMaterial" }`. Limita cuerpos a 16 KiB y admite los seis tipos AR. Los recibos persistentes requieren `SANITY_REVALIDATION_TOKEN`, con escritura limitada a `revalidationReceipt` cuando el plan permita roles personalizados.

Caché publicado: etiqueta `ar-crafts`, TTL 300 segundos y `revalidateTag(tag, "max")` con stale while revalidate. HTTP 200 no prueba frescura: medir cuándo la respuesta web contiene el cambio.

La demo `AR_REMOTE_DEMO=enabled` exige fixture y bloquea APIs editoriales. No modificar `vercel.json` para abrir CMS. El perfil local usa web 3001 y Studio 3334. La superficie alojada existente tiene protección efectiva del proveedor, comprobada desde contextos anónimos. `PATO_HOSTED_INTERNAL_PREVIEW=authenticated`, noindex y Draft Mode no proporcionan autenticación general. El ensayo añade el bypass de automatización únicamente al origen editorial exacto; no lo reenvía a otros orígenes.

Publicación, modificación y despublicación observadas con caché caliente y entrega real de Sanity. La prueba secuencial midió 9,621 s, 8,599 s y 8,874 s desde inicio de acción hasta primera respuesta HTML esperada; son observaciones de esta ejecución, no SLA ni actualización inmediata. El 2026-10-07 se verificó un reintento automático real del mismo mensaje, HTTP 503 → 200, recuperación del HTML, restauración del rol y limpieza. La deduplicación conserva cobertura simulada diferenciada.

La [validación técnica T8](../../plans/007-validacion-t8.md) está verificada técnicamente con contenido de prueba. Next producción local y datos reales de Sanity pasaron 20/20 comprobaciones focalizadas: contenido aprobado, exclusión de pendiente, texto largo, teclado, expiración en pestaña abierta y SSR con relojes controlados, y caché caliente ante caída simulada del transporte. WebKit 26.6 pasó un smoke a 390px y reduced motion; Firefox no pudo iniciar. Las fechas se actualizan sin reemplazar hero ni galería. Caída sin caché 8/8 y despliegue editorial protegido 5/5 comprobados; comprobación focalizada alojada 11/11 satisfactoria. Esto no acredita T1/T9 ni revisión física o aprobación humana global.

Contacto real y publicación comercial pendientes. Los ensayos usan `confirmed:false` y no generan enlaces de WhatsApp.

## Política de animaciones

Desde el 9 de octubre de 2026, por petición expresa del usuario, `CraftPageView` usa `data-motion-policy="always"` tanto con fixture como con contenido editorial publicado o en vista previa. Las animaciones CSS y el controlador de scroll no se desactivan por `prefers-reduced-motion`. Se conservan las condiciones de espacio para fijar las escenas, la reversibilidad y el contenido visible sin JavaScript o ante un fallo de inicialización. No cambia los ajustes del equipo. `system` sigue disponible internamente, pero no es la política predeterminada del contenido editorial.

## Documentos legales y aviso de cookies

Desde el 8 de octubre de 2026, el footer enlaza `/legal/terminos-y-condiciones`, `/legal/privacidad`, `/legal/cookies` y `/legal/condiciones-comerciales`. Son páginas de revisión con texto íntegro, índice, tablas desplazables y aviso de borrador; la identidad, jurisdicción y reglas comerciales aún no están confirmadas. Conservan noindex. La demo permite esas cuatro rutas exactas y sigue bloqueando las APIs editoriales.

Los originales versionados están en `docs/legal/`; `npm run legal:sync` genera la copia incluida en `src/features/legal/documents.json` y `npm run legal:check` verifica correspondencia. El build utiliza el JSON. Los demás informes de `docs/` siguen locales; el índice legal y los informes internos no se incorporan al sitio. Los documentos se mantienen en código; no son campos editables del CMS.

El aviso global de cookies enlaza la política y permite «Cerrar aviso». El cierre vive en memoria y se mantiene durante navegación interna; reaparece tras recarga. No guarda cookies, localStorage ni sessionStorage ni activa analítica/publicidad. Es un aviso informativo, no un gestor de consentimiento por categorías. La política de cookies describe este comportamiento.

Validación local: lint, tipos, 355 pruebas unitarias, 7 pruebas Chrome y build web satisfactorios. Chrome comprobó lectura a 320/390/768/1440 px, navegación, teclado, tablas, noindex y acceso sin JavaScript. No se desplegó esta integración ni se acreditan políticas comerciales definitivas o cumplimiento jurídico.

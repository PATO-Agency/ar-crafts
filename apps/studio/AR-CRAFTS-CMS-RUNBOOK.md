# CMS de AR Crafts: configuración y comprobación

Actualizado el 2026-10-09. Flujo de entrega y versión: [ENTREGA.md](../../ENTREGA.md). Proyecto propio `dbk6sgbx`, dataset privado `ar-crafts-editorial-test`, Studio local `http://127.0.0.1:3334` y web editorial de lectura pública `https://ar-crafts-editorial.vercel.app`. Edición, preview, publicación y retirada se comprobaron con entregas reales. El reintento automático real HTTP 503 → 200 del mismo mensaje quedó comprobado; la validación técnica T8 (evidencia interna local: `plans/007-validacion-t8.md`) está verificada técnicamente con contenido de prueba, con caída sin caché 8/8 y despliegue editorial protegido 5/5 comprobados; comprobación focalizada alojada 11/11 satisfactoria. T1/T9 y aprobación humana global siguen pendientes. Evidencia histórica: `plans/006-validacion.md` (evidencia interna local). Conserva diseño aprobado, hero móvil B, 001/002/003 y escritorio 225vh. No activa contacto ni sustituye la demo.

## 1. Configurar un entorno propio

1. Crear proyecto propio autorizado y dataset **privado y aislado** `ar-crafts-editorial-test`. No copiar VicaFoods ni usar un dataset comercial. El ensayo reserva `arSite`/`ar-cms-test-*` y rechaza colisiones o documentos de comida.
2. Dar acceso de editor al usuario de Studio. Crear token privado de lectura para published/drafts y validación del Preview URL Secret; otro para las acciones del ensayo y otro para recibos. Limitar este último a `revalidationReceipt` si el plan admite roles personalizados; si no, documentar permisos más amplios y revisarlos antes de alojar.
3. Configurar CORS para Studio `http://127.0.0.1:3334`, con credenciales cuando lo requiera la sesión. Comprobar en navegador; no añadir comodines. La lectura de la web es servidor a servidor.
4. Copiar `config/ar-crafts-editorial.env.example` a `.env.ar-crafts-editorial.local` en la raíz. Completar IDs iguales de Studio/web y secretos **localmente**, en editor seguro. Está ignorado por Git. No enviar tokens por chat ni convertirlos en variables públicas. Webhook y preview requieren secretos de al menos 32 caracteres.
5. El hook editorial existente `aiX5YciaTMLKFvVX` apunta a `https://ar-crafts-editorial.vercel.app/api/revalidate/sanity` y está habilitado para los seis tipos AR. Comprobar su estado antes de modificarlo; no crear otro hook como sustituto. Sanity no entrega a loopback sin un receptor accesible.

Perfil: `AR_CONTENT_SOURCE=sanity`, `PATO_SITE_VISIBILITY=internal`, `PATO_LOCAL_INTERNAL=confirmed`, web 3001/Studio 3334. `AR_REMOTE_DEMO` y `PATO_HOSTED_INTERNAL_PREVIEW` deben estar **ausentes**. Un token largo y un ID no prueban permisos: verificar lectura y acciones autorizadas.

## 2. Iniciar el perfil editorial separado

Desde raíz, con el Node instalado compatible con el proyecto:

```powershell
node --env-file=.env.ar-crafts-editorial.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts diagnose
node --env-file=.env.ar-crafts-editorial.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts web
```

En otra terminal:

```powershell
node --env-file=.env.ar-crafts-editorial.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts studio
```

Diagnóstico imprime presencia/coincidencias, no valores. Web: `http://127.0.0.1:3001`; Studio: `http://127.0.0.1:3334`. No iniciar simultáneamente otra instancia Next de la demo en este checkout: comparten `.next`, aunque la configuración y los puertos sean distintos. Detener la web antes de compilar. Para medir caché, usar **build/start**, sin extrapolar desarrollo:

```powershell
node --env-file=.env.ar-crafts-editorial.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts build
node --env-file=.env.ar-crafts-editorial.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts start
```

La demo remota permanece igual. Build sin credenciales prueba scaffold/fixture, no conectividad. No usar la herramienta histórica de VicaFoods.

## 3. Guardado y preview/publicado

Para practicar desde la interfaz como editor de AR Crafts, sigue la [guía del ensayo manual](GUIA-EDITORIAL-AR-CRAFTS.md). El primer borrador del hero fue publicado por el usuario. Después, a su solicitud, se preparó una base editorial completa con 22 registros de prueba y seis fotografías de referencia licenciadas; el hero existente se conserva. Los encabezados y relatos se editan en Página → Textos de las secciones, con fallback al copy original. Los registros quedan disponibles para practicar y no se limpian automáticamente. Esta preparación es posterior a la limpieza de T8, no modifica su evidencia histórica ni añade aprobación comercial/humana.

Crear registros `[PRUEBA CMS]` con `sourceRef=AR-CMS-TEST:…`, sin oferta/contacto real y `contact.confirmed=false`. Hero y Nuestra esencia son campos de `arSite`; talleres y ediciones se relacionan, con offset y `America/Lima`. Materiales: inquiry/unavailable/hidden y destacados. Inspiración: pieza/detalle/manos; menos etapas conservan flujo normal. FAQ vacío elimina su ancla.

Guardar sin publicar en Studio. Abrir Presentation y **refrescar el iframe tras guardar**. Se configura handshake, pero no hay puente live editing/overlays instalado: no prometer refresco automático ni selección visual. Registrar cookie/entrada de Draft Mode y respuesta con el borrador. En otro contexto sin cookie, comprobar lectura publicada sin cambios, incluso en desarrollo. Salir de preview y verificar cookie expirada/lectura normal.

Probar entrada loopback/manual y Preview URL Secret real. En producción manual: HttpOnly/Secure/SameSite=Lax, 30 min. Presentation: HttpOnly/Secure/SameSite=None/Partitioned, 1 h. La salida expira ambas variantes mediante dos cabeceras independientes; no usar una cookie jar que las mezcle por nombre. Esta corrección se verificó en Chrome alojado y en el iframe real. Revisar cookies de terceros en navegadores reales. No guardar URLs con secretos, cookies, Authorization o firmas en capturas, traces o informes. La [guía de Sanity](https://www.sanity.io/docs/visual-editing/implementing-draft-mode) describe el handshake; las unidades con dobles se distinguen de la comprobación real.

Preview alojado exige otra superficie editorial, con autenticación efectiva del proveedor/SSO **antes de Next**. Probar anónimo rechazado, sesión válida, caducidad, roles y acceso al iframe. `PATO_HOSTED_INTERNAL_PREVIEW=authenticated` declara configuración y no implementa login. Noindex/CSP/Draft Mode tampoco lo sustituyen. No abrir CMS en `ar-crafts-demo`.

## 4. Publicación, hook y latencia

Configurar create/update/delete sin drafts/versiones. Usar coalesce para delete/unpublish:

```groq
coalesce(after()._type, before()._type) in ["arSite", "arWorkshop", "arWorkshopEdition", "arMaterial", "arInspiration", "arFaq"]
  && !(coalesce(after()._id, before()._id) in path("drafts.**"))
  && !(coalesce(after()._id, before()._id) in path("versions.**"))
```

```groq
{
  "_id": coalesce(after()._id, before()._id),
  "_type": coalesce(after()._type, before()._type)
}
```

Destino `/api/revalidate/sanity` del receptor editorial propio. Secret compartido en `SANITY_WEBHOOK_SECRET`; hook exacto en `SANITY_WEBHOOK_ID`. Comprobar headers oficiales de firma, project/dataset/document/operation e idempotency key. No desactivar firma ni suplantar origen. Se rechazan tipos de VicaFoods. Recibos distinguen completado/fallido/en curso, lease de 30 s y HTTP 503 para reintentos. Un callback del tester no acredita entrega del proveedor.

Calentar caché con lectura publicada. Registrar hora de publicación/modificación/despublicación, intento real, HTTP, recibo completado y primera respuesta web con marcador nuevo/ausente; registrar respuestas antiguas intermedias. TTL 300 s y `revalidateTag("ar-crafts", "max")` pueden servir contenido anterior mientras revalidan. HTTP 200 y lectura directa de Sanity no prueban frescura web. Si aparece por TTL sin entrega acreditada, registrarlo así.

Conservar intentos/mensajes del proveedor y logs saneados `sanity_webhook` con IDs/operación/tiempos. La documentación vigente indica dos reintentos de fallos, separados por 30 s; comprobar los intentos efectivos. Fuentes: [webhooks](https://www.sanity.io/docs/content-lake/webhooks), [buenas prácticas](https://www.sanity.io/docs/content-lake/webhook-best-practices). Probar duplicado y fallo temporal controlado en el entorno aislado, sin afectar la demo.

## 5. Ensayo específico de AR Crafts

Sin entorno ni escritura:

```powershell
node --import tsx tooling/verify-ar-crafts-editorial-flow.ts --report=docs/delivery/ar-crafts-editorial/plan.json
```

Después de configurar el dataset, el siguiente comando **escribe** documentos y un PNG, realiza acciones reales, observa respuestas HTML y limpia sus propios registros. Sustituir `PROJECT_ID` por ID autorizado. `--simulate-webhook` firma callbacks locales y comprueba deduplicación, **no entrega real de Sanity**:

```powershell
node --env-file=.env.ar-crafts-editorial.local --import tsx tooling/verify-ar-crafts-editorial-flow.ts --apply --confirm-sandbox-write --confirm-project=PROJECT_ID --confirm-dataset=ar-crafts-editorial-test --simulate-webhook --report=docs/delivery/ar-crafts-editorial/ensayo.json
```

Para el hook real, omitir `--simulate-webhook` y contrastar con intentos del proveedor. El receptor debe pertenecer al mismo despliegue y origen observado; invalidar otra web no prueba su caché. El perfil loopback no proporciona una pasarela. No exponer preview anónimamente. El modo alojado ya admite un origen HTTPS exacto y añade autenticación de automatización únicamente a ese origen. Observación por defecto 45 s; `--timeout-ms` permite 1–60 s. Es un límite del ensayo, no SLA. Timeout conserva el fallo y no aprueba el ciclo.

Etapas: colisiones → baseline/cache → drafts → preview/exit → publish → modify → unpublish material → delete FAQ → limpieza. Registra marcador en **HTML**, no aprobación visual ni edición desde Studio. Nunca declara `integratedCMSClosed=true`: Presentation, autenticación y entrega requieren evidencia adicional. Si falla limpieza, revisar los IDs del informe; no vaciar el dataset. Recibos del proveedor con hashes desconocidos se conservan.

El PNG generado de 1×1 prueba upload/asset/alt. Sus campos photograph/rightsConfirmed son datos sintéticos sobre un archivo propio, no prueba de fotografía comercial. Para composición, usar archivos autorizados representativos y web hidratada. Los tests SSR y fixture ilustrativo no prueban movimiento de fotografías remotas.

## 6. Operación alojada y evidencia actual

El flujo de entrega utiliza `apps/web/vercel.json` común y neutral para los dos proyectos. La demo `ar-crafts-demo` mantiene `main` y variables fixture; el proyecto editorial independiente usa `editorial` como rama de producción y variables Sanity. Verificar y registrar el enlace Git y el despliegue antes de declararlos completados. Proyecto editorial: `prj_J59WLJT7RFK6FGzxsGxBloUyJaPv`, equipo `team_lAtnXYSMKXirRnttVXs67MHO`. Protección de Vercel vigente: Standard Protection; la URL principal admite revisión de lectura sin cuenta. Aplicar únicamente la allowlist de servidor del perfil alojado; quedan excluidos `SANITY_WRITE_TOKEN` y los bypass privados del operador. `config/vercel.ar-crafts-editorial.json` y `tooling/prepare-vercel-editorial.mjs` conservan el procedimiento manual histórico; sin `--write` el preparador no modifica archivos. Verificar identidad del proyecto antes de cualquier despliegue.

El perfil privado `.env.ar-crafts-editorial-hosted.local` conserva el perfil loopback original y deriva de la [plantilla alojada](../../config/ar-crafts-editorial-hosted.env.example). `SANITY_STUDIO_PREVIEW_URL` es el origen HTTPS de la **web**, mientras `PATO_STUDIO_ORIGIN` conserva el **Studio local** en 3334. El runner excluye credenciales de servidor, bypass y variables `SANITY_STUDIO_*` desconocidas del proceso/bundle de Studio. Diagnóstico y Studio local:

```powershell
node --env-file=.env.ar-crafts-editorial-hosted.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts diagnose
node --env-file=.env.ar-crafts-editorial-hosted.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts studio
```

### Studio alojado — acceso desde otra computadora

URL de ensayo: [AR Crafts · Studio](https://ar-crafts-editorial-test.sanity.studio/). Sanity puede redirigir al Dashboard de la organización; es el mismo Studio registrado. Proyecto `dbk6sgbx`, dataset privado `ar-crafts-editorial-test`, aplicación `d3lzfvug45572izs3q1jp8kb`. No depende de mantener una terminal local encendida. Los archivos del editor son públicos; los documentos privados requieren sesión y permisos de Sanity. No incluir tokens en el bundle.

El perfil del operador añade `SANITY_STUDIO_HOST=ar-crafts-editorial-test`, `SANITY_STUDIO_APP_ID` con el ID real y `PATO_HOSTED_STUDIO_ORIGIN=https://ar-crafts-editorial-test.sanity.studio`. Estas son identidades públicas, no credenciales. CORS conserva localhost con credenciales y añade solamente el hostname exacto alojado. La web permite como ancestros `'self'`, localhost, el hostname alojado y `https://www.sanity.io`, necesario por el iframe anidado del Dashboard; no usa comodines. [Documentación del Dashboard](https://www.sanity.io/docs/dashboard/dashboard-configure). Standard Protection conserva protegidas las otras URLs de despliegue; la URL principal es de lectura pública. Los bypass separados se conservan para esos despliegues.

Despliegue manual reproducible **por el operador**, con su sesión CLI de Sanity autorizada:

```powershell
node --env-file=.env.ar-crafts-editorial-hosted.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts studio-dry-run
node --env-file=.env.ar-crafts-editorial-hosted.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts studio-deploy
```

`studio-build` compila sin desplegar. `studio-deploy` exige perfil alojado, coincidencia de hostname/origen y despliegue de schema satisfactorio. La versión instalada y `deployment.autoUpdates=false` se mantienen; no actualizar dependencias automáticamente. El primer despliegue devuelve el app ID: guardarlo en el perfil privado, nunca asumirlo. El app ID tiene precedencia sobre hostname en la CLI; comprobar ambos en Sanity antes de cualquier redeploy con un perfil nuevo. La sesión del operador no se entrega al cliente. El runner elimina `SANITY_AUTH_TOKEN`; CI/CD con deploy token separado no está preparado en este alcance.

Al cambiar el hostname, actualizar CORS exacto y `PATO_HOSTED_STUDIO_ORIGIN` en el proyecto **editorial** de Vercel, y reconstruir/desplegar la rama editorial para aplicar el CSP. Para cambios de textos o imágenes basta publicar documentos; no se despliega código. Preservar la demo fixture y el perfil loopback.

Para entregar acceso, invitar la cuenta propia del cliente al proyecto con un rol que permita editar y publicar según los roles disponibles del plan contratado; no dar administración innecesaria ni compartir tokens. Revisar qué documentos privados puede leer ese rol, incluido el acceso exclusivo de Presentation ya autorizado. La URL principal se consulta sin cuenta de Vercel. Las otras URLs de despliegue conservan su autenticación separada; una cuenta Sanity no concede por sí sola acceso a ellas. No quitar la protección para resolver un error del iframe.

La prueba con una cuenta distinta del cliente, dispositivos físicos y otros motores permanece pendiente. La interfaz de la organización puede mostrar su nombre administrativo actual; no cambiar otras organizaciones/proyectos para modificar esa marca. Validación del hosting: `plans/008-validacion.md` (evidencia interna local).

Ensayo alojado **con escrituras y limpieza de sus datos propios**, después de comprobar que no hay colisiones y que el hook está habilitado:

```powershell
node --env-file=.env.ar-crafts-editorial-hosted.local --import tsx tooling/verify-ar-crafts-editorial-flow.ts --apply --confirm-sandbox-write --confirm-project=dbk6sgbx --confirm-dataset=ar-crafts-editorial-test --report=docs/delivery/ar-crafts-editorial/real.json
```

El ensayo conserva HTML antiguo/nuevo, tiempos de acción y polling. Su `providerDeliveryVerified=false` es deliberado: requiere contrastar el informe con el historial externo, no inferir entrega de un HTTP 200. Consultar mensajes desde el hostname del proyecto (`dbk6sgbx.api.sanity.io`), API `2021-10-04`, `/hooks/aiX5YciaTMLKFvVX/messages`, páginas de 25 y offset. El endpoint global `/hooks/projects/dbk6sgbx/aiX5YciaTMLKFvVX/attempts` devuelve intentos. Seleccionar únicamente ID, estado, tiempos y payload mínimo; las respuestas de gestión pueden contener secretos. No imprimirlas completas.

Vercel dispone de dos accesos privados diferentes. `AR_EDITORIAL_AUTOMATION_BYPASS_SECRET` se usa como cabecera del webhook/ensayo. `AR_EDITORIAL_PRESENTATION_BYPASS_SECRET` es exclusivo de Presentation y el usuario autorizó guardarlo en el documento privado `sanity-preview-url-secret.vercel-protection-bypass`. Los lectores de ese documento pueden utilizarlo para acceder a la web editorial; no da permisos nuevos de escritura en Sanity. Sanity añade el bypass al URL inicial del iframe y Vercel establece su cookie; no copiar ese URL a informes. Si se abandona el entorno, revocar ambos accesos en Vercel y retirar solamente ese documento propio. [Mecanismo oficial de Sanity](https://www.sanity.io/docs/visual-editing/vercel-protection-bypass).

Guardado y publicación desde Studio, preview real del borrador, salida al contenido publicado, bloqueo anónimo, firmas, entregas reales de los seis tipos y lectura HTML actualizada comprobados. Prueba secuencial con caché HIT y eventos separados: publicación 9,621 s; modificación 8,599 s; retirada 8,874 s. El ensayo masivo se conserva, pero su cola invalida globalmente la etiqueta: no atribuir cada observación a su propio evento sin correlación. Las cifras son observaciones, no SLA. Las APIs editoriales nunca se abren en la demo.

## 7. Pendientes para cierre total

- Reintento automático real comprobado en el ensayo adicional del 2026-10-07: un mismo mensaje recibió HTTP 503 a las 04:20:34,486 UTC y HTTP 200 a las 04:21:04,857 UTC; HTML actualizado a las 04:21:14,628 UTC. Rol restaurado y limpieza comprobados. Informe real: `docs/delivery/t8-2026-10-06/provider-retry-real.json` (evidencia interna local). El ensayo fallido previo permanece en 006; callbacks y deduplicación simulada se distinguen de esta reentrega real.
- Caducidad de sesión y matriz de roles de múltiples usuarios; la sesión editorial probada no demuestra todos los perfiles. Permisos de recibos más amplios que un rol personalizado requieren revisión antes de uso comercial.
- Presentation/cookies y contenido editorial nuevo en dispositivos físicos y otros motores; la aprobación física previa pertenece al fixture.
- Fotografías y alt contextual, derechos/procedencia, peso/dimensiones/formato/animación; ausencia/fallo/cambio de imagen y pérdida de derechos.
- Landing hidratada con datos de prueba: 20/20 comprobaciones focalizadas en Next producción local/Sanity, incluidas expiración en pestaña abierta y SSR con reloj controlado, y retención de caché ante caída simulada. WebKit 26.6 pasó smoke a 390px/reduced motion; Firefox no pudo iniciar. Caída sin caché 8/8 y despliegue editorial protegido 5/5 comprobados; comprobación focalizada alojada 11/11 satisfactoria. Revisión con contenido definitivo y dispositivos físicos pertenece a T1/T9. Por decisión expresa del usuario del 9 de octubre de 2026, mantener las animaciones activas por defecto en demo, publicado y preview incluso con movimiento reducido emulado; conservar contenido, acciones y espacio de escenas si JavaScript o la inicialización fallan.
- La evidencia previa de lint, tipos, formato, secretos, 304 unidades y build se conserva; el cambio temporal tiene 20 unidades focalizadas y build local satisfactorios. Registrar verificaciones finales necesarias sin repetir suites completas por defecto. No registrar aprobaciones humanas adicionales ni lanzamiento comercial.

Contacto y contenido comercial definitivo quedan fuera. Se desplegó únicamente el entorno editorial protegido autorizado por 006. La preparación anterior sigue en `docs/delivery/cms-2026-10-06/validacion-cms.md`; el estado actual y las limitaciones están en `plans/006-validacion.md`. Ningún ensayo registra aprobación visual humana.

Las referencias a `plans/`, `docs/delivery/` y `work/` son evidencia interna local histórica y no son requisitos para instalar o compilar un clon. El código no incluye los documentos y assets del dataset: acordar exportaciones, retención, destino privado y prueba de restauración con el titular; no se realiza un export ni se crean invitaciones en esta entrega documental.

## Acceso de revisión para el cliente · 9 de octubre de 2026

Por solicitud del usuario, https://ar-crafts-editorial.vercel.app/ permite revisar el contenido publicado sin cuenta de Vercel desde otro dispositivo. Standard Protection protege las otras URLs de despliegue. La demo https://ar-crafts-demo.vercel.app/ también se revisa sin cuenta. Ambas conservan noindex y contacto por confirmar.

Este acceso solo permite consultar la web. Studio y el dataset privado conservan sus permisos; la entrada a borradores exige un secreto válido y el webhook conserva firma y validación de origen. PATO_HOSTED_INTERNAL_PREVIEW=authenticated permanece como configuración heredada del runtime y no autentica a los lectores de la URL principal. La invitación del cliente a Studio sigue pendiente. Los textos, fechas y fotografías de stock del CMS continúan siendo datos de ensayo, y las políticas legales son borradores.

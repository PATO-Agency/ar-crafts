# Entrega técnica de AR Crafts

Esta guía describe el código y la operación editorial que se entregan para revisión. La rama de fuente es `editorial`; `main` conserva la demo. La entrega no acredita lanzamiento comercial, aprobación legal ni acceso de edición del cliente hasta completar los pendientes indicados aquí.

## Código y versión entregable

El repositorio [PATO-Agency/ar-crafts](https://github.com/PATO-Agency/ar-crafts/tree/editorial) contiene la web (`apps/web`), Studio (`apps/studio`), contratos compartidos (`packages`), recursos preparados, pruebas y `package-lock.json`. Web y Studio se mantienen en la misma fuente versionada. La versión de esta entrega se identifica con el tag `editorial-2026-10-09-r2`; consultar su commit en GitHub antes de instalar o restaurar.

El primer despliegue desde GitHub se verificó el 9 de octubre de 2026: código `c37c5dbb8151fd1d804aac9e1015e054792d54fa`, despliegue Vercel `dpl_EZ4WGzpcutTccqgPfRLJTieuudk6`, estado `READY`, rama original `codex/editorial` y [URL editorial protegida](https://ar-crafts-editorial.vercel.app). [GitHub Actions](https://github.com/PATO-Agency/ar-crafts/actions/runs/37892062435) aprobó sincronización legal, lint, tipos, 355 unidades, comprobación de patrones de secretos y builds desde un clon limpio. Localmente pasaron además 32 pruebas focalizadas de Chrome: layout editorial, documentos legales y movimiento. En el despliegue se comprobaron las cuatro páginas legales, el aviso de cookies, el controlador de movimiento con `reduce` emulado y la protección anónima (HTTP 302). Las actualizaciones de documentación posteriores conservan el mismo código de aplicación.

El usuario renombró la rama en GitHub a `editorial` el 9 de octubre de 2026. La revisión `editorial-2026-10-09-r2` sincroniza la rama local, CI, las guías y los ajustes de producción/filtro de builds de Vercel. Conserva el mismo código de aplicación y sirve como punto de restauración antes de las próximas mejoras visuales. El tag inicial `editorial-2026-10-09` permanece como registro histórico.

```sh
git clone --branch editorial https://github.com/PATO-Agency/ar-crafts.git
cd ar-crafts
git checkout editorial-2026-10-09-r2
npm ci
npm run check
```

Se requiere Node.js 22.12 o superior y npm 10 o superior. `npm ci` instala las versiones del lock. `npm run check` ejecuta lint, tipos, unidades, comprobación de secretos y build de Studio/web. La compilación sin credenciales comprueba el fixture y el scaffold de Studio; la conectividad editorial requiere el perfil privado y pruebas aparte.

Para desarrollar la demo: `npm run dev` y abrir `http://127.0.0.1:3000`. Para comprobar formato: `npm run format:check`. Los SVG originales y referencias locales solo son necesarios para regenerar recursos con `assets:botanical` o `assets:butterfly`; los recursos de ejecución están incluidos.

## Pruebas reproducibles

```sh
npm test
npx playwright test --project=chrome
```

`npm test` también genera los fixtures de layout editorial en `tests/.generated/`; ejecutar las unidades antes de las pruebas que los consumen. El proyecto `chrome` usa Google Chrome instalado. Firefox y WebKit necesitan los binarios de Playwright:

```sh
npx playwright install firefox webkit
npm run test:e2e
```

La instalación de binarios no acredita que un motor pueda arrancar en cualquier equipo. Registrar resultados y limitaciones del entorno utilizado; las comprobaciones históricas del runbook no sustituyen una ejecución nueva. La aprobación física anterior del fixture no aprueba contenido editorial definitivo.

Por decisión expresa del usuario del 9 de octubre de 2026, las animaciones permanecen activas en demo, publicado y preview incluso con `prefers-reduced-motion: reduce`. Verificar también ese caso emulado. El contenido y las acciones deben permanecer disponibles si JavaScript o la inicialización fallan, conservando el espacio de las escenas.

## Dos proyectos Vercel, una fuente

| Superficie | Proyecto y rama de producción      | Fuente de contenido | Acceso                                                         |
| ---------- | ---------------------------------- | ------------------- | -------------------------------------------------------------- |
| Demo       | `ar-crafts-demo`, `main`           | Fixture             | Demo interna, sin APIs editoriales                             |
| Editorial  | `ar-crafts-editorial`, `editorial` | Sanity privado      | URL principal de lectura pública; otros despliegues protegidos |

Los proyectos usan Root Directory `apps/web`, con acceso a las fuentes compartidas fuera de esa carpeta, Node `22.x`, instalación `cd ../.. && npm ci --no-fund` y build `npm run build` desde `apps/web`. `apps/web/vercel.json` es común y neutral: las variables de cada proyecto determinan `fixture` o `sanity`. El comando de builds ignorados de cada proyecto omite las ramas ajenas a su superficie. Ambos enlaces Git y sus ramas de producción se verificaron el 9 de octubre de 2026. La rama editorial no se fusiona automáticamente a `main`; verificar proyecto, rama, commit y entorno antes de promover un despliegue.

En la demo, configurar `AR_REMOTE_DEMO=enabled`, `AR_CONTENT_SOURCE=fixture` y `PATO_SITE_VISIBILITY=internal`. En editorial usar el perfil alojado documentado en [el runbook](apps/studio/AR-CRAFTS-CMS-RUNBOOK.md) y conservar Standard Protection en las otras URLs, CSP y noindex. La lectura pública de la URL principal fue autorizada para presentar el sitio al cliente; Studio y los borradores siguen requiriendo sus credenciales o secretos. Publicar contenido en Sanity no cambia el fixture de la demo.

## Configuración privada y Studio

Las plantillas [local](config/ar-crafts-editorial.env.example) y [alojada](config/ar-crafts-editorial-hosted.env.example), dentro de `config/`, contienen nombres y ejemplos de configuración. Copiarlas a archivos privados `.env.ar-crafts-editorial.local` y `.env.ar-crafts-editorial-hosted.local`, completar valores localmente y mantenerlos fuera de Git. Nunca entregar una sesión CLI, cookies, URLs con secretos ni un `.env` real en el repositorio.

La web alojada recibe solo la allowlist de variables de servidor necesaria para lectura, preview y recibos del webhook. `SANITY_WRITE_TOKEN` y los bypass privados del operador quedan excluidos del entorno alojado. Los bypass de automatización y Presentation se gestionan separadamente; el acceso exclusivo de Presentation ya autorizado en el dataset privado no concede escritura en Sanity. Seguir el runbook para gestionar permisos sin imprimir valores.

Studio se compila desde este repositorio, pero se publica separadamente en Sanity: un push a Vercel no actualiza Studio ni su schema. El [runbook](apps/studio/AR-CRAFTS-CMS-RUNBOOK.md) contiene diagnóstico, build y despliegue con la cuenta autorizada del operador. La [guía editorial](apps/studio/GUIA-EDITORIAL-AR-CRAFTS.md) explica guardar, revisar borradores, publicar y despublicar sin terminal.

Los documentos y assets de Sanity están separados del código Git. Acordar responsable, periodicidad, retención, destino privado y prueba de restauración de exportaciones/backup antes de la entrega operativa definitiva. No se realiza ni se entrega un export del dataset en este alcance; tampoco se crean invitaciones.

## Documentos legales

Los cuatro Markdown canónicos y su [índice](docs/legal/README.md) se versionan selectivamente en `docs/legal`. Los demás informes internos siguen locales. La copia de ejecución `apps/web/src/features/legal/documents.json` se genera desde los cuatro textos:

```sh
npm run legal:sync
npm run legal:check
```

Conservar Markdown y JSON sincronizados en el mismo commit. Los textos son borradores visibles para revisión; identidad del responsable, jurisdicción, mercados y condiciones comerciales siguen pendientes. No representan aprobación legal ni condiciones definitivas del negocio.

## Inventario de acceso y titularidad

| Recurso                      | Identidad conocida                                              | Cierre pendiente                                                                      |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Código                       | Repositorio `PATO-Agency/ar-crafts`                             | Confirmar titular contractual, acceso de la cuenta del cliente y commit/tag entregado |
| Demo                         | `ar-crafts-demo.vercel.app`                                     | Confirmar responsable de operación y facturación                                      |
| Web editorial                | `ar-crafts-editorial.vercel.app`, Git `editorial`               | Lectura web sin cuenta habilitada; confirmar responsable de operación                 |
| Sanity                       | Proyecto `dbk6sgbx`, dataset privado `ar-crafts-editorial-test` | Confirmar titularidad, plan, cuentas invitadas, roles y backup acordado               |
| Studio                       | `ar-crafts-editorial-test.sanity.studio`                        | Validar edición/publicación/Presentation con cuenta propia del cliente                |
| Dominio comercial y contacto | Sin confirmar                                                   | Identidad, dominio, canales, jurisdicción y contenido definitivo                      |

No se han acreditado cuentas o invitaciones del cliente por esta guía. La sesión del desarrollador no es un acceso entregable. Registrar responsables y transferencias en un canal privado acordado, sin añadir credenciales a este inventario.

Los registros en `plans/`, `docs/delivery/` y `work/` son evidencia interna local histórica, no requisitos para instalar o compilar un clon. La entrega reproducible se apoya en el código, el lock, las plantillas públicas y estas guías. Los resultados técnicos históricos conservan sus límites y no acreditan aprobación humana global, contenido definitivo ni lanzamiento comercial.

## Acceso de revisión para el cliente · 9 de octubre de 2026

Por solicitud del usuario, https://ar-crafts-editorial.vercel.app/ permite revisar el contenido publicado sin cuenta de Vercel desde otro dispositivo. Standard Protection protege las otras URLs de despliegue. La demo https://ar-crafts-demo.vercel.app/ también se revisa sin cuenta. Ambas conservan noindex y contacto por confirmar.

Este acceso solo permite consultar la web. Studio y el dataset privado conservan sus permisos; la entrada a borradores exige un secreto válido y el webhook conserva firma y validación de origen. PATO_HOSTED_INTERNAL_PREVIEW=authenticated permanece como configuración heredada del runtime y no autentica a los lectores de la URL principal. La invitación del cliente a Studio sigue pendiente. Los textos, fechas y fotografías de stock del CMS continúan siendo datos de ensayo, y las políticas legales son borradores.

# Entrega técnica de AR Crafts

Esta guía describe el código y la operación editorial que se entregan para revisión. La rama de fuente es `codex/editorial`; `main` conserva la demo. La entrega no acredita lanzamiento comercial, aprobación legal ni acceso del cliente hasta completar los pendientes indicados aquí.

## Código y versión entregable

El repositorio contiene la web (`apps/web`), Studio (`apps/studio`), contratos compartidos (`packages`), recursos preparados, pruebas y `package-lock.json`. Web y Studio se mantienen en la misma fuente versionada. La entrega debe identificarse por un commit completo o un tag que resuelva a ese commit; registrar también la URL del repositorio y el despliegue editorial asociado. El operador añadirá los identificadores y resultados verificados al cerrar la entrega: esta guía no presupone que el push, el tag o el despliegue ya existan.

```sh
git clone --branch codex/editorial https://github.com/PATO-Agency/ar-crafts.git
cd ar-crafts
git checkout <COMMIT_O_TAG_DE_ENTREGA>
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

| Superficie | Proyecto y rama de producción            | Fuente de contenido | Acceso                                        |
| ---------- | ---------------------------------------- | ------------------- | --------------------------------------------- |
| Demo       | `ar-crafts-demo`, `main`                 | Fixture             | Demo interna, sin APIs editoriales            |
| Editorial  | `ar-crafts-editorial`, `codex/editorial` | Sanity privado      | Protección de Vercel en todos los despliegues |

Los proyectos usan Root Directory `apps/web`, con acceso a las fuentes compartidas fuera de esa carpeta, Node `22.x`, instalación `cd ../.. && npm ci --no-fund` y build `npm run build` desde `apps/web`. `apps/web/vercel.json` es común y neutral: las variables de cada proyecto determinan `fixture` o `sanity`. El comando de builds ignorados de cada proyecto omite las ramas ajenas a su superficie. La rama editorial no se fusiona automáticamente a `main`; verificar proyecto, rama, commit y entorno antes de promover un despliegue. El enlace Git editorial y el primer despliegue deben verificarse y registrarse al cerrar la entrega.

En la demo, configurar `AR_REMOTE_DEMO=enabled`, `AR_CONTENT_SOURCE=fixture` y `PATO_SITE_VISIBILITY=internal`. En editorial usar el perfil alojado documentado en [el runbook](apps/studio/AR-CRAFTS-CMS-RUNBOOK.md) y conservar autenticación efectiva antes de Next, CSP y noindex. No retirar protección para resolver Presentation. Publicar contenido en Sanity no cambia el fixture de la demo.

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

| Recurso                      | Identidad conocida                                              | Cierre pendiente                                                                               |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Código                       | Repositorio `PATO-Agency/ar-crafts`                             | Confirmar titular contractual, acceso de la cuenta del cliente y commit/tag entregado          |
| Demo                         | `ar-crafts-demo.vercel.app`                                     | Confirmar responsable de operación y facturación                                               |
| Web editorial                | `ar-crafts-editorial.vercel.app`                                | Verificar enlace Git, rama de producción, despliegue y acceso protegido con cuenta del cliente |
| Sanity                       | Proyecto `dbk6sgbx`, dataset privado `ar-crafts-editorial-test` | Confirmar titularidad, plan, cuentas invitadas, roles y backup acordado                        |
| Studio                       | `ar-crafts-editorial-test.sanity.studio`                        | Validar edición/publicación/Presentation con cuenta propia del cliente                         |
| Dominio comercial y contacto | Sin confirmar                                                   | Identidad, dominio, canales, jurisdicción y contenido definitivo                               |

No se han acreditado cuentas o invitaciones del cliente por esta guía. La sesión del desarrollador no es un acceso entregable. Registrar responsables y transferencias en un canal privado acordado, sin añadir credenciales a este inventario.

Los registros en `plans/`, `docs/delivery/` y `work/` son evidencia interna local histórica, no requisitos para instalar o compilar un clon. La entrega reproducible se apoya en el código, el lock, las plantillas públicas y estas guías. Los resultados técnicos históricos conservan sus límites y no acreditan aprobación humana global, contenido definitivo ni lanzamiento comercial.

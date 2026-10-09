# Producto — AR Crafts

<!-- impeccable:product-schema 1 -->

Contexto vigente de la landing de AR Crafts en `apps/web`, registrado el 5 de octubre de 2026. Recoge las decisiones expresas del usuario y el estado comprobado del repositorio. La identidad visual se documenta en [DESIGN.md](DESIGN.md). Este contexto no define la interfaz de Sanity Studio ni la del ejemplo VicaFoods.

## Platform

web

## Users

Personas interesadas en aprender joyería artesanal y consultar materiales para sus proyectos. La landing les permite reconocer la oferta y elegir entre explorar talleres o encontrar materiales antes de iniciar una consulta por el canal confirmado.

No se han establecido perfiles demográficos, niveles de experiencia exclusivos ni afirmaciones de posicionamiento competitivo. No inferirlos de las ilustraciones o del contenido de demostración.

## Product Purpose

Presentar talleres y materiales de AR Crafts con una experiencia artesanal, botánica, cálida y cuidada. Las acciones principales son explorar talleres, encontrar materiales e iniciar una consulta contextualizada cuando exista un canal confirmado.

El resultado esperado es una consulta informada. La versión actual no realiza compras, inscripciones ni reservas dentro del sitio. La demo sirve para revisar la composición, el contenido ilustrativo y el recorrido; su evaluación técnica no equivale a aprobación visual, editorial o de lanzamiento.

## Operating Context

Actualización 2026-10-09: el usuario aprobó implementar el refinamiento floral descrito en [el plan](FLORAL-MOTION.md): fondo estático tenue, dos acentos botánicos finitos, entradas de títulos e imágenes y transiciones de navegación. Se implementa en `editorial` con componentes de presentación; no modifica campos, permisos o registros de Sanity ni el editor de Studio. La URL principal editorial admite lectura pública para revisión del cliente; Studio, entrada a borradores y las otras URLs de despliegue conservan su protección.

El 2026-10-06 se preparó inicialmente el CMS sin proyecto autorizado. Después el usuario creó su proyecto y aprobó el plan 006. Estado ahora comprobado: `dbk6sgbx`, dataset privado `ar-crafts-editorial-test`, Studio local y [entorno editorial protegido](https://ar-crafts-editorial.vercel.app). Se verificaron guardado, preview aislado, salida, publicación, modificación, retirada y entrega real del webhook con documentos claramente identificados como prueba. El [runbook](../studio/AR-CRAFTS-CMS-RUNBOOK.md) conserva las instrucciones operativas y sus límites. La demo publicada permanece en fixture; contacto y publicación comercial siguen fuera del alcance.

Actualización 2026-10-07: [Studio alojado de ensayo](https://ar-crafts-editorial-test.sanity.studio/), conectado al mismo dataset privado; Studio local sigue disponible. Se verificaron CORS exacto, CSP del Dashboard, protección y entrada/salida de Presentation con la sesión actual. La [validación de hosting](../../plans/008-validacion.md) mantiene pendientes la cuenta propia del cliente, contenido definitivo y aprobación editorial/global. Alojar el editor no cambia la demo ni activa contacto.

- Una landing en español en `/`, con locale `es-PE` y zona horaria `America/Lima`.
- Recorrido existente: header, hero, firma botánica, dos rutas de creación, talleres, materiales, nuestra esencia, Inspiración, preguntas, contacto y footer.
- Anclas: `#inicio`, `#talleres`, `#materiales`, `#sobre-adriana`, `#galeria`, `#preguntas`, `#contacto`. Se omiten enlaces a bloques condicionales ausentes.
- Navegación y scroll nativos. El menú móvil, los detalles de taller, las preguntas y el catálogo ampliado usan `details/summary`.
- La revisión visual continúa sobre la landing existente. Un cambio importante de dirección debe presentarse con una alternativa comparable antes de adoptarlo.

## Stack

Identificado en manifiestos, lock, imports y configuración del checkout; no inferido de la demo:

| Área                                  | Implementación comprobada                                                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organización                          | Monorepo con npm workspaces: `apps`, `packages`, `examples`.                                                                                                                                  |
| Frontend                              | Next.js App Router 16.3.8, React y React DOM 19.3.0 resueltos en `package-lock.json`; TypeScript 5.9.3. El manifiesto web declara React `^19.2.0`.                                            |
| Estilos de AR Crafts                  | CSS propio en `src/features/ar-crafts/theme.css`, importado por `src/app/layout.tsx`; Grid, Flexbox, custom properties y media queries. No hay Tailwind en la landing.                        |
| Tipografías activas                   | Fontsource: Cormorant Garamond 400 regular/italic y DM Sans 400/500. Manrope y Barlow Condensed están en dependencias, pero no se importan en el layout de AR Crafts.                         |
| Movimiento de la landing              | CSS keyframes y transforms, SVG para tallos/hojas, `requestAnimationFrame`, media queries y `ResizeObserver` en `CraftMotion`. No importa GSAP, Lenis, Motion, Framer Motion ni React Spring. |
| Dependencias de movimiento indirectas | El lock contiene Motion/Framer Motion por Sanity y `@sanity/ui`. Su presencia no convierte esas librerías en el motor de esta landing.                                                        |
| Contenido                             | Fixture y contratos de `@ar-crafts/content`; validación Zod; adaptación a modelos UI; cliente Sanity 7.27.0 y caché de Next.js. Studio usa Sanity 6.15.0.                                     |
| Recursos                              | SVG conceptual preparado, SVG inline y `next/image` con fallback.                                                                                                                             |
| Comprobaciones existentes             | ESLint, TypeScript, Prettier, Vitest y Playwright con proyectos Chrome, Firefox y WebKit.                                                                                                     |

Rutas de referencia: [package web](package.json), [layout](src/app/layout.tsx), [entrada](src/app/page.tsx), [fuente de contenido](src/features/ar-crafts/content-source.ts), [adaptador UI](src/features/ar-crafts/to-page-content.ts), [motor de movimiento](src/features/ar-crafts/motion.tsx), [lock](../../package-lock.json). Los nombres heredados `@pato-food/*` reflejan la base compartida; no autorizan trasladar marca, contenido o credenciales de VicaFoods.

Desarrollo desde la raíz del repositorio: `npm run dev`; URL local `http://127.0.0.1:3000`. La configuración de demo remota está documentada en [README](../../README.md), pero no se inspeccionó de nuevo el despliegue al registrar este contexto.

## Capabilities and Constraints

- El 2026-10-08 el usuario autorizó integrar los borradores legales. El footer enlaza términos, privacidad, cookies y condiciones comerciales en cuatro rutas `/legal/…`, con aviso de borrador, índice y tablas legibles. Se añadió un aviso informativo de cookies con cierre en memoria durante navegación; no activa analítica ni equivale a consentimiento. Es una ampliación expresa al alcance previo de una sola landing, sin checkout ni contacto real. Se verificó localmente con lint/tipos, 355 unidades, 7 pruebas Chrome y build web; identidad, jurisdicción, reglas del negocio y despliegue remoto siguen pendientes.

- El ensayo editorial del 2026-10-07 permite editar también títulos, introducciones, tarjetas de caminos, relatos de Inspiración y frase del footer mediante `arSite.pageCopy`, con los textos vigentes como fallback. Se prepararon 22 registros de prueba y seis fotografías licenciadas de referencia, conservando el hero publicado por el usuario. No representan oferta, obras ni equipo real de AR Crafts. La [guía editorial](../studio/GUIA-EDITORIAL-AR-CRAFTS.md) distingue campos editables y recursos de identidad fijos; T1/T9 y aprobación comercial/global siguen pendientes.
- La fuente separa fixture, contenido publicado y preview editorial. La demo fuerza `contact.confirmed: false`; precios, fechas e inventario del fixture no se convierten en ofertas reales.
- El estado final de contacto es «Contacto por confirmar», deshabilitado. Las acciones de tarjetas pueden llevar a `#contacto`; no se presentan como conversaciones WhatsApp abiertas. Un enlace externo solo se construye a partir de un contacto confirmado.
- Sin precio se muestra «Consultar precio». Sin edición futura se muestra «Próxima fecha por confirmar». Los materiales ocultos se excluyen; los no disponibles permiten consultar alternativas sin prometer reposición.
- Se muestran hasta seis materiales inicialmente y el resto mediante disclosure. Con cero materiales o talleres hay estados informativos. Sobre Adriana, galería y preguntas dependen del contenido recibido.
- El alcance de contenido previsto es hasta tres talleres simultáneos, doce materiales, ocho imágenes y seis preguntas; es un alcance de la entrega, no una afirmación de inventario ni una garantía de límite rígido en la vista.
- No ampliar esta revisión con checkout, pagos, carrito, reservas, inscripción automática, filtros, buscador, selectores de variantes, nuevas páginas, chatbot o CRM.
- El ciclo CMS con datos de prueba y entrega real está verificado. El 2026-10-07 se comprobó reintento automático real HTTP 503 → 200 del mismo mensaje y recuperación del HTML. La [validación técnica T8](../../plans/007-validacion-t8.md) está verificada técnicamente con contenido de prueba: 20/20 comprobaciones focalizadas con Next producción local y Sanity, expiración en pestaña abierta/SSR con relojes controlados y retención de caché ante caída simulada; caída sin caché 8/8 y despliegue editorial protegido 5/5 comprobados; comprobación focalizada alojada 11/11 satisfactoria. T1/T9 siguen pendientes: fotografías/contenido definitivos, contacto real y aprobación humana editorial/global. El TTL no constituye por sí solo evidencia temporal; conservar los ensayos integrados y sus límites.
- La demo está marcada como interna/no indexable. Desplegar o activar un contacto real requiere un encargo específico; registrar contexto no autoriza esas acciones.

## Brand Commitments

Nombre de trabajo: AR Crafts / Adriana Ravello. Personalidad confirmada por el usuario: artesanal, botánica, cálida y cuidada. Conservar como punto de partida la paleta crema, verde profundo, rosa y dorado, la pareja tipográfica y la mariposa del hero.

Las ramas son un recurso de identidad. Se puede ajustar su presencia cuando compitan con texto o acciones. La mariposa es una ilustración conceptual con facetas y engastes; no acredita ni sustituye el logo oficial. El nombre tipográfico de la demo tampoco debe presentarse como un logotipo definitivo.

## Evidence on Hand

- Código, fixture y contratos actuales; recursos conceptuales en `public/ar-crafts` y datos SVG preparados en `src/features/ar-crafts`.
- [README de recursos](public/ar-crafts/README.md): procedencia y distinción entre ilustración, fotografía y marca oficial.
- [Contexto histórico](../../CONTEXT.md), [tokens de referencia](../../design/design-tokens.json), [especificación](../../docs/specs/2026-10-03-adriana-diseno-web.md) y [plan vigente](../../docs/plans/2026-10-03-adriana-plan-implementacion-diseno.md). Esos archivos permanecen locales/ignorados por Git.
- [Evidencia de implementación](../../docs/delivery/ar-crafts-implementation-evidence.md), especialmente la sección 12 sobre reversibilidad, y [refinamiento del 5 de octubre](../../docs/delivery/landing-refinement-2026-10-05.md). Sus resultados pertenecen a las ejecuciones allí registradas; no son pruebas nuevas de este paso documental.
- Faltan confirmaciones definitivas de contacto, fechas, precios, disponibilidad, copy, logo y fotografías/derechos. No hay testimonios aprobados que se puedan completar por inferencia.

## Product Principles

1. Facilitar la elección entre aprender y buscar materiales, con acciones claras y disponibles.
2. Mantener la diferencia entre demostración, información confirmada y contenido pendiente.
3. Preservar la identidad existente al refinar; comparar una alternativa antes de sustituir la dirección visual.
4. Juzgar recomendaciones de skills frente a la marca, el código y el comportamiento observado. Una preferencia estética general no prueba un defecto.
5. Conservar el acceso al contenido y las acciones aunque la animación o una imagen fallen.

## Accessibility & Inclusion

Mantener lectura, foco visible, navegación por teclado, controles táctiles y contenido en flujo. Los motivos botánicos son decorativos: `aria-hidden` y `pointer-events: none`. No ocultar el contenido base esperando a que una animación termine.

El 2026-10-09 el usuario pidió mantener las animaciones visibles en todas las webs, incluso con los efectos de animación de Windows desactivados. La landing usa `always` con cualquier fuente de contenido: demo, editorial publicado y vista previa. Esta decisión sustituye la excepción previa de demo; `system` conserva un fallback opcional interno, pero ya no se elige por `content.demo`. La política afecta a la web y no cambia preferencias del equipo. Sin JavaScript o ante fallo de inicialización quedan motivos completos y galería en flujo; las escenas fijadas siguen condicionadas al espacio disponible. Las comprobaciones técnicas no acreditan conformidad global de accesibilidad.

El usuario aprobó 001/002/003 y el hero móvil B. El 2026-10-06 precisó su revisión física en iPhone con Safari y Android con Chrome, sin navegación por teclado; modelos y versiones no especificados. Aceptó la validación disponible para actualizar la demo en GitHub/Vercel. La [validación posterior de motores](../../plans/005-validacion-motores.md), conservada localmente, registra Chrome 72/72 y WebKit 71/72; Firefox permanece bloqueado al iniciar y teclado WebKit sigue abierto. La aceptación de esta actualización no convierte esas limitaciones en comprobaciones aprobadas. Accesibilidad/rendimiento global con contenido definitivo, CMS y contacto real siguen pendientes.

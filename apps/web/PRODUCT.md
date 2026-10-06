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

- La fuente separa fixture, contenido publicado y preview editorial. La demo fuerza `contact.confirmed: false`; precios, fechas e inventario del fixture no se convierten en ofertas reales.
- El estado final de contacto es «Contacto por confirmar», deshabilitado. Las acciones de tarjetas pueden llevar a `#contacto`; no se presentan como conversaciones WhatsApp abiertas. Un enlace externo solo se construye a partir de un contacto confirmado.
- Sin precio se muestra «Consultar precio». Sin edición futura se muestra «Próxima fecha por confirmar». Los materiales ocultos se excluyen; los no disponibles permiten consultar alternativas sin prometer reposición.
- Se muestran hasta seis materiales inicialmente y el resto mediante disclosure. Con cero materiales o talleres hay estados informativos. Sobre Adriana, galería y preguntas dependen del contenido recibido.
- El alcance de contenido previsto es hasta tres talleres simultáneos, doce materiales, ocho imágenes y seis preguntas; es un alcance de la entrega, no una afirmación de inventario ni una garantía de límite rígido en la vista.
- No ampliar esta revisión con checkout, pagos, carrito, reservas, inscripción automática, filtros, buscador, selectores de variantes, nuevas páginas, chatbot o CRM.
- La integración CMS existe en el código, pero su cierre con contenido y configuración reales sigue pendiente. Un TTL o una prueba de fechas no acredita por sí solo la garantía de actualización editorial integrada.
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

La demo usa intencionalmente la política `always` para revisión, incluso cuando el navegador solicita movimiento reducido. La política `system` conserva el fallback de movimiento reducido. Sin JavaScript o ante fallo de inicialización quedan motivos completos y galería en flujo. Esta excepción de demo no acredita conformidad de accesibilidad para producción ni autoriza cambiar la preferencia del navegador.

El usuario aprobó 001/002/003 y el hero móvil B. El 2026-10-06 precisó su revisión física en iPhone con Safari y Android con Chrome, sin navegación por teclado; modelos y versiones no especificados. Aceptó la validación disponible para actualizar la demo en GitHub/Vercel. La [validación posterior de motores](../../plans/005-validacion-motores.md), conservada localmente, registra Chrome 72/72 y WebKit 71/72; Firefox permanece bloqueado al iniciar y teclado WebKit sigue abierto. La aceptación de esta actualización no convierte esas limitaciones en comprobaciones aprobadas. Accesibilidad/rendimiento global con contenido definitivo, CMS y contacto real siguen pendientes.

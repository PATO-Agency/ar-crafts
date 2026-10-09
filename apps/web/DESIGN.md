---
name: AR Crafts
description: Landing artesanal, botánica, cálida y cuidada para talleres y materiales.
colors:
  background: "#f6f3e8"
  surface: "#fff"
  text: "#182c23"
  muted: "#5d695f"
  primary: "#173d32"
  accent: "#b96e80"
  border: "#d9ddcf"
  sage: "#e3e8d8"
  pink: "#f0dfdf"
  gold: "#b99259"
  leaf: "#6f7d49"
  primary-hover: "#245446"
  primary-active: "#102b23"
  demo-notice: "#eeefdf"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "104px"
    fontWeight: 400
    lineHeight: 0.965
  display-tablet:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: 1.03125
  display-mobile:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "54px"
    fontWeight: 400
    lineHeight: 0.98
  display-compact:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "42px"
    fontWeight: 400
    lineHeight: 0.98
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "52px"
    fontWeight: 400
    lineHeight: 1.08
  headline-mobile:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.12
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.556
  secondary:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  button:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "22px"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "18px"
    letterSpacing: "0.065em"
rounded:
  artwork: "16px"
  journey: "18px"
  contact: "24px"
  button: "32px"
spacing:
  s8: "8px"
  s12: "12px"
  s16: "16px"
  s18: "18px"
  s20: "20px"
  s24: "24px"
  s30: "30px"
  s32: "32px"
  s40: "40px"
  s48: "48px"
  s56: "56px"
  s64: "64px"
  s88: "88px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "14px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.sage}"
  button-secondary-active:
    backgroundColor: "{colors.border}"
  button-disabled:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.muted}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "14px 24px"
  journey-card:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.text}"
    rounded: "{rounded.journey}"
    padding: "32px"
  journey-card-pink:
    backgroundColor: "{colors.pink}"
  contact-garden:
    backgroundColor: "{colors.sage}"
    rounded: "{rounded.contact}"
    padding: "48px"
---

# Diseño actual — AR Crafts

## Overview

**Creative North Star: "Artesanal, botánica, cálida y cuidada"**

La dirección parte de las decisiones expresas del usuario: base crema, verde profundo, rosa, dorado, pareja tipográfica existente y mariposa del hero. La composición editorial deja espacio para leer y elegir entre talleres y materiales; hojas, tallos y cuentas conectan los bloques con la idea de crear con las manos.

Este documento registra la implementación actual de `apps/web`, con corte al 5 de octubre de 2026 y actualización de validación al 6 de octubre. Los tokens se extrajeron de `src/features/ar-crafts/theme.css` y se contrastaron con estilos calculados de la demo local en 1440×900 y 390×900. El usuario aprobó los alcances revisados de 001/002/003 y B y aceptó actualizar la demo con la validación disponible. No certifica marca oficial, accesibilidad global ni contenido comercial. El propósito, el contenido confirmado y los pendientes están en [PRODUCT.md](PRODUCT.md).

**Key Characteristics:**

- Serif regular/italic editorial y sans serif legible para contenido y controles.
- Superficies tonales crema, salvia y rosa, con verde profundo para acciones y secciones de contraste.
- Mariposa conceptual con facetas, engastes y aro; ramas curvas entre secciones.
- Lectura y acciones en primer plano, con movimiento vinculado al recorrido nativo.

La fuente de implementación es `theme.css`; el frontmatter es su registro normativo para herramientas de diseño. Si el código cambia deliberadamente, actualizar este documento y `.impeccable/design.json` juntos. Los tokens históricos de Figma son referencias para comparar, no valores que deban restaurarse automáticamente. El documento sigue el [formato DESIGN.md](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md).

## Colors

La paleta combina fondo cálido, vegetación y detalles de joyería. Los nombres siguientes se corresponden con las claves del frontmatter.

| Token                              | Aplicación existente                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primary`                          | Verde profundo en títulos, botón principal, firma, Inspiración y footer.                                                                                  |
| `background`                       | Crema de página y texto claro sobre superficies verdes.                                                                                                   |
| `text` / `muted`                   | Tinta principal y lectura secundaria; no sustituir automáticamente por grises de otro sistema.                                                            |
| `sage` / `pink`                    | Salvia y rosa suave para rutas, contacto y fondos de ilustraciones.                                                                                       |
| `accent` / `gold` / `leaf`         | Rosa de identidad, dorado de engastes/indicadores y oliva del follaje. No se ha acreditado contraste para usarlos indiscriminadamente como texto pequeño. |
| `border`                           | Separadores y bordes de FAQ.                                                                                                                              |
| `surface`                          | Blanco disponible en los tokens del proyecto; no implica que todas las tarjetas tengan fondo blanco.                                                      |
| `primary-hover` / `primary-active` | Respuestas del botón principal.                                                                                                                           |
| `demo-notice`                      | Fondo del aviso de contenido de demostración.                                                                                                             |

Las rampas tonales del sidecar son muestras sintéticas para el panel de documentación; no son nuevos colores aprobados ni tokens para sustituir la paleta ejecutada.

## Typography

Cormorant Garamond, con fallback Georgia/serif, sostiene títulos y firma. El hero usa una línea regular y otra en cursiva. DM Sans, con fallback sans-serif, sostiene cuerpo, etiquetas, navegación y controles. Se sirven los pesos activos mediante Fontsource en `src/app/layout.tsx`.

Las variantes `display`, `display-tablet`, `display-mobile` y `display-compact` corresponden a los rangos de Layout. `headline`/`headline-mobile`, `title`, `body`, `secondary`, `button` y `label` describen los roles base; no uniformar excepciones expresivas que ya existen:

- Los títulos de ruta son 42/44 px en escritorio y 34/36 px en móvil. El h3 general pasa a 30 px por debajo de 768 px.
- Inspiración fijada, desde 1100 px, amplía su h2 con `clamp(60px, 6vw, 88px)` y line-height 0.95.
- Firma: cursiva 44/50 px, reducida a 36 px en móvil. El relato de Inspiración fijada usa cursiva 26 px con line-height 1.15.
- `.eyebrow` y numeración de bloques forman parte del diseño existente; los pasos numerados de Inspiración expresan una secuencia real. Suprimirlos por una preferencia general de una skill sería cambiar el punto de partida.

Los botones ejecutados usan el rol `button` del frontmatter. El token histórico del mockup indica 15/20 px; no se ha cambiado el código para forzar esa referencia. Los secundarios ejecutados usan `secondary`, no el estilo histórico de 14 px para todo el cuerpo.

## Layout

Header, hero y secciones tienen contenedor máximo de 1600 px y centrado horizontal. `.ar-section` usa padding vertical de 88 px, reducido a 64 px en móvil. Grid y Flexbox organizan contenido, sin convertir una maqueta completa en una imagen escalada.

| Ancho CSS       | Gutter | Hero h1           | Talleres/materiales | Navegación               |
| --------------- | ------ | ----------------- | ------------------- | ------------------------ |
| Menos de 360 px | 16 px  | `display-compact` | 1 columna           | Menú móvil en flujo      |
| 360–767 px      | 24 px  | `display-mobile`  | 1 columna           | Menú móvil en flujo      |
| 768–1023 px     | 32 px  | `display-tablet`  | 2 columnas          | Menú móvil en flujo      |
| Desde 1024 px   | 64 px  | `display`         | 3 columnas          | Navegación de escritorio |

El hero móvil adopta la opción B elegida y aprobada por el usuario el 2026-10-05: ilustración antes del título, de 160 px de ancho o 96 px por debajo de 360 px; separación del hero de 12 px y del copy de 16 px. El título mide 42 px bajo 360 px y conserva 54 px en el resto del rango móvil. Sus acciones ocupan el ancho disponible y conservan 52 px de alto. El hero de escritorio utiliza dos columnas; la fijación solo se activa desde 768 px, con al menos 600 px de alto y cuando el hero completo mide menos del 95% del viewport. Su tramo mejorado conserva 225vh; si no cabe, permanece en flujo. La alternativa de 175vh sigue pendiente de elección. El 2026-10-06 el usuario precisó revisión física en iPhone/Safari y Android/Chrome, sin teclado, y aceptó actualizar la demo con las limitaciones de motores documentadas en PRODUCT.md.

Las dos rutas y nuestra esencia pasan a una columna en móvil. Las tarjetas y preguntas crecen con el contenido. El foco no modifica sus dimensiones. La galería base tiene tres columnas desde 1024 px, dos entre 768 y 1023 px y una en móvil.

Inspiración mejorada se activa desde 820 px bajo la política predeterminada `always` para demo, contenido editorial y vista previa, o desde 1024 px bajo el fallback opcional `system`, si hay tres etapas completas, wrapper válido, al menos 600 px de alto y layout candidato no mayor al 92% del viewport. El tramo mide 300vh; el sticky comienza en 4vh. Desde 1100 px, narrativa e imagen comparten dos columnas. Cuando no se cumplen las condiciones, todas las imágenes permanecen en el flujo.

Las cuatro familias botánicas cambian en 360, 768 y 1024 px, con SVG preparados para 320/390/768/1440. Las curvas se ajustan a la altura real de los bloques. Ramas decorativas: fuera de interacción, detrás del contenido y con recorte intencional en el borde del viewport. Ajustar su presencia cuando compitan con lectura o acciones, sin sustituirlas por un borde vertical rígido.

## Elevation & Depth

La jerarquía usa espacio, contraste y capas tonales. No hay una escala de sombras ambientales en esta landing. La única `box-shadow` de las rutas, `0 0 0 1px var(--color-primary)` al hover, dibuja un contorno; no representa elevación. Los engastes, facetas y el aro aportan profundidad dentro de la ilustración conceptual.

## Shapes

Imágenes, estados vacíos y FAQ usan `rounded.artwork`; rutas de creación, `rounded.journey`; contacto, `rounded.contact`; botones, `rounded.button`. El menú móvil circular usa `border-radius: 50%`. No reemplazar estos valores por un único radio genérico.

Las imágenes de tarjetas tienen marco 4:3 y `object-fit: contain`. La mariposa usa un marco transparente 720:680. La escena fijada retira el radio de la imagen y revela etapas mediante `clip-path`; la galería en flujo conserva su marco. Las ramas y la mariposa mantienen geometría de los recursos preparados.

## Components

### Acciones y navegación

Botones legibles, con mínimo de 52 px de alto, borde de 1 px, padding del frontmatter y ancho ajustado al contenido o al contenedor móvil. Principal verde con texto crema; secundario transparente con texto verde. Hover y active cambian el fondo. El foco visible es outline de 3 px con offset de 5 px; en footer cambia al color claro. La implementación actual no añade transiciones CSS a esos cambios de fondo.

El header es estático. Menú móvil con control mínimo de 44×44 px y `details/summary`; con JavaScript cierra al seleccionar un ancla. Sin JavaScript conserva apertura/cierre y enlaces nativos. El skip-link aparece al recibir foco. Los enlaces de escritorio, footer y detalles de taller tienen targets de al menos 44 px de alto.

### Rutas, catálogo y contenido desplegable

Las rutas son enlaces completos con fondo salvia o rosa, padding de 32 px (24 px móvil), gap de 18 px y contorno de hover. Las fichas de talleres/materiales son columnas de contenido, con gap de 16 px; el CTA se alinea al fondo mediante `margin-top: auto`. No fijar sus alturas ni ocultar textos para igualarlas.

FAQ: `details/summary`, borde, radio del frontmatter, summary mínimo de 62 px de alto y padding de 16 px. El indicador cambia de + a −. El catálogo muestra seis materiales y ofrece un disclosure cuando hay más. Estados vacíos y de imagen fallida muestran texto informativo, sin inventar contenido.

Contacto pendiente: botón deshabilitado con explicación visible. Las acciones internas de demo llevan a `#contacto`; no simulan un canal real. El aviso de demostración permanece visible y describe ilustraciones y datos pendientes.

### Mariposa, ramas e Inspiración

El hero tiene entrada de 2 s con `cubic-bezier(0.16, 1, 0.3, 1)`. El cuerpo se mueve suavemente en un ciclo de 6 s; el aro gira según scroll. Los destellos son finitos, de 1200 ms y escalonados; la señal de scroll tiene un ciclo de 1.8 s. Son comportamientos existentes, no nuevos requisitos de animar cada elemento.

Cada tallo se dibuja por longitud y cada hoja brota/repliega tras su punto de unión estimado. El progreso responde a la posición actual: el scroll inverso desdibuja ramas y repliega hojas. No conserva el máximo alcanzado. La lectura de geometría precede las escrituras por frame; los cambios de viewport, fuentes, imágenes o contenido invalidan la medición.

Inspiración sigue pieza → detalle → manos, con título/pasos estables, máscaras progresivas, zoom continuo y una etapa semántica activa. Retroceder restaura el mismo estado por posición. Scroll nativo: sin capturar rueda, invertir dirección ni obligar a completar etapas.

El 2026-10-09 el usuario amplió la política `always` a todas las fuentes de contenido y a los próximos proyectos web: las animaciones permanecen activas incluso con reduced motion. Ya no se limita a revisión de la demo. `system` conserva internamente la opción de respetar movimiento reducido: motivos completos, sin escena fijada ni transforms de crecimiento. Sin JS o ante fallo de inicialización se conserva contenido visible en flujo. No se modifican los ajustes del navegador ni del sistema operativo.

### Fuentes, discrepancias y comprobación

Referencias: `src/app/layout.tsx` importa la hoja de estilos. `theme.css`, `page-view.tsx`, `site-header.tsx`, `materials-section.tsx`, `artwork.tsx`, `botanical.tsx`, `butterfly-artwork.tsx`, `motion.tsx` y `motion-math.ts` están en `src/features/ar-crafts`. `../../packages/ui/src/index.tsx` y `../../packages/ui/src/conversion-link.tsx` aportan piezas compartidas. `../../packages/ui/src/styles.css` describe la interfaz heredada de VicaFoods y no se importa en el layout de AR Crafts.

El [contexto histórico](../../CONTEXT.md) contemplaba retención máxima de ramas; el [token de galería de Figma](../../design/design-tokens.json) fijaba el umbral de 1024 px. La [sección 12 de la evidencia](../../docs/delivery/ar-crafts-implementation-evidence.md) y el [plan vigente](../../docs/plans/2026-10-03-adriana-plan-implementacion-diseno.md) registran su sustitución por ramas reversibles y el umbral especial de demo. Este documento incorpora esa diferencia sin presentarla como defecto.

El [refinamiento previo](../../docs/delivery/landing-refinement-2026-10-05.md) guarda pruebas y capturas de escritorio y móvil emulado. Este paso documental solo contrastó código y estilos calculados; no repitió la suite ni certificó rendimiento, contraste completo o hardware móvil.

## Refinamiento floral — 2026-10-09

Dirección aprobada y desarrollada en [FLORAL-MOTION.md](FLORAL-MOTION.md). Se conservan paleta, tipografía, mariposa y ramas existentes. El fondo incorpora un patrón vectorial estático de flores de seis pétalos, tallos y hojas, con opacidad 0.24 en escritorio y 0.18 en móvil; una máscara despeja el centro. Dos acentos, en caminos y contacto, trazan su tallo una sola vez al entrar y despliegan pétalos sin bucle.

Los títulos mantienen saltos editoriales y texto semántico: cada línea entra en 560 ms, con retraso total máximo de 120 ms. Introducciones: 420 ms; marco de imágenes: 680 ms mediante máscara discreta, sin transformar las fotografías que controla Inspiración. Hover de fotografías fuera de esa escena: escala 1.035 solo con cursor preciso. El contenido base siempre es visible; APIs ausentes, errores y desmontaje cancelan efectos sin dejar estilos persistentes. Cambios de contenido reinicializan las entradas; pestaña oculta cancela las animaciones finitas.

El menú conserva `details/summary` nativo. Con Web Animations API abre en 220 ms y cierra en 140 ms, admite interrupción, restaura el foco al pulsar Escape y cierra inmediatamente al seguir un enlace para conservar el destino del ancla. Icono SVG de tres trazos con transición a cierre; subrayado de navegación de escritorio en 220 ms y feedback de pulsación de botones en 160 ms. Por preferencia expresa del usuario, la política `always` aplica también con movimiento reducido. Sin cambios de Studio o del contrato de contenido.

## Do's and Don'ts

### Do:

- **Do** conservar la paleta, la pareja tipográfica, la mariposa y las ramas como punto de partida confirmado.
- **Do** dejar texto y acciones libres y ajustar follaje si compite con ellos.
- **Do** refinar el diseño existente; presentar una alternativa comparable para un cambio importante de dirección.
- **Do** contrastar recomendaciones de skills con la marca, el código y comportamiento observado; exigir evidencia para declarar un defecto.
- **Do** diferenciar dato confirmado, demo y pendiente; conservar estados vacíos, fallbacks y contacto por confirmar.

### Don't:

- **Don't** inventar precios, fechas, disponibilidad, fotografías reales, testimonios o contactos.
- **Don't** presentar la mariposa conceptual ni el nombre tipográfico como logo oficial aprobado.
- **Don't** convertir preferencias estéticas generales en defectos de esta marca ni aplicar cambios masivos por una checklist.
- **Don't** capturar el scroll nativo ni esconder el contenido base esperando animación.
- **Don't** declarar aprobación visual final, conformidad de accesibilidad o mejora de FPS a partir de una captura, un detector o pruebas técnicas.

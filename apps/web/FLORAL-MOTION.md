# Plan de implementación: movimiento y fondo floral

Fecha: 9 de octubre de 2026. Superficie: landing de `apps/web`, rama `editorial`. Dirección aprobada: conservar la identidad botánica, con patrón floral sutil en los márgenes y movimiento suave. `main` y la demo alojada mantienen su revisión actual hasta una promoción expresa.

## Intención y alcance

El momento principal sigue siendo la mariposa del hero y el recorrido pieza → detalle → manos de Inspiración. Los nuevos acentos enlazan la idea de crear con la de florecer: dos flores se dibujan al llegar a los caminos de creación y al contacto. El patrón de fondo es estático, de trazo fino y bajo contraste; deja libre el centro de lectura y reduce su presencia en móvil.

Los títulos entran por líneas editoriales y las introducciones como bloques, sin dividir palabras o letras ni modificar el texto de Sanity. Las imágenes de talleres, materiales y esencia tienen una entrada breve y un acercamiento discreto con cursor preciso. La galería conserva su controlador de zoom y máscaras. El menú móvil abre/cierra con respuesta rápida, permite interrupción, Escape y teclado; los enlaces de escritorio incorporan un subrayado animado.

## Secuencia de trabajo

1. Registrar esta dirección y los límites en la documentación de producto/diseño.
2. Añadir patrón vectorial y acentos florales decorativos, sin datos nuevos del negocio.
3. Implementar entradas finitas con IntersectionObserver + Web Animations API y estado base visible. Reobservar cuando cambie el contenido editorial, cancelar al desmontar y finalizar los efectos cuando se oculte la pestaña.
4. Mejorar el menú conservando `details/summary` como fallback nativo. Separar las propiedades de entrada de imágenes de las que controla la galería.
5. Validar lint, tipos, unidades, build y pruebas de navegador focalizadas; inspeccionar escritorio y móvil en una ronda conjunta. Corregir los hallazgos y registrar resultados concretos.

## Presupuesto y límites

- Entradas de título: 560 ms, introducciones: 420 ms, imágenes: 680 ms. Retrasos entre líneas limitados a 120 ms; no retrasar controles.
- Flores: trazado de 800 ms y pétalos de 520 ms. Solo dos acentos, sin bucles ni seguimiento del cursor.
- Menú: entrada 220 ms, salida 140 ms; enlaces con retraso total máximo de 100 ms. Interrumpir desde el estado actual.
- Fondo estático SVG; sin canvas, shaders, librerías nuevas ni animación continua de toda la página.
- Aplicar en fixture, publicado y preview. Por decisión expresa del usuario, `prefers-reduced-motion: reduce` mantiene los efectos; comprobarlo emulado.
- Si faltan las APIs, JavaScript falla o una imagen no carga, conservar texto, acciones, espacio reservado y motivos completos. No modificar schema, queries, permisos, dataset ni interfaz de Studio.
- Mantener las restricciones de espacio de las escenas existentes, el scroll nativo, foco visible y controles táctiles. No inventar copy, fotografías comerciales ni contacto.

## Validación y entrega

Implementación completada y verificada localmente el 9 de octubre de 2026:

- Lint, tipos, formato, sincronización legal y comprobación de patrones de secretos aprobados.
- 362 pruebas unitarias, 31 archivos: las 355 existentes y siete nuevas para sustitución de contenido, callbacks obsoletos, desmontaje, APIs ausentes/errores, pestaña oculta y movimiento reducido.
- Builds de Studio y web aprobados con fixture; build adicional de web con el perfil editorial privado aprobado. No se desplegó Studio ni se escribieron registros de Sanity.
- 42 casos distintos de Chrome aprobados entre la ronda inicial y la confirmación focalizada. La primera ronda aprobó 39; se corrigieron dos pruebas que centraban una sección larga dejando su título fuera de pantalla y se aisló la medición de escrituras de ramas de las cargas tardías de imágenes. Los siete casos de confirmación pasaron. Se conservan las comprobaciones existentes de zoom, contenido extenso, imágenes fallidas/sustituidas, disclosures, escenas reversibles y fallback sin JavaScript.
- Revisión visual de escritorio 1440×900 y móvil 390×844, con `reduce` emulado: hero, caminos, contacto y menú. Confirmación sobre el build editorial local con 15 elementos de imagen de Sanity: sin desbordamiento horizontal ni errores JavaScript; patrón presente y política `always` activa. Las fotos siguen siendo las referencias de prueba del CMS.
- Detector mecánico ejecutado una vez: seis avisos sobre tamaños tipográficos preexistentes, sin cambios de tipografía en este refinamiento. Se conservan los tamaños de la identidad vigente; el detector no constituye aprobación visual.

Fuentes y pruebas quedan versionadas en `editorial`; el tag `editorial-2026-10-09-r2` conserva la base anterior. La publicación alojada se realiza mediante el flujo GitHub → Vercel y se comprueba aparte contra su commit. Evidencias locales en `work/release/floral-visual.json` y capturas `floral-*.png` (ignoradas por Git). La revisión local no equivale a aprobación visual del cliente ni certificación de rendimiento o accesibilidad en dispositivos físicos. Firefox/WebKit no se ejecutaron en esta revisión.

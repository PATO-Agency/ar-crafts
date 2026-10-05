# Recursos visuales de AR Crafts

19 SVG exportados directamente de nodos finales del archivo de Figma. design/asset-map.json conserva procedencia y dimensiones. previews contiene capturas completas del estado actual.

- butterfly-jewel.svg: mariposa conceptual con gemas/facetas/engastes. No es el logo oficial.
- foliage: cuatro recorridos completos, uno por anchura. Son referencias de curvas, entradas, salidas y distribución; no fondos de altura fija para cualquier contenido.
- conceptual: tres talleres, tres materiales, tres imágenes de galería y una ilustración editorial. No son productos reales ni fotografías del negocio.
- photography-guide: cuatro esquemas de encuadre, solo referencia para fotos autorizadas.

## Preparación para web

La exportación conserva colores y geometría, pero es estática. Organizar tallo/hojas por cada una de las siete ramas; conservar su dirección y curva. Si el exportado convirtió trazos en contornos, recuperar el path central desde el vector editable de Figma o reconstruirlo sobre la geometría aprobada antes de animar por longitud. No usar un fade del SVG completo como reemplazo del dibujo progresivo.

Adaptar cada recorrido a las transiciones y alturas reales por anchura; recalcular cuando cambien contenido, menú/FAQ/disclosure o imágenes. Mantener el follaje detrás del contenido, pointer-events:none y aria-hidden, con recorte intencional solo en los bordes de viewport.

Los IDs exportados son nombres de capa y pueden repetirse; normalizar/namespacear IDs y sus referencias al convertir a componentes o insertar varios SVG inline. No reescribir paths ni perder facetas al optimizar. Revisar el resultado visual tras optimización.

Figma redondea algunos viewBox/dimensiones de exportación. El mapa mantiene medidas originales con decimales. Las fuentes no se incluyen como binarios: usar las familias aprobadas mediante la infraestructura de fuentes del repo, verificar licencia/origen al incorporar archivos.

Sin JS/reduced motion/fallo de inicialización, todos los motivos completos deben permanecer visibles. Las guías y los assets de demo no reemplazan la fotografía real aprobada; omitir galería de producción si no existe.

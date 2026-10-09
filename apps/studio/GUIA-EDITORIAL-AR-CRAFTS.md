# Probar edición, preview y publicación como AR Crafts

Actualizado el 9 de octubre de 2026. Este ensayo usa el dataset privado de prueba y la web editorial protegida. Se conservó el hero que ya habías publicado y se preparó una **base publicada con todas las secciones**: tres talleres, tres ediciones ficticias, ocho materiales visibles y uno oculto, tres imágenes de Inspiración y cuatro preguntas. Contacto permanece sin confirmar. Nada de esto constituye contenido comercial definitivo ni cambia la demo.

## Las dos vistas

| Vista                                                             | Para qué sirve                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Studio alojado](https://ar-crafts-editorial-test.sanity.studio/) | Editar textos, guardar borradores y publicar desde otra computadora   |
| **Presentation**, dentro de Studio                                | Ver la landing con los borradores antes de publicar                   |
| [Web editorial](https://ar-crafts-editorial.vercel.app/)          | Comprobar lo que realmente está publicado; requiere acceso autorizado |

La web editorial está conectada a Sanity. `ar-crafts-demo.vercel.app` utiliza el fixture y **no cambia al publicar desde este Studio**.

Entra en Studio con tu propia cuenta de Sanity invitada al proyecto. El enlace puede redirigir al Dashboard de Sanity; abre **AR Crafts — Contenido de prueba** y **Structure**. No necesitas instalar Node ni arrancar una terminal para editar. El [Studio local](http://127.0.0.1:3334/structure/arSite) sigue disponible para desarrollo en la computadora del operador. El acceso con una cuenta cliente distinta y sus permisos debe comprobarse antes de la entrega; no compartas la cuenta ni los tokens del desarrollador. La web editorial normal conserva su autenticación de Vercel.

## Primera prueba: editar el hero

1. En Studio, entra en **AR Crafts · Página y contacto**. La página conserva la referencia `AR-CMS-TEST:CLIENT-TRIAL-2026-10-07`. Los registros nuevos usan `AR-CMS-TEST:CLIENT-FULL-2026-10-07`.
2. Dentro de **Portada**, cambia **Descripción**, por ejemplo a: `[PRUEBA CMS] Texto actualizado por AR Crafts — ensayo 01.` Para comprobar el mismo mensaje en móvil, cambia también **Descripción breve para móvil (opcional)**. **Título** controla el título y sus saltos de línea.
3. Espera a que termine el guardado automático. Todavía es un **Draft**: guardar no publica y la web normal permanece igual.
4. Abre **Presentation**. Comprueba el aviso de preview y que aparezca tu texto. Después de guardar otro cambio, refresca la vista previa del iframe: actualmente no se ofrece actualización automática ni edición mediante overlays. Si aparece el aviso de que no puede conectar el editor visual, **Continue anyway** permite la vista previa disponible; no significa que los overlays funcionen.
5. Vuelve a **Structure → AR Crafts · Página y contacto** y pulsa **Publish** cuando quieras probar la publicación. Comprueba que termine y exista una versión **Published**.
6. Abre la **web editorial** en la pestaña normal, sin entrar en Draft Mode. Espera unos segundos y recarga. Comprueba tu texto y que no aparezca el aviso «Vista previa editorial». El webhook invalida la caché; no hay que volver a desplegar la web. Puede servirse una respuesta anterior mientras termina la revalidación.

Los campos de aprobación y procedencia están preparados únicamente para renderizar este contenido **de ensayo**. No representan aprobación comercial. En registros nuevos, publicar en Sanity no basta si su **Aprobación editorial** sigue pendiente: la lectura publicada exige estado aprobado y fecha de aprobación.

Para volver a probar: modifica el texto publicado, espera el guardado, compara **borrador en Presentation** frente a **versión anterior en la web**, y publica el segundo cambio. Guardar debe cambiar solo el borrador; publicar debe cambiar la web después de revalidar.

## Qué edita cada sección

| Parte de la web                 | Dónde editar                                                          | Qué probar                                                                      |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Hero                            | Página → Portada                                                      | Título, descripción, texto móvil y texto superior de escritorio                 |
| Textos complementarios del hero | Página → Textos de las secciones → Portada                            | Frase complementaria, invitación al scroll y texto superior móvil               |
| Dos caminos para crear          | Página → Textos de las secciones → Caminos para crear                 | Título, introducción y textos de ambas tarjetas                                 |
| Encabezados e introducciones    | Página → Textos de las secciones                                      | Talleres, Materiales, Nuestra esencia, Inspiración, Preguntas y Contacto        |
| Nuestra esencia                 | Página → Nuestra esencia                                              | Párrafo e imagen; el encabezado se edita en Textos de las secciones             |
| Talleres                        | Taller artesanal                                                      | Título, técnica, detalles, nivel, modalidad, fotografía, precio y orden         |
| Fechas de talleres              | Edición de taller · hora de Lima                                      | Taller relacionado, inicio y fin; son fechas ficticias para este ensayo         |
| Materiales                      | Material · una presentación                                           | Nombre, presentación, código, imagen, precio, orden, destacado y disponibilidad |
| Galería                         | Inspiración · foto autorizada                                         | Fotografía, texto alternativo, pie de foto, etapa y orden                       |
| Relato de galería               | Página → Textos de las secciones → Inspiración → Relato de la galería | Textos de Pieza, Detalle y Manos                                                |
| Preguntas                       | Pregunta frecuente                                                    | Pregunta, respuesta y orden                                                     |
| Pie de página                   | Página → Textos de las secciones → Pie de página                      | Frase editorial y saltos de línea                                               |

La mariposa del hero, las ramas, los colores, las fuentes, la composición, los enlaces de navegación y las etiquetas funcionales forman parte del diseño fijo. Este ensayo edita contenido; no convierte Sanity en un editor de estilos. Mantén el contacto desactivado.

Los campos nuevos son opcionales: si se retira un campo con sus acciones, se recupera el texto original. Para títulos en varias líneas utiliza Enter. Conserva textos identificados como PRUEBA mientras sean ficticios. La web muestra hasta tres talleres, doce materiales, ocho imágenes y seis preguntas.

## Cambiar imágenes

Se cargaron seis fotografías de referencia de Pexels. Sus nombres empiezan por **PRUEBA-CMS**, y los metadatos conservan autor, enlace y licencia. Son imágenes de terceros: no representan piezas, instalaciones, alumnos ni equipo de AR Crafts. [Licencia de uso consultada](https://www.pexels.com/license/).

1. Abre un taller, material, imagen de Inspiración o la imagen de Nuestra esencia.
2. En la imagen existente, abre **Open image options menu** y usa **Select/Replace** para elegir otra imagen preparada. Para una nueva imagen autorizada usa **Upload/Subir**. La interfaz general de Sanity conserva algunos controles en inglés.
3. Actualiza **Descripción de la imagen (accesibilidad)** para describir lo que realmente aparece. Mantén «referencia, no de AR Crafts» mientras sea stock.
4. Comprueba **Tipo de imagen = Fotografía** y **Derechos de uso confirmados** para las fotografías licenciadas preparadas. No marques derechos de archivos que no tengas permiso de usar.
5. Guarda, revisa en Presentation, compara con la imagen anterior en la web normal y publica.

Puedes reutilizar cualquiera de las seis imágenes para comparar encuadres horizontales, verticales y detalle. El marco y sus proporciones permanecen definidos por el diseño; crop/hotspot de Studio no constituyen un editor de composición de la landing. Las ilustraciones conceptuales pueden revisarse como contenido pendiente en preview; la lectura publicada mantiene su política actual de fotografías autorizadas, especialmente en Inspiración.

## Recorrido recomendado para probar todo

1. Cambia un encabezado de Materiales en **Página → Textos de las secciones**. Revisa y publica la página.
2. Cambia el título, fotografía y detalles de un taller. Revisa y publica ese taller.
3. Cambia una edición relacionada con él. Studio puede mostrar la fecha en tu zona local; la web siempre la presenta en **hora de Lima**. El fin debe ser posterior al inicio. No anuncies esa fecha de ensayo como real.
4. En un material, prueba **Destacado** y **Orden**. Los destacados aparecen primero; después se respeta el orden. Hay seis tarjetas iniciales y **Ver todos los materiales (8)** para comprobar las adicionales.
5. Prueba los estados **No disponible (alternativas)** y **Oculto**, publicando el material después de revisar. «Oculto» lo retira de la lectura y la preview; no borra el documento. Deja el precio vacío para «Consultar precio», o usa un precio claramente ficticio de ensayo.
6. Sustituye una fotografía de Inspiración, cambia su pie y edita su relato desde la página. Conserva una imagen de cada etapa **Pieza → Detalle → Manos** para probar la escena de scroll. Página e imagen son documentos diferentes: publica ambos si cambiaste ambos.
7. Cambia una pregunta/respuesta y su orden. Publica la pregunta y comprueba su acordeón.
8. Modifica el párrafo e imagen de Nuestra esencia y la frase del pie. Revisa la página completa, incluyendo móvil, antes de publicar.

Repite en cada caso **editar → guardar borrador → refrescar Presentation → comparar con la web publicada → Publish → esperar y recargar la web**. No necesitas un despliegue por cada cambio de contenido. Despublicar un registro lo retira de la web publicada tras revalidar; un borrador puede seguir apareciendo en preview.

## Límites de esta prueba

Studio ya tiene una superficie alojada en Sanity y puede usarse desde otro dispositivo sin mantener una terminal local. La cuenta propia del cliente, su invitación, sus roles y el acceso protegido a la web editorial siguen pendientes de verificación. No compartir URLs de preview con parámetros privados. La rama `editorial` versiona web y Studio; publicar código en Vercel no publica Studio ni cambia documentos de Sanity. Consulta [ENTREGA.md](../../ENTREGA.md) para el inventario de entrega.

La base de ensayo se deja disponible y no se limpia automáticamente. Registro actual como evidencia interna local, no requerido para instalación: `docs/delivery/client-trial-full-2026-10-07/prepared.json`; conserva el registro histórico de la primera prueba solo del hero. Las comprobaciones técnicas no acreditan que hayas revisado o aprobado este contenido. T1/T9 y la aprobación humana editorial/global siguen pendientes.

Si se detiene Studio, desde la raíz del repositorio:

```powershell
node --env-file=.env.ar-crafts-editorial-hosted.local --experimental-strip-types tooling/run-ar-crafts-editorial.ts studio
```

Configuración y diagnóstico técnico: [runbook CMS](AR-CRAFTS-CMS-RUNBOOK.md).

Por decisión expresa del usuario del 9 de octubre de 2026, las animaciones permanecen activas en demo, publicado y preview incluso si el sistema solicita reducir movimiento. Al revisar contenido, comprobar también ese caso y la disponibilidad del contenido si la inicialización falla.

# Política de cookies y tecnologías similares de AR Crafts

**Borrador con pendientes.** Versión de trabajo: 7 de octubre de 2026. Entrada en vigor: `[PENDIENTE: fecha de aprobación y publicación]`.

Operador: `[PENDIENTE: nombre legal e identificación del operador de AR Crafts]`. Dominio: `[PENDIENTE: dominio definitivo]`. Contacto: `[PENDIENTE: canal de privacidad]`.

## 1. Qué cubre esta política

Las cookies son pequeños datos que un sitio puede almacenar en el navegador y recibir en visitas posteriores. También existen otros mecanismos, como el almacenamiento local del navegador y las solicitudes a servicios externos.

Este inventario se basa en el código de la landing y en evidencia técnica previa de su entorno editorial. No constituye una comprobación completa del dominio comercial, que aún no está definido.

## 2. Cookie identificada

| Nombre | Origen y ámbito | Finalidad | Duración configurada | Activación y categoría |
| --- | --- | --- | --- | --- |
| `__prerender_bypass` | Aplicación Next.js, host de la web y ruta `/`; `[PENDIENTE: host definitivo]` | Mostrar contenido en borrador durante una revisión editorial autorizada | 30 minutos en entrada manual/local; 60 minutos en entrada por Sanity Presentation. La salida de vista previa la expira | Se establece al entrar en vista previa tras validación. Técnica de revisión editorial; no es una cookie de publicidad |

En el entorno de producción, la cookie se configura como `HttpOnly` y `Secure`. La entrada por Presentation utiliza `SameSite=None` y almacenamiento particionado; la entrada manual utiliza `SameSite=Lax`. El carácter técnico describe su función, sin resolver por sí solo su régimen legal en una jurisdicción aún no confirmada.

La demo remota con contenido de ejemplo bloquea las rutas de entrada a la vista previa. La navegación ordinaria de la landing no inicia este flujo editorial según el código revisado.

## 3. Otras tecnologías y servicios

No se identificó en la landing actual un uso propio de `localStorage` o `sessionStorage`, píxeles publicitarios, un gestor de etiquetas ni scripts activos de analítica. El código de medición de consultas permanece conectado a un proveedor desactivado.

Las tipografías se sirven con los recursos del sitio. Un futuro enlace a WhatsApp funcionará como navegación a un servicio externo al pulsarlo; no se ha identificado un widget que cargue la conversación o scripts de WhatsApp al visitar la landing. El canal todavía está sin confirmar.

El alojamiento, las protecciones de acceso y las sesiones de servicios editoriales pueden utilizar tecnologías adicionales. `[PENDIENTE: comprobar nombres, proveedores, finalidad, dominio, duración y activación de cookies y almacenamiento emitidos por Vercel, Sanity Studio y otros servicios del entorno definitivo]`.

Las sesiones del editor y del acceso a un entorno protegido deben distinguirse de las tecnologías usadas en la landing de visitantes. No se atribuyen automáticamente al sitio comercial las cookies del Dashboard de Sanity ni las de una sesión de acceso de Vercel.

## 4. Controles disponibles

En una vista previa habilitada aparece «Salir de vista previa». Ese enlace solicita la expiración de las variantes ordinaria y particionada de `__prerender_bypass` y vuelve a la página con contenido publicado.

Puedes utilizar los controles de tu navegador para consultar, bloquear o eliminar cookies. El bloqueo de esta cookie puede impedir mantener la vista previa editorial.

La web muestra un aviso informativo con un enlace a esta política y un botón «Cerrar aviso». Cerrarlo lo oculta durante la navegación interna; al recargar o abrir de nuevo el sitio puede reaparecer. El cierre se mantiene únicamente en memoria de la página, sin crear una cookie ni guardar una preferencia en el navegador, y no expresa consentimiento ni habilita seguimiento.

No hay un panel de preferencias por categorías ni un gestor de consentimiento implementado. `[PENDIENTE: determinar, tras confirmar jurisdicción e inventario real, qué controles adicionales hacen falta y comprobarlos antes de describirlos como disponibles]`.

Actualización técnica del borrador: 8 de octubre de 2026, para reflejar el aviso informativo incorporado. La entrada en vigor sigue pendiente.

## 5. Actualización y relación con privacidad

La política de privacidad explica quién trata los datos, para qué, los destinatarios y cómo ejercer derechos. Esta política deberá actualizarse si cambian las tecnologías utilizadas.

Antes de activar analítica, publicidad o nuevas integraciones, se revisarán sus datos, finalidades y requisitos aplicables. La publicación de una política de cookies no activa controles de consentimiento ni autoriza por sí misma esas tecnologías.

# Documentos legales de AR Crafts

**Estado del paquete: borrador con pendientes.** Preparación: 7 de octubre de 2026. Esta fecha identifica la redacción; no es una fecha de entrada en vigor ni una aprobación para publicar.

Los textos corresponden a la landing de talleres y materiales de joyería artesanal de este repositorio. La web actual es una demostración, no realiza compras ni inscripciones y mantiene el contacto comercial sin confirmar.

| Documento                                                                                  | Alcance                                                                              | Estado                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [Términos de uso e identificación](terminos-de-uso.md)                                     | Navegación, contenido de demostración, consultas, propiedad intelectual y contacto   | Incluido; identidad, jurisdicción y canales pendientes                 |
| [Política de privacidad](politica-de-privacidad.md)                                        | Visitas, proveedores técnicos, vista previa editorial y futura atención por WhatsApp | Incluido; responsable, bases, conservación y transferencias pendientes |
| [Política de cookies y tecnologías similares](politica-de-cookies.md)                      | Inventario observado en código y límites de la comprobación del hosting              | Incluido; inventario del dominio definitivo pendiente                  |
| [Condiciones de talleres, materiales, entregas y devoluciones](condiciones-comerciales.md) | Contrataciones que el negocio pueda realizar fuera de la landing                     | Incluido como borrador condicionado; reglas operativas desconocidas    |

El aviso de identidad se integra en los términos. No se prepararon políticas separadas de suscripciones, marketplace, cuentas de clientes, contenido de usuarios o IA porque esas funciones no están implementadas. El Libro de Reclamaciones y su aviso quedan pendientes de determinar la jurisdicción, la actividad comercial y el mecanismo real; este paquete no los sustituye.

Las marcas `[PENDIENTE: ...]` señalan hechos o decisiones que faltan. **No presentar estos textos como políticas comerciales definitivas mientras mantengan pendientes materiales.** El 8 de octubre de 2026 el usuario solicitó integrarlos en la web para revisión; las páginas conservan un aviso visible de borrador. La versión futura deberá describir el estado efectivo del servicio en su dominio comercial, conservando la distinción entre demostración y oferta real.

La investigación normativa es preliminar: el país de establecimiento y los mercados no están definidos. Se consultaron fuentes oficiales de Perú como escenario a evaluar, sin atribuir esa jurisdicción al negocio por el idioma, la moneda o la zona horaria del código.

El informe interno `work/legal/informe-de-revision.md` contiene hechos, fuentes y acciones de cierre como evidencia interna local, no requerida para instalar el repositorio. Debe mantenerse fuera de las rutas públicas. La integración utiliza una copia de estos cuatro textos en `apps/web/src/features/legal/documents.json`, generada con `npm run legal:sync` y comprobable con `npm run legal:check`. No incluye este índice ni el informe interno en las páginas legales.

Rutas incorporadas: `/legal/terminos-y-condiciones`, `/legal/privacidad`, `/legal/cookies` y `/legal/condiciones-comerciales`. El footer enlaza las cuatro páginas. El aviso de cookies es informativo y su cierre no constituye consentimiento; no se activó analítica ni publicidad. Los borradores permanecen no indexables como el resto de la demo. La integración no implica despliegue remoto ni aprobación legal.

Para finalizar, el operador debe completar su identidad y mercados, confirmar sus procedimientos y aprobar las condiciones comerciales. Después corresponde actualizar la investigación para los países confirmados, comprobar el dominio definitivo y revisar conjuntamente los cuatro documentos.

Los cuatro Markdown canónicos de esta carpeta y este índice se incluyen selectivamente en la entrega versionada de `codex/editorial`. El resto de `docs/` y `work/` conserva evidencia interna local excluida de Git. El versionado técnico no implica aprobación legal ni lanzamiento comercial. Consulta [ENTREGA.md](../../ENTREGA.md) para reproducir el código y completar los pendientes de titularidad.

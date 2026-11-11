# Seguridad

Para reportar una vulnerabilidad, abre un [aviso privado](https://github.com/urieldomingezm/nexus-dialogs/security/advisories/new) en lugar de un *issue* público.

Qué hace la librería con el HTML que recibe, el filtro `sanitize` y las demás puertas de entrada: [`docs/seguridad.md`](docs/seguridad.md).

Resumen: los textos (`title`, `text`, etiquetas, mensajes) siempre se insertan como texto; solo el `html` en cadena se interpreta, y es responsabilidad de quien lo pasa. Con contenido que no sea tuyo, configura `sanitize` (por ejemplo con DOMPurify).

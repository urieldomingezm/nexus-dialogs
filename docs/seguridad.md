Qué hace la librería con el contenido que le pasas y qué le toca a quien la usa. Lo de esta página está cubierto por pruebas (`test/unit/seguridad.test.ts`).

## La regla corta

- **Textos: seguros siempre.** `title`, `text`, etiquetas, ayudas, mensajes de error, nombres de botones, mensajes de toast y el `footer` del adaptador de SweetAlert2 se insertan **como texto**. Si llega `<img src=x onerror=…>` desde un usuario o un servidor, se ve tal cual y no se ejecuta.
- **`html` en cadena: responsabilidad tuya.** Es la única puerta por donde entra HTML interpretado (`html`, y en el adaptador swal también `iconHtml`, `closeButtonHtml` y `loaderHtml`). Sin filtro, se inserta tal cual. **No le pases datos de usuarios ni de un servidor sin limpiarlos.**
- **`html` como `Node`: ya lo construiste tú.** Se inserta sin tocarlo; es la forma más segura de mostrar contenido propio con estructura.

## Cuándo usar cada cosa

| Quiero mostrar… | Usa |
|---|---|
| Un mensaje con datos del usuario (nombre, comentario, error del servidor) | `text` (o `title`). Nunca `html`. |
| Contenido propio con negritas, listas o enlaces fijos | `html` en cadena escrito por ti (constante en tu código). |
| Contenido que viene de fuera y debe verse con formato | `html` + el filtro `sanitize` (abajo), o construye un `Node` con `textContent`/`createElement`. |

## El filtro `sanitize`

Un solo punto de entrada para todo el HTML en cadena. Se configura una vez:

```ts
import DOMPurify from 'dompurify'
import { configure } from 'nexus-dialogs'

configure({ sanitize: (html) => DOMPurify.sanitize(html) })
```

A partir de ahí, `dialog.alert({ html })` y, con `nexus-dialogs/swal`, `html`, `iconHtml`, `closeButtonHtml` y `loaderHtml` pasan por tu función antes de llegar al DOM. La librería **no trae su propio sanitizador** a propósito: limpiar HTML a mano es una fuente clásica de fallos y es mejor usar uno mantenido (DOMPurify, o la API nativa `Sanitizer` cuando tu navegador objetivo la tenga).

Lo que el filtro **no** toca: los textos (ya son texto) y los `Node` (ya los armaste tú).

## Otras puertas que conviene conocer

- **Exportar a CSV/Excel**: los valores que empiezan con `=`, `+`, `-` o `@` se neutralizan para evitar inyección de fórmulas, y las comillas, saltos de línea y separadores se escapan (probado).
- **Importar**: los archivos se leen en el navegador y no se envían a ningún lado. Un archivo corrupto rechaza la promesa con un error en vez de romper la página, y uno enorme se procesa por filas sin congelar nada (probado con 50 000 filas).
- **Códigos postales (`sepomex`)**: solo hace `fetch` a la carpeta que configures en `baseUrl`; no llama a ningún otro servidor.
- **CSP**: los estilos se aplican con hojas construibles (`adoptedStyleSheets`), que no necesitan `style-src 'unsafe-inline'`. En navegadores sin ellas se usa un elemento `<style>` como alternativa, que sí puede necesitar un `nonce` o la directiva correspondiente.
- **Trusted Types**: si tu página exige `require-trusted-types-for 'script'`, una cadena `html` normal no pasará aunque la filtres; en ese caso entrega un `Node` armado con tu propia política.
- **Shadow DOM no es una barrera de seguridad**: aísla estilos, no protege contra scripts de la misma página. Un `<script>` que ya corre en tu página puede leer los diálogos.

## Cómo reportar una vulnerabilidad

Abre un aviso privado en la pestaña *Security* del [repositorio](https://github.com/urieldomingezm/nexus-dialogs/security/advisories/new) en lugar de un *issue* público.

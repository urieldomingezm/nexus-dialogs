Qué hace la librería con el contenido que le pasas y qué le toca a quien la usa. Lo de esta página está cubierto por pruebas (`test/unit/seguridad.test.ts`).

## La regla corta

- **Textos: seguros siempre.** `title`, `text`, etiquetas, ayudas, mensajes de error, nombres de botones, mensajes de toast y el `footer` del adaptador de SweetAlert2 se insertan **como texto**. Si llega `<img src=x onerror=…>` desde un usuario o un servidor, se ve tal cual y no se ejecuta.
- **`html` en cadena: responsabilidad tuya.** Es la única puerta por donde entra HTML interpretado (`html`, y en el adaptador swal también `iconHtml`, `closeButtonHtml` y `loaderHtml`). Sin filtro, se inserta tal cual. **No le pases datos de usuarios ni de un servidor sin limpiarlos.**
- **`html` como `Node`: tampoco es automáticamente seguro.** La librería lo inserta sin tocarlo y sin pasarlo por `sanitize`. Si el `Node` lo armaste con `createElement` y `textContent`, está bien; si lo creaste con `innerHTML`, `DOMParser` o un fragmento que vino de fuera, puede traer elementos y atributos peligrosos (`onerror`, `javascript:`…). Limpia antes de construirlo.

### Modo estricto (recomendado)

```ts
configure({ strictHtml: true })
```

Con `strictHtml`, cualquier `html` en cadena que **no** pase por un `sanitize` configurado se muestra como texto en vez de interpretarse. Así, si alguien olvida configurar el filtro, el resultado es un texto feo y no un XSS. Hoy es opcional para no romper código que ya existe; **en la 1.0 será el comportamiento por omisión**.

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

`sanitize` puede devolver una cadena o un objeto con `toString()` (por ejemplo, un `TrustedHTML`). Con `sanitize: null` se quita. A partir de ahí, `dialog.alert({ html })` y, con `nexus-dialogs/swal`, `html`, `iconHtml`, `closeButtonHtml` y `loaderHtml` pasan por tu función antes de llegar al DOM. La librería **no trae su propio sanitizador** a propósito: limpiar HTML a mano es una fuente clásica de fallos y es mejor usar uno mantenido (DOMPurify, o la API nativa `Sanitizer` cuando tu navegador objetivo la tenga).

Lo que el filtro **no** toca: los textos (ya son texto) y los `Node`, que son tu responsabilidad (ver arriba).

## Otras puertas que conviene conocer

- **Exportar a CSV**: Excel y LibreOffice **evalúan como fórmula** lo que empieza con `=`, `+`, `-` o `@` (y con tabulador o retorno). `toCSV` les antepone un apóstrofo (`'=1+1`) para que se queden como texto; los números de verdad (`-5`, `+3.25` o un `number`) no se tocan. Comillas, saltos de línea y separadores se escapan. El apóstrofo se ve en la celda: es el costo de la protección, el que recomienda OWASP.
- **Exportar a Excel (.xlsx)**: los textos se guardan como cadenas en línea y el archivo nunca contiene fórmulas (`<f>`), así que no necesita el apóstrofo.
- **Importar**: los archivos se leen en el navegador y no se envían a ningún lado. Un archivo corrupto rechaza la promesa con un error en vez de romper la página, y uno enorme se procesa por filas sin congelar nada (probado con 50 000 filas).
- **Códigos postales (`sepomex`)**: solo hace `fetch` a la carpeta que configures en `baseUrl`; no llama a ningún otro servidor.
- **CSP (estilos)**: los estilos se aplican con hojas construibles (`adoptedStyleSheets`), que no necesitan `style-src 'unsafe-inline'`. En navegadores sin ellas se usa un `<style>`, que una política estricta bloquea **salvo** que le des tu nonce: `configure({ nonce })`. Probado en Chromium con `style-src 'self'` (camino normal) y con `style-src 'nonce-…'` sin hojas construibles; sin el nonce, el segundo camino sí queda bloqueado.
- **Trusted Types**: con `require-trusted-types-for 'script'`, la librería abre diálogos, formularios y toasts sin violaciones: sus iconos se arman con `createElementNS`, sin `innerHTML`. Lo que sí necesita una política es tu `html` en cadena: haz que `sanitize` devuelva un `TrustedHTML` de tu propia política. Una cadena normal se rechaza (probado).
- **Shadow DOM no es una barrera de seguridad**: aísla estilos, no protege contra scripts de la misma página. Un `<script>` que ya corre en tu página puede leer los diálogos.

## Qué está probado y qué no

| Cosa | Cómo |
|---|---|
| Textos como texto, `sanitize`, `strictHtml` | Pruebas unitarias |
| Inyección de fórmulas (`=1+1`, `@SUM(A1:A2)`, `+cmd`, `-1+2`, `HYPERLINK`, `cmd\|…`) | Pruebas unitarias; además, **LibreOffice** abre el CSV y el xlsx exportados sin crear fórmulas (se comprueba convirtiéndolos con `soffice`) |
| Apertura en **Microsoft Excel** | **No probada por nosotros.** El archivo cumple la recomendación de OWASP, pero no lo hemos abierto en Excel |
| CSP y Trusted Types | Pruebas en Chromium real |
| Fugas de memoria | 300 diálogos, formularios y toasts abiertos y cerrados no dejan nodos del DOM (Chromium) |
| Dependencias | La librería no tiene dependencias en producción; `npm audit` de producción corre en cada cambio |

## Cómo reportar una vulnerabilidad

Ver [`SECURITY.md`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/SECURITY.md): canal privado, tiempos de respuesta y cómo se publican las versiones.

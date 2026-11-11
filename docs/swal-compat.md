Qué parte de SweetAlert2 cubre `nexus-dialogs/swal` y qué no. La compatibilidad no es absoluta ni se pretende: es una puerta para migrar poco a poco hacia la API propia. Esta tabla se verifica en cada cambio (`test/unit/swal-matriz.test.ts`): si el adaptador reconoce un parámetro que no está aquí, o uno «compatible» no tiene prueba, el CI falla.

## Qué significa cada estado

| Estado | Significado |
|---|---|
| **compatible** | Hace lo mismo que en SweetAlert2 y tiene una prueba. |
| **parcial** | Funciona con una limitación o una diferencia (ver la nota). |
| **ignorado** | Se acepta para que tu código no falle, pero no tiene efecto: el aspecto lo decide el estándar de botones y el tema. |
| **sin soporte** | Se acepta y no hace nada porque no tiene equivalente. |

## Parámetros

| Parámetro | Estado | Nota |
|---|---|---|
| `title` | compatible |  |
| `titleText` | compatible |  |
| `text` | compatible |  |
| `html` | parcial | Se muestra como texto por omisión (`strictHtml`); con contenido propio, `configure({ strictHtml: false })`. |
| `icon` | compatible |  |
| `footer` | parcial | Se muestra como texto plano: las etiquetas se quitan. |
| `toast` | parcial | Usa la cola de `nexus-dialogs/toast`; no admite todos los parámetros de un diálogo. |
| `position` | parcial | Solo para toasts, y cambia la posición de **todos** los toasts (la cola es una sola). |
| `width` | parcial | Solo números y `px`; con otras unidades se usa el ancho estándar. |
| `timer` | compatible |  |
| `timerProgressBar` | compatible |  |
| `showConfirmButton` | compatible |  |
| `showDenyButton` | compatible |  |
| `showCancelButton` | compatible |  |
| `showCloseButton` | compatible |  |
| `confirmButtonText` | compatible |  |
| `denyButtonText` | compatible |  |
| `cancelButtonText` | compatible |  |
| `focusCancel` | compatible |  |
| `focusDeny` | compatible |  |
| `allowOutsideClick` | compatible |  |
| `allowEscapeKey` | compatible |  |
| `input` | compatible |  |
| `inputLabel` | compatible |  |
| `inputPlaceholder` | compatible |  |
| `inputValue` | compatible |  |
| `inputOptions` | compatible |  |
| `inputAttributes` | compatible |  |
| `inputValidator` | compatible |  |
| `validationMessage` | compatible |  |
| `preConfirm` | compatible |  |
| `preDeny` | compatible |  |
| `willOpen` | compatible |  |
| `didOpen` | compatible |  |
| `didRender` | compatible |  |
| `willClose` | compatible |  |
| `didClose` | compatible |  |
| `didDestroy` | compatible |  |
| `iconHtml` | parcial | Pasa por `sanitize` / `strictHtml` como `html`. |
| `imageUrl` | compatible |  |
| `imageWidth` | compatible |  |
| `imageHeight` | compatible |  |
| `imageAlt` | compatible |  |
| `progressSteps` | compatible |  |
| `currentProgressStep` | compatible |  |
| `progressStepsDistance` | compatible |  |
| `closeButtonHtml` | parcial | Pasa por `sanitize` / `strictHtml` como `html`. |
| `closeButtonAriaLabel` | compatible |  |
| `confirmButtonAriaLabel` | compatible |  |
| `denyButtonAriaLabel` | compatible |  |
| `cancelButtonAriaLabel` | compatible |  |
| `reverseButtons` | compatible |  |
| `allowEnterKey` | compatible |  |
| `inputAutoFocus` | compatible |  |
| `inputAutoTrim` | compatible |  |
| `returnInputValueOnDeny` | compatible |  |
| `target` | parcial | Monta el diálogo en ese elemento, pero sigue siendo modal y en la capa superior. |
| `theme` | parcial | Entiende `light`, `dark` y `auto`; los temas de la librería se eligen con `configure({ theme })`. |
| `template` | parcial | Lee `<swal-title>`, `<swal-html>`, `<swal-icon>`, `<swal-image>`, `<swal-input>`, `<swal-button>`, `<swal-footer>` y `<swal-param>`; no acepta `<swal-function-param>`. |
| `draggable` | compatible |  |
| `confirmButtonColor` | ignorado | Los colores salen del estándar de botones y del tema. |
| `denyButtonColor` | ignorado | Igual que `confirmButtonColor`. |
| `cancelButtonColor` | ignorado | Igual que `confirmButtonColor`. |
| `buttonsStyling` | ignorado | Los botones siempre llevan el estilo estándar. |
| `customClass` | ignorado | El contenido vive en un Shadow DOM: las clases de tu CSS no llegan. Usa temas. |
| `background` | ignorado | Usa `configure({ theme })`. |
| `color` | ignorado | Usa `configure({ theme })`. |
| `padding` | ignorado | El espaciado es el del tema. |
| `iconColor` | ignorado | El color del icono depende del tipo. |
| `backdrop` | ignorado | El fondo siempre es el del navegador (`<dialog>` modal). |
| `grow` | ignorado | Los tamaños son `size` o `width`. |
| `animation` | sin soporte | El movimiento sale del tema y respeta «reducir movimiento». |
| `showClass` | sin soporte | Igual que `animation`. |
| `hideClass` | sin soporte | Igual que `animation`. |
| `heightAuto` | ignorado | No hace falta: el diálogo no altera la altura de la página. |
| `scrollbarPadding` | ignorado | La librería compensa la barra de desplazamiento sola. |
| `topLayer` | sin soporte | Siempre está en la capa superior del navegador. |
| `stopKeydownPropagation` | ignorado | No se detiene la propagación del teclado. |
| `keydownListenerCapture` | ignorado | Los eventos de teclado no se capturan en la fase de captura. |
| `showLoaderOnConfirm` | ignorado | Con `preConfirm` async el indicador de «procesando» siempre se muestra. |
| `showLoaderOnDeny` | ignorado | Con `preDeny` async el indicador de «procesando» siempre se muestra. |
| `focusConfirm` | ignorado | El foco inicial lo decide la librería (en acciones destructivas, Cancelar). |
| `returnFocus` | ignorado | Al cerrar, el foco siempre vuelve al elemento que abrió el diálogo. |
| `loaderHtml` | parcial | Pasa por `sanitize` / `strictHtml` como `html`. |

## Métodos y accesores

Compatibles: `Swal.fire`, `mixin`, `close`, `update`, `isVisible`, `showLoading`, `hideLoading`, `isLoading`, `getLoader`, `showValidationMessage`, `resetValidationMessage`, `enableButtons`, `disableButtons`, `enableInput`, `disableInput`, `clickConfirm`, `clickDeny`, `clickCancel`, los accesores (`getPopup`, `getContainer`, `getTitle`, `getHtmlContainer`, `getIcon`, `getImage`, `getInput`, `getActions`, `getFooter`, `getCloseButton`, `getTimerProgressBar`, `getProgressSteps`, `getFocusableElements`…), los temporizadores (`stopTimer`, `resumeTimer`, `toggleTimer`, `increaseTimer`, `getTimerLeft`, `isTimerRunning`), `argsToParams`, `isValidParameter`, `isUpdatableParameter`, `bindClickHandler` y `DismissReason`.

Sin equivalente: `Swal.version`.

## Diferencias intencionales

- **Botones**: el orden es siempre Cancelar, Denegar, Confirmar. Una confirmación cuyo botón dice «eliminar» o «borrar» pasa a peligro, con el foco en Cancelar.
- **Shadow DOM**: `document.getElementById` no ve el contenido; usa `Swal.getHtmlContainer().querySelector(…)`.
- **`html` en cadena**: sale como texto por omisión (desde la 0.5.0); ver `docs/seguridad.md`.
- **Idioma**: los textos por omisión siguen el idioma configurado.

Guía de migración con ejemplos que se ejecutan: [migracion.html](https://urieldomingezm.github.io/nexus-dialogs/migracion.html).

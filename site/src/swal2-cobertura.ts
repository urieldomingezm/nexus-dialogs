// Qué cubre `nexus-dialogs/swal` de la API real de SweetAlert2 (v11). Lo verifica test/unit/sitio.test.ts contra el
// paquete `sweetalert2` instalado: si SweetAlert2 agrega o quita algo, la prueba avisa y esta lista se actualiza.

/** Opciones de `Swal.fire()` que funcionan igual. */
export const PARAMS_SOPORTADAS = [
  'title', 'titleText', 'text', 'html', 'icon', 'footer', 'toast', 'position', 'width', 'timer', 'timerProgressBar',
  'showConfirmButton', 'showDenyButton', 'showCancelButton', 'showCloseButton',
  'confirmButtonText', 'denyButtonText', 'cancelButtonText', 'focusCancel', 'focusDeny',
  'allowOutsideClick', 'allowEscapeKey', 'input', 'inputLabel', 'inputPlaceholder', 'inputValue', 'inputOptions',
  'inputAttributes', 'inputValidator', 'validationMessage', 'preConfirm', 'preDeny',
  'willOpen', 'didOpen', 'didRender', 'willClose', 'didClose', 'didDestroy',
  'iconHtml', 'imageUrl', 'imageWidth', 'imageHeight', 'imageAlt', 'progressSteps', 'currentProgressStep', 'progressStepsDistance',
  'closeButtonHtml', 'closeButtonAriaLabel', 'confirmButtonAriaLabel', 'denyButtonAriaLabel', 'cancelButtonAriaLabel',
  'reverseButtons', 'allowEnterKey', 'inputAutoFocus', 'inputAutoTrim', 'returnInputValueOnDeny', 'target', 'theme', 'template', 'draggable',
]

/** Se aceptan y se ignoran, o ya lo hace el diseño propio. Va el motivo. */
export const PARAMS_DISTINTAS: Record<string, string> = {
  confirmButtonColor: 'estándar de botones: un color por intención',
  denyButtonColor: 'estándar de botones: un color por intención',
  cancelButtonColor: 'estándar de botones: un color por intención',
  buttonsStyling: 'los botones siempre llevan el estilo propio',
  customClass: 'el Shadow DOM aísla el CSS; se personaliza con variables --nd-*',
  background: 'se personaliza con variables --nd-*',
  color: 'se personaliza con variables --nd-*',
  padding: 'se personaliza con variables --nd-*',
  iconColor: 'un color por tipo de icono',
  backdrop: 'el fondo siempre es inerte y oscurecido',
  grow: 'se usa `size` y `placement` en la API propia',
  animation: 'respeta prefers-reduced-motion automáticamente',
  showClass: 'animaciones propias',
  hideClass: 'animaciones propias',
  heightAuto: 'el bloqueo de scroll lo hace el <dialog> nativo',
  scrollbarPadding: 'el bloqueo de scroll lo hace el <dialog> nativo',
  topLayer: 'siempre usa la capa superior (<dialog>)',
  stopKeydownPropagation: 'el teclado lo maneja el <dialog> modal',
  keydownListenerCapture: 'el teclado lo maneja el <dialog> modal',
  showLoaderOnConfirm: 'con preConfirm el botón ya muestra «Procesando…»',
  showLoaderOnDeny: 'con preDeny el botón ya muestra «Procesando…»',
  focusConfirm: 'el foco inicial ya va al botón principal',
  returnFocus: 'el foco siempre regresa a quien abrió el diálogo',
}

/** Opciones que todavía no existen en el adaptador. */
export const PARAMS_PENDIENTES = ['loaderHtml']

/** Métodos de `Swal` que funcionan. */
export const METODOS_SOPORTADOS = [
  'fire', 'mixin', 'close', 'isVisible', 'isLoading', 'showLoading', 'hideLoading', 'showValidationMessage',
  'resetValidationMessage', 'update', 'getPopup', 'getInput', 'getConfirmButton', 'getCancelButton', 'getDenyButton',
  'clickConfirm', 'clickCancel', 'clickDeny', 'DismissReason',
  'getContainer', 'getTitle', 'getHtmlContainer', 'getIcon', 'getIconContent', 'getImage', 'getCloseButton', 'getActions', 'getFooter', 'getTimerProgressBar', 'getProgressSteps', 'getFocusableElements', 'getValidationMessage', 'getInputLabel', 'enableButtons', 'disableButtons', 'enableInput', 'disableInput', 'getTimerLeft', 'stopTimer', 'resumeTimer', 'toggleTimer', 'isTimerRunning', 'increaseTimer',
]

/** Métodos que todavía no existen en el adaptador. */
export const METODOS_PENDIENTES = ['getLoader', 'bindClickHandler', 'isValidParameter', 'isUpdatableParameter', 'argsToParams', 'version']

/** Lo que funciona a medias: está, pero hace menos que en SweetAlert2. */
export const A_MEDIAS: { nombre: string; detalle: string }[] = [
  { nombre: 'position (no toast)', detalle: 'solo se usa en toasts; el modal siempre sale al centro (o como hoja inferior en celular)' },
  { nombre: 'html con document.getElementById', detalle: 'el contenido vive dentro del Shadow DOM: busca con Swal.getHtmlContainer().querySelector(…) o con el popup que reciben didOpen y getPopup()' },
  { nombre: 'theme', detalle: 'se entienden light, dark y auto; los temas bootstrap, material-ui, bulma… se ignoran (los colores salen de --nd-*)' },
  { nombre: 'target', detalle: 'monta el diálogo dentro de ese elemento, pero sigue siendo modal y en la capa superior; no sirve para mostrarlo incrustado' },
  { nombre: 'reverseButtons', detalle: 'el orden propio es Cancelar, Denegar, Confirmar; con true pasa a Confirmar primero' },
  { nombre: 'template', detalle: 'se leen swal-title, swal-html, swal-icon, swal-image, swal-input, swal-button, swal-footer y swal-param; swal-function-param no (evaluaría texto)' },
]

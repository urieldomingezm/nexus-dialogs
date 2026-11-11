// Qué cubre `nexus-dialogs/swal` de la API real de SweetAlert2 (v11). Lo verifica test/unit/sitio.test.ts contra el
// paquete `sweetalert2` instalado: si SweetAlert2 agrega o quita algo, la prueba avisa y esta lista se actualiza.

/** Opciones de `Swal.fire()` que funcionan igual. */
export const PARAMS_SOPORTADAS = [
  'title', 'titleText', 'text', 'html', 'icon', 'footer', 'toast', 'position', 'width', 'timer', 'timerProgressBar',
  'showConfirmButton', 'showDenyButton', 'showCancelButton', 'showCloseButton',
  'confirmButtonText', 'denyButtonText', 'cancelButtonText', 'focusCancel', 'focusDeny',
  'allowOutsideClick', 'allowEscapeKey', 'input', 'inputLabel', 'inputPlaceholder', 'inputValue', 'inputOptions',
  'inputAttributes', 'inputValidator', 'validationMessage', 'preConfirm', 'preDeny',
  'willOpen', 'didOpen', 'didRender', 'willClose', 'didClose',
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
export const PARAMS_PENDIENTES = [
  'imageUrl', 'imageWidth', 'imageHeight', 'imageAlt', 'progressSteps', 'currentProgressStep', 'progressStepsDistance',
  'iconHtml', 'closeButtonHtml', 'closeButtonAriaLabel', 'confirmButtonAriaLabel', 'denyButtonAriaLabel', 'cancelButtonAriaLabel',
  'reverseButtons', 'allowEnterKey', 'inputAutoFocus', 'inputAutoTrim', 'returnInputValueOnDeny', 'loaderHtml',
  'target', 'theme', 'template', 'draggable', 'didDestroy',
]

/** Métodos de `Swal` que funcionan. */
export const METODOS_SOPORTADOS = [
  'fire', 'mixin', 'close', 'isVisible', 'isLoading', 'showLoading', 'hideLoading', 'showValidationMessage',
  'resetValidationMessage', 'update', 'getPopup', 'getInput', 'getConfirmButton', 'getCancelButton', 'getDenyButton',
  'clickConfirm', 'clickCancel', 'clickDeny', 'DismissReason',
]

/** Métodos que todavía no existen en el adaptador. */
export const METODOS_PENDIENTES = [
  'getContainer', 'getTitle', 'getHtmlContainer', 'getIcon', 'getIconContent', 'getImage', 'getCloseButton', 'getActions',
  'getFooter', 'getInputLabel', 'getLoader', 'getTimerProgressBar', 'getProgressSteps', 'getFocusableElements', 'getValidationMessage',
  'enableButtons', 'disableButtons', 'enableInput', 'disableInput',
  'getTimerLeft', 'stopTimer', 'resumeTimer', 'toggleTimer', 'isTimerRunning', 'increaseTimer',
  'bindClickHandler', 'isValidParameter', 'isUpdatableParameter', 'argsToParams', 'version',
]

/** Lo que funciona a medias: está, pero hace menos que en SweetAlert2. */
export const A_MEDIAS: { nombre: string; detalle: string }[] = [
  { nombre: 'Swal.update()', detalle: 'solo cambia el título; faltan text, html, icon y los botones' },
  { nombre: 'Swal.close(resultado)', detalle: 'cierra, pero ignora el resultado que le pases' },
  { nombre: 'input: tipos', detalle: 'falta range, file y week' },
  { nombre: 'inputAutoTrim', detalle: 'SweetAlert2 recorta los espacios del texto por omisión; el adaptador devuelve el texto tal cual' },
  { nombre: 'position (no toast)', detalle: 'solo se usa en toasts; el modal siempre sale al centro (o como hoja inferior en celular)' },
  { nombre: 'html con document.getElementById', detalle: 'el contenido vive dentro del Shadow DOM: el código que lo busca con document.* no lo encuentra' },
]

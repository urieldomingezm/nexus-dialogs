/** Estilo del botón. Uno por intención, igual en toda la app (ver README, «Estándar de botones»). */
export type ButtonVariant = 'primary' | 'cancel' | 'danger' | 'secondary'

/** Qué hace el botón al pulsarlo. */
export type ButtonRole = 'confirm' | 'cancel' | 'deny' | 'custom'

export interface ButtonSpec {
  /** Identificador. Llega en `result.action` cuando el botón cierra el diálogo. */
  id: string
  /** Texto del botón. Di la acción: «Crear cliente», no «Aceptar». Los botones no llevan iconos. */
  text: string
  /** confirm: valida y cierra con `confirmed: true`. cancel: cierra con `confirmed: false`. deny: cierra con `denied: true`. custom: llama a `onClick`. */
  role?: ButtonRole
  /** Color. Por omisión: confirm → primary, cancel → cancel, deny → cancel, custom → secondary. */
  variant?: ButtonVariant
  /** Para role custom. Devuelve `false` para dejar el diálogo abierto. */
  onClick?: (ctx: DialogContext) => unknown
  /** Valor que se devuelve en `result.value` (deny y custom). */
  value?: unknown
  disabled?: boolean
  hidden?: boolean
}

export type IconName = 'success' | 'error' | 'warning' | 'info' | 'question'

export type Placement = 'center' | 'right' | 'left' | 'bottom'

export type Size = 'sm' | 'md' | 'lg' | 'xl' | number

export type Scheme = 'light' | 'dark' | 'auto'

/** Por qué se cerró el diálogo. */
export type CloseReason = 'confirm' | 'cancel' | 'deny' | 'escape' | 'backdrop' | 'close' | 'timer' | 'program' | (string & {})

export interface DialogResult<T = unknown> {
  /** `true` solo si se pulsó el botón de confirmar y pasó la validación. */
  confirmed: boolean
  /** `true` si se pulsó un botón con role deny («No guardar»). */
  denied: boolean
  /** Lo que devolvió el diálogo: el texto del prompt, los valores del formulario o lo que regresó `preConfirm`. */
  value: T | undefined
  /** Qué lo cerró: confirm, cancel, deny, escape, backdrop, close, timer, program o el id de un botón custom. */
  reason: CloseReason
}

export interface Dismissible {
  /** Cerrar con Esc. */
  escape?: boolean
  /** Cerrar al hacer clic fuera. */
  backdrop?: boolean
  /** Mostrar el botón × arriba a la derecha. */
  closeButton?: boolean
}

export interface DialogOptions<T = unknown> {
  title?: string
  /** Texto plano (seguro). */
  text?: string
  /** HTML o un nodo. Si es texto, se inserta tal cual: úsalo solo con contenido tuyo, nunca con datos del usuario. */
  html?: string | Node
  icon?: IconName
  /** center (por omisión), right o left (panel lateral), bottom (hoja inferior). En celular, center se vuelve hoja inferior. */
  placement?: Placement
  /** sm 400 px, md 480 px (por omisión), lg 640 px, xl 860 px o un número en px. */
  size?: Size
  /** Botones en el orden en que se ven, de izquierda a derecha. Por omisión: Cancelar + Confirmar. */
  buttons?: ButtonSpec[]
  confirmText?: string
  cancelText?: string
  /** Acción destructiva: el botón de confirmar se pinta rojo, Cancelar pasa a gris y recibe el foco. */
  danger?: boolean
  /** Mostrar el botón de cancelar en alert/confirm. */
  showCancel?: boolean
  /** Exige escribir este texto exacto para habilitar el botón de confirmar (borrados irreversibles). */
  requireText?: string
  /** Cierra solo después de estos milisegundos (reason: 'timer'). Se pausa con el mouse o el foco encima. */
  timer?: number
  /** Barra de progreso del timer. Por omisión true. */
  timerProgress?: boolean
  /** true/false o detalle por vía. Por omisión: Esc y clic fuera cierran; × solo en paneles laterales. */
  dismissible?: boolean | Dismissible
  /** Se llama al confirmar con el valor del diálogo. Puede ser async: muestra «cargando» mientras tanto.
   *  Devuelve `false` para dejarlo abierto, lanza un Error para mostrar su mensaje, o devuelve el valor final. */
  preConfirm?: (value: T | undefined, ctx: DialogContext) => unknown
  /** Antes de cerrar por cualquier vía distinta de confirmar. Devuelve false para impedirlo. */
  beforeClose?: (reason: CloseReason, ctx: DialogContext) => boolean | Promise<boolean>
  /** Qué recibe el foco al abrir: 'confirm', 'cancel', 'first-field' o un selector dentro del diálogo. */
  initialFocus?: 'confirm' | 'cancel' | 'first-field' | (string & {})
  /** Nota pequeña bajo el contenido. */
  footnote?: string
  /** Clase extra en el panel (dentro del Shadow DOM; estilízala con `styles`). */
  className?: string
  /** CSS extra dentro del Shadow DOM de este diálogo. */
  styles?: string
  /** Variables `--nd-*` solo para este diálogo. */
  theme?: Record<string, string>
  scheme?: Scheme
  onOpen?: (ctx: DialogContext) => void
  onClose?: (result: DialogResult<T>) => void
}

/** Lo que reciben los callbacks para controlar el diálogo abierto. */
export interface DialogContext {
  /** El `<dialog>` nativo (DOM normal). */
  readonly dialog: HTMLDialogElement
  /** Raíz del Shadow DOM donde vive el contenido. */
  readonly root: ShadowRoot
  /** Contenedor del contenido (entre el título y los botones). */
  readonly body: HTMLElement
  close(reason?: CloseReason, value?: unknown, confirmed?: boolean): void
  /** Estado «procesando»: deshabilita botones y evita cerrar. */
  setLoading(loading: boolean, text?: string): void
  /** Mensaje de error sobre los botones; null lo quita. */
  setError(message: string | null): void
  setTitle(title: string): void
  setButtons(buttons: ButtonSpec[]): void
  button(id: string): HTMLButtonElement | null
}

export interface Labels {
  ok: string
  confirm: string
  cancel: string
  close: string
  loading: string
  required: string
  typeToConfirm: string
  typeToConfirmHelp: string
  invalidEmail: string
  invalidUrl: string
  minLength: string
  maxLength: string
  min: string
  max: string
  pattern: string
  invalidRfc: string
  invalidCurp: string
  invalidNss: string
  invalidClabe: string
  invalidPostal: string
  errorSummary: string
  next: string
  back: string
  submit: string
  review: string
  edit: string
  step: string
  discardTitle: string
  discardText: string
  discard: string
  keepEditing: string
  select: string
  yes: string
  no: string
  notifications: string
  dismiss: string
  success: string
  error: string
  warning: string
  info: string
}

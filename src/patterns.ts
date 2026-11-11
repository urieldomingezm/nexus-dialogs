/**
 * Recetas: los diálogos que todo sistema de empresa necesita, en una llamada.
 *
 * ```ts
 * import { confirmDelete, unsavedChanges, approval, bulkAction, choose, loading, watchIdle } from 'nexus-dialogs/patterns'
 *
 * if (await confirmDelete({ what: 'el periodo de nómina', name: 'Quincena 21', requireName: true })) borrar()
 * ```
 * Todas siguen el estándar de botones y resuelven con algo fácil de usar (booleano, texto o un objeto pequeño).
 */
import { INVALID as INVALIDO, labels, language, openDialog } from 'nexus-dialogs'
import type { ButtonSpec, DialogContext } from 'nexus-dialogs'
import { h, uid } from './core/dom'

// ── Textos ──────────────────────────────────────────────────────────────────
const ES = {
  deleteTitle: '¿Eliminar {0}?',
  deleteText: 'Se eliminará {0}.',
  deleteLose: 'Se perderá:',
  irreversible: 'No se puede deshacer.',
  delete: 'Eliminar',
  unsavedTitle: 'Tienes cambios sin guardar',
  unsavedTitle1: 'Tienes 1 cambio sin guardar',
  unsavedTitleN: 'Tienes {0} cambios sin guardar',
  unsavedText: 'Si sales ahora se perderán.',
  saveAndExit: 'Guardar y salir',
  sessionTitle: 'Tu sesión está por cerrarse',
  sessionText: 'Por seguridad la cerramos tras un tiempo sin actividad.',
  sessionLeft: 'Quedan {0}.',
  stay: 'Seguir trabajando',
  logout: 'Cerrar sesión ahora',
  approve: 'Aprobar',
  reject: 'Rechazar…',
  rejectTitle: 'Rechazar la solicitud',
  rejectConfirm: 'Rechazar solicitud',
  reason: 'Motivo',
  explain: 'Explica el motivo',
  comment: 'Comentario',
  optional: '(opcional)',
  requestInfo: 'Pedir más información',
  back: 'Volver',
  minChars: 'Escribe al menos {0} caracteres.',
  chooseReason: 'Elige un motivo.',
  apply: 'Aplicar a {0}',
  preview: 'Vista previa',
  andMore: 'y {0} más…',
  skipped: '{0} se omitirán:',
  skippedDone: '{0} omitido(s)',
  running: 'Aplicando cambios…',
  progress: '{0} de {1}',
  doneTitle: 'Listo',
  doneOk: '{0} sin problema',
  doneFail: '{0} con error',
  retry: 'Reintentar {0}',
  close: 'Cerrar',
  choose: 'Continuar',
}
type Textos = typeof ES
const EN: Textos = {
  deleteTitle: 'Delete {0}?',
  deleteText: '{0} will be deleted.',
  deleteLose: 'You will lose:',
  irreversible: 'This cannot be undone.',
  delete: 'Delete',
  unsavedTitle: 'You have unsaved changes',
  unsavedTitle1: 'You have 1 unsaved change',
  unsavedTitleN: 'You have {0} unsaved changes',
  unsavedText: 'If you leave now they will be lost.',
  saveAndExit: 'Save and leave',
  sessionTitle: 'Your session is about to end',
  sessionText: 'For security we sign you out after some time without activity.',
  sessionLeft: '{0} left.',
  stay: 'Keep working',
  logout: 'Sign out now',
  approve: 'Approve',
  reject: 'Reject…',
  rejectTitle: 'Reject the request',
  rejectConfirm: 'Reject request',
  reason: 'Reason',
  explain: 'Explain why',
  comment: 'Comment',
  optional: '(optional)',
  requestInfo: 'Ask for more information',
  back: 'Back',
  minChars: 'Write at least {0} characters.',
  chooseReason: 'Choose a reason.',
  apply: 'Apply to {0}',
  preview: 'Preview',
  andMore: 'and {0} more…',
  skipped: '{0} will be skipped:',
  skippedDone: '{0} skipped',
  running: 'Applying changes…',
  progress: '{0} of {1}',
  doneTitle: 'Done',
  doneOk: '{0} without problems',
  doneFail: '{0} with errors',
  retry: 'Retry {0}',
  close: 'Close',
  choose: 'Continue',
}
const extra: Partial<Textos> = {}
const T = (): Textos => ({ ...(language() === 'en' ? EN : ES), ...extra })
const f = (s: string, ...v: (string | number)[]) => s.replace(/\{(\d)\}/g, (_, i) => String(v[+i] ?? ''))

/** Cambia textos de las recetas (por ejemplo `{ stay: 'Continuar aquí' }`). */
export function configurePatterns(textos: Partial<Textos>): void {
  Object.assign(extra, textos)
}

const CSS = `
.lead{margin:0 0 16px;color:var(--_muted);font-size:14px;line-height:20px}
.lead b{color:var(--_fg);font-weight:600}
.req{color:var(--_error)}
.loss{margin:0;padding:12px 16px 12px 34px;border-radius:12px;font-size:14px;line-height:22px;color:var(--_muted);
  background:color-mix(in srgb,var(--_danger) 4%,var(--_bg));border:1px solid color-mix(in srgb,var(--_danger) 22%,var(--_bg))}
.loss-t{margin:0 0 8px;font-size:14px;font-weight:600;color:var(--_label)}
.changes{list-style:none;margin:0;padding:0;border:1px solid var(--_line);border-radius:12px;font-size:14px}
.changes li{display:flex;gap:10px;align-items:baseline;padding:10px 14px;border-top:1px solid var(--_line)}
.changes li:first-child{border-top:0}
.changes li::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--_warning);transform:translateY(-1px)}
.changes s{color:var(--_subtle)}
.clock{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin:4px 0 0}
.clock .num{font:600 36px/44px var(--_title-font);letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--_fg)}
.warnbar{margin:0}
.bar.warnbar div{background:var(--_warning)}
.facts{margin:0 0 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));border:1px solid var(--_line);border-radius:12px;overflow:hidden}
.facts div{padding:12px 14px;border-inline-end:1px solid var(--_line);border-bottom:1px solid var(--_line);margin-inline-end:-1px;margin-block-end:-1px}
.facts dt{font-size:12px;color:var(--_subtle)}
.facts dd{margin:2px 0 0;font-weight:600;font-size:14px;color:var(--_fg)}
.warn{margin:0 0 16px;padding:12px 14px;border-radius:12px;font-size:14px;line-height:20px;color:var(--_fg);
  background:color-mix(in srgb,var(--_warning) 7%,var(--_bg));border:1px solid color-mix(in srgb,var(--_warning) 35%,var(--_bg))}
.chips{border:0;margin:0 0 16px;padding:0}
.chips legend{font-size:14px;font-weight:500;color:var(--_label);margin-bottom:8px;padding:0}
.chips div{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative}
.chip input{position:absolute;opacity:0;inset:0;margin:0}
.chip span{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--_border);background:var(--_bg);
  font-size:14px;font-weight:500;color:var(--_label);cursor:pointer;box-shadow:var(--_xs)}
.chip span:hover{background:var(--_surface)}
.chip input:checked+span{border-color:color-mix(in srgb,var(--_accent) 50%,var(--_bg));background:color-mix(in srgb,var(--_accent) 8%,var(--_bg));color:color-mix(in srgb,var(--_accent) 75%,var(--_fg));font-weight:600}
.chip input:focus-visible+span{box-shadow:0 0 0 4px var(--_focus)}
.warn-top{margin:12px 0 0}
.warn-list{margin:4px 0 0;padding-inline-start:18px}
.count{display:flex;justify-content:space-between;font-size:13px;margin-top:6px;color:var(--_subtle)}
.count .msg{margin:0}
.table{border:1px solid var(--_line);border-radius:12px;overflow:hidden;font-size:14px}
.row{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;padding:10px 14px;border-top:1px solid var(--_line)}
.row:first-child{border-top:0}
.row.head{background:var(--_surface);color:var(--_subtle);font-size:12px;font-weight:600}
.row .to{font-weight:600;color:var(--_fg)}
.more{padding:10px 14px;border-top:1px solid var(--_line);color:var(--_subtle)}
.bar{height:8px;border-radius:999px;background:var(--_line);overflow:hidden;margin:4px 0 6px}
.bar div{height:100%;border-radius:999px;background:var(--_accent);transition:width .2s}
.results{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:8px;font-size:14px;max-height:220px;overflow:auto}
.results li{display:flex;gap:10px;align-items:flex-start}
.dot{flex:none;width:8px;height:8px;border-radius:50%;margin-top:6px}
.ok .dot{background:var(--_success)}.bad .dot{background:var(--_danger)}.skip .dot{background:var(--_subtle)}
.cards{display:grid;gap:10px;border:0;margin:0;padding:0}
.card{position:relative;display:block}
.card input{position:absolute;opacity:0;inset:0;margin:0}
.card span{display:block;padding:14px 16px;border:1px solid var(--_line);border-radius:12px;cursor:pointer;box-shadow:var(--_xs)}
.card span:hover{background:var(--_surface)}
.card b{display:block;font-size:14px;font-weight:600;color:var(--_fg)}
.card small{display:block;color:var(--_subtle);font-size:14px;margin-top:2px}
.card input:checked+span{border-color:var(--_accent);box-shadow:inset 0 0 0 1px var(--_accent);background:color-mix(in srgb,var(--_accent) 4%,var(--_bg))}
.card input:focus-visible+span{box-shadow:inset 0 0 0 1px var(--_accent),0 0 0 4px var(--_focus)}
.card input:disabled+span{opacity:.5;cursor:not-allowed}
.spin{width:40px;height:40px;border-radius:50%;border:4px solid var(--_line);border-top-color:var(--_accent);animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(1turn)}}
@media (prefers-reduced-motion:reduce){.spin{animation:none}.bar div{transition:none}}
`

// ── confirmDelete ───────────────────────────────────────────────────────────

export interface ConfirmDeleteOptions {
  /** Qué se borra, como se diría en la frase: 'el periodo de nómina', 'a Laura Méndez'. */
  what: string
  /** Nombre concreto (se muestra en negritas). Con `requireName`, hay que escribirlo para habilitar el botón. */
  name?: string
  /** Lo que se pierde: ['148 recibos calculados', '12 incidencias']. */
  consequences?: string[]
  /** Exigir escribir `name` (para lo irreversible y grande). */
  requireName?: boolean
  /** Por omisión true: agrega «No se puede deshacer». */
  irreversible?: boolean
  confirmText?: string
  /** Se ejecuta al confirmar (con «Procesando…»). Si lanza, el error se muestra y el diálogo sigue abierto. */
  onConfirm?: () => unknown
}

/** Confirmación de borrado. Resuelve `true` solo si se confirmó (y `onConfirm` terminó bien). */
export async function confirmDelete(o: ConfirmDeleteOptions): Promise<boolean> {
  const t = T()
  const r = await openDialog({
    role: 'alertdialog',
    title: f(t.deleteTitle, o.what),
    danger: true,
    requireText: o.requireName && o.name ? o.name : undefined,
    confirmText: o.confirmText ?? t.delete,
    moduleCss: CSS,
    render: () => {
      // «Se eliminará {0}.» → el nombre (o lo que se borra) va en negritas dentro de la frase.
      const [antes, despues = ''] = t.deleteText.split('{0}')
      return h(
        'div',
        null,
        h('p', { class: 'lead' }, antes, h('b', null, o.name ?? o.what), despues, o.irreversible === false ? '' : ` ${t.irreversible}`),
        o.consequences?.length
          ? h(
              'div',
              null,
              h('p', { class: 'loss-t' }, t.deleteLose),
              h('ul', { class: 'loss' }, ...o.consequences.map((c) => h('li', null, c))),
            )
          : null,
      )
    },
    preConfirm: o.onConfirm ? async () => (await o.onConfirm!(), true) : undefined,
  })
  return r.confirmed
}

// ── unsavedChanges ──────────────────────────────────────────────────────────

export interface Change {
  label: string
  from?: string
  to?: string
}

export interface UnsavedChangesOptions {
  /** Lista de lo que cambió; se muestra «antes → después». */
  changes?: Change[]
  /** Mostrar «Guardar y salir». Por omisión true si hay `onSave`. */
  canSave?: boolean
  /** Guarda (con «Procesando…»). Si lanza, se muestra el error. */
  onSave?: () => unknown
}

/** Al salir con cambios sin guardar. Resuelve 'save', 'discard' o 'keep' (seguir editando; también con Esc). */
export async function unsavedChanges(o: UnsavedChangesOptions = {}): Promise<'save' | 'discard' | 'keep'> {
  const t = T()
  const L = labels()
  const n = o.changes?.length ?? 0
  const guardar = o.canSave ?? !!o.onSave
  const r = await openDialog({
    role: 'alertdialog',
    title: n === 1 ? t.unsavedTitle1 : n ? f(t.unsavedTitleN, n) : t.unsavedTitle,
    text: t.unsavedText,
    moduleCss: CSS,
    initialFocus: 'cancel',
    render: () =>
      n
        ? h(
            'ul',
            { class: 'changes' },
            ...o.changes!.map((c) =>
              h(
                'li',
                null,
                h(
                  'span',
                  null,
                  h('b', null, `${c.label}: `),
                  c.from !== undefined ? h('s', null, c.from) : null,
                  c.from !== undefined ? ' → ' : '',
                  c.to ?? '',
                ),
              ),
            ),
          )
        : null,
    buttons: [
      { id: 'discard', role: 'deny', text: L.discard },
      { id: 'keep', role: 'cancel', text: L.keepEditing, variant: 'secondary' },
      ...(guardar ? [{ id: 'save', role: 'confirm' as const, text: t.saveAndExit }] : []),
    ],
    preConfirm: o.onSave ? async () => (await o.onSave!(), true) : undefined,
  })
  return r.confirmed ? 'save' : r.denied ? 'discard' : 'keep'
}

// ── sessionTimeout / watchIdle ─────────────────────────────────────────────

export interface SessionTimeoutOptions {
  /** Segundos que quedan. Por omisión 120 (WCAG pide avisar con al menos 20 s; lo recomendado son 2 min). */
  seconds?: number
  /** Texto extra: «Lo que llevas ya se guardó como borrador». */
  text?: string
}

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Aviso de sesión por expirar con cuenta regresiva. Resuelve 'extend', 'logout' o 'expired'. */
export async function sessionTimeout(o: SessionTimeoutOptions = {}): Promise<'extend' | 'logout' | 'expired'> {
  const t = T()
  const total = Math.max(1, Math.round(o.seconds ?? 120))
  let queda = total
  let intervalo: ReturnType<typeof setInterval> | undefined
  const r = await openDialog({
    role: 'alertdialog',
    title: t.sessionTitle,
    icon: 'clock',
    text: [t.sessionText, o.text].filter(Boolean).join(' '),
    moduleCss: CSS,
    dismissible: { escape: true, backdrop: false },
    initialFocus: 'confirm',
    buttons: [
      { id: 'logout', role: 'deny', text: t.logout },
      { id: 'extend', role: 'confirm', text: t.stay },
    ],
    render: (ctx: DialogContext) => {
      const relleno = h('div')
      const barra = h('div', { class: 'bar warnbar', 'aria-hidden': 'true' }, relleno)
      const num = h('div', { class: 'num', 'aria-hidden': 'true' }, reloj(queda))
      const vivo = h('p', { class: 'sr', role: 'status' }, f(t.sessionLeft, reloj(queda)))
      const pintar = () => {
        num.textContent = reloj(queda)
        relleno.style.width = `${(queda / total) * 100}%`
        // Al lector de pantalla solo cada minuto y en los últimos 30 s y 10 s, no cada segundo.
        if (queda % 60 === 0 || queda === 30 || queda === 10) vivo.textContent = f(t.sessionLeft, reloj(queda))
      }
      pintar()
      intervalo = setInterval(() => {
        queda--
        pintar()
        if (queda <= 0) ctx.close('expired')
      }, 1000)
      return h('div', { class: 'clock' }, num, barra, vivo)
    },
    onClose: () => clearInterval(intervalo),
  })
  clearInterval(intervalo)
  if (r.confirmed) return 'extend'
  if (r.reason === 'expired') return 'expired'
  if (r.denied) return 'logout'
  return 'extend' // Esc = seguir trabajando (lo más seguro para no perder trabajo)
}

export interface WatchIdleOptions {
  /** Minutos sin actividad para cerrar la sesión. */
  minutes: number
  /** Segundos de aviso antes de cerrar. Por omisión 120. */
  warnSeconds?: number
  /** Al elegir «Seguir trabajando»: renueva el token, llama a tu API, etc. */
  onExtend?: () => unknown
  /** Al cerrar sesión (por el botón o porque se acabó el tiempo). */
  onLogout: (reason: 'logout' | 'expired') => unknown
  text?: string
}

/**
 * Vigila la inactividad (mouse, teclado, toque, scroll) y avisa antes de cerrar la sesión.
 * Devuelve `{ stop, reset }`: `reset()` cuenta como actividad (por ejemplo, tras una llamada a tu API).
 */
export function watchIdle(o: WatchIdleOptions): { stop: () => void; reset: () => void } {
  const aviso = (o.warnSeconds ?? 120) * 1000
  const limite = Math.max(o.minutes * 60_000, aviso + 1000)
  let ultimo = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  let avisando = false
  let activo = true
  const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

  const programar = () => {
    clearTimeout(timer)
    if (!activo) return
    const falta = limite - aviso - (Date.now() - ultimo)
    timer = setTimeout(revisar, Math.max(0, falta))
  }
  const revisar = async () => {
    if (!activo || avisando) return
    if (Date.now() - ultimo < limite - aviso - 50) return programar()
    avisando = true
    const r = await sessionTimeout({ seconds: Math.round(aviso / 1000), text: o.text })
    avisando = false
    if (!activo) return
    if (r === 'extend') {
      ultimo = Date.now()
      try {
        await o.onExtend?.()
      } catch (e) {
        console.error(e)
      }
      programar()
    } else {
      stop()
      await o.onLogout(r)
    }
  }
  let throttle = 0
  const actividad = () => {
    if (avisando) return // durante el aviso solo cuentan los botones
    const ahora = Date.now()
    if (ahora - throttle < 1000) return
    throttle = ahora
    ultimo = ahora
  }
  for (const e of eventos) document.addEventListener(e, actividad, { capture: true, passive: true })
  const stop = () => {
    activo = false
    clearTimeout(timer)
    for (const e of eventos) document.removeEventListener(e, actividad, { capture: true })
  }
  programar()
  return {
    stop,
    reset: () => {
      ultimo = Date.now()
      programar()
    },
  }
}

// ── approval ────────────────────────────────────────────────────────────────

export interface ApprovalOptions {
  title: string
  /** Línea pequeña arriba del título: 'Solicitud SOL-0412 · hace 2 h'. */
  subtitle?: string
  /** Datos clave: [{ label: 'Fechas', value: '16 – 20 dic' }]. */
  details?: { label: string; value: string }[]
  /** Aviso amarillo: '2 personas del área ya tienen vacaciones esos días'. */
  warning?: string
  /** Motivos rápidos para rechazar. */
  reasons?: string[]
  /** Mínimo de caracteres del motivo al rechazar. Por omisión 10. */
  minReasonLength?: number
  /** Mostrar «Pedir más información». */
  allowRequestInfo?: boolean
  approveText?: string
  onApprove?: (comment: string) => unknown
  onReject?: (comment: string, reason?: string) => unknown
  onRequestInfo?: (comment: string) => unknown
}

export interface ApprovalResult {
  decision: 'approved' | 'rejected' | 'info' | 'cancelled'
  comment: string
  reason?: string
}

/** Aprobar o rechazar una solicitud. El comentario es opcional al aprobar y obligatorio al rechazar. */
export async function approval(o: ApprovalOptions): Promise<ApprovalResult> {
  const t = T()
  const idC = uid('pc')
  let comentario!: HTMLTextAreaElement
  let rechazo: { comment: string; reason?: string } | null = null

  const rechazar = async (): Promise<boolean> => {
    const min = o.minReasonLength ?? 10
    let texto!: HTMLTextAreaElement
    let msg!: HTMLElement
    let cuenta!: HTMLElement
    const nombre = uid('pr')
    const idT = uid('pt')
    const idM = uid('pm')
    const motivo = (root: ShadowRoot) => root.querySelector<HTMLInputElement>(`input[name="${nombre}"]:checked`)?.value
    const r = await openDialog<{ comment: string; reason?: string }>({
      role: 'dialog',
      title: t.rejectTitle,
      moduleCss: CSS,
      initialFocus: o.reasons?.length ? `input[name="${nombre}"]` : `#${idT}`,
      buttons: [
        { id: 'back', role: 'cancel', text: t.back, variant: 'secondary' },
        { id: 'confirm', role: 'confirm', text: t.rejectConfirm, variant: 'danger' },
      ],
      render: () => {
        texto = h('textarea', { id: idT, class: 'input', rows: 3, maxlength: 500, 'aria-describedby': idM, 'aria-required': 'true' })
        msg = h('span', { class: 'msg', id: idM })
        cuenta = h('span', null, '0 / 500')
        texto.addEventListener('input', () => (cuenta.textContent = `${texto.value.length} / 500`))
        return h(
          'div',
          null,
          o.reasons?.length
            ? h(
                'fieldset',
                { class: 'chips' },
                h('legend', null, t.reason),
                h(
                  'div',
                  null,
                  ...o.reasons.map((m) =>
                    h('label', { class: 'chip' }, h('input', { type: 'radio', name: nombre, value: m }), h('span', null, m)),
                  ),
                ),
              )
            : null,
          h(
            'div',
            { class: 'field' },
            h('label', { for: idT }, t.explain, h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')),
            texto,
            h('div', { class: 'count' }, msg, cuenta),
          ),
        )
      },
      collect: (ctx) => {
        const v = texto.value.trim()
        const err = v.length < min ? f(t.minChars, min) : null
        msg.textContent = err ?? ''
        texto.setAttribute('aria-invalid', String(!!err))
        if (err) {
          texto.focus()
          return INVALIDO
        }
        return { comment: v, reason: motivo(ctx.root) }
      },
      preConfirm: o.onReject ? async (v) => (await o.onReject!(v!.comment, v!.reason), v) : undefined,
    })
    if (!r.confirmed || !r.value) return false
    rechazo = r.value
    return true
  }

  const botones: ButtonSpec[] = [
    ...(o.allowRequestInfo ? [{ id: 'info', text: t.requestInfo, variant: 'secondary' as const }] : []),
    { id: 'reject', text: t.reject, variant: 'cancel', onClick: async () => ((await rechazar()) ? 'rejected' : false) },
    { id: 'confirm', role: 'confirm', text: o.approveText ?? t.approve },
  ]
  if (o.allowRequestInfo && o.onRequestInfo) {
    botones[0].onClick = async (ctx) => {
      ctx.setLoading(true)
      try {
        await o.onRequestInfo!(comentario.value.trim())
      } catch (e) {
        ctx.setLoading(false)
        ctx.setError(e instanceof Error ? e.message : String(e))
        return false
      }
      return 'info'
    }
  }

  const r = await openDialog<unknown>({
    role: 'dialog',
    title: o.title,
    moduleCss: CSS,
    size: 'md',
    initialFocus: 'confirm',
    buttons: botones,
    render: () => {
      comentario = h('textarea', { id: idC, class: 'input', rows: 2, maxlength: 500 })
      return h(
        'div',
        null,
        o.subtitle ? h('p', { class: 'lead' }, o.subtitle) : null,
        o.details?.length
          ? h('dl', { class: 'facts' }, ...o.details.map((d) => h('div', null, h('dt', null, d.label), h('dd', null, d.value))))
          : null,
        o.warning ? h('p', { class: 'warn' }, o.warning) : null,
        h('div', { class: 'field' }, h('label', { for: idC }, `${t.comment} `, h('span', { class: 'help' }, t.optional)), comentario),
      )
    },
    preConfirm: o.onApprove ? async () => (await o.onApprove!(comentario.value.trim()), true) : undefined,
  })
  const c = (): string => comentario?.value.trim() ?? ''
  const rech = rechazo as { comment: string; reason?: string } | null
  if (r.confirmed) return { decision: 'approved', comment: c() }
  if (r.reason === 'reject' && rech) return { decision: 'rejected', comment: rech.comment, reason: rech.reason }
  if (r.reason === 'info') return { decision: 'info', comment: c() }
  return { decision: 'cancelled', comment: c() }
}

// ── bulkAction ──────────────────────────────────────────────────────────────

export interface BulkActionOptions<T> {
  title: string
  items: T[]
  /** Nombre de cada elemento en la lista: (e) => e.nombre */
  label: (item: T) => string
  /** Qué le pasará: (e) => `${e.area} → Logística`. */
  describe?: (item: T) => string
  /** Si devuelve un texto, ese elemento se omite y se muestra el motivo. */
  skip?: (item: T) => string | false | null | undefined
  /** La acción para un elemento. Si lanza, se marca con error y sigue con los demás. */
  run: (item: T) => unknown
  /** Texto del botón. Por omisión «Aplicar a N». */
  confirmText?: string | ((n: number) => string)
  /** Cuántos a la vez. Por omisión 3. */
  concurrency?: number
  /** Filas en la vista previa. Por omisión 5. */
  preview?: number
}

export interface BulkActionResult<T> {
  /** false si se canceló antes de empezar. */
  confirmed: boolean
  done: T[]
  failed: { item: T; error: string }[]
  skipped: { item: T; reason: string }[]
}

/** Acción masiva: vista previa, confirmación, progreso fila por fila, resumen y «Reintentar» los fallidos. */
export async function bulkAction<T>(o: BulkActionOptions<T>): Promise<BulkActionResult<T>> {
  const t = T()
  const omitidos: { item: T; reason: string }[] = []
  const pendientes: T[] = []
  for (const it of o.items) {
    const motivo = o.skip?.(it)
    if (motivo) omitidos.push({ item: it, reason: motivo })
    else pendientes.push(it)
  }
  const hechos: T[] = []
  let fallidos: { item: T; error: string }[] = []
  let corriendo = false
  let empezo = false
  const textoBoton =
    typeof o.confirmText === 'function' ? o.confirmText(pendientes.length) : (o.confirmText ?? f(t.apply, pendientes.length))
  const cont = h('div')
  const max = o.preview ?? 5

  const vistaPrevia = () =>
    h(
      'div',
      null,
      h('p', { class: 'loss-t' }, t.preview),
      h(
        'div',
        { class: 'table' },
        ...pendientes
          .slice(0, max)
          .map((it) => h('div', { class: 'row' }, h('span', null, o.label(it)), h('span', { class: 'to' }, o.describe?.(it) ?? ''))),
        pendientes.length > max ? h('div', { class: 'more' }, f(t.andMore, pendientes.length - max)) : null,
      ),
      omitidos.length
        ? h(
            'div',
            { class: 'warn warn-top' },
            f(t.skipped, omitidos.length),
            h('ul', { class: 'warn-list' }, ...omitidos.slice(0, max).map((s) => h('li', null, `${o.label(s.item)}: ${s.reason}`))),
          )
        : null,
    )

  const correr = async (ctx: DialogContext, lista: T[]) => {
    corriendo = true
    empezo = true
    fallidos = fallidos.filter((x) => !lista.includes(x.item))
    ctx.setTitle(t.running)
    ctx.setError(null)
    ctx.setButtons([])
    const barra = h('div')
    const avance = h('p', { class: 'help', role: 'status' })
    const res = h('ul', { class: 'results' })
    cont.replaceChildren(
      h(
        'div',
        { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(lista.length), 'aria-label': t.running },
        barra,
      ),
      avance,
      res,
    )
    const progressbar = cont.querySelector('[role=progressbar]')!
    let n = 0
    const pintar = () => {
      barra.style.width = `${(n / lista.length) * 100}%`
      progressbar.setAttribute('aria-valuenow', String(n))
      avance.textContent = f(t.progress, n, lista.length)
    }
    pintar()
    const cola = [...lista]
    const trabajador = async () => {
      while (cola.length) {
        const it = cola.shift()!
        try {
          await o.run(it)
          hechos.push(it)
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e)
          fallidos.push({ item: it, error })
          res.appendChild(
            h(
              'li',
              { class: 'bad' },
              h('span', { class: 'dot', 'aria-hidden': 'true' }),
              h('span', null, h('b', null, o.label(it)), `: ${error}`),
            ),
          )
        }
        n++
        pintar()
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, Math.min(o.concurrency ?? 3, lista.length)) }, trabajador))
    corriendo = false
    ctx.setTitle(t.doneTitle)
    res.prepend(h('li', { class: 'ok' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', null, f(t.doneOk, hechos.length))))
    if (omitidos.length)
      res.append(
        h('li', { class: 'skip' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', null, f(t.skippedDone, omitidos.length))),
      )
    avance.textContent = [f(t.doneOk, hechos.length), fallidos.length ? f(t.doneFail, fallidos.length) : ''].filter(Boolean).join(' · ')
    ctx.setButtons([
      ...(fallidos.length ? [{ id: 'retry', text: f(t.retry, fallidos.length), variant: 'secondary' as const }] : []),
      { id: 'done', role: 'confirm', text: t.close },
    ])
    ctx.button('done')?.focus()
  }

  await openDialog({
    role: 'dialog',
    title: o.title,
    size: 'lg',
    moduleCss: CSS,
    dismissible: { backdrop: false },
    initialFocus: 'confirm',
    buttons: [
      { id: 'cancel', role: 'cancel', text: labels().cancel },
      { id: 'run', text: textoBoton, variant: 'primary', disabled: !pendientes.length },
    ],
    render: () => {
      cont.appendChild(vistaPrevia())
      return cont
    },
    beforeClose: () => !corriendo,
    onAction: async (b, ctx) => {
      if (b.id === 'run') {
        await correr(ctx, pendientes)
        return true
      }
      if (b.id === 'retry') {
        await correr(
          ctx,
          fallidos.map((x) => x.item),
        )
        return true
      }
      return false
    },
  })
  return { confirmed: empezo, done: hechos, failed: fallidos, skipped: omitidos }
}

// ── choose ──────────────────────────────────────────────────────────────────

export interface ChooseOption<V extends string> {
  value: V
  label: string
  description?: string
  disabled?: boolean
}

export interface ChooseOptions<V extends string> {
  title: string
  text?: string
  options: ChooseOption<V>[]
  /** Opción marcada al abrir. Por omisión la primera habilitada. */
  value?: V
  confirmText?: string
}

/** Elegir una opción entre varias (tarjetas). Resuelve el `value` elegido o `null` si se canceló. */
export async function choose<V extends string>(o: ChooseOptions<V>): Promise<V | null> {
  const t = T()
  const nombre = uid('ch')
  const inicial = o.value ?? o.options.find((x) => !x.disabled)?.value
  const r = await openDialog<V>({
    role: 'dialog',
    title: o.title,
    text: o.text,
    moduleCss: CSS,
    confirmText: o.confirmText ?? t.choose,
    initialFocus: `input[name="${nombre}"]:checked`,
    render: () =>
      h(
        'fieldset',
        { class: 'cards', 'aria-label': o.title },
        ...o.options.map((op) =>
          h(
            'label',
            { class: 'card' },
            h('input', { type: 'radio', name: nombre, value: op.value, checked: op.value === inicial, disabled: !!op.disabled }),
            h('span', null, h('b', null, op.label), op.description ? h('small', null, op.description) : null),
          ),
        ),
      ),
    collect: (ctx) => (ctx.root.querySelector<HTMLInputElement>(`input[name="${nombre}"]:checked`)?.value as V) ?? INVALIDO,
  })
  return r.confirmed ? (r.value ?? null) : null
}

// ── loading ─────────────────────────────────────────────────────────────────

export interface LoadingHandle {
  /** Cambia el texto: 'Timbrando 40 de 148…'. */
  update(text: string): void
  close(): void
}

/** Pantalla de espera que no se puede cerrar. Úsala para lo que de verdad bloquea (timbrar, cerrar nómina). */
function abrirCarga(texto: string): LoadingHandle {
  let ctxRef: DialogContext | null = null
  let titulo = texto
  let cerrar = false
  void openDialog({
    role: 'dialog',
    title: texto,
    size: 'sm',
    moduleCss: CSS + '.head{justify-content:center;text-align:center}.head>div{width:100%}.body{overflow:visible;padding:16px 24px 32px}',
    dismissible: false,
    buttons: [],
    render: () => h('div', { class: 'spin', role: 'progressbar', 'aria-label': texto }),
    onOpen: (ctx) => {
      ctxRef = ctx
      if (titulo !== texto) ctx.setTitle(titulo)
      if (cerrar) ctx.close('program')
    },
  })
  return {
    update(nuevo) {
      titulo = nuevo
      ctxRef?.setTitle(nuevo)
    },
    close() {
      cerrar = true
      ctxRef?.close('program')
    },
  }
}

/**
 * Pantalla de espera mientras corre una tarea. Devuelve lo que devuelva la tarea (y relanza su error).
 * ```ts
 * const folios = await loading('Timbrando recibos…', () => api.timbrar())
 * ```
 * Sin tarea, `loading.open(texto)` devuelve `{ update, close }`.
 */
export async function loading<R>(texto: string, tarea: Promise<R> | (() => Promise<R> | R)): Promise<R> {
  const c = abrirCarga(texto)
  try {
    return await (typeof tarea === 'function' ? tarea() : tarea)
  } finally {
    c.close()
  }
}
loading.open = abrirCarga

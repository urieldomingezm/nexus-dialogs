// Examples gallery (English): the same examples as ejemplos-def.ts with the text in English. Each `@ejemplo` block runs for real
// and its code is shown as is. Keep the ids and function names identical to the Spanish file.
import { dialog, configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form, wizard, formFromJSON, type FormSchema } from 'nexus-dialogs/forms'
import { confirmDelete, unsavedChanges, sessionTimeout, approval, bulkAction, choose, loading } from 'nexus-dialogs/patterns'
import { isRFC, isCURP, isCLABE, businessDays, mexicanHolidays } from 'nexus-dialogs/mx'
import { importData, exportData } from 'nexus-dialogs/import'
import { pickRows } from 'nexus-dialogs/table'
import { tabsDialog } from 'nexus-dialogs/tabs'
import { timelineDialog } from 'nexus-dialogs/timeline'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'
import { themes } from 'nexus-dialogs/themes'

/* @ejemplo
 * id: alerta
 * grupo: Dialogs
 * titulo: Notice with an icon that closes by itself
 * desc: Shortcuts with an icon: success, error, warning and info. The timer pauses with the mouse or focus over it.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function alerta() {
  const r = await dialog.success({ title: 'Employee saved', text: 'Laura now appears in the payroll.', timer: 3000 })
  return r
}

/* @ejemplo
 * id: error
 * grupo: Dialogs
 * titulo: Error with an explanation
 * desc: A short title and text with what happened. Focus starts on the button and Esc closes.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function error() {
  const r = await dialog.error('Could not stamp', 'The tax authority did not respond. Try again in a few minutes.')
  return r
}

/* @ejemplo
 * id: confirmar
 * grupo: Dialogs
 * titulo: Confirm
 * desc: It always resolves, never rejects. `reason` says how it was closed.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function confirmar() {
  const r = await dialog.confirm({ title: 'Send for approval?', text: 'Your manager will get a notice.', confirmText: 'Send' })
  return r
}

/* @ejemplo
 * id: preconfirm
 * grupo: Dialogs
 * titulo: Confirm and wait for the server
 * desc: While `preConfirm` runs, the button says “Processing…” and nothing can be closed. If it throws an Error, the message appears inside. Try failing: the second time it works.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function preconfirm() {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let attempts = 0
  const r = await dialog.confirm({
    title: 'Stamp 148 payslips',
    confirmText: 'Stamp',
    preConfirm: async () => {
      await wait(1200)
      if (++attempts === 1) throw new Error('The tax authority did not respond. Try again.')
      return { folios: 148 }
    },
  })
  return r
}

/* @ejemplo
 * id: prompt
 * grupo: Dialogs
 * titulo: Ask for a value
 * desc: One field with its own validation. The error appears inside and focus returns to the field.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function prompt() {
  const r = await dialog.prompt({
    title: 'New area',
    label: 'Area name',
    input: 'text',
    validate: (v) => (v.length < 3 ? 'Type at least 3 characters.' : null),
    confirmText: 'Create area',
  })
  return r
}

/* @ejemplo
 * id: libre
 * grupo: Dialogs
 * titulo: Your buttons, your content
 * desc: Three exits with different roles. `initialFocus: 'cancel'` leaves focus on “Keep editing”.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function libre() {
  const r = await dialog.open({
    title: 'You have 2 unsaved changes',
    text: 'If you leave now, they are lost.',
    buttons: [
      { id: 'discard', role: 'deny', text: 'Discard changes' },
      { id: 'keep', role: 'cancel', text: 'Keep editing', variant: 'secondary' },
      { id: 'save', role: 'confirm', text: 'Save and leave' },
    ],
    initialFocus: 'cancel',
  })
  return r
}

/* @ejemplo
 * id: panel
 * grupo: Dialogs
 * titulo: Side panel
 * desc: `placement` can be center, right, left or bottom. On narrow screens centered ones become a bottom sheet.
 * import: import { dialog } from 'nexus-dialogs'
 */
export async function panel() {
  const r = await dialog.open({
    title: 'Filters',
    placement: 'right',
    render: () => {
      const p = document.createElement('p')
      p.textContent = 'Your filters go here: area, position, hire date…'
      return p
    },
    confirmText: 'See results',
  })
  return r
}

/* @ejemplo
 * id: borrar
 * grupo: Recipes
 * titulo: Confirm a delete
 * desc: Focus starts on Cancel and the red button says what it deletes. It returns true or false.
 * import: import { confirmDelete } from 'nexus-dialogs/patterns'
 */
export async function borrar() {
  const r = await confirmDelete({ what: 'Laura Méndez' })
  return r
}

/* @ejemplo
 * id: borrar-grande
 * grupo: Recipes
 * titulo: Big delete: type the name
 * desc: It lists what is lost and asks to type the name. `onConfirm` shows “Processing…” and, if it fails, the error.
 * import: import { confirmDelete } from 'nexus-dialogs/patterns'
 */
export async function borrarGrande() {
  const r = await confirmDelete({
    what: 'the payroll period',
    name: 'Period 21',
    requireName: true,
    consequences: ['148 calculated payslips', '12 recorded incidents'],
    onConfirm: () => new Promise((ok) => setTimeout(ok, 1000)),
  })
  return r
}

/* @ejemplo
 * id: sin-guardar
 * grupo: Recipes
 * titulo: Leave with unsaved changes
 * desc: It shows what changed. Focus starts on “Keep editing”; Esc also returns to the form.
 * import: import { unsavedChanges } from 'nexus-dialogs/patterns'
 */
export async function sinGuardar() {
  const r = await unsavedChanges({
    changes: [{ label: 'Daily salary', from: '$ 980.00', to: '$ 1,150.00' }],
    onSave: () => new Promise((ok) => setTimeout(ok, 800)),
  })
  return r
}

/* @ejemplo
 * id: sesion
 * grupo: Recipes
 * titulo: Session about to expire
 * desc: Visible countdown (WCAG 2.2.1), focus on “Keep working”. Here it lasts 20 seconds so you can see it.
 * import: import { sessionTimeout } from 'nexus-dialogs/patterns'
 */
export async function sesion() {
  const r = await sessionTimeout({ seconds: 20 })
  return r
}

/* @ejemplo
 * id: aprobar
 * grupo: Recipes
 * titulo: Approve or reject
 * desc: Approve allows a comment; reject opens a second step with quick reasons and a mandatory explanation.
 * import: import { approval } from 'nexus-dialogs/patterns'
 */
export async function aprobar() {
  const r = await approval({
    title: 'Vacation of Diego Ramírez',
    subtitle: 'Request SOL-2026-0412 · 2 h ago',
    details: [
      { label: 'Dates', value: 'Dec 16 – 20' },
      { label: 'Business days', value: '5' },
    ],
    warning: '2 people from Warehouse already have vacation on those days.',
    reasons: ['Covers another shift', 'Inventory close', 'No balance'],
    allowRequestInfo: true,
  })
  return r
}

/* @ejemplo
 * id: masiva
 * grupo: Recipes
 * titulo: Bulk action with progress
 * desc: Preview, confirmation, progress bar and a row-by-row result. If one fails, it continues with the rest and offers “Retry”.
 * import: import { bulkAction } from 'nexus-dialogs/patterns'
 */
export async function masiva() {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const employees = [
    { id: 1, name: 'Ana Torres', area: 'Warehouse' },
    { id: 2, name: 'Diego Ramírez', area: 'Logistics' },
    { id: 3, name: 'Laura Méndez', area: 'Warehouse' },
    { id: 4, name: 'Mateo Cruz', area: 'Sales' },
  ]
  const r = await bulkAction({
    title: 'Change the area of 4 employees',
    items: employees,
    label: (e) => e.name,
    describe: (e) => `${e.area} → Logistics`,
    skip: (e) => e.area === 'Logistics' && 'already in Logistics',
    confirmText: (n) => `Move ${n} employees`,
    run: async (e) => {
      await wait(600)
      if (e.id === 4) throw new Error('No permission in Sales')
    },
  })
  return { done: r.done.length, failed: r.failed.length, skipped: r.skipped.length }
}

/* @ejemplo
 * id: elegir
 * grupo: Recipes
 * titulo: Choose between options
 * desc: A list with a description per option. It returns the chosen value or null if closed.
 * import: import { choose } from 'nexus-dialogs/patterns'
 */
export async function elegir() {
  const format = await choose({
    title: 'Export payroll',
    options: [
      { value: 'xlsx', label: 'Excel', description: 'To review and filter' },
      { value: 'csv', label: 'CSV', description: 'To import into another system' },
    ],
  })
  return format
}

/* @ejemplo
 * id: espera
 * grupo: Recipes
 * titulo: Block while something finishes
 * desc: If the task fails, the wait closes and the error is rethrown so you can show it.
 * import: import { loading } from 'nexus-dialogs/patterns'
 */
export async function espera() {
  const folios = await loading(
    'Stamping 148 payslips…',
    () => new Promise<number>((ok) => setTimeout(() => ok(148), 1800)),
  )
  return folios
}

/* @ejemplo
 * id: gasto
 * grupo: Forms
 * titulo: Form with validation
 * desc: An RFC with its real format, an amount in pesos, a field that appears depending on another and validation that looks at several fields. Errors come out in a summary with links.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function gasto() {
  const r = await form({
    title: 'New expense',
    columns: 2,
    submitText: 'Send for approval',
    fields: [
      { name: 'rfc', label: 'Supplier RFC', type: 'rfc', required: true },
      { name: 'amount', label: 'Amount', type: 'money', required: true, min: 1 },
      { name: 'kind', label: 'Type', type: 'segmented', options: ['Person', 'Company'], value: 'Company' },
      { name: 'legalName', label: 'Legal name', visible: (v) => v.kind === 'Company', required: true },
      { name: 'description', label: 'Description', type: 'textarea', span: 2, maxLength: 200 },
    ],
    validate: (v) => (Number(v.amount) > 50000 ? { amount: 'More than $50,000 requires a purchase order.' } : undefined),
  })
  return r
}

/* @ejemplo
 * id: combobox
 * grupo: Forms
 * titulo: Search and choose (one or several)
 * desc: It searches without accents (“nomina” finds “Nómina”). Arrows, Enter and Esc; in multiple mode each chosen item is a chip.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function combobox() {
  const r = await form({
    title: 'Build a team',
    fields: [
      {
        name: 'lead',
        label: 'Lead',
        type: 'combobox',
        required: true,
        options: ['Ana Torres', 'Diego Ramírez', 'Laura Méndez', 'Mateo Cruz'],
      },
      {
        name: 'team',
        label: 'Team',
        type: 'combobox',
        multiple: true,
        maxItems: 3,
        options: [
          { value: 'ana', label: 'Ana Torres', description: 'Warehouse', group: 'Warehouse' },
          { value: 'laura', label: 'Laura Méndez', description: 'Warehouse', group: 'Warehouse' },
          { value: 'diego', label: 'Diego Ramírez', description: 'Logistics', group: 'Logistics' },
          { value: 'mateo', label: 'Mateo Cruz', description: 'Sales', group: 'Sales' },
        ],
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: vacaciones
 * grupo: Forms
 * titulo: Vacation with a calendar and business days
 * desc: The range is chosen in a calendar (two clicks). Weekends are struck out, statutory holidays (art. 74 LFT) are marked and `maxDays` counts only business days.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function vacaciones() {
  const r = await form({
    title: 'Request vacation',
    fields: [
      {
        name: 'days',
        label: 'Dates',
        type: 'daterange',
        calendar: true,
        businessDays: true,
        holidays: ['2026-12-24', '2026-12-31'],
        maxDays: 12,
        required: true,
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: contacto
 * grupo: Forms
 * titulo: Phone with country code and address by postal code
 * desc: The phone formats as you type and delivers +52…; the address fills state and municipality from the postal code (here with 3 sample codes; you connect your API or the SEPOMEX catalog).
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function contacto() {
  const catalog: Record<string, { state: string; municipality: string; neighborhoods: string[] }> = {
    '06600': { state: 'Ciudad de México', municipality: 'Cuauhtémoc', neighborhoods: ['Juárez', 'Roma Sur'] },
    '64000': { state: 'Nuevo León', municipality: 'Monterrey', neighborhoods: ['Centro'] },
    '44100': { state: 'Jalisco', municipality: 'Guadalajara', neighborhoods: ['Americana', 'Moderna'] },
  }
  const r = await form({
    title: 'Contact details',
    fields: [
      { name: 'phone', label: 'Phone', type: 'phone', required: true },
      {
        name: 'address',
        label: 'Address',
        type: 'address',
        required: true,
        lookupPostalCode: async (cp: string) => catalog[cp] ?? null,
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: partidas
 * grupo: Forms
 * titulo: Repeatable rows with totals
 * desc: Each row validates its fields and the totals are recalculated as you type.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function partidas() {
  const pesos = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
  const r = await form({
    title: 'Expense report',
    size: 'lg',
    fields: [
      {
        name: 'lines',
        label: 'Line items',
        type: 'items',
        required: true,
        maxRows: 20,
        addText: 'Add line',
        fields: [
          { name: 'concept', label: 'Description', required: true },
          { name: 'quantity', label: 'Quantity', type: 'number', min: 1, value: 1 },
          { name: 'price', label: 'Unit price', type: 'money', required: true },
        ],
        totals: (rows) => {
          const subtotal = rows.reduce((s, f) => s + (Number(f.quantity) || 0) * (Number(f.price) || 0), 0)
          return [
            { label: 'Subtotal', value: pesos(subtotal) },
            { label: 'VAT', value: pesos(subtotal * 0.16) },
            { label: 'Total', value: pesos(subtotal * 1.16) },
          ]
        },
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: firma
 * grupo: Forms
 * titulo: On-screen signature
 * desc: It is signed with a finger, the mouse or a pen; with a keyboard, “Type my name” draws it in handwriting. The value is a PNG.
 * import: import { form } from 'nexus-dialogs/forms'
 */
export async function firma() {
  const r = await form({
    title: 'I received my severance',
    fields: [{ name: 'signature', label: 'Employee signature', type: 'signature', required: true }],
  })
  return { confirmed: r.confirmed, signature: r.value ? `${String(r.value.signature).slice(0, 40)}…` : null }
}

/* @ejemplo
 * id: asistente
 * grupo: Wizards
 * titulo: Wizard with conditional steps and review
 * desc: “Tax data” only appears if the type is company. The last step summarizes everything with “Edit” per section.
 * import: import { wizard } from 'nexus-dialogs/forms'
 */
export async function asistente() {
  const r = await wizard({
    title: 'New supplier',
    review: true,
    submitText: 'Register',
    steps: [
      {
        title: 'General data',
        fields: [
          { name: 'name', label: 'Name or legal name', required: true },
          { name: 'kind', label: 'Type', type: 'segmented', options: ['person', 'company'], value: 'person' },
        ],
      },
      {
        title: 'Tax data',
        when: { field: 'kind', equals: 'company' },
        fields: [
          { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
          { name: 'regime', label: 'Tax regime', type: 'select', options: ['601 General', '603 Non-profit legal entities'] },
        ],
      },
      { title: 'Payment', fields: [{ name: 'clabe', label: 'CLABE', type: 'clabe', required: true }] },
    ],
  })
  return r
}

/* @ejemplo
 * id: json
 * grupo: Wizards
 * titulo: Form stored as JSON
 * desc: So that each company has its forms in your database. Functions go by name and you pass them in `resolvers`.
 * import: import { formFromJSON, type FormSchema } from 'nexus-dialogs/forms'
 */
export async function json() {
  const schema: FormSchema = {
    title: 'Leave request',
    columns: 2,
    fields: [
      { name: 'reason', label: 'Reason', type: 'select', required: true, options: ['Personal', 'Medical', 'Other'] },
      { name: 'other', label: 'Which?', required: true, visibleIf: { field: 'reason', equals: 'Other' } },
      { name: 'rfc', label: 'RFC', type: 'rfc', validate: 'rfcFree' },
    ],
  }
  const r = await formFromJSON(schema, {
    resolvers: { rfcFree: async (rfc: string) => (rfc === 'PEMJ900515AB3' ? 'Already registered' : null) },
  })
  return r
}

/* @ejemplo
 * id: plantilla-alta
 * grupo: HR and Mexico
 * titulo: Template: new employee
 * desc: A 4-step wizard with review, ready in JSON (the template text is in Spanish; being data, you can translate it). It uses functions by name (rfcLibre, curpLibre, buscarCP): here they are removed with `sinResolvers`; in your system you connect them to your API.
 * import: import { formFromJSON } from 'nexus-dialogs/forms'\nimport { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'
 */
export async function plantillaAlta() {
  const r = await formFromJSON(sinResolvers(plantillas.altaEmpleado))
  return r
}

/* @ejemplo
 * id: plantilla-permiso
 * grupo: HR and Mexico
 * titulo: Template: leave
 * desc: Nine HR templates: hiring, vacation, leave, sick leave, termination, expenses, evaluation, training and position change.
 * import: import { formFromJSON } from 'nexus-dialogs/forms'\nimport { plantillas } from 'nexus-dialogs/rrhh'
 */
export async function plantillaPermiso() {
  const r = await formFromJSON(plantillas.permiso, { values: { empleado: 'Ana Torres' } })
  return r
}

/* @ejemplo
 * id: validadores
 * grupo: HR and Mexico
 * titulo: RFC, CURP and CLABE validators
 * desc: No DOM: they also work in your API with Node. CURP and CLABE validate the check digit, not just the format.
 * import: import { isRFC, isCURP, isCLABE } from 'nexus-dialogs/mx'
 */
export function validadores() {
  return {
    rfc: isRFC('PEMJ900515AB3'),
    curp: isCURP('PELJ900515HJCRPN03'),
    goodClabe: isCLABE('002010077777777771'),
    badClabe: isCLABE('002010077777777772'),
  }
}

/* @ejemplo
 * id: habiles
 * grupo: HR and Mexico
 * titulo: Business days and Mexican holidays
 * desc: Statutory holidays come from article 74 of the LFT (with movable Mondays). They work on the server to compute deadlines.
 * import: import { businessDays, mexicanHolidays } from 'nexus-dialogs/mx'
 */
export function habiles() {
  return {
    holidays2026: mexicanHolidays(2026),
    businessDaysDec14to18: businessDays('2026-12-14', '2026-12-18'),
    businessDaysAllDec: businessDays('2026-12-01', '2026-12-31'),
  }
}

/* @ejemplo
 * id: importar
 * grupo: Data
 * titulo: Import CSV or Excel
 * desc: Three steps: choose the file, map columns (they map themselves by name) and review errors per row. “Download template” downloads a CSV with the headers to try.
 * import: import { importData } from 'nexus-dialogs/import'
 */
export async function importar() {
  const r = await importData({
    title: 'Import employees',
    columns: [
      { name: 'number', label: 'Employee number', required: true, unique: true },
      { name: 'name', label: 'Full name', required: true, aliases: ['employee'] },
      { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
      { name: 'hired', label: 'Hire date', type: 'date' },
      { name: 'salary', label: 'Daily salary', type: 'number' },
    ],
    onImport: () => new Promise((ok) => setTimeout(ok, 800)),
  })
  return r
}

/* @ejemplo
 * id: tabla
 * grupo: Data
 * titulo: Choose rows from a table
 * desc: Search without accents, pages and a selection that is kept when searching. With `onExport` “Export selected” appears.
 * import: import { pickRows } from 'nexus-dialogs/table'
 */
export async function tabla() {
  const employees = Array.from({ length: 37 }, (_, i) => ({
    number: 1000 + i,
    name: ['Ana Torres', 'Diego Ramírez', 'Laura Méndez', 'Mateo Cruz', 'Sofía Núñez'][i % 5] + ` ${i + 1}`,
    area: ['Warehouse', 'Logistics', 'Sales'][i % 3],
    terminated: i === 3,
  }))
  const r = await pickRows({
    title: 'Add participants',
    rows: employees,
    rowKey: 'number',
    columns: [
      { key: 'number', label: 'No.' },
      { key: 'name', label: 'Name' },
      { key: 'area', label: 'Area' },
    ],
    isDisabled: (e) => e.terminated,
    max: 30,
  })
  return r.confirmed ? { chosen: (r.value ?? []).length } : r
}

/* @ejemplo
 * id: pestanas
 * grupo: Data
 * titulo: Detail with tabs
 * desc: A candidate’s record in “General data” and “Appointment and interview”. It is as tall as the tallest tab, so it doesn’t jump; the tab list stays fixed when scrolling. Arrows, Home and End switch tabs.
 * import: import { tabsDialog } from 'nexus-dialogs/tabs'
 */
export async function pestanas() {
  const row = (label: string, value: string) => {
    const d = document.createElement('div')
    d.style.cssText = 'padding:10px 0;border-bottom:1px solid rgba(127,127,127,.25)'
    const k = document.createElement('small')
    k.style.cssText = 'display:block;font-size:12px;opacity:.65;text-transform:uppercase;letter-spacing:.03em'
    k.textContent = label
    d.append(k, value)
    return d
  }
  const sheet = (...rows: HTMLElement[]) => {
    const c = document.createElement('div')
    c.append(...rows)
    return c
  }
  const r = await tabsDialog({
    title: 'Ana Lucía Torres Reyes',
    header: 'Scheduled · Administrative assistant, Downtown branch',
    variant: 'segmented',
    tabs: [
      {
        id: 'general',
        label: 'General data',
        content: () =>
          sheet(
            row('Ticket', '1024'),
            row('Branch', 'Downtown'),
            row('Vacancy', 'Administrative assistant'),
            row('Phone', '55 5555 0100'),
            row('Recruiting channel', 'WhatsApp'),
            row('Recruiter', 'Carlos Méndez'),
          ),
      },
      {
        id: 'cita',
        label: 'Appointment and interview',
        badge: 1,
        // Built when the tab is opened; it can be async (here, the query to your API).
        content: async () => {
          await new Promise((ok) => setTimeout(ok, 300))
          return sheet(row('Date', '11/13/2026'), row('Time', '9:00 AM'), row('Channel', 'Video call'))
        },
      },
    ],
  })
  return r
}

/* @ejemplo
 * id: seguimiento
 * grupo: Data
 * titulo: Step-by-step tracking
 * desc: A candidate’s progress: each step states its status with text (not only with color), on top goes “0 of 6 steps completed” with its progress bar and the current step is announced as the current step.
 * import: import { timelineDialog } from 'nexus-dialogs/timeline'
 */
export async function seguimiento() {
  const r = await timelineDialog({
    title: 'Torres Reyes Ana Lucía',
    steps: [
      { id: 'cita', title: 'Appointment', description: 'Appointment registered; attendance still to be confirmed.', date: '11/13/2026', status: 'current' },
      { id: 'enlace', title: 'Documents link', description: 'No documents link registered.', status: 'pending' },
      { id: 'docs', title: 'Documents', description: 'No file received yet.', status: 'pending' },
      { id: 'revision', title: 'Review', description: 'Waiting to receive documents.', status: 'pending' },
      { id: 'contrato', title: 'Hired', description: 'Pending approval and confirmation of the hire.', status: 'pending' },
      { id: 'ingreso', title: 'Start and training', description: 'No start or training data.', status: 'pending' },
    ],
    footnote: 'Statuses are shown based on the system’s records.',
  })
  return r
}

/* @ejemplo
 * id: pestanas-compactas
 * grupo: Data
 * titulo: Compact tabs
 * desc: `scale: 'sm' | 'md' | 'lg'` changes the size of the tabs without touching the dialog width (that is `size`). `fill` shares the full width; in a narrow container the list scrolls. Your own measures with the variables `--nd-tab-height`, `--nd-tab-font-size` and `--nd-tab-padding`.
 * import: import { tabsDialog } from 'nexus-dialogs/tabs'
 */
export async function pestanasCompactas() {
  // Icono: un nodo (aquí un SVG) o las clases de tu fuente de iconos, como 'bi bi-journal-text'.
  const icono = (trazo: string) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', trazo)
    svg.append(path)
    return svg
  }
  const r = await tabsDialog({
    title: 'Appointment result',
    size: 'sm', // dialog width: sm 400 px, md 480, lg 640, xl 860 or a number
    scale: 'sm', // size of the tabs
    fill: true,
    tabs: [
      { id: 'resultado', label: 'Result', icon: icono('M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'), content: 'Suitable, with remarks.' },
      { id: 'notas', label: 'Notes', icon: icono('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5'), badge: 2, content: 'Interview with a good profile; schedule still to be confirmed.' },
      { id: 'historial', label: 'History', icon: icono('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2'), content: 'No previous movements.' },
    ],
  })
  return r
}

/* @ejemplo
 * id: seguimiento-horizontal
 * grupo: Data
 * titulo: Tracking in a row
 * desc: `layout: 'horizontal'` puts the steps in a row with the status below (the dialog opens at `xl`). If the container is narrow, like a phone, it goes back to vertical by itself. `scale` changes the size of the markers and the text.
 * import: import { timelineDialog } from 'nexus-dialogs/timeline'
 */
export async function seguimientoHorizontal() {
  const r = await timelineDialog({
    title: 'Hiring tracking',
    layout: 'horizontal',
    scale: 'sm',
    steps: [
      { id: 'cita', title: 'Appointment', description: 'Attended.', date: '11/13/2026', status: 'done' },
      { id: 'docs', title: 'Documents', description: 'Received.', date: '11/14/2026', status: 'done' },
      { id: 'revision', title: 'Review', description: 'Under review.', status: 'current' },
      { id: 'alta', title: 'Hire', description: 'Pending approval.', status: 'pending' },
      { id: 'ingreso', title: 'Start', description: 'No date.', status: 'pending' },
    ],
  })
  return r
}

/* @ejemplo
 * id: exportar
 * grupo: Data
 * titulo: Export to Excel
 * desc: No dependencies: it builds the .xlsx with bold headers, a frozen row, filters and real dates and numbers. It downloads employees.xlsx.
 * import: import { exportData } from 'nexus-dialogs/import'
 */
export async function exportar() {
  const employees = [
    { number: 1001, name: 'Ana Torres', hired: '2022-03-14', salary: 612.5 },
    { number: 1002, name: 'Diego Ramírez', hired: '2021-08-02', salary: 700 },
    { number: 1003, name: 'Laura Méndez', hired: '2023-01-09', salary: 580.25 },
  ]
  await exportData(employees, {
    filename: 'employees',
    sheet: 'Employees',
    columns: [
      { key: 'number', label: 'Number' },
      { key: 'name', label: 'Full name' },
      { key: 'hired', label: 'Hire date', type: 'date' },
      { key: 'salary', label: 'Daily salary', type: 'number' },
    ],
  })
}

/* @ejemplo
 * id: toast
 * grupo: Toasts
 * titulo: Toast with an “Undo” action
 * desc: A queue of 3 visible, it pauses with the mouse or focus and is announced to the screen reader. Inside a modal it mounts inside it so that “Undo” can be pressed.
 * import: import { toast } from 'nexus-dialogs/toast'
 */
export function toastAccion() {
  toast('3 payslips archived', { action: { label: 'Undo', onClick: () => toast.success('Payslips restored') } })
}

/* @ejemplo
 * id: toast-promesa
 * grupo: Toasts
 * titulo: Toast that follows a promise
 * desc: It goes from “Calculating…” to success or error depending on what happens to the promise.
 * import: import { toast } from 'nexus-dialogs/toast'
 */
export async function toastPromesa() {
  const calculatePayroll = () => new Promise<number>((ok) => setTimeout(() => ok(148), 1800))
  await toast.promise(calculatePayroll(), {
    loading: 'Calculating payroll…',
    success: (n) => `${n} payslips ready`,
    error: (e) => String(e),
  })
}

/* @ejemplo
 * id: tema
 * grupo: Themes and language
 * titulo: Change the theme
 * desc: Every color and measure comes from --nd-* variables. There are ready-made themes for Bootstrap, Tailwind and Material. Here it applies only while the dialog is open.
 * import: import { configure } from 'nexus-dialogs'\nimport { themes } from 'nexus-dialogs/themes'
 */
export async function tema() {
  configure({ theme: themes.material })
  try {
    const r = await dialog.confirm({ title: 'With the Material theme', text: 'Colors and corners change across the whole app.' })
    return r
  } finally {
    configure({ theme: themes.light })
  }
}

/* @ejemplo
 * id: ingles
 * grupo: Themes and language
 * titulo: Another language
 * desc: The library’s own texts follow `configure({ lang })`. Here `lang: 'es'` shows the Spanish ones; when it closes, it goes back to English.
 * import: import { configure, dialog } from 'nexus-dialogs'
 */
export async function ingles() {
  configure({ lang: 'es' })
  try {
    const r = await dialog.confirm({ title: '¿Eliminar este registro?', danger: true, confirmText: 'Eliminar' })
    return r
  } finally {
    configure({ lang: 'en' })
  }
}

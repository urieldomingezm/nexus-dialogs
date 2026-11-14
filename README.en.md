<div align="center">

# nexus-dialogs

**Dialogs, forms, wizards and toasts for business systems.**
A library of transactional interfaces for business applications, with what a Mexican administrative system needs.
No dependencies · TypeScript · native `<dialog>` + Shadow DOM · accessibility targeting WCAG 2.2 AA (automated tests, not certified) · promise-based

Made by [**DevMedina**](https://devmedina.is-a.dev/) (Angel Uriel Domínguez Medina) · libraries branch of **Nexus** · MIT License

</div>

---

> This is the English version of the guide. The Spanish [README.md](README.md) is the reference; if something differs, it wins.

Alert libraries solve the “Are you sure?” and little else. An HR or accounting system needs much more: forms with validation and an error summary, multi-step wizards with a review, confirming a delete by typing the name, warning before losing changes, amounts in pesos, RFC… **nexus-dialogs** brings all of that on top of the browser’s native `<dialog>`:

- **A real top layer**: no `z-index` wars with Bootstrap, SweetAlert2 or your sticky menu. The background becomes inert and scrolling is locked.
- **Shadow DOM**: your page’s CSS doesn’t break it and its own doesn’t leak out.
- **Promises**: dialog operations (`dialog.alert`, `dialog.confirm`, `dialog.prompt` and `dialog.open`, and also forms, wizards, tables and recipes) always resolve with a `DialogResult` `{ confirmed, denied, value, reason }` and never reject: cancelling is not an error (`const r = await dialog.confirm(…)`). The helper functions have their own rejection conditions: `formFromJSON` (unknown type or missing resolver), `loading` (rethrows your task’s error) and `readSpreadsheet` (unreadable file). Details in [`docs/en/contratos.md`](docs/en/contratos.md).
- **Accessible** (WCAG 2.2 AA target; not a certification): correct initial focus (Cancel on destructive actions), Esc, focus return, errors tied to each field, toasts announced in live regions. Tested with axe in light, dark, Bootstrap, Tailwind and Material, with keyboard, reduced motion and reflow at 320 px. What is tested and what is missing (screen readers): [`docs/en/accesibilidad.md`](docs/en/accesibilidad.md).
- **Button standard**: one color per intent, the same across the whole app, and no icons in buttons.
- **Safe by default**: texts are always inserted as text; only the `html` string is interpreted and it can be filtered with `configure({ sanitize })`; by default (`strictHtml`) it is shown as text when there is no filter. It works with a strict CSP and Trusted Types, and the exported CSV does not allow formula injection. Details in [`docs/en/seguridad.md`](docs/en/seguridad.md).
- **In tiers**: a ~10 KB core, advanced UI, business and integrations, each in its own subpath; what you don’t import is not downloaded. What each part weighs and what is still unvalidated: [`docs/en/arquitectura.md`](docs/en/arquitectura.md).

> **Status**: version 1.0, with semantic versioning: only a major version breaks the public API ([what counts as breaking](https://urieldomingezm.github.io/nexus-dialogs/en/soporte#versions)). Tested in Chromium, Firefox and WebKit with unit, edge-case and accessibility (axe) tests. Validation with screen readers and in production applications is still pending (today there is one unnamed internal case and no public external one). Limitations, browsers, versioning and coverage: [`docs/en/limitaciones.md`](docs/en/limitaciones.md). What each function returns: [`docs/en/contratos.md`](docs/en/contratos.md). SweetAlert2 compatibility parameter by parameter: [`docs/en/swal-compat.md`](docs/en/swal-compat.md). Using it outside Nexus? [Tell us how it went](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=adopcion.yml): today that is what it needs most to back it up.

> **Just arrived?** Start with [Getting started](https://urieldomingezm.github.io/nexus-dialogs/en/primeros-pasos.html): five minutes to install and open your first dialog. This guide is the full reference; you don’t need to read it straight through.

## Index

1. [Install](#1-install)
2. [Quick start](#2-quick-start)
3. [Recipes: everyday things in one line](#3-recipes-everyday-things-in-one-line)
   - [Vue 3](#vue-3)
   - [React](#react)
   - [Angular](#angular)
   - [Coming from SweetAlert2?](#coming-from-sweetalert2)
4. [Button standard](#4-button-standard)
5. [Dialogs](#5-dialogs)
6. [Forms](#6-forms)
7. [Wizards](#7-wizards)
8. [Toasts](#8-toasts)
9. [Mexican validators](#9-mexican-validators)
10. [Themes and appearance](#10-themes-and-appearance)
11. [Language and texts](#11-language-and-texts)
12. [Quick reference](#12-quick-reference)
13. [Compatibility](#13-compatibility)
14. [Development](#14-development)

## 1. Install

```bash
npm i nexus-dialogs
```

| Import | For |
|---|---|
| `nexus-dialogs` | **Core**: `dialog.alert / confirm / prompt / open`, `configure` |
| `nexus-dialogs/forms` | `form()` and `wizard()` |
| `nexus-dialogs/toast` | `toast()` with a queue |
| `nexus-dialogs/tabs` | Accessible tabs, standalone or inside a dialog (`tabsDialog`) |
| `nexus-dialogs/timeline` | Step tracking with status, date and progress (`timelineDialog`) |
| `nexus-dialogs/themes` | Ready-made themes (Bootstrap, Tailwind, Material, dark) |
| `nexus-dialogs/patterns` | One-line recipes: delete, unsaved changes, session, approvals, bulk actions… |
| `nexus-dialogs/mx` | RFC, CURP, NSS, CLABE and postal code validators (also in Node) |
| `nexus-dialogs/vue` | Plugin and composables for Vue 3 |
| `nexus-dialogs/react` | Hooks and provider for React 18+ |
| `nexus-dialogs/angular` | Injection functions and signals for Angular 16+ |
| `nexus-dialogs/swal` | SweetAlert2 compatible: change the import and you’re done |

Without a bundler, with a `<script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/nexus-dialogs/dist/nexus-dialogs.all.iife.js"></script>
<script>
  const { dialog, form, toast, confirmDelete, isCURP } = NexusDialogs
</script>
```

## 2. Quick start

```ts
import { dialog } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'

// Confirm something dangerous
const r = await dialog.confirm({
  title: 'Delete the payroll period?',
  text: '148 payslips will be deleted. This cannot be undone.',
  danger: true,
  requireText: 'Period 21', // it must be typed to enable the button
  confirmText: 'Delete period',
})
if (r.confirmed) await deletePeriod()

// Ask for data
const created = await form<{ name: string; email: string }>({
  title: 'New customer',
  submitText: 'Create customer',
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
  preConfirm: (v) => api.customers.create(v), // shows “Processing…”; if it throws, it shows the error
})
if (created.confirmed) toast.success('Customer created')
```

## 3. Recipes: everyday things in one line

Not sure which dialog to use? Start here. Each recipe already comes with the right text, buttons, focus and accessibility; you only say what happens.

```ts
import { confirmDelete, unsavedChanges, sessionTimeout, watchIdle, approval, bulkAction, choose, loading } from 'nexus-dialogs/patterns'
```

| I need to… | Use | It returns |
|---|---|---|
| Confirm a delete | `confirmDelete` | `true` / `false` |
| Warn about unsaved changes | `unsavedChanges` | `'save'` / `'discard'` / `'keep'` |
| Warn that the session expires | `sessionTimeout` or `watchIdle` | `'extend'` / `'logout'` / `'expired'` |
| Approve or reject a request | `approval` | `{ decision, comment, reason }` |
| Apply something to many records | `bulkAction` | `{ done, failed, skipped }` |
| Choose one option among several | `choose` | the value or `null` |
| Block while something finishes | `loading` | whatever the task returns |

### Delete something

```ts
if (await confirmDelete({ what: 'Laura Méndez' })) await api.employees.remove(id)

// Something big and irreversible: lists what is lost and asks to type the name
await confirmDelete({
  what: 'the payroll period',
  name: 'Period 21',
  requireName: true,
  consequences: ['148 calculated payslips', '12 recorded incidents'],
  onConfirm: () => api.periods.remove(21), // shows “Processing…”; if it fails, it shows the error
})
```

### Leave with unsaved changes

```ts
const decision = await unsavedChanges({
  changes: [{ label: 'Daily salary', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => save(),
})
if (decision !== 'keep') router.back()
```

Focus starts on “Keep editing” (the most common case is having closed by accident) and Esc also returns to the form.

### Session about to expire

```ts
// One line when the app starts: it watches inactivity and warns 2 minutes before
const session = watchIdle({
  minutes: 30,
  onExtend: () => api.renewToken(),
  onLogout: () => (location.href = '/login'),
})
// session.reset() counts as activity; session.stop() stops watching (on logout).
```

Or the standalone notice: `await sessionTimeout({ seconds: 120 })`. It meets WCAG 2.2.1: visible countdown, focus on “Keep working”, unlimited extensions, and the screen reader is only told every minute.

### Approve or reject

```ts
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
  onApprove: (comment) => api.approve(id, comment),
  onReject: (comment, reason) => api.reject(id, comment, reason),
})
r.decision // 'approved' | 'rejected' | 'info' | 'cancelled'
```

Approve: optional comment. Reject: opens a second step with quick reasons and a mandatory explanation (minimum 10 characters, `minReasonLength`).

### Bulk actions

```ts
const r = await bulkAction({
  title: 'Move 12 employees to another area',
  items: selected,
  label: (e) => e.name,
  describe: (e) => `${e.area} → Logistics`,
  skip: (e) => e.area === 'Logistics' && 'already in Logistics',
  confirmText: (n) => `Move ${n} employees`,
  run: (e) => api.employees.move(e.id, 'logistics'), // if it throws, that row is left with an error and it continues with the rest
})
toast.success(`${r.done.length} moved`)
```

Preview, confirmation, progress bar, row-by-row result and “Retry” only the ones that failed. It cannot be closed while it runs.

### Choose between options

```ts
const format = await choose({
  title: 'Export payroll',
  options: [
    { value: 'xlsx', label: 'Excel', description: 'To review and filter' },
    { value: 'csv', label: 'CSV', description: 'To import into another system' },
  ],
})
if (format) exportPayroll(format)
```

### Wait for something that blocks

```ts
const folios = await loading('Stamping 148 payslips…', () => api.stamp())

// With progress
const wait = loading.open('Preparing…')
wait.update('Stamping 40 of 148…')
wait.close()
```

If the task fails, the wait closes and the error is rethrown so you can show it (for example with `dialog.error`). For what doesn’t block, prefer `toast.promise`.

Recipe texts: they follow the language of `configure({ lang })`; change the ones you want with `configurePatterns({ stay: 'Continue here' })`.

### Vue 3

```ts
// main.ts
import { NexusDialogs } from 'nexus-dialogs/vue'
app.use(NexusDialogs, { scheme: 'auto', toast: { position: 'top-right' } })
```

```vue
<script setup lang="ts">
import { useDialog, useToast } from 'nexus-dialogs/vue'
import { confirmDelete } from 'nexus-dialogs/patterns'

const dialog = useDialog()
const toast = useToast()
const remove = dialog.scoped(confirmDelete)

async function deleteEmployee(employee) {
  if (await remove({ what: employee.name })) toast.success('Deleted')
}
</script>
```

- Dialogs opened by the component **close themselves when it unmounts** (for example, if the user changes route with one open). `scoped()` does the same with recipes and forms: `dialog.scoped(form)`, `dialog.scoped(wizard)`.
- `dialog.isOpen` is reactive: does this component have an open dialog?
- Toasts are not closed on unmount: “Saved” stays visible on the next page.
- In the Options API: `this.$dialog.confirm(…)` and `this.$toast.success(…)`.
- `vue` is an optional dependency: it is only needed if you import `nexus-dialogs/vue`.

### React

```tsx
// main.tsx (optional: only if you want to configure language, theme or toasts)
import { NexusDialogsProvider } from 'nexus-dialogs/react'

root.render(
  <NexusDialogsProvider scheme="auto" toast={{ position: 'top-right' }}>
    <App />
  </NexusDialogsProvider>,
)
```

```tsx
import { useDialog, useForm, useToast } from 'nexus-dialogs/react'
import { confirmDelete } from 'nexus-dialogs/patterns'

function Employees() {
  const dialog = useDialog()
  const { form, scoped } = useForm()
  const toast = useToast()

  async function remove(employee: Employee) {
    if ((await dialog.confirm({ title: `Delete ${employee.name}?`, danger: true })).confirmed) toast.success('Deleted')
  }

  async function create() {
    const r = await form({ title: 'New employee', fields: [{ name: 'name', label: 'Name', required: true }] })
    if (r.confirmed) save(r.value)
  }
  // …
}
```

- It behaves the same as in Vue: dialogs opened by the component **close themselves when it unmounts** (for example, if the user changes route with one open). The promise ends with `reason: 'program'`, so don’t keep updating the component’s state if it no longer exists.
- `useDialog()` brings `alert`, `confirm`, `prompt`, `open`, `success`, `error`, `warning` and `info`. `useForm()` brings `form`, `wizard` and `formFromJSON`. Both include `isOpen` (the component re-renders when it changes), `closeAll()` and `scoped()` for the rest: `scoped(confirmDelete)`, `scoped(pickRows)`, `scoped(importData)`.
- The functions the hooks return are **stable between renders**: you can put them in the dependencies of `useEffect` or `useCallback`. Wrap with `scoped()` only once (outside the render or with `useMemo`).
- It works with `StrictMode`. Toasts are not closed on unmount: “Saved” stays visible on the next screen.
- `NexusDialogsProvider` renders nothing of its own and configures before the children’s effects run. If you don’t need to configure anything, it isn’t needed.
- With Next.js, use them in client components (`'use client'`). Importing the package doesn’t touch the DOM, so server rendering doesn’t fail.
- Each dialog belongs to the component that asked for it (nested ones too), even if two components have dialogs open at once: when one unmounts, only its own close. A dialog opened from outside the hooks belongs to nobody.
- `react` (18 or later) is an optional dependency: it is only needed if you import `nexus-dialogs/react`.

### Angular

Injection functions and signals, no decorators (Angular 16 or later; with or without zone.js):

```ts
// app.config.ts (optional: only for language, theme, scheme, direction or toasts)
import { provideNexusDialogs } from 'nexus-dialogs/angular'

export const appConfig: ApplicationConfig = {
  providers: [provideNexusDialogs({ scheme: 'auto', toast: { position: 'top-right' } })],
}
```

```ts
// In a component or service
import { Component } from '@angular/core'
import { injectDialog, injectForm, injectToast } from 'nexus-dialogs/angular'
import { confirmDelete } from 'nexus-dialogs/patterns'

@Component({
  selector: 'app-employees',
  template: `<button (click)="remove()" [disabled]="dialog.isOpen()">Delete</button>`,
})
export class Employees {
  dialog = injectDialog()
  forms = injectForm()
  toast = injectToast()
  private confirmRemoval = this.dialog.scoped(confirmDelete)

  async remove() {
    if (await this.confirmRemoval({ what: 'Laura Méndez' })) this.toast.success('Deleted')
  }
}
```

- `injectDialog()` brings `alert`, `confirm`, `prompt`, `open`, `success`, `error`, `warning` and `info`; `injectForm()` brings `form`, `wizard` and `formFromJSON`. Both include `isOpen` (a **signal**), `closeAll()` and `scoped()` for recipes and other functions that open dialogs.
- Call them in an injection context (class field, constructor or `inject`). Dialogs opened by the component close themselves when Angular destroys it, for example on a route change; toasts don’t.
- Each dialog belongs to the component that asked for it, even if several are open at once.
- `@angular/core` (16 or later) is an optional dependency and this module only exists as ESM, just like Angular. Importing the package doesn’t touch the DOM, so SSR doesn’t fail.

### Coming from SweetAlert2?

Change the import and your code keeps working (if you use `html`, add `configure({ strictHtml: false })` once, see below):

```ts
// before: import Swal from 'sweetalert2'
import Swal from 'nexus-dialogs/swal'

const r = await Swal.fire({
  title: 'Are you sure?',
  text: "You won't be able to revert this",
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Yes, delete it',
})
if (r.isConfirmed) remove()
```

Without a bundler, replace SweetAlert2’s `<script>` with this one (it defines `window.Swal`):

```html
<script src="https://cdn.jsdelivr.net/npm/nexus-dialogs/dist/nexus-dialogs.swal.iife.js"></script>
```

This build has no `import`, so global configuration is done with `Swal.configure(…)`, the same object as `configure()` from `nexus-dialogs`:

```html
<script>
  Swal.configure({ strictHtml: false }) // with your own HTML
  // or, with user data: Swal.configure({ sanitize: (h) => DOMPurify.sanitize(h) })
</script>
```

**What it covers**: `Swal.fire(title, html, icon)` and `Swal.fire({…})`, `Swal.mixin`, toasts (`toast: true`, `position`, `timer`), confirm/deny/cancel buttons, `input` (text, email, password, number, tel, url, date, week, range, file, textarea, select, radio, checkbox) with `inputOptions`, `inputValidator`, `validationMessage`, `inputAutoTrim`, `inputAutoFocus` and `returnInputValueOnDeny`, `preConfirm`, `preDeny`, `timer` (with `stopTimer`, `resumeTimer`, `toggleTimer`, `increaseTimer`, `getTimerLeft`), `imageUrl`, `iconHtml`, `progressSteps`, `reverseButtons`, `allowEnterKey`, `draggable`, `template`, `theme` (light, dark and auto), `target`, the buttons’ `aria-label`s, the `willOpen`, `didOpen`, `willClose`, `didClose` and `didDestroy` hooks, the `{ isConfirmed, isDenied, isDismissed, value, dismiss }` result, `Swal.DismissReason` and the methods `close(result)`, `update` (title, text, html, icon, image, steps, footer and buttons), `isVisible`, `showLoading`, `hideLoading`, `isLoading`, `getLoader` (with `loaderHtml`), `argsToParams`, `isValidParameter`, `isUpdatableParameter`, `bindClickHandler`, `showValidationMessage`, `resetValidationMessage`, `enableButtons`, `disableButtons`, `enableInput`, `disableInput`, the accessors (`getPopup`, `getContainer`, `getTitle`, `getHtmlContainer`, `getIcon`, `getImage`, `getInput`, `getActions`, `getFooter`, `getCloseButton`, `getTimerProgressBar`, `getProgressSteps`, `getFocusableElements`…) and `clickConfirm` and similar.

**What changes on purpose**:
- The [button standard](#4-button-standard) is applied. A confirmation whose button says “delete” or “remove” switches to **danger** by itself: a red button and focus on Cancel. Force it with `danger: true`.
- `confirmButtonColor`, `customClass` and similar are ignored; colors come from the theme.
- The button order is always Cancel, Deny, Confirm (the main action on the right).
- Default texts come out in the configured language (“OK”, “Cancel”).
- Toasts use the `nexus-dialogs/toast` queue; the position is a single one for all of them.
- `footer` is shown as plain text (no tags). `html` also comes out as text by default (`strictHtml`, since 0.5.0): with your own content use `configure({ strictHtml: false })` (in the no-bundler build, `Swal.configure(…)`); with outside content, `configure({ sanitize })`.
- The content lives inside the Shadow DOM: instead of `document.getElementById('x')` use `Swal.getHtmlContainer().querySelector('#x')`. The “popup” the hooks receive and `getPopup()` returns is the panel, so `popup.querySelector(…)` works.
- `theme` understands `light`, `dark` and `auto`; `target` mounts the dialog in that element but it is still modal; `reverseButtons: true` puts Confirm first; `template` does not accept `<swal-function-param>`.
- No equivalent: `Swal.version`, `topLayer`, `showClass`/`hideClass` and `animation` (motion comes from the theme and respects “reduce motion”).

When you have time, move to the native API (`dialog.confirm`, recipes): it is shorter and has more precise types. The site has a [migration guide](https://urieldomingezm.github.io/nexus-dialogs/en/migracion.html) with before-and-after examples you can run, equivalences and a checklist.

## 4. Button standard

Each button says **the action** (“Create customer”, not “OK”) and its color says **what kind of action it is**. Buttons carry no icons.

| Variant | Looks like | For | Examples |
|---|---|---|---|
| `primary` | Solid blue | Confirm, approve, save, move forward | Approve · Create customer · Next |
| `cancel` | Red outline | Leave without doing anything or abandon what was entered | Cancel · Discard changes · Leave without saving |
| `danger` | Solid red | The final action of something that deletes or rejects | Delete period · Reject request |
| `secondary` | Gray outline | Neutral actions | Back · Save draft · Keep editing |

Rules the library applies by itself:

- A single blue button per dialog, on the right; Cancel to its left.
- With `danger: true`, the main button turns red and **Cancel turns gray and receives focus**: that way there are not two reds and an accidental Enter deletes nothing.
- Enter in a single-line field presses the main button.

If you define your buttons, the variant comes from the `role` (`confirm` → primary, `cancel`/`deny` → cancel, `custom` → secondary) or you set it with `variant`.

## 5. Dialogs

### Alerts

```ts
await dialog.alert('Saved')                                         // title
await dialog.alert('Saved', 'Laura now appears in the payroll')     // title and text
await dialog.success({ title: 'Employee saved', timer: 3000 })      // with icon and closes by itself
await dialog.error('Could not stamp', 'The tax authority did not respond.')
```

Shortcuts with an icon: `success`, `error`, `warning`, `info`. The `timer` pauses with the mouse or focus over it.

### Confirm

```ts
const r = await dialog.confirm({ title: 'Send for approval?', confirmText: 'Send' })
r.confirmed // true / false
r.reason    // 'confirm' | 'cancel' | 'escape' | 'backdrop' | 'close' | 'timer' | 'program' | button id
```

`preConfirm` runs on confirm. It can be async: meanwhile the button says “Processing…” and nothing can be closed. If it returns `false` the dialog stays open; if it throws an `Error`, its message appears inside; if it returns something, that arrives in `r.value`.

```ts
const r = await dialog.confirm({
  title: 'Stamp 148 payslips',
  confirmText: 'Stamp',
  preConfirm: async () => {
    const res = await api.stamp()
    if (!res.ok) throw new Error(res.message)
    return res.folios
  },
})
```

### Ask for a value (prompt)

```ts
const r = await dialog.prompt({
  title: 'New area',
  label: 'Area name',
  input: 'text', // text, email, password, number, tel, url, textarea, select
  validate: (v) => (v.length < 3 ? 'Type at least 3 characters.' : null),
  confirmText: 'Create area',
})
if (r.confirmed) r.value // string
```

### Free dialog: your buttons, your content

```ts
const r = await dialog.open({
  title: 'You have 2 unsaved changes',
  buttons: [
    { id: 'discard', role: 'deny', text: 'Discard changes' },
    { id: 'keep', role: 'cancel', text: 'Keep editing', variant: 'secondary' },
    { id: 'save', role: 'confirm', text: 'Save and leave' },
  ],
  initialFocus: 'cancel',
})
if (r.denied) discard()
```

Your own content with `render(ctx)` (returns a node) or `html` (a string comes out as text unless you configure `sanitize` or `strictHtml: false`, and then only with your own HTML; **never with user data**: `title` and `text` are always plain, safe text).

### Side panels and bottom sheet

```ts
dialog.open({ title: 'Filters', placement: 'right', render: drawFilters, confirmText: 'See results' })
dialog.open({ title: 'Share', placement: 'bottom' })
```

`placement`: `center` (default), `right`, `left`, `bottom`. On narrow screens centered dialogs become a bottom sheet (turn it off with `configure({ sheetOnMobile: false })`). Sizes: `size: 'sm' | 'md' | 'lg' | 'xl' | <px>`.

### Closing and other options

| Option | What it does |
|---|---|
| `dismissible` | `false` prevents closing with Esc and outside click. Or in detail: `{ escape, backdrop, closeButton }` |
| `beforeClose(reason)` | Return `false` to prevent closing (for example, to ask first) |
| `initialFocus` | `'confirm'`, `'cancel'`, `'first-field'` or a selector |
| `onOpen(ctx)` / `onClose(result)` | Hooks |
| `dialog.close()` / `dialog.closeAll()` | Close from code (`reason: 'program'`) |

`ctx` allows `setLoading`, `setError`, `setTitle`, `setButtons`, `button(id)` and `close()`.

## 6. Forms

```ts
import { form } from 'nexus-dialogs/forms'

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
  validate: (v) => (v.amount > 50000 ? { amount: 'More than $50,000 requires a purchase order.' } : undefined),
})
```

**Responsive columns.** `columns: 2` splits the fields into two columns and, on a phone, **stays at two** as long as fields of about 9 rem fit (otherwise it drops to one). `columns: 'auto'` uses as many columns as fit (3 on desktop, 2 on a phone) and long fields (`textarea`, `radio`, `segmented`, `items`, `address`, `signature`, `file`, `daterange`, `otp`) take the whole row; with `span: 2` you force any other field to a full row, and with `span: 1` the opposite. The minimum width per column on desktop is adjusted with `--nd-col-min` (11 rem); on a phone it never goes below 8.75 rem and never exceeds two columns.

**Buttons and header on a phone.** The footer buttons go in a single row (up to 3 per row, in equal columns; if they don’t fit, they wrap). When the dialog has an icon, the `html` content uses the full width instead of being indented under the title.

**Field types**: `text`, `email`, `tel`, `url`, `password`, `number`, `date`, `time`, `textarea`, `select`, `radio`, `segmented`, `checkbox`, `switch`, the [advanced ones](#advanced-fields) `combobox`, `file`, `daterange`, `otp` and `items`, and for Mexico:

- `money`: shows `$ 12,500.50 MXN` on leaving the field, a numeric keyboard on mobile, returns `number`. Change `currency` and `locale` if needed.
- `rfc`, `curp`, `nss`, `clabe`, `postal`: see [Mexican validators](#9-mexican-validators).

### Advanced fields

Five more types, with keyboard, screen reader and validation included:

| Type | For | Returns |
|---|---|---|
| `combobox` | Search and choose (customers, employees), one or several | `string` or `string[]` |
| `file` | Upload files, with drag and drop | `File`, `File[]` or whatever `upload` returns |
| `daterange` | Periods with shortcuts (“Current fortnight”) | `{ from, to }` in `YYYY-MM-DD` |
| `otp` | Verification code | `string` |
| `items` | Repeatable rows with totals (line items, concepts) | array of rows |

**Search and select**

```ts
{ name: 'customer', label: 'Customer', type: 'combobox', required: true,
  search: (q) => api.customers.search(q),     // or `options: [...]` for a fixed list
  creatable: (text) => api.customers.create(text) }, // offers “Create “text”” if it doesn't exist

{ name: 'team', label: 'Team', type: 'combobox', multiple: true, maxItems: 3,
  options: [{ value: 'ana', label: 'Ana Torres', description: 'Warehouse', group: 'Warehouse' }, …] }
```

It searches without accents (“nomina” finds “Nómina”). Arrows to move, Enter chooses and Esc closes only the list. In multiple mode, each chosen item is a chip with its “Remove” button and Backspace deletes the last. With `search`, it waits 250 ms for you to stop typing.

**Upload files**

```ts
{ name: 'id', label: 'ID card', type: 'file', multiple: true, maxFiles: 2,
  accept: '.pdf,image/*', maxSize: 5 * 1024 * 1024,
  upload: (file, progress) => api.upload(file, progress) } // optional: uploads when added
```

There is always a “Choose files” button in addition to dragging. Files of another type or too heavy are not added and you are told why. With `upload`, each file shows its progress and, if it fails, “Retry”. The form is not submitted while something is uploading.

**Date range**

```ts
{ name: 'period', label: 'Period', type: 'daterange', required: true, maxDays: 31 }
```

Shortcuts: Today, This week, Current fortnight, This month, Last month and Last 30 days. Change them with `presets: [{ label: 'Two months', range: () => [start, end] }]` or remove them with `presets: false`. It also supports `min` and `max` in `YYYY-MM-DD`.

**Several periods (ranges and single days)**

```ts
{ name: 'dates', label: 'Dates', type: 'daterange', periods: true, required: true, maxDays: 10 }
```

An always-visible calendar and, below it, the list of periods: tap the first and last day for a range (“17 to 19 Nov · 3 days”) or use “Add another period” for a single day (“25 Nov · 1 day”). Each period is removed with the ×. No shortcuts and no text boxes. The value is `{ from, to }[]` (a single day has `from` equal to `to`) or `null`; periods are sorted, cannot overlap, and `maxDays` counts the total (business days if you use `businessDays`). It supports `min`, `max`, `businessDays` and `holidays`.

**Verification code**

```ts
{ name: 'code', label: 'Code', type: 'otp', length: 6 }
```

It is a single field with visual boxes: pasting works, the phone suggests the SMS code (`one-time-code`) and on completing it presses the main button (`autoSubmit: false` to avoid it).

**Repeatable rows with totals**

```ts
{ name: 'lines', label: 'Line items', type: 'items', required: true, maxRows: 20, addText: 'Add line',
  fields: [
    { name: 'concept', label: 'Description', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', min: 1, value: 1 },
    { name: 'price', label: 'Unit price', type: 'money', required: true },
  ],
  totals: (rows) => {
    const subtotal = rows.reduce((s, r) => s + (r.quantity ?? 0) * (r.price ?? 0), 0)
    return [
      { label: 'Subtotal', value: pesos(subtotal) },
      { label: 'VAT', value: pesos(subtotal * 0.16) },
      { label: 'Total', value: pesos(subtotal * 1.16) },
    ]
  } }
```

Each row validates its fields (errors are marked on the row) and has its “Remove row N” button. Totals are recalculated as you type. On mobile, each row stacks as a card.

#### `phone`: phone with country code

```ts
{ name: 'phone', label: 'Phone', type: 'phone', required: true }
```

Country code to choose (+52 by default; change the list with `countries` and the initial one with `dialCode`). It formats as you type (`81 1234 5678`, `222 123 4567`), validates each country’s number of digits and delivers the full number: `'+528112345678'`. It accepts that same format as the initial value. `formatPhone(digits, dialCode)` is exported.

#### `address`: address by postal code

```ts
{ name: 'address', label: 'Address', type: 'address', required: true,
  lookupPostalCode: async (cp) => {
    const r = await fetch(`/api/cp/${cp}`) // your API or SEPOMEX
    return r.ok ? r.json() : null // { state, municipality, neighborhoods: [...] }
  } }
```

On typing the 5 digits it fills state and municipality; with several neighborhoods it offers the list, with one it sets it directly. If the postal code doesn’t exist, it warns and lets you type everything by hand. The library ships no catalog (it would weigh megabytes): you decide where it comes from. Value: `{ postalCode, state, municipality, neighborhood, street }`; if required, it says which part is missing. To not depend on an API, use the [SEPOMEX catalog](#sepomex-catalog-without-an-api).

#### Calendar in `daterange`

```ts
{ name: 'vacation', label: 'Dates', type: 'daterange', calendar: true, maxDays: 20 }
```

With `calendar: true` the range is chosen in an on-screen calendar (two clicks, in any order) and dates are typed as `dd/mm/yyyy`, without the browser’s picker. Full keyboard: arrows (day and week), Page Up / Page Down (month), Home / End (week), Enter to choose. It respects `min`, `max` and the shortcuts. Week from Monday to Sunday.

**Business days.** With `businessDays: true` it shows “8 business days” under the dates, the calendar strikes out weekends and marks holidays in orange, and `maxDays` counts only business days (holidays don’t use up vacation). Statutory holidays come from article 74 of the Federal Labor Law (`mexicanHolidays(year)` in `nexus-dialogs/mx`); the company’s go in `holidays: ['2026-12-24']`. With `businessDays: 'custom'` only yours count.

```ts
{ name: 'vacation', label: 'Days', type: 'daterange', calendar: true, businessDays: true, holidays: ['2026-12-24', '2026-12-31'], maxDays: 12 }
```

`nexus-dialogs/mx` also has `businessDays(from, to)`, `isBusinessDay(date)` and `addBusinessDays(date, n)` (deadlines), with no DOM: they work on the server.

**A single date.** `{ type: 'date', calendar: true }` types `dd/mm/yyyy` and opens the calendar with the button, with ↓ or with Alt+Enter. It opens in the browser’s top layer, so the dialog doesn’t clip it.

#### `signature`: on-screen signature

```ts
{ name: 'signature', label: 'Employee signature', type: 'signature', required: true }
```

It is signed with a finger, the mouse or a pen. For someone using a keyboard or who can’t draw, “Type my name” draws it in handwriting. The value is the PNG image (`data:image/png;base64,…`), ready to store or put in a PDF.

**Validation**: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` (+ `patternMessage`) and `validate(value, values)` per field, which can be async (“does this RFC already exist?”). On submitting with errors, a **summary with links** to each field appears on top, each field gets `aria-invalid` and its message tied with `aria-describedby`.

**Conditional fields**: `visible: (values) => boolean`, or declarative with `visibleIf: { field: 'kind', equals: 'company' }` (also `notEquals`, `in: [...]`, `filled`, and `all`, `any`, `not` to combine). Hidden ones are neither validated nor submitted.

**Automatic draft**: with `draftKey: 'employee-hire'` what is typed is saved in the browser (`localStorage`, without passwords or files). If the tab is closed or reloaded, on reopening it asks “Continue where you left off?”. It is cleared on submit or on choosing “Discard” / “Start over”. With `draftPrompt: false` it restores without asking.

**Unsaved changes**: if the user entered something and closes (Cancel, Esc or ×), it asks “Discard the changes?” with focus on “Keep editing”. Turn it off with `confirmDiscard: false`. Clicking outside does not close forms.

Values arrive with their type: `number`/`money` → `number | null`, `checkbox`/`switch` → `boolean`, everything else → `string` (trimmed).

## 7. Wizards

```ts
import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'New employee',
  review: true, // final “Review” step with “Edit” per section
  submitText: 'Hire',
  steps: [
    { title: 'Personal data', fields: [{ name: 'name', label: 'Full name', required: true }] },
    { title: 'Position', fields: [{ name: 'salary', label: 'Daily salary', type: 'money', required: true }] },
  ],
})
```

**Conditional steps**: `when` on the step (a function or the same declarative condition as `visibleIf`) shows it only if it applies given what was answered before. The bar, the “Step 1 of N”, the review and the submitted values adjust by themselves.

```ts
{ title: 'Tax data', when: { field: 'kind', equals: 'company' }, fields: [/* … */] }
```

The wizard also accepts `draftKey`: besides the values, it remembers which step you were on.

Each step validates before moving on, “Back” never loses data, Enter advances, the step title receives focus so the screen reader announces it (“Step 2 of 3”) and on mobile the indicator shows only the current step. `onStepChange(i, values)` reports each change.

### Forms from JSON

So that each company can have its own forms (stored in your database), describe them in JSON and open them with `formFromJSON`. Functions go by name and you pass them in `resolvers`; with `steps` a wizard opens.

```ts
import { formFromJSON } from 'nexus-dialogs/forms'

const schema = {
  title: 'Leave request',
  columns: 2,
  fields: [
    { name: 'reason', label: 'Reason', type: 'select', required: true, options: ['Personal', 'Medical', 'Other'] },
    { name: 'other', label: 'Which?', required: true, visibleIf: { field: 'reason', equals: 'Other' } },
    { name: 'rfc', label: 'RFC', type: 'rfc', validate: 'rfcFree' },
  ],
}
const r = await formFromJSON(schema, { resolvers: { rfcFree: async (rfc) => ((await exists(rfc)) ? 'Already registered' : null) } })
```

An unknown type or a missing resolver rejects the promise with a clear message (without opening anything). `fieldsFromJSON()` converts only the fields, in case you want to assemble them yourself.

### Import CSV or Excel

```ts
import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Import employees',
  columns: [
    { name: 'number', label: 'Employee number', required: true, unique: true },
    { name: 'name', label: 'Full name', required: true, aliases: ['employee'] },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
    { name: 'hired', label: 'Hire date', type: 'date' },
    { name: 'salary', label: 'Daily salary', type: 'number' },
  ],
  onImport: (rows) => api.post('/employees/batch', rows), // with “Importing…”; if it fails, the error is shown
})
```

Three steps: choose the file (CSV or `.xlsx`, no dependencies), map the columns (they map themselves by name, without accents and with abbreviations like “No. employee”) and review: how many rows are fine and which have errors (“Row 5 · RFC is not valid”). Only the valid ones are imported. Types: `text`, `number` (accepts `$1,234.50` and `1.234,50`), `date` (`dd/mm/yyyy`, ISO or an Excel date), `boolean` (yes/no, 1/0, x), `email`, `rfc`, `curp`, `nss`, `clabe`, `postal`. “Download template” downloads a CSV with the headers.

The pieces work separately: `readSpreadsheet(file)`, `parseCSV(text)`, `guessMapping()`, `processRows()`, `convert()`.

### Choose from a table

```ts
import { pickRows } from 'nexus-dialogs/table'

const r = await pickRows({
  title: 'Add participants',
  rows: employees, // or load: ({ search, page, pageSize }) => api.get(...) → { rows, total }
  rowKey: 'number',
  columns: [
    { key: 'number', label: 'No.' },
    { key: 'name', label: 'Name' },
    { key: 'salary', label: 'Salary', align: 'right', format: (v) => pesos(v) },
  ],
  isDisabled: (e) => e.terminated, // can't be chosen
  max: 30,
})
if (r.confirmed) add(r.value)
```

Search without accents, pages, “select all on this page”, click anywhere on the row, and the selection is kept when searching or changing page. `multiple: false` to choose only one. On mobile the table scrolls sideways.

With `onExport` “Export selected: Excel · CSV” appears (or “Export all” if there is no selection): `onExport: (rows, format) => exportData(rows, { columns, format, filename: 'employees' })`.

### Tabs

```ts
import { tabsDialog } from 'nexus-dialogs/tabs'

await tabsDialog({
  title: 'Ana Torres Reyes',
  header: 'Scheduled · Administrative assistant', // text or a node, above the tabs
  tabs: [
    { id: 'general', label: 'General data', content: () => generalCard(candidate) },
    { id: 'interview', label: 'Appointment and interview', badge: 1, content: async () => appointmentCard(await api.appointment(id)) },
  ],
})
```

A candidate’s detail, an employee’s record, a survey with several sections. Each tab’s content is **text, a node or a function** (called the first time the tab is opened and it can be `async`: meanwhile “Loading…” appears, and if it fails, a notice). For an HTML string use `html: '…'`, which goes through `sanitize` / `strictHtml` like the `html` of any dialog.

- **Accessible**: linked `tablist` / `tab` / `tabpanel`; arrows (reversed in RTL), Home and End; disabled tabs are skipped; focus starts on the active one.
- **Stable height** (`height: 'stable'`, the default): the dialog is as tall as the tallest tab and doesn’t jump when switching. With `height: 'auto'` it is as tall as the active one. If the content is taller than the screen, the tab list stays fixed on top and only the content scrolls.
- **Styles**: `variant: 'soft'` (default: tabs share the full width, the active one on a soft background), `'underline'` (a line under the active one) or `'segmented'`. `badge` shows a number or a short text next to the label and `icon` puts an icon before it (a node such as an SVG, or the classes of your icon font).
- By default a single “Close” button; pass `buttons` for something else (for example, Save and Cancel).

To put them inside another dialog (`dialog.open` with `render`, a `form`…): `const t = tabs({ tabs: [...] })` returns `{ el, current, select(id), panel(id), setBadge(id, n), setDisabled(id, bool) }`; insert `t.el` and add `styles: TABS_CSS` to the dialog.

### Sizes and responsive design

There are two things you can configure, and they are not to be confused: the **dialog width** (`size`) and the **content size** (`scale`).

| Option | Values | What changes |
|---|---|---|
| `size` (dialog) | `sm` 400 px, `md` 480, `lg` 640, `xl` 860 or a number | The width. On mobile the centered dialog becomes a bottom sheet |
| `scale` in `tabs` | `sm` 34 px, `md` 42 (default), `lg` 50 | Tab height and font |
| `scale` in `timeline` | `sm` 24 px marker, `md` 32 (default), `lg` 40 | Marker and font of the steps |
| `fill` in `tabs` | `true` / `false` | Tabs share the full width (by default in `soft` and `segmented`; with many tabs they keep a minimum width and the list scrolls) |
| `layout` in `timeline` | `vertical` (default) / `horizontal` | Steps in a column or in a row (opens in `xl`) |

They adapt to the **container’s width**, not the screen’s: they work the same in a dialog, a side panel or a bottom sheet. Tabs compact and the list scrolls if they don’t fit; the `horizontal` tracking goes back to vertical by itself when the container is under 36 rem.

For your own measures, CSS variables with `theme` (or in your stylesheet): `--nd-tab-height`, `--nd-tab-font-size`, `--nd-tab-padding`, `--nd-tl-marker`, `--nd-tl-title` and `--nd-tl-text`.

```ts
await tabsDialog({ title: 'Result', size: 'sm', scale: 'sm', fill: true, tabs, theme: { '--nd-tab-height': '38px' } })
await timelineDialog({ title: 'Hiring', layout: 'horizontal', scale: 'lg', steps })
```

### Step-by-step tracking

```ts
import { timelineDialog } from 'nexus-dialogs/timeline'

await timelineDialog({
  title: 'Torres Reyes Ana Lucía',
  steps: [
    { id: 'appointment', title: 'Appointment', description: 'Appointment registered; attendance still to be confirmed.', date: '13/11/2026', status: 'current' },
    { id: 'docs', title: 'Documents', description: 'No file received yet.', status: 'pending' },
  ],
  footnote: 'Statuses come from the system’s records.',
})
```

The progress of a candidate, a procedure or an order. Statuses: `done`, `current`, `pending`, `error` and `skipped`. Each step **states its status with text** (“Completed”, “In progress”, “Pending”…), not only with color; `statusLabel` sets another text (“Waiting for the candidate”). On top goes “2 of 6 steps completed · 33 %” with a progress bar (`progressbar`); `skipped` steps don’t count. The current step is announced as the current step (`aria-current="step"`). `date` accepts free text or a `Date` (formatted according to the language); with no date it shows “No data” (`emptyDate` changes or hides it). `summary: false` removes the summary; a text replaces it.

With the dialog open, `onOpen: (ctx, t) => …` hands you the control: `t.setStatus('docs', 'done', { date: new Date() })` updates the step, the summary and the bar; `t.progress()` returns `{ done, total, percent }`. To put it inside another dialog: `timeline({ steps })` and `styles: TIMELINE_CSS`.

### Export to Excel or CSV

```ts
import { exportData } from 'nexus-dialogs/import'

await exportData(employees, {
  filename: 'employees',
  sheet: 'Employees',
  columns: [
    { key: 'number', label: 'Number' },
    { key: 'name', label: 'Full name' },
    { key: 'hired', label: 'Hire date', type: 'date' }, // a real date in Excel
    { key: 'salary', label: 'Daily salary', type: 'number' },
  ],
}) // downloads employees.xlsx; with format: 'csv', employees.csv
```

No dependencies: the .xlsx is assembled right here, with bold headers, a frozen row, filters, widths based on the content and real dates and numbers. `toXLSX()` and `toCSV()` return the file without downloading it (to upload it or send it by email).

### HR templates

Nine ready-made forms, in plain JSON (stored in your database and adjusted per company): `altaEmpleado` (a 4-step wizard with review), `vacaciones` (calendar with business days), `permiso`, `incapacidad` (IMSS), `baja` (reason, settlement, handover and signature), `gastos` (line items and receipts), `evaluacion` (competencies from 1 to 5, result and commitments), `capacitacion` (course, attendees and DC-3 certificate) and `cambioPuesto` (promotion, transfer or pay change with approval).

```ts
import { formFromJSON } from 'nexus-dialogs/forms'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'

await formFromJSON(plantillas.vacaciones, { values: { empleado: 'Ana Torres' } })
// Hiring uses functions by name (rfcLibre, curpLibre, buscarCP): pass them in resolvers, or remove them:
await formFromJSON(sinResolvers(plantillas.altaEmpleado))
```

### SEPOMEX catalog without an API

To fill in the address by postal code without depending on an external service, serve the official catalog from your site:

1. Download the TXT from [correosdemexico.gob.mx](https://www.correosdemexico.gob.mx) (“Descarga tu código postal”).
2. Convert it into small files by prefix: `npx nexus-dialogs-sepomex CPdescarga.txt public/cp`
3. Use it:

```ts
import { sepomexLookup } from 'nexus-dialogs/sepomex'
const lookupPostalCode = sepomexLookup({ baseUrl: '/cp/' })
// { name: 'address', label: 'Address', type: 'address', lookupPostalCode }
```

Each lookup downloads only its prefix’s file (a few KB) and keeps it in memory. To update, repeat steps 1 and 2.

## 8. Toasts

```ts
import { toast } from 'nexus-dialogs/toast'

toast.success('Employee saved')
toast.error('Could not stamp', { title: 'Tax authority error' })
toast('3 payslips archived', { action: { label: 'Undo', onClick: undo } })

await toast.promise(calculatePayroll(), {
  loading: 'Calculating payroll…',
  success: (n) => `${n} payslips ready`,
  error: (e) => e.message,
})

const id = toast.loading('Uploading…')
toast.update(id, { type: 'success', message: 'Uploaded' })
toast.dismiss(id)
toast.configure({ position: 'top-right', max: 3, duration: 4000 })
```

- **Queue**: at most 3 visible (configurable); the rest wait.
- **Duration**: 4 s; with an action 6 s; errors 7 s; `loading` until you update it. `duration: 0` = until they close it. They pause with the mouse, focus or a hidden tab.
- **Announced**: `polite` live region (errors `assertive`).
- **Inside modals**: with a modal dialog open (from this library or any `<dialog>`), the toast mounts inside it; otherwise it would be inert behind and “Undo” couldn’t be pressed. Without a modal, it uses the Popover API to stay above any `z-index`.
- On mobile they appear on top so as not to cover the bottom sheet’s buttons.

## 9. Mexican validators

In forms, use the field type and you’re done:

```ts
fields: [
  { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
  { name: 'curp', label: 'CURP', type: 'curp', required: true },
  { name: 'nss', label: 'NSS', type: 'nss' },
  { name: 'clabe', label: 'CLABE', type: 'clabe' },
  { name: 'cp', label: 'Postal code', type: 'postal' },
]
```

They go uppercase, bring up the numeric keyboard on mobile, limit the length and validate **the check digit** (CURP, NSS, CLABE), not just the format.

The same validators, without DOM, to use wherever you want (also in your API with Node):

```ts
import { isRFC, isCURP, isNSS, isCLABE, isPostalCode, normalize } from 'nexus-dialogs/mx'

isCLABE('002010077777777771') // true
isCURP('PELJ900515HJCRPN03')  // true
normalize(' pem840101ab3 ')   // 'PEM840101AB3'
```

| Function | Checks |
|---|---|
| `isRFC` | 12 (legal entity) or 13 (individual) characters with a valid date. It doesn’t compute the homoclave. |
| `isCURP` | 18 characters, date, sex, state and check digit |
| `isNSS` | 11 digits and check digit (Luhn) |
| `isCLABE` | 18 digits and control digit (weights 3, 7, 1) |
| `isPostalCode` | 5 digits, from 01000 to 99999 |

They validate the shape, not that the data exists before the tax authority, IMSS or a bank.

## 10. Themes and appearance

Every color and measure comes from `--nd-*` variables. Put them on `:root` (they are inherited inside the Shadow DOM) or with `configure`:

```ts
import { configure } from 'nexus-dialogs'
import { themes, fromBootstrap } from 'nexus-dialogs/themes'

configure({ theme: themes.bootstrap })    // Bootstrap 5 colors
configure({ theme: fromBootstrap() })     // or the --bs-* your page already has
configure({ scheme: 'auto' })             // light or dark depending on the system ('light' | 'dark' | 'auto')
toast.configure({ scheme: 'auto', theme: themes.bootstrap })
```

```css
:root {
  --nd-accent: #0f766e;        /* main button */
  --nd-danger: #b91c1c;        /* danger button */
  --nd-cancel-fg: #b91c1c;     /* Cancel text and border */
  --nd-cancel-border: #fca5a5;
  --nd-radius: 12px;           /* dialog corners */
  --nd-control-radius: 8px;    /* buttons and fields */
  --nd-font: 'Inter', system-ui, sans-serif;
}
```

Variables: `accent`, `accent-contrast`, `danger`, `danger-contrast`, `success`, `warning`, `info`, `bg`, `fg`, `muted`, `border`, `surface`, `line`, `cancel-fg`, `cancel-border`, `error`, `overlay`, `radius`, `control-radius`, `font`, `title-font`, `shadow`, `focus`.

Included themes: `light`, `dark`, `bootstrap`, `tailwind`, `tailwindDark`, `material`.

### Tailwind, Bootstrap and your page’s light and dark mode

`themes.tailwind` is the light palette and `themes.tailwindDark` its dark pair (slate and indigo). `followPageScheme` watches your page’s mode and switches between the two, also when the person uses a theme switch:

```ts
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { themes, followPageScheme } from 'nexus-dialogs/themes'

followPageScheme(
  ({ scheme, theme }) => {
    configure({ scheme, theme })
    toast.configure({ scheme, theme })
  },
  { light: themes.tailwind, dark: themes.tailwindDark },
)
```

What it understands as “dark”:

| Your page | Option |
|---|---|
| Tailwind with `darkMode: 'class'` (v3) or `@custom-variant dark` (v4): `<html class="dark">` | default (`strategy: 'class'`) |
| Unconfigured Tailwind, which follows the system mode | `strategy: 'media'` |
| Bootstrap 5.3 (`data-bs-theme="dark"`) or `data-theme="dark"` | default; with `light: themes.bootstrap` |
| Another class for dark mode | `darkClass: 'night-theme'` |

It returns a function that stops watching. Dialogs opened afterwards come out in the new mode; one already open keeps the one it had. Without this, `configure({ theme: themes.tailwind })` fixes light colors and they don’t change with the page’s mode. For a dialog’s own CSS: `styles: '.title { … }'` and `className`.

The CSS is applied with constructable stylesheets (`adoptedStyleSheets`), so it works with a strict Content-Security-Policy without `unsafe-inline`.

## 11. Language and texts

Spanish by default. English with `configure({ lang: 'en' })` (and `toast.configure({ lang: 'en' })`). Change individual texts:

```ts
configure({ labels: { cancel: 'Close', submit: 'Save changes' } })
```

Other languages are registered; what you don’t translate shows in English. Portuguese (Brazil) and French come ready in `nexus-dialogs/locales`:

```ts
import { registerLanguage, configure, pageLanguage } from 'nexus-dialogs'
import { pt } from 'nexus-dialogs/locales'

registerLanguage('pt', pt)
configure({ lang: 'pt' })            // or { lang: pageLanguage() } to follow <html lang>
```

Details, plugins (`use`) and your own field types (`registerField`): [Plugins and languages](https://urieldomingezm.github.io/nexus-dialogs/en/plugins.html).

### Right to left (RTL)

Dialogs and toasts follow your page’s direction: with `<html dir="rtl">` everything is mirrored (× button, button order, icons, switches, calendar with reversed arrows, tables and lists). It can also be set by hand:

```ts
configure({ dir: 'rtl' })              // 'ltr' | 'rtl' | 'auto' (default: the page's)
await dialog.alert({ title: 'مرحبا', dir: 'rtl' }) // only this dialog
```

Phone numbers are always written left to right. `placement: 'left' | 'right'` and the toast positions (`top-left`…) are physical: on an RTL page choose the side you want.

## 12. Quick reference

| | |
|---|---|
| `dialog.alert(opts \| title, text?)` | Notice with one button |
| `dialog.success / error / warning / info` | Notice with an icon |
| `dialog.confirm(opts \| title, text?)` | Cancel + Confirm |
| `dialog.prompt(opts)` | One field |
| `dialog.open(opts)` | Free |
| `dialog.close(value?)`, `dialog.closeAll()`, `dialog.isOpen()` | Control |
| `form(opts)`, `wizard(opts)` | `nexus-dialogs/forms` |
| `toast(...)`, `toast.success/error/warning/info/loading/promise/update/dismiss/configure` | `nexus-dialogs/toast` |
| `themes`, `fromBootstrap()`, `applyTheme()` | `nexus-dialogs/themes` |
| `confirmDelete`, `unsavedChanges`, `sessionTimeout`, `watchIdle`, `approval`, `bulkAction`, `choose`, `loading`, `configurePatterns` | `nexus-dialogs/patterns` |
| `isRFC`, `isCURP`, `isNSS`, `isCLABE`, `isPostalCode`, `normalize` | `nexus-dialogs/mx` |
| `NexusDialogs` (plugin), `useDialog`, `useToast` | `nexus-dialogs/vue` |
| `NexusDialogsProvider`, `useDialog`, `useForm`, `useToast` | `nexus-dialogs/react` |
| `provideNexusDialogs`, `injectDialog`, `injectForm`, `injectToast` | `nexus-dialogs/angular` |
| `Swal` (default), `DismissReason` | `nexus-dialogs/swal` |
| `configure({ lang, labels, theme, scheme, dir, defaults, sheetOnMobile })` | Global |

Events on `document`: `nexus-dialogs:open` and `nexus-dialogs:close` (with `detail.dialog`).

The full public API, generated from the types, is in [`api/nexus-dialogs.api.md`](api/nexus-dialogs.api.md).

## 13. Compatibility

- Current browsers: Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (it uses modal `<dialog>` and `color-mix()`). Tested in Chromium, Firefox and WebKit. Feature by feature, what happens if one is missing, and the versioning and support policy: [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html). How to upgrade without surprises: [Versioning and migrations](https://urieldomingezm.github.io/nexus-dialogs/en/versiones.html).
- **nexus-tours**: the dialogs are real `<dialog open>`, so tours detect them and can explain what is inside.
- Bootstrap, Tailwind, SweetAlert2: no `z-index` or CSS clashes. To migrate from SweetAlert2, see [Coming from SweetAlert2?](#coming-from-sweetalert2).
- Security: [`docs/en/seguridad.md`](docs/en/seguridad.md). To report a vulnerability, [`SECURITY.md`](SECURITY.md).
- Vue 3.3+ with `nexus-dialogs/vue`. React 18+ with `nexus-dialogs/react`. Angular 16+ with `nexus-dialogs/angular`. CI installs and tests each one at its minimum version and the latest (matrix in [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html), output of [`compat/matriz.json`](compat/matriz.json)).
- Node 18 or later (tested on 18, 20, 22 and 24). SSR: importing doesn’t touch the DOM; dialogs open only in the browser.

## 14. Development

```bash
npm ci
npm run dev           # test page in test/paginas/
npm run build:site    # documentation site in site-dist/ (needs npm run build first)
npm run test:unit     # Vitest + happy-dom
npm run test:e2e      # Playwright (Chromium, Firefox, WebKit) + axe
npm run build && npm run size && npm run api:check && npm run check:paquete
npm run compat:check  # the compatibility matrix matches package.json and docs/soporte.md
npm run bench         # repeatable sizes, timings and memory (docs/rendimiento.md)
```

Complete start-to-finish examples (employee hiring, fortnight close, importing employees): [`examples/`](examples/). Sizes and timings: [Performance](https://urieldomingezm.github.io/nexus-dialogs/en/rendimiento.html).

Want to contribute? Read [`CONTRIBUTING.md`](CONTRIBUTING.md). See the [CHANGELOG](CHANGELOG.md).

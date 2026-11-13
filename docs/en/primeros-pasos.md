# Getting started

Five minutes: install, open your first dialog and solve three everyday cases. You don't need to read the whole guide to get going; when you need something more, the last section tells you where to look.

## 1. Install

```bash
npm i nexus-dialogs
```

Without a bundler, with a `<script>` from a CDN, also works: see the [guide](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#1-install).

## 2. Your first dialog: confirm an operation

```ts
import { dialog } from 'nexus-dialogs'

const r = await dialog.confirm({
  title: 'Send the order?',
  text: 'The warehouse will be notified.',
  confirmText: 'Send',
})

if (r.confirmed) await sendOrder()
```

Cancelling, closing with Esc or clicking outside **is not an error**: the promise always resolves with `{ confirmed, denied, value, reason }`. If what you are deleting cannot be undone, add `danger: true` and focus stays on Cancel.

## 3. Ask for data: create a customer

```ts
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'

const created = await form<{ name: string; email: string }>({
  title: 'New customer',
  submitText: 'Create customer',
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
  preConfirm: (v) => api.customers.create(v), // shows "Processing…"; if it throws, the error appears inside the dialog
})

if (created.confirmed) toast.success('Customer created')
```

Validation (required fields, valid email) and each field's errors are already built in.

## 4. Record a purchase

```ts
const purchase = await form({
  title: 'Record purchase',
  columns: 2,
  fields: [
    { name: 'supplier', label: 'Supplier', required: true },
    { name: 'product', label: 'Product', type: 'select', options: ['Stationery', 'Cleaning', 'Equipment'], required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true },
    { name: 'amount', label: 'Amount', type: 'money', min: 1, required: true },
  ],
  validate: (v) => (v.amount > 50000 ? { amount: 'Over $50,000 requires a purchase order.' } : undefined),
})
```

`validate` checks several fields at once and returns one message per field.

## 5. Import products from Excel or CSV

```ts
import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Import products',
  columns: [
    { name: 'sku', label: 'SKU', required: true, unique: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'price', label: 'Price', type: 'number' },
  ],
  onImport: (rows) => api.post('/products/batch', rows),
})
```

The user picks the file, columns are matched by name automatically and the number of valid rows is reviewed before importing. Everything runs in the browser.

## What's next

| If you need… | Go to |
|---|---|
| Everyday recipes (delete, unsaved changes, session, approve) | [Guide: recipes](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#3-recipes-everyday-things-in-one-line) |
| More fields, columns and wizards | [Guide: forms](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#6-forms) and [wizards](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#7-wizards) |
| Tabs, tables and step-by-step tracking | [Guide: tables, tabs and tracking](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#choose-from-a-table) |
| Vue, React or Angular | [Guide: Vue 3](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#vue-3), [React](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#react) and [Angular](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#angular) |
| HR templates and Mexican validators (RFC, CURP, NSS, CLABE) | [Guide: HR templates](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#hr-templates) and [validators](https://urieldomingezm.github.io/nexus-dialogs/en/guia.html#9-mexican-validators) |
| Switching from SweetAlert2 | [Migrate](https://urieldomingezm.github.io/nexus-dialogs/en/migracion.html) |
| Try everything live | [Examples](https://urieldomingezm.github.io/nexus-dialogs/en/ejemplos.html) |
| What each module guarantees and what it does not do | [Limitations and guarantees](https://urieldomingezm.github.io/nexus-dialogs/en/limitaciones.html#guarantees-by-module) |

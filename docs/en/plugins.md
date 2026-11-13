A stable way to extend the library without touching its code: hooks that run with **all** dialogs (also those of `form`, `wizard`, `confirmDelete`…), custom field types for forms and texts in other languages.

## Install a plugin

A plugin is an object with a `name` and, if you want, `install` and hooks:

```ts
import { use, type Plugin } from 'nexus-dialogs'

const audit: Plugin = {
  name: 'audit',
  // Called once on install. Receives `configure` and `labels`.
  install: ({ configure }) => configure({ defaults: { dismissible: { backdrop: false } } }),
  // Before opening: return the changed options (or nothing, if you only observe).
  beforeOpen: (o) => ({ ...o, title: o.title ?? 'Notice' }),
  // With the dialog already on screen.
  afterOpen: (ctx, o) => console.log('opened', o.title, ctx.dialog),
  // After closing, with the result.
  afterClose: (r, o) => record({ title: o.title, confirmed: r.confirmed, reason: r.reason }),
}

use(audit) // true; with the same name again it does nothing and returns false
```

| Function | What it does |
|---|---|
| `use(plugin)` | Installs the plugin. Returns `false` if there was already one with that name |
| `unuse(name)` | Removes it. Returns `false` if it wasn't there |
| `plugins()` | The names of the installed ones, in order |

## How hooks behave

- They run **in the order they were installed**. With `beforeOpen`, each plugin receives the options left by the previous one.
- They apply to everything that opens a dialog: `dialog.*`, `form`, `wizard`, the recipes; not `toast` (toasts are not dialogs).
- `afterOpen` and `afterClose` run **after** the `onOpen` and `onClose` that the dialog itself asks for.
- A hook that throws an error is written to the console (`console.error(name, hook, error)`) and does **not** prevent opening or closing the dialog nor stop the other plugins.
- Don't install or remove plugins from inside a hook.
- If you had already opened a dialog, a new plugin's hooks don't reach it: only the ones opened afterwards.

## Custom field types

With `registerField` (in `nexus-dialogs/forms`) a plugin adds a type that is used like any other in `form()` and `wizard()`:

```ts
import { registerField } from 'nexus-dialogs/forms'

const remove = registerField('rating', (ctx, value) => {
  const el = document.createElement('input')
  el.id = ctx.id // the field's label points here
  el.type = 'number'
  el.min = '1'
  el.max = '5'
  el.value = String(value ?? 3)
  return {
    el,
    value: () => Number(el.value),
    focus: () => el.focus(),
    invalid: (on) => el.toggleAttribute('aria-invalid', on),
    validate: () => (Number(el.value) >= 1 ? null : 'Choose from 1 to 5.'),
    summary: () => `${el.value} of 5`, // what is shown in the wizard's review
  }
})

await form({ title: 'Rate', fields: [{ name: 'score', label: 'Score', type: 'rating' }] })
remove() // stops registering it
```

The control returns its `el`, `value()`, `focus()` and `invalid(on)`; `validate`, `summary`, `group` (uses `<fieldset>` instead of `<label>`) and `lazy` are optional (the `CustomControl` type describes them). The label, the help text and the error message are provided by the library. An existing type cannot be replaced: `registerField` throws an error.

Since controls live inside the dialog's Shadow DOM, their CSS must go with them: a `<style>` inside `el`, or inline styles.

## Texts in other languages

Spanish and English are included. Other languages are registered with `registerLanguage`; whatever you don't translate is shown in English:

```ts
import { registerLanguage, configure, pageLanguage } from 'nexus-dialogs'
import { pt, fr } from 'nexus-dialogs/locales' // Portuguese (Brazil) and French, ready to use

registerLanguage('pt', pt)
configure({ lang: 'pt' }) // or configure({ lang: pageLanguage() }) to follow <html lang>
```

- Regional codes are reduced to the main one: `pt-BR` is `pt`, both when registering and when configuring.
- Only the core and toasts use the registered texts (`toast.configure({ lang: 'pt' })` for notices). The recipes (`configurePatterns`), tables, import and other modules have their own texts and, in a registered language, come out in English until you change them with each module's configuration function.
- You can complete a language in parts: calling `registerLanguage` again with the same code **merges** with what is already registered. Do it before `configure({ lang })`.
- `nexus-dialogs/locales` is a separate file (1.3 KB): if you don't import it, it weighs nothing.

## What is promised

`use`, `unuse`, `plugins`, the shape of `Plugin` (`name`, `install`, `beforeOpen`, `afterOpen`, `afterClose`), `registerField`, `CustomControl`, `registerLanguage` and `labelsFor` are public API: changing them counts as a breaking change and `npm run api:check` watches it ([Versioning and migrations](https://urieldomingezm.github.io/nexus-dialogs/en/versiones.html)).

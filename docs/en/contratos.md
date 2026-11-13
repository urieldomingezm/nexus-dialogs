What each public function returns and why. The signatures are pinned by the compiler (`test/tipos/contratos.ts`): if what a function returns changes, `npm run typecheck` fails and the change must be announced as a "breaking change" (see [limitations and versions](https://urieldomingezm.github.io/nexus-dialogs/en/limitaciones.html)).

## The rule: three families

**1. Dialogs → `DialogResult<T>`.** Everything that opens a "full" dialog (alerts, confirmations, `prompt`, forms, wizards, tables, import) always resolves with the same object and **never rejects**:

```ts
{ confirmed: boolean, denied: boolean, value: T | undefined, reason: CloseReason }
```

It reads the same everywhere: `if (r.confirmed) use(r.value)`. `reason` says how it was closed (`confirm`, `cancel`, `escape`, `backdrop`, `deny`, `timer`, `program` or the `id` of a custom button).

**2. Recipes (`nexus-dialogs/patterns`) → the value you need, without a wrapper.** These are one-line decisions, so they return the answer directly:

| Function | Returns |
|---|---|
| `confirmDelete` | `boolean` (`true` = delete) |
| `choose` | the chosen value, or `null` if cancelled |
| `unsavedChanges` | `'save'`, `'discard'` or `'keep'` |
| `sessionTimeout` | `'extend'`, `'logout'` or `'expired'` |
| `loading` | whatever your task returns (propagates its error) |

**3. Recipes with a structured result → their own documented object.** When the answer has several parts:

| Function | Returns |
|---|---|
| `approval` | `{ decision: 'approved' \| 'rejected' \| 'info' \| 'cancelled', comment, reason? }` |
| `bulkAction` | `{ confirmed, done[], failed[{ item, error }], skipped[{ item, … }] }` |

## Why not everything is a `DialogResult`

A recipe like `confirmDelete` exists so you can write `if (await confirmDelete(...)) remove()`. Forcing you to read `.confirmed` in each of the 30 screens of a system adds nothing. When you need more detail (why it was closed, what value it had), use the base dialog (`dialog.confirm`, `form`), which always returns `DialogResult`.

## Other conventions

- **They never reject**: neither dialogs nor recipes; cancelling is not an error. What does reject is `formFromJSON` with an unknown type or a missing resolver (an error by whoever builds the schema; it opens nothing), `loading`, which rethrows your task's error, and `readSpreadsheet` with an unreadable file.
- **A `preConfirm` that throws** does not reject the promise: it shows the error inside the dialog and leaves it open.
- **`toast()`** returns a `string` (the id) for `toast.update` and `toast.dismiss`; `toast.promise` returns the original promise.
- **Pure functions** (`isRFC`, `isCURP`, `businessDays`…) return `boolean`, `number` or `string`, and never throw on odd input.
- **Adapters** (`nexus-dialogs/swal`): the result is SweetAlert2's (`{ isConfirmed, isDenied, isDismissed, value, dismiss }`) so migrated code works as is.

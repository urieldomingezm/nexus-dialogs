Qué devuelve cada función pública y por qué. Las firmas están fijadas con el compilador (`test/tipos/contratos.ts`): si cambia lo que devuelve una función, `npm run typecheck` falla y el cambio hay que anunciarlo como «cambio que rompe» (ver [limitaciones y versiones](https://urieldomingezm.github.io/nexus-dialogs/limitaciones.html)).

## La regla: tres familias

**1. Diálogos → `DialogResult<T>`.** Todo lo que abre un diálogo «completo» (alertas, confirmaciones, `prompt`, formularios, asistentes, tablas, importación) resuelve siempre con el mismo objeto y **nunca rechaza**:

```ts
{ confirmed: boolean, denied: boolean, value: T | undefined, reason: CloseReason }
```

Se lee igual en todos lados: `if (r.confirmed) usar(r.value)`. `reason` dice cómo se cerró (`confirm`, `cancel`, `escape`, `backdrop`, `deny`, `timer`, `program` o el `id` de un botón propio).

**2. Recetas (`nexus-dialogs/patterns`) → el valor que necesitas, sin envoltorio.** Son decisiones de una línea, así que devuelven directamente la respuesta:

| Función | Devuelve |
|---|---|
| `confirmDelete` | `boolean` (`true` = borrar) |
| `choose` | el valor elegido o `null` si se canceló |
| `unsavedChanges` | `'save'`, `'discard'` o `'keep'` |
| `sessionTimeout` | `'extend'`, `'logout'` o `'expired'` |
| `loading` | lo que devuelve tu tarea (propaga su error) |

**3. Recetas con resultado estructurado → un objeto propio, documentado.** Cuando la respuesta tiene varias partes:

| Función | Devuelve |
|---|---|
| `approval` | `{ decision: 'approved' \| 'rejected' \| 'info' \| 'cancelled', comment, reason? }` |
| `bulkAction` | `{ confirmed, done[], failed[{ item, error }], skipped[{ item, … }] }` |

## Por qué no todo es `DialogResult`

Una receta como `confirmDelete` existe para escribir `if (await confirmDelete(...)) borrar()`. Obligar a leer `.confirmed` en cada una de las 30 pantallas de un sistema no aporta nada. Cuando necesites más detalle (por qué se cerró, qué valor tenía), usa el diálogo base (`dialog.confirm`, `form`), que siempre devuelve `DialogResult`.

## Otras convenciones

- **Nunca rechazan** los diálogos ni las recetas: cancelar no es un error. Lo que sí propaga el error de tu código es `loading` (es tu tarea) y `readSpreadsheet` con un archivo ilegible (rechaza con un error).
- **`preConfirm` que lanza** no rechaza la promesa: muestra el error dentro del diálogo y lo deja abierto.
- **`toast()`** devuelve un `string` (el id) para `toast.update` y `toast.dismiss`; `toast.promise` devuelve la promesa original.
- **Funciones puras** (`isRFC`, `isCURP`, `businessDays`…) devuelven `boolean`, `number` o `string`, nunca lanzan por entradas raras.
- **Adaptadores** (`nexus-dialogs/swal`): el resultado es el de SweetAlert2 (`{ isConfirmed, isDenied, isDismissed, value, dismiss }`) para que el código migrado funcione tal cual.

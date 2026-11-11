// Contratos de resultado fijados con el compilador: si un cambio altera lo que devuelve una función pública, `npm run typecheck` falla.
// Para cambiarlo a propósito hay que actualizar también docs/contratos.md y avisar en el CHANGELOG como cambio que rompe.
import type { DialogResult } from 'nexus-dialogs'
import { dialog } from 'nexus-dialogs'
import type { ApprovalResult, BulkActionResult } from 'nexus-dialogs/patterns'
import { approval, bulkAction, choose, confirmDelete, loading, sessionTimeout, unsavedChanges } from 'nexus-dialogs/patterns'
import { form, wizard } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import type { ImportResult } from 'nexus-dialogs/import'
import { exportData, importData } from 'nexus-dialogs/import'
import { pickRows } from 'nexus-dialogs/table'

type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const igual = <_T extends true>(): void => {}

// Familia «diálogo»: siempre DialogResult<…>; nunca rechaza.
igual<Igual<ReturnType<typeof dialog.alert>, Promise<DialogResult<true>>>>()
igual<Igual<ReturnType<typeof dialog.confirm>, Promise<DialogResult<true>>>>()
igual<Igual<ReturnType<typeof dialog.prompt>, Promise<DialogResult<string>>>>()
igual<Igual<ReturnType<typeof form<{ a: string }>>, Promise<DialogResult<{ a: string }>>>>()
igual<Igual<ReturnType<typeof wizard<{ a: string }>>, Promise<DialogResult<{ a: string }>>>>()
igual<Igual<ReturnType<typeof pickRows<{ id: number }>>, Promise<DialogResult<{ id: number }[]>>>>()
igual<Igual<ReturnType<typeof importData<{ a: string }>>, Promise<DialogResult<ImportResult<{ a: string }>>>>>()

// Familia «recetas» (patterns): resultados simples que se leen directo.
igual<Igual<ReturnType<typeof confirmDelete>, Promise<boolean>>>()
igual<Igual<ReturnType<typeof choose<'a' | 'b'>>, Promise<'a' | 'b' | null>>>()
igual<Igual<ReturnType<typeof unsavedChanges>, Promise<'save' | 'discard' | 'keep'>>>()
igual<Igual<ReturnType<typeof sessionTimeout>, Promise<'extend' | 'logout' | 'expired'>>>()
igual<Igual<ReturnType<typeof approval>, Promise<ApprovalResult>>>()
igual<Igual<ReturnType<typeof bulkAction<number>>, Promise<BulkActionResult<number>>>>()
igual<Igual<ReturnType<typeof loading<string>>, Promise<string>>>()

// Las formas de esos objetos.
igual<Igual<ApprovalResult['decision'], 'approved' | 'rejected' | 'info' | 'cancelled'>>()
igual<Igual<DialogResult['reason'], import('nexus-dialogs').CloseReason>>()

// toast devuelve el id (se usa con toast.dismiss / toast.update); exportData no devuelve nada que haya que esperar para usar.
igual<Igual<ReturnType<typeof toast>, string>>()
void exportData

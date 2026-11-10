/**
 * nexus-dialogs: diálogos, avisos, confirmaciones y prompts sobre el <dialog> nativo, aislados con Shadow DOM,
 * basados en promesas y sin dependencias.
 *
 * ```ts
 * import { dialog } from 'nexus-dialogs'
 * const r = await dialog.confirm({ title: '¿Eliminar el periodo?', danger: true, confirmText: 'Eliminar periodo' })
 * if (r.confirmed) eliminar()
 * ```
 * Formularios y asistentes: `nexus-dialogs/forms`. Toasts: `nexus-dialogs/toast`. Temas: `nexus-dialogs/themes`.
 */
export { dialog, alert, confirm, prompt, open } from './dialog'
export type { PromptOptions, DialogInput } from './dialog'
export { configure, labels, language } from './config'
export type { GlobalConfig } from './config'
export { openDialog, closeDialog, INVALID } from './core/engine'
export type { EngineOptions } from './core/engine'
export { es, en } from './i18n'
export type * from './types'

/** Versión del paquete. */
export const version: string = __VERSION__

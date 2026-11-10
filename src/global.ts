// Build para <script> sin bundler: window.NexusDialogs = { dialog, toast, form, wizard, themes, … }
import * as core from './index'
import { form, wizard } from './forms'
import { toast } from './toast'
import { themes, fromBootstrap, applyTheme } from './themes'

const NexusDialogs = { ...core, form, wizard, toast, themes, fromBootstrap, applyTheme }

declare global {
  interface Window {
    NexusDialogs: typeof NexusDialogs
  }
}
if (typeof window !== 'undefined') window.NexusDialogs = NexusDialogs

export { form, wizard, toast, themes, fromBootstrap, applyTheme }
export * from './index'

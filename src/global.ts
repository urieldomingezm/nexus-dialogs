// Build para <script> sin bundler: window.NexusDialogs = { dialog, toast, form, wizard, themes, … }
import * as core from './index'
import { form, wizard, formFromJSON, formatPhone } from './forms'
import { toast } from './toast'
import { themes, fromBootstrap, applyTheme } from './themes'
import * as patterns from './patterns'
import * as mx from './mx'

const NexusDialogs = { ...core, ...patterns, ...mx, form, wizard, formFromJSON, formatPhone, toast, themes, fromBootstrap, applyTheme }

declare global {
  interface Window {
    NexusDialogs: typeof NexusDialogs
  }
}
if (typeof window !== 'undefined') window.NexusDialogs = NexusDialogs

export { form, wizard, formFromJSON, formatPhone, toast, themes, fromBootstrap, applyTheme }
export * from './index'
export * from './patterns'
export * from './mx'

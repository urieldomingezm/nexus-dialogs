// Guía de migración: cada ejemplo corre el código de SweetAlert2 con el adaptador y la versión con la API propia.
import './comun'
import { idioma } from './textos'
import Swal from 'nexus-dialogs/swal'
import { configure, dialog } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { form, wizard } from 'nexus-dialogs/forms'
import { confirmDelete } from 'nexus-dialogs/patterns'

// Los ejemplos de SweetAlert2 traen `html` propio: este es el único cambio que necesita el código migrado (ver «Qué cambia»).
configure({ strictHtml: false })

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms))
const timbrar = async () => {
  await espera(700)
}

type Ejemplo = { swal: () => Promise<unknown>; nativa: () => Promise<unknown> }

// Los textos de los ejemplos van en el idioma de la página (español e inglés; el resto, en español como el contenido).
const TXT = {
  es: {
    delTitle: '¿Eliminar a Laura Méndez?',
    delText: 'No podrás revertirlo',
    delYes: 'Sí, eliminar',
    what: 'a Laura Méndez',
    saved: 'Guardado',
    savedText: 'Los cambios ya están en el sistema',
    mailTitle: 'Correo del cliente',
    mailErr: 'Escribe un correo',
    mailLabel: 'Correo',
    mailName: 'correo',
    expense: 'Nuevo gasto',
    rfcLabel: 'RFC del proveedor',
    amountLabel: 'Importe',
    next: 'Siguiente',
    s1: 'Datos',
    s2: 'Puesto',
    s3: 'Prestaciones',
    hire: 'Alta de empleado',
    nameLabel: 'Nombre',
    posLabel: 'Puesto',
    vouchers: 'Vales de despensa',
    toastSaved: 'Empleado guardado',
    undo: 'Deshacer',
    undone: 'Cambio deshecho',
    stampQ: '¿Enviar a timbrar?',
    shown: 'toast mostrado',
    waiting: 'Esperando…',
    adapter: 'SweetAlert2 (adaptador)',
    native: 'API propia',
  },
  en: {
    delTitle: 'Delete Laura Méndez?',
    delText: "You won't be able to revert this",
    delYes: 'Yes, delete',
    what: 'Laura Méndez',
    saved: 'Saved',
    savedText: 'The changes are now in the system',
    mailTitle: 'Customer email',
    mailErr: 'Enter an email',
    mailLabel: 'Email',
    mailName: 'email',
    expense: 'New expense',
    rfcLabel: 'Supplier RFC',
    amountLabel: 'Amount',
    next: 'Next',
    s1: 'Details',
    s2: 'Position',
    s3: 'Benefits',
    hire: 'New employee',
    nameLabel: 'Name',
    posLabel: 'Position',
    vouchers: 'Food vouchers',
    toastSaved: 'Employee saved',
    undo: 'Undo',
    undone: 'Change undone',
    stampQ: 'Send to be stamped?',
    shown: 'toast shown',
    waiting: 'Waiting…',
    adapter: 'SweetAlert2 (adapter)',
    native: 'Native API',
  },
}
const T = idioma === 'en' ? TXT.en : TXT.es

const EJEMPLOS: Record<string, Ejemplo> = {
  borrar: {
    swal: async () =>
      (await Swal.fire({ title: T.delTitle, text: T.delText, icon: 'warning', showCancelButton: true, confirmButtonText: T.delYes })).isConfirmed,
    nativa: () => confirmDelete({ what: T.what }),
  },
  exito: {
    swal: async () => (await Swal.fire({ icon: 'success', title: T.saved, text: T.savedText, timer: 2500, showConfirmButton: false })).isDismissed,
    nativa: () => dialog.success({ title: T.saved, text: T.savedText, timer: 2500 }),
  },
  input: {
    swal: async () => (await Swal.fire({ title: T.mailTitle, input: 'email', inputValidator: (v) => (!v ? T.mailErr : undefined) })).value,
    nativa: () => form({ title: T.mailTitle, fields: [{ name: T.mailName, label: T.mailLabel, type: 'email', required: true }] }),
  },
  formulario: {
    swal: async () =>
      (
        await Swal.fire({
          title: T.expense,
          html: `<label>RFC <input id="rfc"></label><br><label>${T.amountLabel} <input id="importe"></label>`,
          focusConfirm: false,
          preConfirm: () => {
            const c = Swal.getHtmlContainer()!
            return { rfc: (c.querySelector('#rfc') as HTMLInputElement).value, importe: (c.querySelector('#importe') as HTMLInputElement).value }
          },
        })
      ).value,
    nativa: () =>
      form({
        title: T.expense,
        fields: [
          { name: 'rfc', label: T.rfcLabel, type: 'rfc', required: true },
          { name: 'importe', label: T.amountLabel, type: 'money', required: true },
        ],
      }),
  },
  pasos: {
    swal: async () => {
      const Pasos = Swal.mixin({ progressSteps: ['1', '2', '3'], confirmButtonText: T.next })
      await Pasos.fire({ title: T.s1, currentProgressStep: 0 })
      await Pasos.fire({ title: T.s2, currentProgressStep: 1 })
      return (await Pasos.fire({ title: T.s3, currentProgressStep: 2 })).isConfirmed
    },
    nativa: () =>
      wizard({
        title: T.hire,
        review: true,
        steps: [
          { title: T.s1, fields: [{ name: 'nombre', label: T.nameLabel, required: true }] },
          { title: T.s2, fields: [{ name: 'puesto', label: T.posLabel, required: true }] },
          { title: T.s3, fields: [{ name: 'vales', label: T.vouchers, type: 'switch' }] },
        ],
      }),
  },
  toast: {
    swal: async () => {
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: T.toastSaved, timer: 3000, showConfirmButton: false })
      return T.shown
    },
    nativa: async () => {
      toast.success(T.toastSaved, { action: { label: T.undo, onClick: () => toast(T.undone) } })
      return T.shown
    },
  },
  cargando: {
    swal: async () =>
      (await Swal.fire({ title: T.stampQ, showCancelButton: true, showLoaderOnConfirm: true, preConfirm: () => timbrar() })).isConfirmed,
    nativa: () => dialog.confirm({ title: T.stampQ, preConfirm: () => timbrar() }),
  },
}

const salida = document.getElementById('mig-salida')!
document.addEventListener('click', async (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-mig]')
  if (!b) return
  const ejemplo = EJEMPLOS[b.dataset.id!]
  if (!ejemplo) return
  const modo = b.dataset.mig as 'swal' | 'nativa'
  salida.textContent = T.waiting
  const r = await ejemplo[modo]()
  salida.textContent = `${modo === 'swal' ? T.adapter : T.native} → ${JSON.stringify(r) ?? 'undefined'}`
})

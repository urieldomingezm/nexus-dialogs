// Guía de migración: cada ejemplo corre el código de SweetAlert2 con el adaptador y la versión con la API propia.
import './comun'
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

const EJEMPLOS: Record<string, Ejemplo> = {
  borrar: {
    swal: async () =>
      (await Swal.fire({ title: '¿Eliminar a Laura Méndez?', text: 'No podrás revertirlo', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' })).isConfirmed,
    nativa: () => confirmDelete({ what: 'a Laura Méndez' }),
  },
  exito: {
    swal: async () => (await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Los cambios ya están en el sistema', timer: 2500, showConfirmButton: false })).isDismissed,
    nativa: () => dialog.success({ title: 'Guardado', text: 'Los cambios ya están en el sistema', timer: 2500 }),
  },
  input: {
    swal: async () => (await Swal.fire({ title: 'Correo del cliente', input: 'email', inputValidator: (v) => (!v ? 'Escribe un correo' : undefined) })).value,
    nativa: () => form({ title: 'Correo del cliente', fields: [{ name: 'correo', label: 'Correo', type: 'email', required: true }] }),
  },
  formulario: {
    swal: async () =>
      (
        await Swal.fire({
          title: 'Nuevo gasto',
          html: '<label>RFC <input id="rfc"></label><br><label>Importe <input id="importe"></label>',
          focusConfirm: false,
          preConfirm: () => {
            const c = Swal.getHtmlContainer()!
            return { rfc: (c.querySelector('#rfc') as HTMLInputElement).value, importe: (c.querySelector('#importe') as HTMLInputElement).value }
          },
        })
      ).value,
    nativa: () =>
      form({
        title: 'Nuevo gasto',
        fields: [
          { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
          { name: 'importe', label: 'Importe', type: 'money', required: true },
        ],
      }),
  },
  pasos: {
    swal: async () => {
      const Pasos = Swal.mixin({ progressSteps: ['1', '2', '3'], confirmButtonText: 'Siguiente' })
      await Pasos.fire({ title: 'Datos', currentProgressStep: 0 })
      await Pasos.fire({ title: 'Puesto', currentProgressStep: 1 })
      return (await Pasos.fire({ title: 'Prestaciones', currentProgressStep: 2 })).isConfirmed
    },
    nativa: () =>
      wizard({
        title: 'Alta de empleado',
        review: true,
        steps: [
          { title: 'Datos', fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
          { title: 'Puesto', fields: [{ name: 'puesto', label: 'Puesto', required: true }] },
          { title: 'Prestaciones', fields: [{ name: 'vales', label: 'Vales de despensa', type: 'switch' }] },
        ],
      }),
  },
  toast: {
    swal: async () => {
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empleado guardado', timer: 3000, showConfirmButton: false })
      return 'toast mostrado'
    },
    nativa: async () => {
      toast.success('Empleado guardado', { action: { label: 'Deshacer', onClick: () => toast('Cambio deshecho') } })
      return 'toast mostrado'
    },
  },
  cargando: {
    swal: async () =>
      (await Swal.fire({ title: '¿Enviar a timbrar?', showCancelButton: true, showLoaderOnConfirm: true, preConfirm: () => timbrar() })).isConfirmed,
    nativa: () => dialog.confirm({ title: '¿Enviar a timbrar?', preConfirm: () => timbrar() }),
  },
}

const salida = document.getElementById('mig-salida')!
document.addEventListener('click', async (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-mig]')
  if (!b) return
  const ejemplo = EJEMPLOS[b.dataset.id!]
  if (!ejemplo) return
  const modo = b.dataset.mig as 'swal' | 'nativa'
  salida.textContent = 'Esperando…'
  const r = await ejemplo[modo]()
  salida.textContent = `${modo === 'swal' ? 'SweetAlert2 (adaptador)' : 'API propia'} → ${JSON.stringify(r) ?? 'undefined'}`
})

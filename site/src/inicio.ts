import './comun'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import { chispas, animarNumero } from './animaciones'
import './demo'

const $ = (id: string) => document.getElementById(id)!

// Cuánta gente la usa: descargas de la última semana según npm. Si no responde, la cifra queda en «—» y el enlace lleva a npm.
void (async () => {
  try {
    const r = await fetch('https://api.npmjs.org/downloads/point/last-week/nexus-dialogs')
    const { downloads } = (await r.json()) as { downloads?: number }
    if (typeof downloads === 'number') animarNumero($('n-descargas'), new Intl.NumberFormat('es-MX').format(downloads))
  } catch {
    /* sin red o npm no responde: se queda el guion */
  }
})()

$('b-borrar').addEventListener('click', async () => {
  if (await confirmDelete({ what: 'a Laura Méndez' })) toast.success('Laura Méndez eliminada')
})

$('b-form').addEventListener('click', async () => {
  const r = await form({
    title: 'Nuevo gasto',
    columns: 2,
    fields: [
      { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
      { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
      { name: 'concepto', label: 'Concepto', type: 'textarea', span: 2, maxLength: 200 },
    ],
  })
  if (r.confirmed) toast.success('Enviado a aprobación')
})

$('b-vacaciones').addEventListener('click', async () => {
  const r = await form({
    title: 'Solicitar vacaciones',
    fields: [{ name: 'dias', label: 'Fechas', type: 'daterange', calendar: true, businessDays: true, maxDays: 12, required: true }],
  })
  if (r.confirmed) toast.success('Solicitud enviada')
})

$('b-toast').addEventListener('click', () => {
  toast.success('Empleado guardado', { action: { label: 'Deshacer', onClick: () => toast('Cambio deshecho') } })
})

$('b-hero').addEventListener('click', async () => {
  if (await confirmDelete({ what: 'a Laura Méndez' })) {
    toast.success('Laura Méndez eliminada')
    chispas($('b-hero'))
  }
})

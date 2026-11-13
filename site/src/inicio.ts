import './comun'
import { d } from './demo-textos'
import { confirmDelete } from 'nexus-dialogs/patterns'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'
import { chispas, animarNumero } from './animaciones'
import './demo'

const $ = (id: string) => document.getElementById(id)!

// Cuánta gente la usa: descargas de la última semana según npm. Mientras llega la cifra se ve un esqueleto brillante;
// si npm no responde, la cifra queda en «—» y el enlace lleva a npm.
void (async () => {
  const cifra = $('n-descargas')
  cifra.classList.add('esqueleto')
  try {
    const r = await fetch('https://api.npmjs.org/downloads/point/last-week/nexus-dialogs')
    const { downloads } = (await r.json()) as { downloads?: number }
    cifra.classList.remove('esqueleto')
    if (typeof downloads === 'number') animarNumero(cifra, new Intl.NumberFormat('es-MX').format(downloads))
  } catch {
    /* sin red o npm no responde: se queda el guion */
    cifra.classList.remove('esqueleto')
  }
})()

// La insignia de versión se confirma con npm; sin respuesta, queda la versión con la que se construyó esta página.
void (async () => {
  try {
    const r = await fetch('https://registry.npmjs.org/nexus-dialogs/latest')
    const { version } = (await r.json()) as { version?: string }
    if (version && /^\d+\.\d+\.\d+/.test(version)) $('i-version').textContent = `v${version}`
  } catch {
    /* se queda la versión de la construcción */
  }
})()

$('b-borrar').addEventListener('click', async () => {
  if (await confirmDelete({ what: d.what })) toast.success(d.eliminada)
})

$('b-form').addEventListener('click', async () => {
  const r = await form({
    title: d.gastoTitulo,
    columns: 2,
    fields: [
      { name: 'rfc', label: d.rfcEt, type: 'rfc', required: true },
      { name: 'importe', label: d.importeEt, type: 'money', required: true, min: 1 },
      { name: 'concepto', label: d.conceptoEt, type: 'textarea', span: 2, maxLength: 200 },
    ],
  })
  if (r.confirmed) toast.success(d.enviadoAprob)
})

$('b-vacaciones').addEventListener('click', async () => {
  const r = await form({
    title: d.vacTitulo,
    fields: [{ name: 'dias', label: d.fechasEt, type: 'daterange', calendar: true, businessDays: true, maxDays: 12, required: true }],
  })
  if (r.confirmed) toast.success(d.solicitudEnviada)
})

$('b-toast').addEventListener('click', () => {
  toast.success(d.guardado, { action: { label: d.deshacer, onClick: () => toast(d.deshecho) } })
})

$('b-hero').addEventListener('click', async () => {
  if (await confirmDelete({ what: d.what })) {
    toast.success(d.eliminada)
    chispas($('b-hero'))
  }
})

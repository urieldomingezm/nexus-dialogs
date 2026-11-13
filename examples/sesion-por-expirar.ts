// Sesión por expirar: cuenta regresiva visible (WCAG 2.2.1) con el foco en «Seguir trabajando». Sin respuesta, se cierra sola.
import { toast } from 'nexus-dialogs/toast'
import { sessionTimeout } from 'nexus-dialogs/patterns'
import { api } from './api-falsa'

export async function sesionPorExpirar(segundos = 20): Promise<'extendida' | 'cerrada'> {
  const r = await sessionTimeout({ seconds: segundos, text: 'Lo que llevas se guardó como borrador.' })
  if (r === 'extend') {
    await api.sesion.renovar()
    toast.success('Sesión extendida')
    return 'extendida'
  }
  await api.sesion.cerrar() // «Cerrar sesión» o se acabó el tiempo
  return 'cerrada'
}

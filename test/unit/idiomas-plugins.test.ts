import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  configure,
  dialog,
  labels,
  language,
  labelsFor,
  pageLanguage,
  plugins,
  registerLanguage,
  unuse,
  use,
  type Plugin,
} from '../../src/index'
import { registerField } from '../../src/fields'
import { form } from '../../src/forms'
import { pt, fr } from '../../src/locales'
import { toast } from '../../src/toast'
import { esperar } from './utilidades'

const cerrar = async () => {
  document
    .querySelector<HTMLDialogElement>('dialog[data-nexus-dialog]')
    ?.querySelector<HTMLElement>('[data-nexus-host]')
    ?.shadowRoot?.querySelector<HTMLButtonElement>('button[data-role=confirm], button[data-role=cancel]')
    ?.click()
  await esperar(20)
}

afterEach(async () => {
  configure({ lang: 'es', labels: {} })
  for (const n of plugins()) unuse(n)
  toast.dismiss()
  await esperar(5)
})

describe('idiomas', () => {
  it('registerLanguage + configure({ lang }) cambian los textos; lo no traducido cae a inglés', () => {
    registerLanguage('de', { ok: 'Okay', cancel: 'Abbrechen' })
    configure({ lang: 'de' })
    expect(language()).toBe('de')
    expect(labels().cancel).toBe('Abbrechen')
    expect(labels().close).toBe('Close')
  })

  it('«pt-BR» se usa como «pt», también al registrar', () => {
    registerLanguage('pt-BR', pt)
    configure({ lang: 'pt-BR' })
    expect(language()).toBe('pt')
    expect(labels().cancel).toBe('Cancelar')
    expect(labels().close).toBe('Fechar')
  })

  it('pageLanguage lee <html lang> y, sin él, es español', () => {
    document.documentElement.lang = 'fr-CA'
    expect(pageLanguage()).toBe('fr')
    document.documentElement.lang = ''
    expect(pageLanguage()).toBe('es')
  })

  it('los paquetes de idiomas traen todos los textos del español', () => {
    const claves = Object.keys(labelsFor('es')).sort()
    expect(Object.keys(pt).sort()).toEqual(claves)
    expect(Object.keys(fr).sort()).toEqual(claves)
    for (const t of [pt, fr]) for (const v of Object.values(t)) expect(v.trim()).not.toBe('')
  })

  it('un diálogo y un toast salen en el idioma registrado', async () => {
    registerLanguage('fr', fr)
    configure({ lang: 'fr' })
    toast.configure({ lang: 'fr' })
    void dialog.alert({ title: 'x' })
    await esperar(30)
    const boton = document
      .querySelector('dialog[data-nexus-dialog] [data-nexus-host]')!
      .shadowRoot!.querySelector('button[data-role=confirm]')!
    expect(boton.textContent).toBe('OK')
    await cerrar()
    toast.success('Hecho', { duration: 0 })
    await esperar(50)
    expect(document.querySelector('[data-nexus-toast]')!.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).toBe(fr.dismiss)
    toast.configure({ lang: 'es' })
  })
})

describe('plugins', () => {
  const abrirYCerrar = async () => {
    const p = dialog.alert({ title: 'Hola' })
    await esperar(30)
    await cerrar()
    return p
  }

  it('use instala una vez por nombre, plugins() lista y unuse quita', () => {
    const instalar = vi.fn()
    expect(use({ name: 'a', install: instalar })).toBe(true)
    expect(use({ name: 'a', install: instalar })).toBe(false)
    expect(instalar).toHaveBeenCalledTimes(1)
    expect(instalar.mock.calls[0][0]).toHaveProperty('configure')
    expect(plugins()).toEqual(['a'])
    expect(unuse('a')).toBe(true)
    expect(unuse('a')).toBe(false)
    expect(plugins()).toEqual([])
    expect(() => use({} as Plugin)).toThrow(TypeError)
  })

  it('beforeOpen cambia las opciones, afterOpen ve el diálogo y afterClose el resultado, en orden', async () => {
    const orden: string[] = []
    use({
      name: 'uno',
      beforeOpen: (o) => {
        orden.push('antes-1')
        return { ...o, title: `${o.title}!` }
      },
      afterOpen: (ctx) => orden.push(`abrió-1 ${ctx.dialog.getAttribute('aria-label')}`),
      afterClose: (r) => orden.push(`cerró-1 ${r.confirmed}`),
    })
    use({ name: 'dos', beforeOpen: (o) => void orden.push(`antes-2 ${o.title}`), afterClose: () => orden.push('cerró-2') })
    await abrirYCerrar()
    expect(orden).toEqual(['antes-1', 'antes-2 Hola!', 'abrió-1 Hola!', 'cerró-1 true', 'cerró-2'])
  })

  it('los ganchos corren también en form() y los demás módulos', async () => {
    const vistos: string[] = []
    use({ name: 'espia', beforeOpen: (o) => void vistos.push(String(o.title)) })
    const p = form({ title: 'Alta', fields: [{ name: 'n', label: 'N' }] })
    await esperar(40)
    expect(vistos).toEqual(['Alta'])
    document
      .querySelector<HTMLDialogElement>('dialog[data-nexus-dialog]')!
      .querySelector<HTMLElement>('[data-nexus-host]')!
      .shadowRoot!.querySelector<HTMLButtonElement>('button[data-role=cancel]')!
      .click()
    await p
  })

  it('un gancho que lanza se registra y no impide abrir ni cerrar', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    use({
      name: 'roto',
      beforeOpen: () => {
        throw new Error('boom')
      },
      afterOpen: () => {
        throw new Error('boom2')
      },
    })
    const r = await abrirYCerrar()
    expect(r.confirmed).toBe(true)
    expect(error).toHaveBeenCalledWith('roto', 'beforeOpen', expect.any(Error))
    expect(error).toHaveBeenCalledWith('roto', 'afterOpen', expect.any(Error))
    error.mockRestore()
  })

  it('respeta el onOpen y el onClose del propio diálogo', async () => {
    const llamadas: string[] = []
    use({ name: 'p', afterOpen: () => llamadas.push('plugin-abrió'), afterClose: () => llamadas.push('plugin-cerró') })
    const p = dialog.open({
      title: 'x',
      onOpen: () => llamadas.push('propio-abrió'),
      onClose: () => llamadas.push('propio-cerró'),
      buttons: [{ id: 'ok', role: 'confirm', text: 'Ok' }],
    })
    await esperar(30)
    await cerrar()
    await p
    expect(llamadas).toEqual(['propio-abrió', 'plugin-abrió', 'propio-cerró', 'plugin-cerró'])
  })

  it('registerField añade un tipo de campo propio a form() y se puede quitar', async () => {
    const quitar = registerField('rating', (ctx, valor) => {
      const el = document.createElement('input')
      el.id = ctx.id
      el.type = 'number'
      el.value = String(valor ?? 3)
      return { el, value: () => Number(el.value), focus: () => el.focus(), invalid: () => {} }
    })
    expect(() => registerField('rating', () => null as never)).toThrow()
    expect(() => registerField('combobox', () => null as never)).toThrow()
    const p = form<{ nota: number }>({ title: 'Evalúa', fields: [{ name: 'nota', label: 'Nota', type: 'rating' }] })
    await esperar(40)
    document
      .querySelector<HTMLDialogElement>('dialog[data-nexus-dialog]')!
      .querySelector<HTMLElement>('[data-nexus-host]')!
      .shadowRoot!.querySelector<HTMLButtonElement>('button[data-role=confirm]')!
      .click()
    const r = await p
    expect(r.value).toEqual({ nota: 3 })
    quitar()
    registerField('rating', () => null as never)() // ya se puede registrar de nuevo
  })
})

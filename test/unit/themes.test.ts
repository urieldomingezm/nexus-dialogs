import { describe, expect, it } from 'vitest'
import { applyTheme, fromBootstrap, themes } from '../../src/themes'
import { fmt } from '../../src/i18n'

describe('themes', () => {
  it('applyTheme pone las variables en :root', () => {
    applyTheme({ '--nd-accent': '#123456', radius: '4px' })
    expect(document.documentElement.style.getPropertyValue('--nd-accent')).toBe('#123456')
    expect(document.documentElement.style.getPropertyValue('--nd-radius')).toBe('4px')
  })

  it('fromBootstrap lee --bs-* y Cancelar usa el rojo de Bootstrap', () => {
    const el = document.createElement('div')
    el.style.setProperty('--bs-primary', '#6610f2')
    el.style.setProperty('--bs-danger', '#ff0000')
    document.body.appendChild(el)
    const t = fromBootstrap(el)
    expect(t['--nd-accent']).toBe('#6610f2')
    expect(t['--nd-cancel-fg']).toBe('#ff0000')
    expect(t['--nd-radius']).toBe(themes.bootstrap['--nd-radius'])
  })
})

describe('i18n', () => {
  it('fmt reemplaza {0} y {1}', () => {
    expect(fmt('Paso {0} de {1}', 2, 4)).toBe('Paso 2 de 4')
  })
})

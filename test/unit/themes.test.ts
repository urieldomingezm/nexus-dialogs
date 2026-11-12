import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, followPageScheme, fromBootstrap, themes } from '../../src/themes'
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

describe('Tailwind claro y oscuro', () => {
  it('tailwindDark es el par oscuro de tailwind: mismas variables de forma, colores de fondo oscuros y texto claro', () => {
    expect(themes.tailwindDark['--nd-radius']).toBe(themes.tailwind['--nd-radius'])
    expect(themes.tailwindDark['--nd-bg']).toBe('#0f172a')
    expect(themes.tailwindDark['--nd-fg']).toBe('#f1f5f9')
    expect(themes.tailwindDark['--nd-accent']).not.toBe(themes.tailwind['--nd-accent'])
  })

  describe('followPageScheme', () => {
    afterEach(() => {
      document.documentElement.className = ''
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.removeAttribute('data-bs-theme')
    })
    const esperar = () => new Promise((r) => setTimeout(r, 0))

    it('empieza en el modo de la página y sigue sus cambios (clase dark de Tailwind)', async () => {
      const aplicar = vi.fn()
      const parar = followPageScheme(aplicar, { light: themes.tailwind, dark: themes.tailwindDark })
      expect(aplicar).toHaveBeenCalledTimes(1)
      expect(aplicar.mock.calls[0][0].scheme).toBe('light')
      expect(aplicar.mock.calls[0][0].theme['--nd-fg']).toBe(themes.tailwind['--nd-fg'])

      document.documentElement.classList.add('dark')
      await esperar()
      expect(aplicar).toHaveBeenCalledTimes(2)
      expect(aplicar.mock.calls[1][0].scheme).toBe('dark')
      expect(aplicar.mock.calls[1][0].theme['--nd-bg']).toBe('#0f172a')

      document.documentElement.classList.remove('dark')
      await esperar()
      expect(aplicar).toHaveBeenCalledTimes(3)
      expect(aplicar.mock.calls[2][0].scheme).toBe('light')
      parar()
    })

    it('al volver de un modo a otro vacía las variables que el modo nuevo no define', async () => {
      const aplicar = vi.fn()
      const parar = followPageScheme(aplicar, {
        light: { '--nd-accent': '#111111' },
        dark: { '--nd-accent': '#eeeeee', '--nd-bg': '#000000' },
      })
      document.documentElement.classList.add('dark')
      await esperar()
      document.documentElement.classList.remove('dark')
      await esperar()
      expect(aplicar.mock.calls[2][0].theme).toEqual({ '--nd-accent': '#111111', '--nd-bg': '' })
      parar()
    })

    it('no repite la llamada si el modo no cambió y deja de observar al parar', async () => {
      const aplicar = vi.fn()
      const parar = followPageScheme(aplicar)
      document.documentElement.classList.add('otra-clase')
      await esperar()
      expect(aplicar).toHaveBeenCalledTimes(1)
      parar()
      document.documentElement.classList.add('dark')
      await esperar()
      expect(aplicar).toHaveBeenCalledTimes(1)
    })

    it('reconoce data-theme y data-bs-theme, y darkClass propia', async () => {
      const aplicar = vi.fn()
      const parar = followPageScheme(aplicar, { darkClass: 'tema-noche' })
      document.documentElement.dataset.bsTheme = 'dark'
      await esperar()
      expect(aplicar.mock.calls.at(-1)?.[0].scheme).toBe('dark')
      document.documentElement.removeAttribute('data-bs-theme')
      document.documentElement.dataset.theme = 'dark'
      await esperar()
      expect(aplicar.mock.calls.at(-1)?.[0].scheme).toBe('dark')
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.add('tema-noche')
      await esperar()
      expect(aplicar.mock.calls.at(-1)?.[0].scheme).toBe('dark')
      parar()
    })

    it("strategy 'media' sigue prefers-color-scheme", () => {
      const original = window.matchMedia
      let cambio: (() => void) | undefined
      let oscuro = true
      window.matchMedia = ((q: string) => ({
        get matches() {
          return q.includes('dark') && oscuro
        },
        addEventListener: (_: string, f: () => void) => (cambio = f),
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia
      const aplicar = vi.fn()
      const parar = followPageScheme(aplicar, { strategy: 'media' })
      expect(aplicar.mock.calls[0][0].scheme).toBe('dark')
      oscuro = false
      cambio?.()
      expect(aplicar.mock.calls[1][0].scheme).toBe('light')
      parar()
      window.matchMedia = original
    })
  })
})

describe('i18n', () => {
  it('fmt reemplaza {0} y {1}', () => {
    expect(fmt('Paso {0} de {1}', 2, 4)).toBe('Paso 2 de 4')
  })
})

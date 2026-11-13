import { afterEach, describe, expect, it, vi } from 'vitest'

// site/src/textos.ts toma el idioma de <html lang> al cargarse y resuelve los textos con nexus-i18n.
const cargar = async (lang: string) => {
  document.documentElement.lang = lang
  vi.resetModules()
  return import('../../site/src/textos')
}

afterEach(() => {
  document.documentElement.lang = ''
})

describe('textos del sitio (nexus-i18n)', () => {
  it.each([
    ['es', 'Buscar'],
    ['en', 'Search'],
    ['pt', 'Buscar'],
    ['fr', 'Rechercher'],
  ])('en <html lang="%s">, buscar = %s', async (lang, esperado) => {
    const { idioma, t } = await cargar(lang)
    expect(idioma).toBe(lang)
    expect(t('buscar')).toBe(esperado)
  })
  it('una variante regional usa su idioma base', async () => {
    const { idioma, t } = await cargar('en-US')
    expect(idioma).toBe('en')
    expect(t('cargando')).toBe('Loading…')
  })
  it('un idioma desconocido o sin lang cae a español', async () => {
    expect((await cargar('de')).idioma).toBe('es')
    expect((await cargar('')).idioma).toBe('es')
  })
  it('interpola {n}', async () => {
    const { t } = await cargar('en')
    expect(t('nResultados', 3)).toBe('3 results')
  })
})

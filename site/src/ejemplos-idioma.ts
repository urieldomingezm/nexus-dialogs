// Los ejemplos en el idioma de la página: inglés tiene su propio archivo (mismos ids y funciones); el resto usa el español.
// Se cargan al momento para que cada página descargue solo el suyo.
import { idioma } from './textos'
import type * as Es from './ejemplos-def'

const en = idioma === 'en'
export const fuente: string = en ? (await import('./ejemplos-def.en.ts?raw')).default : (await import('./ejemplos-def.ts?raw')).default
export const funciones = (en ? await import('./ejemplos-def.en') : await import('./ejemplos-def')) as unknown as typeof Es

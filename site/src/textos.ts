// Textos de la interfaz que el sitio escribe desde JavaScript (los de las páginas salen del build: site/idiomas.mjs).
// El idioma es el de la página: <html lang="en"> → inglés. Lo que falte en un idioma sale en español.
export type Idioma = 'es' | 'en' | 'pt' | 'fr'
export const IDIOMAS: Idioma[] = ['es', 'en', 'pt', 'fr']

const leer = (): Idioma => {
  const l = (document.documentElement.lang || 'es').slice(0, 2) as Idioma
  return IDIOMAS.includes(l) ? l : 'es'
}
export const idioma: Idioma = leer()

const D = {
  es: {
    tema: 'Tema',
    auto: 'Auto',
    claro: 'Claro',
    oscuro: 'Oscuro',
    copiar: 'Copiar',
    copiarCodigo: 'Copiar el código',
    copiado: 'Copiado',
    noSePudo: 'No se pudo',
    copiarEnlace: 'Copiar enlace',
    volverArriba: 'Volver arriba',
    buscarDoc: 'Buscar en la documentación',
    buscar: 'Buscar',
    buscarPista: 'Buscar en la documentación…',
    resultados: 'Resultados',
    cargando: 'Cargando…',
    sinResultados: 'Sin resultados',
    nResultados: '{n} resultados',
    ayuda: '<kbd>↑</kbd> <kbd>↓</kbd> para moverte · <kbd>Enter</kbd> para abrir · <kbd>Esc</kbd> para cerrar',
  },
  en: {
    tema: 'Theme',
    auto: 'Auto',
    claro: 'Light',
    oscuro: 'Dark',
    copiar: 'Copy',
    copiarCodigo: 'Copy the code',
    copiado: 'Copied',
    noSePudo: 'Could not copy',
    copiarEnlace: 'Copy link',
    volverArriba: 'Back to top',
    buscarDoc: 'Search the documentation',
    buscar: 'Search',
    buscarPista: 'Search the documentation…',
    resultados: 'Results',
    cargando: 'Loading…',
    sinResultados: 'No results',
    nResultados: '{n} results',
    ayuda: '<kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close',
  },
  pt: {
    tema: 'Tema',
    auto: 'Auto',
    claro: 'Claro',
    oscuro: 'Escuro',
    copiar: 'Copiar',
    copiarCodigo: 'Copiar o código',
    copiado: 'Copiado',
    noSePudo: 'Não foi possível',
    copiarEnlace: 'Copiar link',
    volverArriba: 'Voltar ao topo',
    buscarDoc: 'Buscar na documentação',
    buscar: 'Buscar',
    buscarPista: 'Buscar na documentação…',
    resultados: 'Resultados',
    cargando: 'Carregando…',
    sinResultados: 'Sem resultados',
    nResultados: '{n} resultados',
    ayuda: '<kbd>↑</kbd> <kbd>↓</kbd> para mover · <kbd>Enter</kbd> para abrir · <kbd>Esc</kbd> para fechar',
  },
  fr: {
    tema: 'Thème',
    auto: 'Auto',
    claro: 'Clair',
    oscuro: 'Sombre',
    copiar: 'Copier',
    copiarCodigo: 'Copier le code',
    copiado: 'Copié',
    noSePudo: 'Échec de la copie',
    copiarEnlace: 'Copier le lien',
    volverArriba: 'Retour en haut',
    buscarDoc: 'Rechercher dans la documentation',
    buscar: 'Rechercher',
    buscarPista: 'Rechercher dans la documentation…',
    resultados: 'Résultats',
    cargando: 'Chargement…',
    sinResultados: 'Aucun résultat',
    nResultados: '{n} résultats',
    ayuda: '<kbd>↑</kbd> <kbd>↓</kbd> pour naviguer · <kbd>Entrée</kbd> pour ouvrir · <kbd>Échap</kbd> pour fermer',
  },
} as const

export type Clave = keyof (typeof D)['es']
export const t = (k: Clave, n?: number): string => (D[idioma][k] ?? D.es[k]).replace('{n}', String(n ?? ''))

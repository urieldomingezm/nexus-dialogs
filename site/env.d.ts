/// <reference types="vite/client" />

type EntradaIndice = { t: string; p: string; d: string; u: string; g?: 1 }
declare module 'virtual:indice-busqueda/es' {
  const indice: EntradaIndice[]
  export default indice
}
declare module 'virtual:indice-busqueda/en' {
  const indice: EntradaIndice[]
  export default indice
}
declare module 'virtual:indice-busqueda/pt' {
  const indice: EntradaIndice[]
  export default indice
}
declare module 'virtual:indice-busqueda/fr' {
  const indice: EntradaIndice[]
  export default indice
}

// Lee las recetas de ejemplos-def.ts (comentarios `@ejemplo`) y devuelve su código tal cual se muestra. La usan la galería y el playground.

export interface Ejemplo {
  id: string
  grupo: string
  titulo: string
  desc: string
  imports: string
  funcion: string
  codigo: string
}

export function analizar(texto: string): Ejemplo[] {
  const lista: Ejemplo[] = []
  for (const bloque of texto.split('/* @ejemplo').slice(1)) {
    const fin = bloque.indexOf('*/')
    const cabecera = bloque.slice(0, fin)
    const meta: Record<string, string> = {}
    for (const linea of cabecera.split('\n')) {
      const m = /^\s*\*\s*(\w+):\s*(.*)$/.exec(linea)
      if (m) meta[m[1]] = m[2].replace(/\\n/g, '\n')
    }
    const resto = bloque.slice(fin + 2)
    const f = /^\s*export (?:async )?function (\w+)\(\) \{\n([\s\S]*?)\n\}\n/m.exec(resto)
    if (!f) continue
    let cuerpo = f[2]
      .split('\n')
      .map((l) => (l.startsWith('  ') ? l.slice(2) : l))
      .join('\n')
    // El último `return x` se muestra como `console.log(x)`: es lo que aparece en «Resultado».
    const i = cuerpo.lastIndexOf('\nreturn ')
    const ini = cuerpo.startsWith('return ') ? 0 : i >= 0 ? i + 1 : -1
    if (ini >= 0) cuerpo = `${cuerpo.slice(0, ini)}console.log(${cuerpo.slice(ini + 7)})`
    lista.push({
      id: meta.id,
      grupo: meta.grupo,
      titulo: meta.titulo,
      desc: meta.desc,
      imports: meta.import,
      funcion: f[1],
      codigo: `${meta.import}\n\n${cuerpo}`,
    })
  }
  return lista
}

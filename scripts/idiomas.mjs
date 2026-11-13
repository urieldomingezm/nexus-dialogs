// Genera las páginas del sitio en los demás idiomas (site/en, site/pt, site/fr) a partir de las de español.
//   · Páginas de texto (docs/*.md): usan docs/<idioma>/<mismo archivo> si existe; si no, el texto en español con un aviso.
//   · Páginas con diseño propio (portada, ejemplos, playground…): si no hay una versión traducida a mano, copia la de español.
// Una página traducida a mano se deja en site/<idioma>/ SIN la marca <!--@generado--> y este script ya no la toca.
// Uso: npm run idiomas           (crea lo que falta y actualiza lo generado)
//      npm run idiomas:check     (falla si lo generado no está al día; corre en CI)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { IDIOMAS, PAGINAS, pagina as paginaDe } from '../site/idiomas.mjs'

const MARCA = '<!--@generado-->'
const comprobar = process.argv.includes('--check')
const NOTAS = {
  // Párrafos de introducción de la Guía y de la API en cada idioma (los de español están en sus páginas).
  guia: {
    en: 'This text is the repository README, always at the same version as the library (<strong>v<!--@version--></strong>). To see each thing working, go to <a href="ejemplos.html">Examples</a>.',
    pt: 'Este texto é o README do repositório, sempre na mesma versão da biblioteca (<strong>v<!--@version--></strong>). Para ver cada coisa funcionando, vá para <a href="ejemplos.html">Exemplos</a>.',
    fr: 'Ce texte est le README du dépôt, toujours à la même version que la bibliothèque (<strong>v<!--@version--></strong>). Pour voir chaque élément en action, allez à <a href="ejemplos.html">Exemples</a>.',
  },
  api: {
    en: 'Generated from the compiled types (<code>npm run api</code>): what you see here is exactly what each package path exports in version <strong>v<!--@version--></strong>. For explanations and examples, go to the <a href="guia.html">Guide</a>.',
    pt: 'Gerada a partir dos tipos compilados (<code>npm run api</code>): o que você vê aqui é exatamente o que cada rota do pacote exporta na versão <strong>v<!--@version--></strong>. Para explicações e exemplos, vá para o <a href="guia.html">Guia</a>.',
    fr: 'Générée à partir des types compilés (<code>npm run api</code>) : ce que vous voyez ici est exactement ce que chaque chemin du paquet exporte dans la version <strong>v<!--@version--></strong>. Pour des explications et des exemples, allez au <a href="guia.html">Guide</a>.',
  },
}

const desactualizadas = []
function escribir(ruta, contenido) {
  if (existsSync(ruta)) {
    const actual = readFileSync(ruta, 'utf8')
    if (!actual.includes(MARCA)) return // traducida a mano
    if (actual === contenido) return
  }
  if (comprobar) {
    desactualizadas.push(ruta)
    return
  }
  mkdirSync(ruta.replace(/\/[^/]*$/, ''), { recursive: true })
  writeFileSync(ruta, contenido)
}

for (const lang of IDIOMAS.filter((l) => l !== 'es')) {
  for (const [id, archivo] of PAGINAS) {
    let h = readFileSync(`site/${archivo}`, 'utf8')
    const { titulo, desc } = paginaDe(lang, id)
    h = h.replace('<html lang="es">', `<html lang="${lang}">\n  ${MARCA}`)
    h = h.replace(/<script type="module" src="\.\/src\//g, '<script type="module" src="../src/')
    if (id !== 'inicio') {
      h = h.replace(/<title>[^<]*<\/title>/, `<title>${titulo} · nexus-dialogs</title>`)
      if (desc) h = h.replace(/(<meta name="description" content=")[^"]*"/, `$1${desc.replace(/"/g, '&quot;')}"`)
      h = h.replace(/<h1>[^<]*<\/h1>/, `<h1>${titulo}</h1>`)
    }
    let traducida = true
    // Markdown del repositorio: la versión del idioma si existe.
    h = h.replace(/<!--@md:docs\/([\w.-]+)-->/g, (m, f) => {
      if (existsSync(`docs/${lang}/${f}`)) return `<!--@md:docs/${lang}/${f}-->`
      traducida = false
      return m
    })
    if (h.includes('<!--@readme-->') && !existsSync(`README.${lang}.md`)) traducida = false
    if (h.includes('<!--@md:CHANGELOG.md-->')) traducida = false // el historial de cambios solo está en español
    if (h.includes('<!--@api-->')) traducida = true // son tipos: no hay nada que traducir
    if (NOTAS[id]?.[lang] && traducida) h = h.replace(/<p class="nota">[\s\S]*?<\/p>/, `<p class="nota">${NOTAS[id][lang]}</p>`)
    const rica = !h.includes('<main class="doc">')
    if (!traducida || (rica && id !== 'inicio')) {
      // El contenido sigue en español: se marca con su idioma (lectores de pantalla y traductores) y se avisa.
      h = h.replace(/(<\/h1>)/, '$1\n        <!--@aviso:es-->')
      if (!rica) h = h.replace('<article class="contenido" id="contenido">', '<article class="contenido" id="contenido" lang="es">')
      else h = h.replace(/<main(?![^>]*lang=)/, '<main lang="es"')
    }
    escribir(`site/${lang}/${archivo}`, h)
  }
}

if (desactualizadas.length) {
  console.error(`✗ Páginas por idioma desactualizadas (corre \`npm run idiomas\`):\n  ${desactualizadas.join('\n  ')}`)
  process.exit(1)
}
console.log(comprobar ? '✓ Las páginas por idioma están al día' : '✓ Páginas por idioma generadas')

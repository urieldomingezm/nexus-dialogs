// Plugin de Vite para el sitio de documentación: rellena los marcadores de las páginas HTML.
//   <!--@cabecera:guia-->   cabecera con el menú (la página activa va resaltada)
//   <!--@pie-->             pie de página
//   <!--@readme-->          README.md convertido a HTML (sin el índice, que lo reemplaza el menú lateral)
//   <!--@api-->             api/nexus-dialogs.api.md convertido a HTML
//   <!--@md:docs/archivo.md-->  un Markdown del repositorio convertido a HTML (sin su título de nivel 1)
//   <!--@version-->         versión de package.json
//   <!--@tam:forms-->       tamaño min+gzip de dist/forms.js (necesita `npm run build` antes); `a+b` suma varios archivos
import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { transformSync } from 'esbuild'
import { Marked } from 'marked'

const REPO = 'https://github.com/urieldomingezm/nexus-dialogs'
const NPM = 'https://www.npmjs.com/package/nexus-dialogs'
// Dirección pública del sitio (GitHub Pages). Se usa para las etiquetas Open Graph, el sitemap y el canónico;
// cámbiala con la variable SITE_URL si el sitio vive en otro dominio.
const SITE = (process.env.SITE_URL || 'https://urieldomingezm.github.io/nexus-dialogs').replace(/\/$/, '')
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')
const pkg = JSON.parse(leer('../package.json'))

const MENU = [
  ['inicio', 'index.html', 'Inicio'],
  ['primeros-pasos', 'primeros-pasos.html', 'Primeros pasos'],
  ['guia', 'guia.html', 'Guía'],
  ['ejemplos', 'ejemplos.html', 'Ejemplos'],
  ['erp', 'erp.html', 'Mini ERP'],
  ['migracion', 'migracion.html', 'Migrar'],
  ['api', 'api.html', 'API'],
]

/** Dirección sin extensión: `ejemplos.html` → `ejemplos` y `index.html` → la raíz. GitHub Pages sirve `/ejemplos` con `ejemplos.html`. */
const sinExtension = (f) => (f === 'index.html' ? '' : f.replace(/\.html$/, ''))

/**
 * Enlaces del sitio sin «.html» (solo en el build): `href="ejemplos.html#alerta"` → `href="ejemplos#alerta"`, `index.html` → `./`, y lo
 * mismo con las direcciones absolutas del propio sitio que traen el README y los Markdown (esos siguen con `.html` en GitHub y npm,
 * donde también funcionan). Las direcciones con `.html` viejas siguen abriendo: GitHub Pages sirve las dos.
 */
export function limpiarEnlaces(html, sitio = SITE) {
  const base = sitio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return html
    .replace(/href="([\w-]+)\.html(#[^"]*)?"/g, (_, n, h = '') => `href="${n === 'index' ? './' : n}${h}"`)
    .replace(new RegExp(`href="${base}/([\\w-]+)\\.html(#[^"]*)?"`, 'g'), (_, n, h = '') => `href="${sitio}/${n === 'index' ? '' : n}${h}"`)
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Misma regla que usa GitHub para los anclajes: así los enlaces del índice del README siguen funcionando. */
export const slug = (texto) =>
  texto
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

function enlace(href) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href
  if (href.endsWith('api/nexus-dialogs.api.md')) return 'api.html'
  return `${REPO}/blob/main/${href.replace(/^\.\//, '')}`
}

function markdown() {
  const m = new Marked({ gfm: true })
  const usados = new Map()
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const texto = tokens.map((t) => t.raw ?? t.text ?? '').join('')
        let id = slug(texto)
        const n = usados.get(id) ?? 0
        usados.set(id, n + 1)
        if (n) id += `-${n}`
        return `<h${depth} id="${id}"><a class="ancla" href="#${id}" aria-label="Enlace a esta sección">#</a>${html}</h${depth}>\n`
      },
      code({ text, lang }) {
        const l = (lang ?? '').split(/\s/)[0] || 'txt'
        return `<pre data-lang="${escapar(l)}"><code class="language-${escapar(l)}">${escapar(text)}</code></pre>\n`
      },
      table(t) {
        const cab = t.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('')
        const filas = t.rows.map((f) => `<tr>${f.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('')
        return `<div class="tabla"><table><thead><tr>${cab}</tr></thead><tbody>${filas}</tbody></table></div>\n`
      },
      link({ href, title, tokens }) {
        const h = enlace(href)
        const externo = /^https?:/.test(h)
        return `<a href="${escapar(h)}"${title ? ` title="${escapar(title)}"` : ''}${externo ? ' rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`
      },
    },
  })
  return m
}

/** README sin la cabecera centrada (la reemplaza la portada) y sin el índice (lo reemplaza el menú lateral). */
function readmeHtml() {
  let md = leer('../README.md')
  md = md.replace(/^<div align="center">[\s\S]*?<\/div>\s*---\s*/, '')
  md = md.replace(/## Índice[\s\S]*?(?=\n## 1\.)/, '')
  return markdown().parse(md)
}

function apiHtml() {
  let md = leer('../api/nexus-dialogs.api.md').replace(/^# .*\n/, '')
  md = md.replace(/^>.*\n?/gm, '')
  return markdown().parse(md)
}

/** Cualquier archivo Markdown del repositorio (por ejemplo docs/accesibilidad.md) convertido a HTML. */
function mdHtml(ruta) {
  return markdown().parse(leer(`../${ruta}`).replace(/^# .*\n/, ''))
}

const tamano = (ruta) => {
  if (!existsSync(ruta)) return null
  const min = transformSync(readFileSync(ruta, 'utf8'), { minify: true, format: 'esm' }).code
  return gzipSync(min).length / 1024
}
const kb = (n) => (n === null ? '—' : `${n.toFixed(1)} KB`)

function cabecera(activa) {
  const enlaces = MENU.map(
    ([id, href, texto]) => `<a href="${href}"${id === activa ? ' aria-current="page"' : ''}>${texto}</a>`,
  ).join('')
  return `<header class="cabecera">
  <a class="marca" href="index.html"><span class="logo"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g transform="rotate(-6 32 32)"><rect x="5" y="5" width="54" height="54" rx="12" fill="#6D28D9" stroke="#1A1033" stroke-width="5"/><text x="32" y="41" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="900" font-size="22" fill="#FFFFFF">&lt;/&gt;</text></g></svg></span>nexus-dialogs</a>
  <button type="button" class="menu-btn" aria-expanded="false" aria-controls="menu-principal" aria-label="Menú"><span aria-hidden="true"></span></button>
  <nav id="menu-principal" aria-label="Principal">${enlaces}<a class="solo-movil" href="${REPO}" rel="noopener">GitHub</a><a class="solo-movil" href="${NPM}" rel="noopener">npm</a></nav>
  <div class="herr">
    <a class="ico-enlace" href="${REPO}" rel="noopener">GitHub</a>
    <a class="ico-enlace" href="${NPM}" rel="noopener">npm</a>
    <button type="button" class="tema" data-tema title="Cambiar entre automático, claro y oscuro"></button>
  </div>
</header>`
}

const ICONO =
  '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Cg transform=%27rotate%28-6 32 32%29%27%3E%3Crect x=%275%27 y=%275%27 width=%2754%27 height=%2754%27 rx=%2712%27 fill=%27%236D28D9%27 stroke=%27%231A1033%27 stroke-width=%275%27/%3E%3Ctext x=%2732%27 y=%2741%27 text-anchor=%27middle%27 font-family=%27ui-monospace,Menlo,Consolas,monospace%27 font-weight=%27900%27 font-size=%2722%27 fill=%27%23FFFFFF%27%3E%26lt%3B/%26gt%3B%3C/text%3E%3C/g%3E%3C/svg%3E" />'

const pie = () => `<footer class="pie">
  <p><strong>nexus-dialogs</strong> v${pkg.version}. Licencia MIT. Hecho por <a class="firma" href="https://devmedina.is-a.dev/" rel="noopener"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g transform="rotate(-6 32 32)"><rect x="5" y="5" width="54" height="54" rx="12" fill="#6D28D9" stroke="#1A1033" stroke-width="5"/><text x="32" y="41" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-weight="900" font-size="22" fill="#FFFFFF">&lt;/&gt;</text></g></svg>DevMedina</a>, rama de librerías de Nexus.</p>
  <nav aria-label="Pie de página">
    <a href="${REPO}" rel="noopener">Código</a>
    <a href="${NPM}" rel="noopener">npm</a>
    <a href="novedades.html">Novedades</a>
    <a href="arquitectura.html">Arquitectura</a>
    <a href="seguridad.html">Seguridad</a>
    <a href="limitaciones.html">Limitaciones</a>
    <a href="contratos.html">Contratos</a>
    <a href="swal-compat.html">Compatibilidad SweetAlert2</a>
    <a href="accesibilidad.html">Accesibilidad</a>
    <a href="migracion.html">Migrar de SweetAlert2</a>
    <a href="${REPO}/issues" rel="noopener">Reportar un problema</a>
  </nav>
</footer>`

const atributo = (html, rx) => html.match(rx)?.[1]

/** Etiquetas para compartir el enlace (Open Graph y Twitter), canónico y color de la barra del navegador. */
function metaSocial(html, pagina) {
  const titulo = atributo(html, /<title>([\s\S]*?)<\/title>/)
  const desc = atributo(html, /<meta name="description" content="([^"]*)"/)
  if (!titulo || !desc) return ''
  const url = `${SITE}/${sinExtension(pagina)}`
  return `
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#f1ecf9" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#16111f" media="(prefers-color-scheme: dark)" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="nexus-dialogs" />
    <meta property="og:locale" content="es_MX" />
    <meta property="og:title" content="${titulo}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="nexus-dialogs: diálogos, formularios y asistentes para sistemas de empresa" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${titulo}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${SITE}/og.png" />`
}

/** Columna derecha de las páginas de texto largo: dónde editar la página, versión y tamaño del núcleo. */
function riel(html, pagina) {
  const md = atributo(html, /<!--@md:([\w./-]+)-->/)
  const origen = md ?? (html.includes('<!--@readme-->') ? 'README.md' : html.includes('<!--@api-->') ? null : `site/${pagina}`)
  const nucleo = tamano('dist/nexus-dialogs.js')
  return `<aside class="riel" aria-label="Sobre esta página">
        <p class="riel-t">Esta página</p>
        <ul>
          ${origen ? `<li><a href="${REPO}/edit/main/${origen}" rel="noopener">Editar en GitHub</a></li>` : ''}
          <li><a href="${REPO}/issues/new" rel="noopener">Reportar un problema</a></li>
          <li><a href="${REPO}/blob/main/CHANGELOG.md" rel="noopener">Historial de cambios</a></li>
        </ul>
        <p class="riel-t">Versión</p>
        <p class="riel-v">v${pkg.version}${nucleo === null ? '' : `<br />núcleo ${kb(nucleo)} gzip`}</p>
      </aside>`
}

export function docsPlugin() {
  return [
    {
      name: 'nexus-dialogs-docs',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!html.includes('<!--@')) return html
          const pagina = (ctx?.path ?? '/index.html').split('/').pop() || 'index.html'
          const conRiel = html.includes('<main class="doc">')
          let salida = html
            .replace(/<!--@md:([\w./-]+)-->/g, (_, ruta) => mdHtml(ruta))
            .replace('</head>', `    ${ICONO}${metaSocial(html, pagina)}\n  </head>`)
            .replace(/<!--@cabecera:([\w-]+)-->/g, (_, id) => cabecera(id))
            .replace(/<!--@pie-->/g, pie())
            .replace(/<!--@readme-->/g, () => readmeHtml())
            .replace(/<!--@api-->/g, () => apiHtml())
            .replace(/<!--@version-->/g, pkg.version)
            .replace(/<!--@tam:([\w.+-]+)-->/g, (_, a) => kb(a.split('+').map((x) => tamano(`dist/${x}.js`)).reduce((s, n) => (s === null || n === null ? null : s + n), 0)))
          if (conRiel) {
            salida = salida.replace('<main class="doc">', '<main class="doc con-riel">').replace('</article>', `</article>\n      ${riel(html, pagina)}`)
          }
          return salida
        },
      },
    },
    {
      // Enlaces sin «.html» en el sitio publicado (ver limpiarEnlaces).
      name: 'nexus-dialogs-urls-limpias',
      apply: 'build',
      transformIndexHtml: { order: 'post', handler: (html) => limpiarEnlaces(html) },
    },
    {
      // Precarga las fuentes del texto (latín) para que no parpadee el cambio de tipografía.
      name: 'nexus-dialogs-fuentes',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(_html, ctx) {
          const fuentes = Object.keys(ctx?.bundle ?? {}).filter((f) => /(outfit|onest)-latin-wght-normal.*\.woff2$/.test(f))
          return fuentes.map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `./${f}` },
            injectTo: 'head',
          }))
        },
      },
    },
    {
      // sitemap.xml y robots.txt con las páginas que salen en el build.
      name: 'nexus-dialogs-sitemap',
      apply: 'build',
      enforce: 'post',
      generateBundle(_o, bundle) {
        const paginas = Object.keys(bundle).filter((f) => f.endsWith('.html')).sort()
        if (!paginas.length) return
        const fecha = new Date().toISOString().slice(0, 10)
        const urls = paginas.map((f) => `  <url><loc>${SITE}/${sinExtension(f)}</loc><lastmod>${fecha}</lastmod></url>`).join('\n')
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` })
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` })
      },
    },
  ]
}

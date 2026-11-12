import { cssEnPlantillas } from './scripts/css-en-plantillas.mjs'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { docsPlugin } from './site/plugin-docs.mjs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const define = { __VERSION__: JSON.stringify(version) }

const src = (f) => fileURLToPath(new URL(`./src/${f}`, import.meta.url))
// Lo más específico primero: 'nexus-dialogs' también coincidiría con 'nexus-dialogs/toast'.
const ALIAS = { 'nexus-dialogs/toast': src('toast.ts'), 'nexus-dialogs/forms': src('forms.ts'), 'nexus-dialogs': src('index.ts') }
// El sitio de documentación y las páginas de prueba usan todas las rutas desde el código fuente.
const ALIAS_TODAS = Object.fromEntries([
  ...['patterns', 'mx', 'themes', 'import', 'table', 'tabs', 'timeline', 'sepomex', 'rrhh', 'swal'].map((m) => [
    `nexus-dialogs/${m}`,
    src(`${m}.ts`),
  ]),
  ...Object.entries(ALIAS),
])

// Un build por modo. `npm run build` los corre todos. forms depende del núcleo como paquete externo
// para compartir la misma configuración (configure) y la misma pila de diálogos.
const LIBS = {
  core: { entry: 'src/index.ts', name: 'NexusDialogs', fileName: 'nexus-dialogs', formats: ['es', 'umd'], external: [] },
  all: { entry: 'src/global.ts', name: 'NexusDialogs', fileName: 'nexus-dialogs.all', formats: ['es', 'iife'], external: [] },
  forms: { entry: 'src/forms.ts', name: 'NexusDialogsForms', fileName: 'forms', formats: ['es', 'cjs'], external: ['nexus-dialogs'] },
  toast: { entry: 'src/toast.ts', name: 'NexusDialogsToast', fileName: 'toast', formats: ['es', 'cjs'], external: [] },
  themes: { entry: 'src/themes.ts', name: 'NexusDialogsThemes', fileName: 'themes', formats: ['es', 'umd'], external: [] },
  patterns: {
    entry: 'src/patterns.ts',
    name: 'NexusDialogsPatterns',
    fileName: 'patterns',
    formats: ['es', 'cjs'],
    external: ['nexus-dialogs'],
  },
  mx: { entry: 'src/mx.ts', name: 'NexusDialogsMx', fileName: 'mx', formats: ['es', 'umd'], external: [] },
  vue: {
    entry: 'src/vue.ts',
    name: 'NexusDialogsVue',
    fileName: 'vue',
    formats: ['es', 'cjs'],
    external: ['vue', 'nexus-dialogs', 'nexus-dialogs/toast'],
  },
  angular: {
    entry: 'src/angular.ts',
    name: 'NexusDialogsAngular',
    fileName: 'angular',
    // @angular/core solo se publica como ESM: no hay versión CJS.
    formats: ['es'],
    external: ['@angular/core', 'nexus-dialogs', 'nexus-dialogs/toast', 'nexus-dialogs/forms'],
  },
  react: {
    entry: 'src/react.ts',
    name: 'NexusDialogsReact',
    fileName: 'react',
    formats: ['es', 'cjs'],
    external: ['react', 'nexus-dialogs', 'nexus-dialogs/toast', 'nexus-dialogs/forms'],
  },
  swal: {
    entry: 'src/swal.ts',
    name: 'NexusDialogsSwal',
    fileName: 'swal',
    formats: ['es', 'cjs'],
    external: ['nexus-dialogs', 'nexus-dialogs/toast'],
  },
  import: { entry: 'src/import.ts', name: 'NexusDialogsImport', fileName: 'import', formats: ['es', 'cjs'], external: ['nexus-dialogs'] },
  table: { entry: 'src/table.ts', name: 'NexusDialogsTable', fileName: 'table', formats: ['es', 'cjs'], external: ['nexus-dialogs'] },
  tabs: { entry: 'src/tabs.ts', name: 'NexusDialogsTabs', fileName: 'tabs', formats: ['es', 'cjs'], external: ['nexus-dialogs'] },
  timeline: {
    entry: 'src/timeline.ts',
    name: 'NexusDialogsTimeline',
    fileName: 'timeline',
    formats: ['es', 'cjs'],
    external: ['nexus-dialogs'],
  },
  sepomex: { entry: 'src/sepomex.ts', name: 'NexusDialogsSepomex', fileName: 'sepomex', formats: ['es', 'cjs'], external: [] },
  rrhh: { entry: 'src/rrhh.ts', name: 'NexusDialogsRRHH', fileName: 'rrhh', formats: ['es', 'cjs'], external: [] },
  swalglobal: { entry: 'src/swal-global.ts', name: 'Swal', fileName: 'nexus-dialogs.swal', formats: ['iife'], external: [] },
}

export default defineConfig(({ mode, command }) => {
  const lib = LIBS[mode]
  if (command === 'build' && lib) {
    return {
      define,
      plugins: [cssEnPlantillas()],
      resolve: mode === 'all' || mode === 'swalglobal' ? { alias: ALIAS } : undefined,
      build: {
        lib: { entry: lib.entry, name: lib.name, fileName: lib.fileName, formats: lib.formats },
        rollupOptions: { external: lib.external, output: mode === 'swal' ? { exports: 'named' } : undefined },
        emptyOutDir: mode === 'core',
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
      },
    }
  }
  // Sitio de documentación: `npm run build:site` → site-dist/ (rutas relativas: sirve en GitHub Pages bajo cualquier ruta).
  if (command === 'build' && mode === 'site') {
    const paginas = [
      'index',
      'guia',
      'ejemplos',
      'erp',
      'migracion',
      'accesibilidad',
      'seguridad',
      'arquitectura',
      'limitaciones',
      'swal-compat',
      'contratos',
      'api',
    ]
    return {
      root: 'site',
      base: './',
      define,
      plugins: [docsPlugin()],
      resolve: { alias: ALIAS_TODAS },
      build: {
        outDir: '../site-dist',
        emptyOutDir: true,
        target: 'es2022',
        rollupOptions: { input: Object.fromEntries(paginas.map((p) => [p, fileURLToPath(new URL(`./site/${p}.html`, import.meta.url))])) },
      },
    }
  }
  // Servidor de desarrollo y pruebas: todo desde el código fuente (el plugin solo actúa en las páginas del sitio).
  return { define, plugins: [docsPlugin(), cssEnPlantillas()], resolve: { alias: ALIAS_TODAS } }
})

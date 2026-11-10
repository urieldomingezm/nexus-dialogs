import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const define = { __VERSION__: JSON.stringify(version) }

const src = (f) => fileURLToPath(new URL(`./src/${f}`, import.meta.url))
const ALIAS = { 'nexus-dialogs': src('index.ts') }

// Un build por modo. `npm run build` los corre todos. forms depende del núcleo como paquete externo
// para compartir la misma configuración (configure) y la misma pila de diálogos.
const LIBS = {
  core: { entry: 'src/index.ts', name: 'NexusDialogs', fileName: 'nexus-dialogs', formats: ['es', 'umd'], external: [] },
  all: { entry: 'src/global.ts', name: 'NexusDialogs', fileName: 'nexus-dialogs.all', formats: ['es', 'iife'], external: [] },
  forms: { entry: 'src/forms.ts', name: 'NexusDialogsForms', fileName: 'forms', formats: ['es', 'cjs'], external: ['nexus-dialogs'] },
  toast: { entry: 'src/toast.ts', name: 'NexusDialogsToast', fileName: 'toast', formats: ['es', 'cjs'], external: [] },
  themes: { entry: 'src/themes.ts', name: 'NexusDialogsThemes', fileName: 'themes', formats: ['es', 'umd'], external: [] },
}

export default defineConfig(({ mode, command }) => {
  const lib = LIBS[mode]
  if (command === 'build' && lib) {
    return {
      define,
      resolve: mode === 'all' ? { alias: ALIAS } : undefined,
      build: {
        lib: { entry: lib.entry, name: lib.name, fileName: lib.fileName, formats: lib.formats },
        rollupOptions: { external: lib.external },
        emptyOutDir: mode === 'core',
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
      },
    }
  }
  // Servidor de desarrollo y pruebas: todo desde el código fuente.
  return { define, resolve: { alias: ALIAS } }
})

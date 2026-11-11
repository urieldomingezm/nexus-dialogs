// Pruebas unitarias con happy-dom: npm run test:unit
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  define: { __VERSION__: JSON.stringify('0.0.0-test') },
  resolve: {
    alias: {
      'nexus-dialogs/forms': fileURLToPath(new URL('./src/forms.ts', import.meta.url)),
      'nexus-dialogs/toast': fileURLToPath(new URL('./src/toast.ts', import.meta.url)),
      'nexus-dialogs': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/unit/**/*.test.ts'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/global.ts', 'src/swal-global.ts', 'src/styles.ts'],
      thresholds: { lines: 89, functions: 85, branches: 76, statements: 86 },
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
})

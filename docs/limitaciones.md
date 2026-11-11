Lo que nexus-dialogs **no** hace, con qué navegadores se prueba, cómo se versiona y cuánto del código cubren las pruebas. Lo mejor de una librería que se quiere usar en serio es que diga con claridad hasta dónde llega.

## En una frase

nexus-dialogs es una **biblioteca de interfaces transaccionales para aplicaciones empresariales**: la parte de tu sistema donde alguien confirma, captura, aprueba, importa o corrige datos. No es un sistema de diseño, ni un gestor de estado, ni una tabla de datos completa.

## Limitaciones conocidas

- **Lectores de pantalla sin probar a mano.** Hay pruebas automáticas (axe, teclado, foco, zoom, contraste), pero NVDA, JAWS, VoiceOver y TalkBack están **pendientes**. Ver [Accesibilidad](https://urieldomingezm.github.io/nexus-dialogs/accesibilidad.html).
- **Sin casos públicos en producción todavía.** La librería está pensada para sistemas reales y se está probando dentro de Nexus, pero aún no hay un caso externo que lo respalde.
- **Los diálogos se apilan, no se encolan.** Dos `dialog.alert` seguidos se muestran uno encima de otro, no uno después de otro. Si necesitas una cola, espera la promesa del primero.
- **Solo en el navegador.** Importar la librería en Node (SSR) funciona; abrir un diálogo ahí falla con un error explícito. Los validadores de `nexus-dialogs/mx` sí corren en Node.
- **El contenido vive en un Shadow DOM.** Tu CSS no lo afecta (se personaliza con temas y variables `--nd-*`) y `document.querySelector` no lo ve. Playwright y Cypress lo atraviesan; Testing Library necesita `within(host.shadowRoot)`.
- **Subida de archivos sin cancelación.** El campo `file` muestra progreso y reintento, pero no puede abortar una subida en curso: si cierras el diálogo, tu función `upload` sigue hasta terminar.
- **Excel, solo lo básico.** Se lee la primera hoja como texto y fechas; no hay fórmulas, estilos ni varias hojas. Al exportar se escribe una hoja con encabezados, números, fechas y anchos.
- **La exportación a Excel no se ha abierto en Microsoft Excel**, solo en LibreOffice. Ver [Seguridad](https://urieldomingezm.github.io/nexus-dialogs/seguridad.html).
- **Los toasts comparten posición.** Hay una sola cola y una sola posición para todos.
- **Idiomas: español e inglés.** Más idiomas se agregan con `labels`.
- **Códigos postales (`sepomex`)** necesitan que publiques tú los archivos JSON del catálogo.
- **Borradores en `localStorage`.** Las contraseñas y los archivos nunca se guardan; si el almacenamiento falla o está lleno, el formulario sigue funcionando sin borrador.
- **Angular, solo ESM y 16 o más.** React 18 o más; Vue 3.3 o más.
- **Compatibilidad con SweetAlert2 parcial a propósito.** Ver la [matriz](https://urieldomingezm.github.io/nexus-dialogs/swal-compat.html).

## Navegadores

| Navegador | Mínimo | Pruebas |
|---|---|---|
| Chrome / Edge | 111 | Chromium actual en cada cambio |
| Firefox | 113 | Firefox actual en cada cambio (axe no corre en Firefox por una limitación de la herramienta) |
| Safari | 16.4 | WebKit actual en cada cambio |

Los mínimos salen de `<dialog>` modal, `color-mix()` y las hojas de estilo construibles; sin estas últimas se usa un `<style>` de respaldo (con CSP estricta, necesita `configure({ nonce })`). No se prueban versiones viejas por separado. No hay soporte para Internet Explorer.

## Versiones y cambios que rompen

La librería sigue [SemVer](https://semver.org/lang/es/):

- **0.x (hoy).** Una versión menor (`0.4` → `0.5`) puede traer cambios que rompen. **Siempre** aparecen en el CHANGELOG bajo «Cambios que rompen», con cómo migrar.
- **Desde la 1.0.** Solo una versión mayor rompe. Antes de quitar algo se marca como obsoleto una versión menor antes y se avisa en el CHANGELOG.
- **Qué cuenta como romper:** quitar o renombrar una exportación pública, cambiar lo que devuelve una función ([contratos](https://urieldomingezm.github.io/nexus-dialogs/contratos.html)), cambiar un valor por omisión que altera el resultado (por ejemplo, `strictHtml`), subir el mínimo de un navegador o de un framework.
- **Qué no cuenta:** el aspecto exacto (colores, espacios) dentro de lo que pide el estándar de botones y la accesibilidad, correcciones de errores y de seguridad, y lo que no está en la API pública (`api/nexus-dialogs.api.md`).
- **Cómo se vigila:** `npm run api:check` falla si la API pública cambia sin actualizar su reporte, y `test/tipos/contratos.ts` fija lo que devuelve cada función.
- **Correcciones de seguridad:** solo en la última versión publicada. Ver `SECURITY.md`.

## Cobertura de pruebas

Cobertura de las pruebas unitarias (Vitest, medida en la última revisión): **líneas 90 %, sentencias 88 %, funciones 87 %, ramas 79 %**. El CI falla si baja de los umbrales (89 / 86 / 85 / 76). A eso se suman las pruebas en navegador real (Playwright, Chromium, Firefox y WebKit) que no cuentan en ese porcentaje: accesibilidad, teclado, CSP, Trusted Types, fugas de memoria y el sitio de documentación.

La cobertura mide qué líneas se ejecutan, no que estén bien probadas; por eso las pruebas de casos extremos (`extremos`, `auditoria`, `seguridad`, `exportacion`) se escriben a partir de lo que puede salir mal, no de lo que falta cubrir.

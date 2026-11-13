Lo que nexus-dialogs **no** hace, con qué navegadores se prueba, cómo se versiona y cuánto del código cubren las pruebas. Lo mejor de una librería que se quiere usar en serio es que diga con claridad hasta dónde llega.

## En una frase

nexus-dialogs es una **biblioteca de interfaces transaccionales para aplicaciones empresariales**: la parte de tu sistema donde alguien confirma, captura, aprueba, importa o corrige datos. No es un sistema de diseño, ni un gestor de estado, ni una tabla de datos completa.

## Limitaciones conocidas

- **Lectores de pantalla sin probar a mano.** Hay pruebas automáticas (axe, teclado, foco, zoom, contraste), pero NVDA, JAWS, VoiceOver y TalkBack están **pendientes**. Ver [Accesibilidad](https://urieldomingezm.github.io/nexus-dialogs/accesibilidad.html).
- **Sin casos públicos en producción todavía.** La librería está pensada para sistemas reales y se está probando dentro de Nexus; hay un caso interno de producción sin nombre, pero aún no hay un caso externo público que lo respalde. Ver [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html#uso-en-producción).
- **Los diálogos se apilan, no se encolan.** Dos `dialog.alert` seguidos se muestran uno encima de otro, no uno después de otro. Si necesitas una cola, espera la promesa del primero.
- **Solo en el navegador.** Importar la librería en Node (SSR) funciona; abrir un diálogo ahí falla con un error explícito. Los validadores de `nexus-dialogs/mx` sí corren en Node.
- **El contenido vive en un Shadow DOM.** Tu CSS no lo afecta (se personaliza con temas y variables `--nd-*`) y `document.querySelector` no lo ve. Playwright y Cypress lo atraviesan; Testing Library necesita `within(host.shadowRoot)`.
- **Subida de archivos sin cancelación.** El campo `file` muestra progreso y reintento, pero no puede abortar una subida en curso: si cierras el diálogo, tu función `upload` sigue hasta terminar.
- **Excel, solo lo básico.** Se lee la primera hoja como texto y fechas; no hay fórmulas, estilos ni varias hojas. Al exportar se escribe una hoja con encabezados, números, fechas y anchos.
- **La exportación a Excel no se ha abierto en Microsoft Excel**, solo en LibreOffice. Ver [Seguridad](https://urieldomingezm.github.io/nexus-dialogs/seguridad.html).
- **Los toasts comparten posición.** Hay una sola cola y una sola posición para todos.
- **Idiomas: español e inglés de serie.** Portugués y francés vienen en `nexus-dialogs/locales`; más idiomas se agregan con `registerLanguage` o `labels`.
- **Códigos postales (`sepomex`)** necesitan que publiques tú los archivos JSON del catálogo.
- **Borradores en `localStorage`.** Las contraseñas y los archivos nunca se guardan; si el almacenamiento falla o está lleno, el formulario sigue funcionando sin borrador.
- **Angular, solo ESM y 16 o más.** React 18 o más; Vue 3.3 o más.
- **Compatibilidad con SweetAlert2 parcial a propósito.** Ver la [matriz](https://urieldomingezm.github.io/nexus-dialogs/swal-compat.html).

## Garantías por módulo

Desde la 1.0, todos los módulos siguen el versionado semántico: solo una versión mayor rompe (ver [Versiones](https://urieldomingezm.github.io/nexus-dialogs/versiones.html)). Esta tabla dice qué tan asentado está cada módulo y qué limitación lo condiciona, no que esté validado por usuarios externos (ver arriba: aún no hay casos públicos en producción).

- **Estable**: lleva tres o más versiones menores, su API está fijada en el reporte (`npm run api:check`) y en los contratos de tipos, y las pruebas unitarias y de navegador lo cubren.
- **En maduración**: más reciente, con menos uso, o con una limitación que lo condiciona. Úsalo, pero lee su limitación y fija la versión.
- **Parcial**: cubre una parte a propósito.

| Módulo | Estado | Desde | Limitación principal |
|---|---|---|---|
| `nexus-dialogs` (núcleo) | Estable | 0.1.0 | Los diálogos se apilan, no se encolan; solo en el navegador |
| `forms` | Estable | 0.1.0 | Borradores en `localStorage`; la subida de archivos no se puede cancelar |
| `toast` | Estable | 0.1.0 | Una sola cola y una sola posición |
| `themes` | Estable | 0.1.0 | Se personaliza con variables `--nd-*`, no con tu CSS (Shadow DOM) |
| `patterns` | Estable | 0.1.0 | Textos en español e inglés; más idiomas con `labels` |
| `mx` | Estable | 0.1.0 | El RFC no calcula la homoclave y nada consulta al SAT, IMSS ni bancos |
| `vue` | En maduración | 0.3.0 | Vue 3.3 o más |
| `react` | En maduración | 0.4.0 | React 18 o más |
| `angular` | En maduración | 0.3.0 | Solo ESM y Angular 16 o más |
| `swal` | Parcial | 0.3.0 | Compatible a propósito solo en parte: ver la [matriz](https://urieldomingezm.github.io/nexus-dialogs/swal-compat.html). El `html` sale como texto por omisión |
| `import` (importar y exportar) | En maduración | 0.4.0 | Excel solo lo básico; la exportación no se ha abierto en Microsoft Excel, solo en LibreOffice |
| `table` | En maduración | 0.4.0 | Elegir filas, no es una tabla de datos completa |
| `rrhh` | En maduración | 0.4.0 | Plantillas en JSON que tú adaptas a tus reglas; hay que dar los `resolvers` |
| `sepomex` | En maduración | 0.4.0 | Tú publicas los archivos JSON del catálogo |
| `tabs` | En maduración | 0.5.0 | Nuevo: pestañas con contenido en texto, nodo o función |
| `timeline` | En maduración | 0.5.0 | Nuevo: seguimiento por etapas |

La accesibilidad tiene su propia nota: hay pruebas automáticas, pero los lectores de pantalla están pendientes de validar a mano (ver [Accesibilidad](https://urieldomingezm.github.io/nexus-dialogs/accesibilidad.html)).

## Navegadores

| Navegador | Mínimo | Pruebas |
|---|---|---|
| Chrome / Edge | 111 | Chromium actual en cada cambio |
| Firefox | 113 | Firefox actual en cada cambio (axe no corre en Firefox por una limitación de la herramienta) |
| Safari | 16.4 | WebKit actual en cada cambio |

Los mínimos salen de `<dialog>` modal, `color-mix()` y las hojas de estilo construibles; sin estas últimas se usa un `<style>` de respaldo (con CSP estricta, necesita `configure({ nonce })`). No se prueban versiones viejas por separado. No hay soporte para Internet Explorer. Qué función exige qué versión y la política de soporte: [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html).

## Versiones y cambios que rompen

La librería sigue [SemVer](https://semver.org/lang/es/):

- **Desde la 1.0 (hoy).** Solo una versión mayor rompe. Antes de quitar algo se marca como obsoleto una versión menor antes y se avisa en el CHANGELOG.
- **Antes (0.x).** Una versión menor (`0.4` → `0.5`) podía traer cambios que rompen; aparecen en el CHANGELOG bajo «Cambios que rompen», con cómo migrar.
- **Qué cuenta como romper:** quitar o renombrar una exportación pública, cambiar lo que devuelve una función ([contratos](https://urieldomingezm.github.io/nexus-dialogs/contratos.html)), cambiar un valor por omisión que altera el resultado (por ejemplo, `strictHtml`), subir el mínimo de un navegador o de un framework.
- **Qué no cuenta:** el aspecto exacto (colores, espacios) dentro de lo que pide el estándar de botones y la accesibilidad, correcciones de errores y de seguridad, y lo que no está en la API pública (`api/nexus-dialogs.api.md`).
- **Cómo se vigila:** `npm run api:check` falla si la API pública cambia sin actualizar su reporte, y `test/tipos/contratos.ts` fija lo que devuelve cada función.
- **Correcciones de seguridad:** solo en la última 1.x publicada. Ver `SECURITY.md`.

## Cobertura de pruebas

Cobertura de las pruebas unitarias (Vitest, medida en la última revisión): **líneas 90 %, sentencias 88 %, funciones 87 %, ramas 79 %**. El CI falla si baja de los umbrales (89 / 86 / 85 / 76). A eso se suman las pruebas en navegador real (Playwright, Chromium, Firefox y WebKit) que no cuentan en ese porcentaje: accesibilidad, teclado, CSP, Trusted Types, fugas de memoria y el sitio de documentación.

La cobertura mide qué líneas se ejecutan, no que estén bien probadas; por eso las pruebas de casos extremos (`extremos`, `auditoria`, `seguridad`, `exportacion`) se escriben a partir de lo que puede salir mal, no de lo que falta cubrir.

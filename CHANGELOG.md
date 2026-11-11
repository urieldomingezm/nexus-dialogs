# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Cambios que rompen

- **`strictHtml` es `true` por omisión.** El `html` en cadena (`html` de `dialog.*` y, en `nexus-dialogs/swal`, `html`, `iconHtml`, `closeButtonHtml` y `loaderHtml`) ya no se interpreta: se muestra como texto, salvo que configures un `sanitize`. Para volver al comportamiento anterior con contenido propio: `configure({ strictHtml: false })`. Con contenido de fuera: `configure({ sanitize: (h) => DOMPurify.sanitize(h) })`. Los `Node` y los textos no cambian. Esto es lo que más afecta a quien migra de SweetAlert2.

### Agregado

- `configure({ strictHtml })`: con `true` (por omisión, ver «Cambios que rompen») el `html` en cadena que no pase por un `sanitize` se muestra como texto. `sanitize: null` quita el filtro y `sanitize` puede devolver un `TrustedHTML`.
- `configure({ nonce })`: nonce de CSP para el `<style>` alternativo de navegadores sin hojas de estilo construibles.
- Pruebas: CSP y Trusted Types en Chromium, inyección de fórmulas con LibreOffice, fugas de memoria (300 diálogos, formularios y toasts) y *tree-shaking* del núcleo en `check:paquete`. `npm audit` de producción en el CI.
- `SECURITY.md`: canal privado, tiempos de respuesta, versiones con correcciones y cómo se publica una versión.
- `configure({ sanitize })`: filtro para todo el `html` en cadena (`html`, y en swal `iconHtml`, `closeButtonHtml` y `loaderHtml`); también se exporta `setHtml`. Los textos siguen insertándose siempre como texto y un `Node` no pasa por el filtro. Documentado en `docs/seguridad.md` y `SECURITY.md`.
- Documentación de niveles (`docs/arquitectura.md`: núcleo, UI avanzada, empresa, integraciones, pesos y qué está validado) y una prueba que impide que un nivel importe de uno superior.
- Sitio: páginas **Seguridad** y **Arquitectura**, y tabla de diferencias de comportamiento con SweetAlert2 en la guía de migración.
- `nexus-dialogs/angular`: `provideNexusDialogs()`, `injectDialog()`, `injectForm()` e `injectToast()` para Angular 16+. `isOpen` es una señal, los diálogos se cierran al destruir el componente y no usa decoradores. Solo ESM, como `@angular/core`, que es dependencia opcional.
- Soporte RTL (derecha a izquierda): los diálogos y toasts siguen `<html dir="rtl">` o `configure({ dir })` / `dir` por diálogo. CSS con propiedades lógicas, calendario y temporizador espejados y teclado invertido en el calendario.
- Plantillas de RR. HH.: `evaluacion`, `capacitacion` y `cambioPuesto` (ya son nueve).
- `nexus-dialogs/swal`: `loaderHtml` y `getLoader` (indicador de «procesando» visible), `argsToParams`, `isValidParameter`, `isUpdatableParameter` y `bindClickHandler` (`data-swal-template`).

- Sitio: página **Mini ERP** (alta con asistente, importar y exportar Excel, vacaciones, acción masiva y bajas con «Deshacer»), **guía de migración** desde SweetAlert2 con ejemplos que se ejecutan y página de **accesibilidad** (`docs/accesibilidad.md`).
- Pruebas: casos extremos (diálogos apilados y encadenados, desmontar con promesas pendientes, validaciones asíncronas que fallan, CSV y Excel corruptos o enormes, SSR, navegadores sin `matchMedia` ni hojas construibles) y accesibilidad en navegador real (contraste y axe por tema, teclado, foco, movimiento reducido, reflow a 320 px y colores forzados).

### Corregido

- **Seguridad**: `toCSV` no neutralizaba la inyección de fórmulas (`=1+1`, `@SUM(…)`, `+cmd`, `-1+2`): Excel y LibreOffice las evaluaban al abrir el CSV. Ahora los textos que empiezan con `= + - @` (o tab/retorno) llevan un apóstrofo delante; los números de verdad no cambian. El `.xlsx` ya guardaba esos valores como texto.
- **Trusted Types**: con `require-trusted-types-for 'script'` la librería fallaba al abrir cualquier diálogo (sus iconos usaban `innerHTML`). Ahora se arman con `createElementNS`.
- Contraste: el botón de peligro del esquema oscuro y del tema `dark` pasa de 3.8:1 a 4.9:1, y el texto del resumen de errores del formulario cumple 4.5:1 con los temas Bootstrap y Tailwind.
- Con navegadores sin hojas de estilo construibles, los estilos globales se agregan al `<head>` sin depender de `instanceof Document`.
- Vue y React: cada diálogo queda a nombre del componente que lo pidió (también los anidados). Con dos componentes con diálogos abiertos a la vez, desmontar uno ya no cierra los del otro.

## [0.4.0] - 2026-11-11

### Agregado

- `nexus-dialogs/swal`, paridad con SweetAlert2: accesores (`getContainer`, `getTitle`, `getHtmlContainer`, `getIcon`, `getImage`, `getActions`, `getFooter`, `getCloseButton`, `getTimerProgressBar`, `getProgressSteps`, `getValidationMessage`, `getInputLabel`, `getFocusableElements`); `Swal.update()` completo (título, texto, html, icono, imagen, pasos, pie y botones) y `Swal.close(resultado)`; `inputAutoTrim`, `inputAutoFocus` y `returnInputValueOnDeny`; temporizador (`stopTimer`, `resumeTimer`, `toggleTimer`, `increaseTimer`, `getTimerLeft`, `isTimerRunning`); campos `file`, `range` y `week`; `imageUrl` (+ancho, alto, alt), `iconHtml`, `progressSteps`; `enableButtons`, `disableButtons`, `enableInput`, `disableInput`; `reverseButtons`, `allowEnterKey`, `theme`, `target`, `draggable`, `template`, `didDestroy`, `closeButtonHtml` y los `aria-label` de los botones.
- Motor: `ctx.timer` (`TimerControl`: `left`, `running`, `stop`, `resume`, `increase`) en `DialogContext`.
- Sitio de documentación (`site/`, `npm run build:site`): guía, galería de unos 35 ejemplos que se ejecutan en la página con su código y referencia de la API. Se publica en GitHub Pages con el flujo `docs.yml`.
- `nexus-dialogs/react`: hooks `useDialog()`, `useForm()` y `useToast()`, y `NexusDialogsProvider` para configurar. Los diálogos del componente se cierran al desmontarlo, `isOpen` vuelve a renderizar, las funciones son estables entre renders y funciona con `StrictMode`. Probado con React 18 y 19. `react` es dependencia opcional.
- Calendario en `daterange` con `calendar: true`: rango en dos clics, fechas escritas como `dd/mm/aaaa`, teclado completo.
- Campo `signature`: firma con el dedo, el mouse o la pluma, o escribiendo el nombre (teclado). Valor en PNG.
- `nexus-dialogs/import`: `importData()` para CSV y Excel (.xlsx) sin dependencias, con relación automática de columnas, tipos, `unique` y revisión de errores por fila. También `readSpreadsheet`, `parseCSV`, `guessMapping`, `processRows`, `convert`, `downloadTemplate`.
- `nexus-dialogs/table`: `pickRows()` para elegir filas de una lista grande, con búsqueda, páginas, selección conservada y carga desde tu API.
- `nexus-dialogs/sepomex`: `sepomexLookup()` y el comando `nexus-dialogs-sepomex` para servir el catálogo oficial de códigos postales desde tu sitio.
- Días hábiles en `daterange` (`businessDays`, `holidays`): conteo visible, festivos marcados y `maxDays` en hábiles. En `nexus-dialogs/mx`: `mexicanHolidays()`, `businessDays()`, `isBusinessDay()`, `addBusinessDays()`.
- Fecha sola con calendario desplegable: `{ type: 'date', calendar: true }`.
- Exportar a Excel o CSV sin dependencias: `exportData()`, `toXLSX()`, `toCSV()` en `nexus-dialogs/import`; botón «Exportar» en `pickRows()` con `onExport`.
- `nexus-dialogs/rrhh`: plantillas en JSON (alta de empleado, vacaciones, permiso, incapacidad, baja, gastos) y `sinResolvers()`.

### Cambiado

- `nexus-dialogs/swal`: `getPopup()` y el popup que reciben los ganchos son ahora el panel (dentro del Shadow DOM) y no el `<dialog>`, para que `querySelector` sobre él encuentre el contenido. `willClose` se llama al empezar a cerrar y recibe el panel. El adaptador pesa unos 3.6 KB gzip más (límite 7 KB).

### Corregido


- La lista del buscador y el calendario desplegable ya no se recortan en el borde del diálogo: se abren en la capa superior (Popover API) y hacia arriba cuando abajo no caben.

## [0.3.0] - 2026-11-10

La 0.2.0 no se publicó: sus cambios salen en esta versión.

### Agregado

- `nexus-dialogs/vue`: plugin `NexusDialogs` (configura todo y expone `$dialog` y `$toast`), `useDialog()` y `useToast()`. Los diálogos que abre un componente se cierran solos al desmontarlo; `scoped()` hace lo mismo con recetas y formularios. `isOpen` reactivo.
- `nexus-dialogs/swal`: adaptador compatible con SweetAlert2 (`Swal.fire`, `mixin`, toasts, inputs, `inputValidator`, `preConfirm`, `preDeny`, timer, `DismissReason` y los métodos estáticos comunes). Aplica el estándar de botones: una confirmación que dice «eliminar» o «borrar» pasa sola a «peligro» con el foco en Cancelar.
- `dist/nexus-dialogs.swal.iife.js`: reemplazo directo de SweetAlert2 por `<script>` (define `window.Swal`).
- `closeDialog(el)` en el núcleo, para cerrar un diálogo concreto.
- Campos avanzados en `form()` y `wizard()`:
  - `combobox`: buscar y elegir uno o varios, sin acentos, con grupos, descripción, búsqueda async (`search`), «Crear» (`creatable`) y `maxItems`.
  - `file`: arrastrar o elegir, `accept`, `maxSize`, `maxFiles` y subida con progreso y reintento (`upload`); no deja enviar mientras sube.
  - `daterange`: desde/hasta con atajos (incluye «Quincena actual»), `maxDays`, `min`, `max` y `presets` propios. `defaultDatePresets()` exportado.
  - `otp`: código con cajas visuales, `one-time-code` y envío automático al completar.
  - `items`: filas repetibles con `fields`, `minRows`, `maxRows` y `totals` que se recalculan al escribir.
- Un control dentro del diálogo puede «consumir» Esc (evento `nexus-dialogs:escape`): Esc cierra la lista del combobox, no el diálogo.
- `combobox`: `avatars: true` muestra iniciales con un color fijo por nombre; con `avatar` (URL) en la opción, la foto.
- Campo `phone`: lada a elegir (+52 por omisión), formato mientras se escribe y valor completo (`+528112345678`). `formatPhone()` exportado.
- Campo `address`: dirección por código postal con `lookupPostalCode` (llena estado y municipio, ofrece las colonias).
- Borrador automático en `form()` y `wizard()` con `draftKey` (y `draftPrompt`): sobrevive a recargar la página.
- Pasos condicionales en `wizard()` con `when`.
- Condiciones declarativas: `visibleIf` en campos y `when` en pasos (`equals`, `notEquals`, `in`, `filled`, `all`, `any`, `not`). `matches()` exportado.
- `formFromJSON()` y `fieldsFromJSON()`: formularios y asistentes desde JSON, con funciones por nombre (`resolvers`).
- Iconos `delete` (papelera) y `clock`. Las confirmaciones de peligro llevan la papelera por omisión.

### Cambiado

- **Diseño v2.** Paleta neutra más fría y acento `#4263eb`; sombras en capas; fondo con desenfoque; foco como anillo suave de 4 px.
  - Icono en un cuadro de color junto al título (centrado solo en avisos de un botón).
  - Pie con borde y botones de 40 px; en celular se apilan a lo ancho con 52 px de alto.
  - Asistente con barras de progreso, segmentado tipo pastilla e interruptor más compacto.
  - Buscador con palomita a la derecha y «Crear» separado; archivos con etiqueta de tipo (PDF, XML, JPG…) y barra de 8 px; partidas como tabla con total grande.
  - Recetas: datos en cuadrícula, sesión con tiempo grande y barra (en vez del anillo), chips y tarjetas nuevas.
  - Toasts con icono en círculo por tipo; la acción es un enlace de texto.
- En la revisión del asistente, las fechas se muestran legibles («1 dic 2026») en lugar de ISO.
- Sin atributos `style` en el marcado: los estilos dinámicos van por CSSOM, así funciona con `style-src` estricta.

### Corregido

- `toast.configure` ignora las opciones `undefined` en lugar de borrar las anteriores.
- Los grupos de radio usan `role="radiogroup"` (un `<fieldset>` no admite `aria-required`).
- En el resumen de errores, los textos largos ya no separan la viñeta del enlace.
- Salir de un campo sin haberlo cambiado ya no muestra «Este campo es obligatorio»: el error aparecía al hacer clic en «Enviar», movía el botón y el clic se perdía. Los errores de campos vacíos esperan al envío.
- Un Esc en los primeros 250 ms de la página se ignoraba.

## [0.1.0] - 2026-11-10

Primera versión.

### Agregado

- `dialog.alert`, `confirm`, `prompt`, `open` y atajos `success`, `error`, `warning`, `info` sobre `<dialog>` nativo con Shadow DOM.
- Estándar de botones: `primary`, `cancel`, `danger`, `secondary`, sin iconos. Con `danger`, Cancelar pasa a gris y recibe el foco.
- `requireText` para confirmar borrados escribiendo el nombre.
- `preConfirm` async con estado «Procesando…» y errores dentro del diálogo; `beforeClose`; `timer` que se pausa con mouse o foco.
- Paneles laterales (`right`, `left`), hoja inferior (`bottom`) y hoja automática en celular.
- `nexus-dialogs/forms`: `form()` y `wizard()` con validación, resumen de errores con enlaces, campos condicionales, `money`, `rfc`, `segmented`, `switch`, confirmación al descartar cambios y paso de revisión.
- `nexus-dialogs/toast`: cola, acciones, `toast.promise`, `update`, regiones vivas y montaje dentro del modal abierto.
- `nexus-dialogs/themes`: `light`, `dark`, `bootstrap`, `tailwind`, `material`, `fromBootstrap()`, `applyTheme()`; esquema `auto`.
- Español por omisión e inglés.
- `nexus-dialogs/patterns`: recetas `confirmDelete`, `unsavedChanges`, `sessionTimeout`, `watchIdle`, `approval`, `bulkAction`, `choose` y `loading`, con textos configurables (`configurePatterns`).
- `nexus-dialogs/mx`: `isRFC`, `isCURP`, `isNSS`, `isCLABE`, `isPostalCode` y `normalize`, sin DOM (sirven en Node). En formularios, tipos de campo `curp`, `nss`, `clabe` y `postal`; el RFC ahora también valida la fecha.
- Enter sobre una opción (radio o casilla) también pulsa el botón principal.

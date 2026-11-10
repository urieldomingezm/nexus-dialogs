# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [0.2.0] - sin publicar

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

### Corregido

- `toast.configure` ignora las opciones `undefined` en lugar de borrar las anteriores.
- Los grupos de radio usan `role="radiogroup"` (un `<fieldset>` no admite `aria-required`).
- En el resumen de errores, los textos largos ya no separan la viñeta del enlace.

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

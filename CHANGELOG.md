# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [0.1.0] - sin publicar

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

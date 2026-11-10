<div align="center">

# nexus-dialogs

**Diálogos, formularios, asistentes y toasts para sistemas de empresa.**
Sin dependencias · TypeScript · `<dialog>` nativo + Shadow DOM · accesible (WCAG 2.2 AA) · basado en promesas

Hecho por [**DevMedina**](https://devmedina.is-a.dev/) (Angel Uriel Domínguez Medina) · rama de librerías de **Nexus** · Licencia MIT

</div>

---

Las librerías de alertas resuelven el «¿Seguro?» y poco más. En un sistema de RRHH o contabilidad hace falta mucho más: formularios con validación y resumen de errores, asistentes de varios pasos con revisión, confirmar un borrado escribiendo el nombre, avisar antes de perder cambios, importes en pesos, RFC… **nexus-dialogs** trae todo eso sobre el `<dialog>` nativo del navegador:

- **Capa superior real**: sin guerras de `z-index` con Bootstrap, SweetAlert2 o tu menú fijo. El fondo queda inerte y el scroll bloqueado.
- **Shadow DOM**: el CSS de tu página no lo rompe y el suyo no se sale.
- **Promesas**: `const r = await dialog.confirm(…)`; nunca rechaza, siempre resuelve con `{ confirmed, denied, value, reason }`.
- **Accesible**: foco inicial correcto (Cancelar en acciones destructivas), Esc, regreso del foco, errores ligados a cada campo, toasts anunciados en regiones vivas. Probado con axe en claro, oscuro y Bootstrap.
- **Estándar de botones**: un color por intención, igual en toda la app, y sin iconos en los botones.

## Índice

1. [Instalación](#1-instalación)
2. [Inicio rápido](#2-inicio-rápido)
3. [Estándar de botones](#3-estándar-de-botones)
4. [Diálogos](#4-diálogos)
5. [Formularios](#5-formularios)
6. [Asistentes (wizard)](#6-asistentes-wizard)
7. [Toasts](#7-toasts)
8. [Temas y apariencia](#8-temas-y-apariencia)
9. [Idioma y textos](#9-idioma-y-textos)
10. [Referencia rápida](#10-referencia-rápida)
11. [Compatibilidad](#11-compatibilidad)
12. [Desarrollo](#12-desarrollo)

## 1. Instalación

```bash
npm i nexus-dialogs
```

| Importa | Para |
|---|---|
| `nexus-dialogs` | `dialog.alert / confirm / prompt / open`, `configure` |
| `nexus-dialogs/forms` | `form()` y `wizard()` |
| `nexus-dialogs/toast` | `toast()` con cola |
| `nexus-dialogs/themes` | Temas listos (Bootstrap, Tailwind, Material, oscuro) |

Sin bundler, con un `<script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/nexus-dialogs/dist/nexus-dialogs.all.iife.js"></script>
<script>
  const { dialog, form, toast } = NexusDialogs
</script>
```

## 2. Inicio rápido

```ts
import { dialog } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'

// Confirmar algo peligroso
const r = await dialog.confirm({
  title: '¿Eliminar el periodo de nómina?',
  text: 'Se borrarán 148 recibos. No se puede deshacer.',
  danger: true,
  requireText: 'Quincena 21', // hay que escribirlo para habilitar el botón
  confirmText: 'Eliminar periodo',
})
if (r.confirmed) await eliminarPeriodo()

// Pedir datos
const nuevo = await form<{ nombre: string; correo: string }>({
  title: 'Nuevo cliente',
  submitText: 'Crear cliente',
  fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'correo', label: 'Correo', type: 'email', required: true },
  ],
  preConfirm: (v) => api.clientes.crear(v), // muestra «Procesando…»; si lanza, enseña el error
})
if (nuevo.confirmed) toast.success('Cliente creado')
```

## 3. Estándar de botones

Cada botón dice **la acción** («Crear cliente», no «Aceptar») y su color dice **qué tipo de acción es**. Los botones no llevan iconos.

| Variante | Se ve | Para | Ejemplos |
|---|---|---|---|
| `primary` | Azul sólido | Confirmar, aprobar, guardar, avanzar | Aprobar · Crear cliente · Siguiente |
| `cancel` | Contorno rojo | Salir sin hacer nada o abandonar lo capturado | Cancelar · Descartar cambios · Salir sin guardar |
| `danger` | Rojo sólido | La acción final de algo que borra o rechaza | Eliminar periodo · Rechazar solicitud |
| `secondary` | Contorno gris | Acciones neutras | Atrás · Guardar borrador · Seguir editando |

Reglas que la librería aplica sola:

- Un solo botón azul por diálogo, a la derecha; Cancelar a su izquierda.
- Con `danger: true`, el botón principal se vuelve rojo y **Cancelar pasa a gris y recibe el foco**: así no hay dos rojos y un Enter accidental no borra nada.
- Enter en un campo de una línea pulsa el botón principal.

Si defines tus botones, la variante sale del `role` (`confirm` → primary, `cancel`/`deny` → cancel, `custom` → secondary) o la pones tú con `variant`.

## 4. Diálogos

### Alertas

```ts
await dialog.alert('Guardado')                                  // título
await dialog.alert('Guardado', 'Laura ya aparece en la nómina') // título y texto
await dialog.success({ title: 'Empleado guardado', timer: 3000 }) // con icono y se cierra solo
await dialog.error('No se pudo timbrar', 'El SAT no respondió.')
```

Atajos con icono: `success`, `error`, `warning`, `info`. El `timer` se pausa con el mouse o el foco encima.

### Confirmar

```ts
const r = await dialog.confirm({ title: '¿Enviar a aprobación?', confirmText: 'Enviar' })
r.confirmed // true / false
r.reason    // 'confirm' | 'cancel' | 'escape' | 'backdrop' | 'close' | 'timer' | 'program' | id de botón
```

`preConfirm` corre al confirmar. Puede ser async: mientras tanto el botón dice «Procesando…» y nada se puede cerrar. Si devuelve `false` el diálogo sigue abierto; si lanza un `Error`, su mensaje aparece dentro; si devuelve algo, eso llega en `r.value`.

```ts
const r = await dialog.confirm({
  title: 'Timbrar 148 recibos',
  confirmText: 'Timbrar',
  preConfirm: async () => {
    const res = await api.timbrar()
    if (!res.ok) throw new Error(res.mensaje)
    return res.folios
  },
})
```

### Pedir un dato (prompt)

```ts
const r = await dialog.prompt({
  title: 'Nueva área',
  label: 'Nombre del área',
  input: 'text', // text, email, password, number, tel, url, textarea, select
  validate: (v) => (v.length < 3 ? 'Escribe al menos 3 caracteres.' : null),
  confirmText: 'Crear área',
})
if (r.confirmed) r.value // string
```

### Diálogo libre: tus botones, tu contenido

```ts
const r = await dialog.open({
  title: 'Tienes 2 cambios sin guardar',
  buttons: [
    { id: 'discard', role: 'deny', text: 'Descartar cambios' },
    { id: 'keep', role: 'cancel', text: 'Seguir editando', variant: 'secondary' },
    { id: 'save', role: 'confirm', text: 'Guardar y salir' },
  ],
  initialFocus: 'cancel',
})
if (r.denied) descartar()
```

Contenido propio con `render(ctx)` (devuelve un nodo) o `html` (solo con HTML tuyo; **nunca con datos del usuario**: `title` y `text` siempre son texto plano y seguros).

### Paneles laterales y hoja inferior

```ts
dialog.open({ title: 'Filtros', placement: 'right', render: dibujarFiltros, confirmText: 'Ver resultados' })
dialog.open({ title: 'Compartir', placement: 'bottom' })
```

`placement`: `center` (por omisión), `right`, `left`, `bottom`. En pantallas angostas los diálogos centrados se vuelven hoja inferior (desactívalo con `configure({ sheetOnMobile: false })`). Tamaños: `size: 'sm' | 'md' | 'lg' | 'xl' | <px>`.

### Cerrar y otras opciones

| Opción | Qué hace |
|---|---|
| `dismissible` | `false` impide cerrar con Esc y clic fuera. O detalle: `{ escape, backdrop, closeButton }` |
| `beforeClose(reason)` | Devuelve `false` para impedir el cierre (por ejemplo, preguntar antes) |
| `initialFocus` | `'confirm'`, `'cancel'`, `'first-field'` o un selector |
| `onOpen(ctx)` / `onClose(result)` | Ganchos |
| `dialog.close()` / `dialog.closeAll()` | Cerrar desde código (`reason: 'program'`) |

`ctx` permite `setLoading`, `setError`, `setTitle`, `setButtons`, `button(id)` y `close()`.

## 5. Formularios

```ts
import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Nuevo gasto',
  columns: 2,
  submitText: 'Enviar a aprobación',
  fields: [
    { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
    { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
    { name: 'tipo', label: 'Tipo', type: 'segmented', options: ['Persona', 'Empresa'], value: 'Empresa' },
    { name: 'razon', label: 'Razón social', visible: (v) => v.tipo === 'Empresa', required: true },
    { name: 'concepto', label: 'Concepto', type: 'textarea', span: 2, maxLength: 200 },
  ],
  validate: (v) => (v.importe > 50000 ? { importe: 'Más de $50,000 requiere orden de compra.' } : undefined),
})
```

**Tipos de campo**: `text`, `email`, `tel`, `url`, `password`, `number`, `date`, `time`, `textarea`, `select`, `radio`, `segmented`, `checkbox`, `switch`, y dos para México:

- `money`: muestra `$ 12,500.50 MXN` al salir del campo, teclado numérico en celular, devuelve `number`. Cambia `currency` y `locale` si hace falta.
- `rfc`: convierte a mayúsculas y valida 12 (moral) o 13 (física) caracteres.

**Validación**: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` (+ `patternMessage`) y `validate(valor, valores)` por campo, que puede ser async («¿ya existe este RFC?»). Al enviar con errores aparece un **resumen arriba con enlaces** a cada campo, cada campo queda con `aria-invalid` y su mensaje ligado con `aria-describedby`.

**Campos condicionales**: `visible: (valores) => boolean`. Los ocultos no se validan ni se envían.

**Cambios sin guardar**: si el usuario capturó algo y cierra (Cancelar, Esc o ×), se pregunta «¿Descartar los cambios?» con el foco en «Seguir editando». Desactívalo con `confirmDiscard: false`. Clic fuera no cierra formularios.

Los valores llegan con su tipo: `number`/`money` → `number | null`, `checkbox`/`switch` → `boolean`, lo demás → `string` (sin espacios al inicio y al final).

## 6. Asistentes (wizard)

```ts
import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'Alta de empleado',
  review: true, // paso final «Revisar» con «Editar» por sección
  submitText: 'Dar de alta',
  steps: [
    { title: 'Datos personales', fields: [{ name: 'nombre', label: 'Nombre completo', required: true }] },
    { title: 'Puesto', fields: [{ name: 'salario', label: 'Salario diario', type: 'money', required: true }] },
  ],
})
```

Cada paso valida antes de avanzar, «Atrás» nunca pierde datos, Enter avanza, el título del paso recibe el foco para que el lector de pantalla lo anuncie («Paso 2 de 3») y en celular el indicador muestra solo el paso actual. `onStepChange(i, valores)` avisa cada cambio.

## 7. Toasts

```ts
import { toast } from 'nexus-dialogs/toast'

toast.success('Empleado guardado')
toast.error('No se pudo timbrar', { title: 'Error del SAT' })
toast('Se archivaron 3 recibos', { action: { label: 'Deshacer', onClick: deshacer } })

await toast.promise(calcularNomina(), {
  loading: 'Calculando nómina…',
  success: (n) => `${n} recibos listos`,
  error: (e) => e.message,
})

const id = toast.loading('Subiendo…')
toast.update(id, { type: 'success', message: 'Subido' })
toast.dismiss(id)
toast.configure({ position: 'top-right', max: 3, duration: 4000 })
```

- **Cola**: máximo 3 visibles (configurable); los demás esperan.
- **Duración**: 4 s; con acción 6 s; errores 7 s; `loading` hasta que lo actualices. `duration: 0` = hasta que lo cierren. Se pausan con el mouse, el foco o la pestaña oculta.
- **Anunciados**: región viva `polite` (errores `assertive`).
- **Dentro de modales**: con un diálogo modal abierto (de esta librería o cualquier `<dialog>`), el toast se monta dentro de él; si no, quedaría inerte detrás y no se podría pulsar «Deshacer». Sin modal, usa el Popover API para quedar sobre cualquier `z-index`.
- En celular salen arriba para no tapar los botones de la hoja inferior.

## 8. Temas y apariencia

Todo color y medida sale de variables `--nd-*`. Ponlas en `:root` (se heredan dentro del Shadow DOM) o con `configure`:

```ts
import { configure } from 'nexus-dialogs'
import { themes, fromBootstrap } from 'nexus-dialogs/themes'

configure({ theme: themes.bootstrap })    // colores de Bootstrap 5
configure({ theme: fromBootstrap() })     // o los --bs-* que tu página ya tiene
configure({ scheme: 'auto' })             // claro u oscuro según el sistema ('light' | 'dark' | 'auto')
toast.configure({ scheme: 'auto', theme: themes.bootstrap })
```

```css
:root {
  --nd-accent: #0f766e;        /* botón principal */
  --nd-danger: #b91c1c;        /* botón de peligro */
  --nd-cancel-fg: #b91c1c;     /* texto y borde de Cancelar */
  --nd-cancel-border: #fca5a5;
  --nd-radius: 12px;           /* esquinas del diálogo */
  --nd-control-radius: 8px;    /* botones y campos */
  --nd-font: 'Inter', system-ui, sans-serif;
}
```

Variables: `accent`, `accent-contrast`, `danger`, `danger-contrast`, `success`, `warning`, `info`, `bg`, `fg`, `muted`, `border`, `surface`, `line`, `cancel-fg`, `cancel-border`, `error`, `overlay`, `radius`, `control-radius`, `font`, `title-font`, `shadow`, `focus`.

Temas incluidos: `light`, `dark`, `bootstrap`, `tailwind`, `material`. Para CSS propio de un diálogo: `styles: '.title { … }'` y `className`.

El CSS se aplica con hojas de estilo construibles (`adoptedStyleSheets`), así que funciona con una Content-Security-Policy estricta sin `unsafe-inline`.

## 9. Idioma y textos

Español por omisión. Inglés con `configure({ lang: 'en' })` (y `toast.configure({ lang: 'en' })`). Cambia textos sueltos:

```ts
configure({ labels: { cancel: 'Cerrar', submit: 'Guardar cambios' } })
```

## 10. Referencia rápida

| | |
|---|---|
| `dialog.alert(opts \| título, texto?)` | Aviso con un botón |
| `dialog.success / error / warning / info` | Aviso con icono |
| `dialog.confirm(opts \| título, texto?)` | Cancelar + Confirmar |
| `dialog.prompt(opts)` | Un campo |
| `dialog.open(opts)` | Libre |
| `dialog.close(valor?)`, `dialog.closeAll()`, `dialog.isOpen()` | Control |
| `form(opts)`, `wizard(opts)` | `nexus-dialogs/forms` |
| `toast(...)`, `toast.success/error/warning/info/loading/promise/update/dismiss/configure` | `nexus-dialogs/toast` |
| `themes`, `fromBootstrap()`, `applyTheme()` | `nexus-dialogs/themes` |
| `configure({ lang, labels, theme, scheme, defaults, sheetOnMobile })` | Global |

Eventos en `document`: `nexus-dialogs:open` y `nexus-dialogs:close` (con `detail.dialog`).

La API pública completa, generada de los tipos, está en [`api/nexus-dialogs.api.md`](api/nexus-dialogs.api.md).

## 11. Compatibilidad

- Navegadores actuales: Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (usa `<dialog>` modal y `color-mix()`). Probado en Chromium, Firefox y WebKit.
- **nexus-tours**: los diálogos son `<dialog open>` de verdad, así que los tours los detectan y pueden explicar lo que hay dentro.
- Bootstrap, Tailwind, SweetAlert2: sin choques de `z-index` ni de CSS.
- Node/SSR: importar no toca el DOM; los diálogos se abren solo en el navegador.

## 12. Desarrollo

```bash
npm ci
npm run dev           # página de pruebas en test/paginas/
npm run test:unit     # Vitest + happy-dom
npm run test:e2e      # Playwright (Chromium, Firefox, WebKit) + axe
npm run build && npm run size && npm run api:check && npm run check:paquete
```

Ver [CHANGELOG](CHANGELOG.md).

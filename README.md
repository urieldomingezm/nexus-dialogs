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
3. [Recetas: lo de todos los días en una línea](#3-recetas-lo-de-todos-los-días-en-una-línea)
4. [Estándar de botones](#4-estándar-de-botones)
5. [Diálogos](#5-diálogos)
6. [Formularios](#6-formularios)
7. [Asistentes (wizard)](#7-asistentes-wizard)
8. [Toasts](#8-toasts)
9. [Validadores de México](#9-validadores-de-méxico)
10. [Temas y apariencia](#10-temas-y-apariencia)
11. [Idioma y textos](#11-idioma-y-textos)
12. [Referencia rápida](#12-referencia-rápida)
13. [Compatibilidad](#13-compatibilidad)
14. [Desarrollo](#14-desarrollo)

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
| `nexus-dialogs/patterns` | Recetas en una línea: borrar, cambios sin guardar, sesión, aprobaciones, acciones masivas… |
| `nexus-dialogs/mx` | Validadores de RFC, CURP, NSS, CLABE y código postal (también en Node) |

Sin bundler, con un `<script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/nexus-dialogs/dist/nexus-dialogs.all.iife.js"></script>
<script>
  const { dialog, form, toast, confirmDelete, isCURP } = NexusDialogs
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

## 3. Recetas: lo de todos los días en una línea

¿No sabes qué diálogo usar? Empieza aquí. Cada receta ya trae el texto, los botones, el foco y la accesibilidad correctos; tú solo dices qué pasa.

```ts
import { confirmDelete, unsavedChanges, sessionTimeout, watchIdle, approval, bulkAction, choose, loading } from 'nexus-dialogs/patterns'
```

| Necesito… | Usa | Te devuelve |
|---|---|---|
| Confirmar un borrado | `confirmDelete` | `true` / `false` |
| Avisar que hay cambios sin guardar | `unsavedChanges` | `'save'` / `'discard'` / `'keep'` |
| Avisar que la sesión expira | `sessionTimeout` o `watchIdle` | `'extend'` / `'logout'` / `'expired'` |
| Aprobar o rechazar una solicitud | `approval` | `{ decision, comment, reason }` |
| Aplicar algo a muchos registros | `bulkAction` | `{ done, failed, skipped }` |
| Elegir una opción entre varias | `choose` | el valor o `null` |
| Bloquear mientras termina algo | `loading` | lo que devuelva la tarea |

### Borrar algo

```ts
if (await confirmDelete({ what: 'a Laura Méndez' })) await api.empleados.borrar(id)

// Algo grande e irreversible: lista lo que se pierde y pide escribir el nombre
await confirmDelete({
  what: 'el periodo de nómina',
  name: 'Quincena 21',
  requireName: true,
  consequences: ['148 recibos calculados', '12 incidencias capturadas'],
  onConfirm: () => api.periodos.borrar(21), // muestra «Procesando…»; si falla, enseña el error
})
```

### Salir con cambios sin guardar

```ts
const decision = await unsavedChanges({
  changes: [{ label: 'Salario diario', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => guardar(),
})
if (decision !== 'keep') router.back()
```

El foco empieza en «Seguir editando» (lo más común es haber cerrado sin querer) y Esc también regresa al formulario.

### Sesión por expirar

```ts
// Una sola línea al iniciar la app: vigila la inactividad y avisa 2 minutos antes
const sesion = watchIdle({
  minutes: 30,
  onExtend: () => api.renovarToken(),
  onLogout: () => (location.href = '/login'),
})
// sesion.reset() cuenta como actividad; sesion.stop() deja de vigilar (al cerrar sesión).
```

O el aviso suelto: `await sessionTimeout({ seconds: 120 })`. Cumple WCAG 2.2.1: cuenta regresiva visible, foco en «Seguir trabajando», extensiones sin límite y al lector de pantalla solo se anuncia cada minuto.

### Aprobar o rechazar

```ts
const r = await approval({
  title: 'Vacaciones de Diego Ramírez',
  subtitle: 'Solicitud SOL-2026-0412 · hace 2 h',
  details: [
    { label: 'Fechas', value: '16 – 20 dic' },
    { label: 'Días hábiles', value: '5' },
  ],
  warning: '2 personas de Almacén ya tienen vacaciones esos días.',
  reasons: ['Cubre otro turno', 'Cierre de inventario', 'Sin saldo'],
  allowRequestInfo: true,
  onApprove: (comentario) => api.aprobar(id, comentario),
  onReject: (comentario, motivo) => api.rechazar(id, comentario, motivo),
})
r.decision // 'approved' | 'rejected' | 'info' | 'cancelled'
```

Aprobar: comentario opcional. Rechazar: abre un segundo paso con motivos rápidos y explicación obligatoria (mínimo 10 caracteres, `minReasonLength`).

### Acciones masivas

```ts
const r = await bulkAction({
  title: 'Cambiar de área a 12 empleados',
  items: seleccionados,
  label: (e) => e.nombre,
  describe: (e) => `${e.area} → Logística`,
  skip: (e) => e.area === 'Logística' && 'ya está en Logística',
  confirmText: (n) => `Mover ${n} empleados`,
  run: (e) => api.empleados.mover(e.id, 'logistica'), // si lanza, esa fila queda con error y sigue con las demás
})
toast.success(`${r.done.length} movidos`)
```

Vista previa, confirmación, barra de progreso, resultado fila por fila y «Reintentar» solo los que fallaron. No se puede cerrar mientras corre.

### Elegir entre opciones

```ts
const formato = await choose({
  title: 'Exportar nómina',
  options: [
    { value: 'xlsx', label: 'Excel', description: 'Para revisar y filtrar' },
    { value: 'csv', label: 'CSV', description: 'Para importar en otro sistema' },
  ],
})
if (formato) exportar(formato)
```

### Esperar algo que bloquea

```ts
const folios = await loading('Timbrando 148 recibos…', () => api.timbrar())

// Con avance
const espera = loading.open('Preparando…')
espera.update('Timbrando 40 de 148…')
espera.close()
```

Si la tarea falla, la espera se cierra y el error se relanza para que lo muestres (por ejemplo con `dialog.error`). Para lo que no bloquea, mejor `toast.promise`.

Textos de las recetas: siguen el idioma de `configure({ lang })`; cambia los que quieras con `configurePatterns({ stay: 'Continuar aquí' })`.

## 4. Estándar de botones

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

## 5. Diálogos

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

## 6. Formularios

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

**Tipos de campo**: `text`, `email`, `tel`, `url`, `password`, `number`, `date`, `time`, `textarea`, `select`, `radio`, `segmented`, `checkbox`, `switch`, y para México:

- `money`: muestra `$ 12,500.50 MXN` al salir del campo, teclado numérico en celular, devuelve `number`. Cambia `currency` y `locale` si hace falta.
- `rfc`, `curp`, `nss`, `clabe`, `postal`: ver [Validadores de México](#9-validadores-de-méxico).

**Validación**: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` (+ `patternMessage`) y `validate(valor, valores)` por campo, que puede ser async («¿ya existe este RFC?»). Al enviar con errores aparece un **resumen arriba con enlaces** a cada campo, cada campo queda con `aria-invalid` y su mensaje ligado con `aria-describedby`.

**Campos condicionales**: `visible: (valores) => boolean`. Los ocultos no se validan ni se envían.

**Cambios sin guardar**: si el usuario capturó algo y cierra (Cancelar, Esc o ×), se pregunta «¿Descartar los cambios?» con el foco en «Seguir editando». Desactívalo con `confirmDiscard: false`. Clic fuera no cierra formularios.

Los valores llegan con su tipo: `number`/`money` → `number | null`, `checkbox`/`switch` → `boolean`, lo demás → `string` (sin espacios al inicio y al final).

## 7. Asistentes (wizard)

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

## 8. Toasts

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

## 9. Validadores de México

En formularios, usa el tipo de campo y listo:

```ts
fields: [
  { name: 'rfc', label: 'RFC', type: 'rfc', required: true },
  { name: 'curp', label: 'CURP', type: 'curp', required: true },
  { name: 'nss', label: 'NSS', type: 'nss' },
  { name: 'clabe', label: 'CLABE', type: 'clabe' },
  { name: 'cp', label: 'Código postal', type: 'postal' },
]
```

Pasan a mayúsculas, ponen el teclado numérico en celular, limitan el largo y validan **el dígito verificador** (CURP, NSS, CLABE), no solo el formato.

Los mismos validadores, sin DOM, para usarlos donde quieras (también en tu API con Node):

```ts
import { isRFC, isCURP, isNSS, isCLABE, isPostalCode, normalize } from 'nexus-dialogs/mx'

isCLABE('002010077777777771') // true
isCURP('PELJ900515HJCRPN03')  // true
normalize(' pem840101ab3 ')   // 'PEM840101AB3'
```

| Función | Revisa |
|---|---|
| `isRFC` | 12 (moral) o 13 (física) caracteres con fecha válida. No calcula la homoclave. |
| `isCURP` | 18 caracteres, fecha, sexo, estado y dígito verificador |
| `isNSS` | 11 dígitos y dígito verificador (Luhn) |
| `isCLABE` | 18 dígitos y dígito de control (pesos 3, 7, 1) |
| `isPostalCode` | 5 dígitos, de 01000 a 99999 |

Validan la forma, no que el dato exista ante el SAT, el IMSS o un banco.

## 10. Temas y apariencia

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

## 11. Idioma y textos

Español por omisión. Inglés con `configure({ lang: 'en' })` (y `toast.configure({ lang: 'en' })`). Cambia textos sueltos:

```ts
configure({ labels: { cancel: 'Cerrar', submit: 'Guardar cambios' } })
```

## 12. Referencia rápida

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
| `confirmDelete`, `unsavedChanges`, `sessionTimeout`, `watchIdle`, `approval`, `bulkAction`, `choose`, `loading`, `configurePatterns` | `nexus-dialogs/patterns` |
| `isRFC`, `isCURP`, `isNSS`, `isCLABE`, `isPostalCode`, `normalize` | `nexus-dialogs/mx` |
| `configure({ lang, labels, theme, scheme, defaults, sheetOnMobile })` | Global |

Eventos en `document`: `nexus-dialogs:open` y `nexus-dialogs:close` (con `detail.dialog`).

La API pública completa, generada de los tipos, está en [`api/nexus-dialogs.api.md`](api/nexus-dialogs.api.md).

## 13. Compatibilidad

- Navegadores actuales: Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (usa `<dialog>` modal y `color-mix()`). Probado en Chromium, Firefox y WebKit.
- **nexus-tours**: los diálogos son `<dialog open>` de verdad, así que los tours los detectan y pueden explicar lo que hay dentro.
- Bootstrap, Tailwind, SweetAlert2: sin choques de `z-index` ni de CSS.
- Node/SSR: importar no toca el DOM; los diálogos se abren solo en el navegador.

## 14. Desarrollo

```bash
npm ci
npm run dev           # página de pruebas en test/paginas/
npm run test:unit     # Vitest + happy-dom
npm run test:e2e      # Playwright (Chromium, Firefox, WebKit) + axe
npm run build && npm run size && npm run api:check && npm run check:paquete
```

Ver [CHANGELOG](CHANGELOG.md).

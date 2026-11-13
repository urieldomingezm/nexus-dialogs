<div align="center">

# nexus-dialogs

**Diálogos, formularios, asistentes y toasts para sistemas de empresa.**
Una biblioteca de interfaces transaccionales para aplicaciones empresariales, con lo que un sistema administrativo mexicano necesita.
Sin dependencias · TypeScript · `<dialog>` nativo + Shadow DOM · accesibilidad con objetivo WCAG 2.2 AA (pruebas automáticas, sin certificar) · basado en promesas

Hecho por [**DevMedina**](https://devmedina.is-a.dev/) (Angel Uriel Domínguez Medina) · rama de librerías de **Nexus** · Licencia MIT

</div>

---

Las librerías de alertas resuelven el «¿Seguro?» y poco más. En un sistema de RRHH o contabilidad hace falta mucho más: formularios con validación y resumen de errores, asistentes de varios pasos con revisión, confirmar un borrado escribiendo el nombre, avisar antes de perder cambios, importes en pesos, RFC… **nexus-dialogs** trae todo eso sobre el `<dialog>` nativo del navegador:

- **Capa superior real**: sin guerras de `z-index` con Bootstrap, SweetAlert2 o tu menú fijo. El fondo queda inerte y el scroll bloqueado.
- **Shadow DOM**: el CSS de tu página no lo rompe y el suyo no se sale.
- **Promesas**: las operaciones de diálogo (`dialog.alert`, `dialog.confirm`, `dialog.prompt` y `dialog.open`, y también formularios, asistentes, tablas y recetas) resuelven siempre con un `DialogResult` `{ confirmed, denied, value, reason }` y nunca rechazan: cancelar no es un error (`const r = await dialog.confirm(…)`). Las funciones auxiliares tienen sus propias condiciones de rechazo: `formFromJSON` (tipo desconocido o resolver que falta), `loading` (relanza el error de tu tarea) y `readSpreadsheet` (archivo ilegible). Detalle en [`docs/contratos.md`](docs/contratos.md).
- **Accesible** (objetivo WCAG 2.2 AA; no es una certificación): foco inicial correcto (Cancelar en acciones destructivas), Esc, regreso del foco, errores ligados a cada campo, toasts anunciados en regiones vivas. Probado con axe en claro, oscuro, Bootstrap, Tailwind y Material, con teclado, movimiento reducido y reflow a 320 px. Qué se prueba y qué falta (lectores de pantalla): [`docs/accesibilidad.md`](docs/accesibilidad.md).
- **Estándar de botones**: un color por intención, igual en toda la app, y sin iconos en los botones.
- **Seguro por omisión**: los textos siempre se insertan como texto; solo el `html` en cadena se interpreta y se puede filtrar con `configure({ sanitize })`; por omisión (`strictHtml`) se muestra como texto si no hay filtro. Funciona con CSP estricta y Trusted Types, y el CSV exportado no permite inyección de fórmulas. Detalle en [`docs/seguridad.md`](docs/seguridad.md).
- **Por niveles**: núcleo de ~10 KB, UI avanzada, empresa e integraciones, cada uno en su subruta; lo que no importas no se descarga. Qué pesa cada parte y qué está validado todavía: [`docs/arquitectura.md`](docs/arquitectura.md).

> **Estado**: probada en Chromium, Firefox y WebKit con pruebas unitarias, de casos extremos y de accesibilidad (axe). Falta validarla con lectores de pantalla y en aplicaciones en producción. Limitaciones, navegadores, versionado y cobertura: [`docs/limitaciones.md`](docs/limitaciones.md). Qué devuelve cada función: [`docs/contratos.md`](docs/contratos.md). Compatibilidad con SweetAlert2 parámetro por parámetro: [`docs/swal-compat.md`](docs/swal-compat.md). ¿La usas fuera de Nexus? [Cuéntanos cómo te fue](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=adopcion.yml): hoy es lo que más falta para estabilizarla.

> **¿Acabas de llegar?** Empieza por los [Primeros pasos](https://urieldomingezm.github.io/nexus-dialogs/primeros-pasos.html): cinco minutos para instalar y abrir tu primer diálogo. Esta guía es la referencia completa; no hace falta leerla de corrido.

## Índice

1. [Instalación](#1-instalación)
2. [Inicio rápido](#2-inicio-rápido)
3. [Recetas: lo de todos los días en una línea](#3-recetas-lo-de-todos-los-días-en-una-línea)
   - [Vue 3](#vue-3)
   - [React](#react)
   - [Angular](#angular)
   - [¿Vienes de SweetAlert2?](#vienes-de-sweetalert2)
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
| `nexus-dialogs` | **Núcleo**: `dialog.alert / confirm / prompt / open`, `configure` |
| `nexus-dialogs/forms` | `form()` y `wizard()` |
| `nexus-dialogs/toast` | `toast()` con cola |
| `nexus-dialogs/tabs` | Pestañas accesibles, sueltas o dentro de un diálogo (`tabsDialog`) |
| `nexus-dialogs/timeline` | Seguimiento por etapas con estado, fecha y progreso (`timelineDialog`) |
| `nexus-dialogs/themes` | Temas listos (Bootstrap, Tailwind, Material, oscuro) |
| `nexus-dialogs/patterns` | Recetas en una línea: borrar, cambios sin guardar, sesión, aprobaciones, acciones masivas… |
| `nexus-dialogs/mx` | Validadores de RFC, CURP, NSS, CLABE y código postal (también en Node) |
| `nexus-dialogs/vue` | Plugin y composables para Vue 3 |
| `nexus-dialogs/react` | Hooks y proveedor para React 18+ |
| `nexus-dialogs/angular` | Funciones de inyección y señales para Angular 16+ |
| `nexus-dialogs/swal` | Compatible con SweetAlert2: cambia el import y listo |

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

O el aviso suelto: `await sessionTimeout({ seconds: 120 })`. Atiende el criterio WCAG 2.2.1: cuenta regresiva visible, foco en «Seguir trabajando», extensiones sin límite y al lector de pantalla solo se anuncia cada minuto.

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

### Vue 3

```ts
// main.ts
import { NexusDialogs } from 'nexus-dialogs/vue'
app.use(NexusDialogs, { scheme: 'auto', toast: { position: 'top-right' } })
```

```vue
<script setup lang="ts">
import { useDialog, useToast } from 'nexus-dialogs/vue'
import { confirmDelete } from 'nexus-dialogs/patterns'

const dialog = useDialog()
const toast = useToast()
const borrar = dialog.scoped(confirmDelete)

async function eliminar(empleado) {
  if (await borrar({ what: `a ${empleado.nombre}` })) toast.success('Eliminado')
}
</script>
```

- Los diálogos que abre el componente **se cierran solos al desmontarlo** (por ejemplo, si el usuario cambia de ruta con uno abierto). `scoped()` hace lo mismo con recetas y formularios: `dialog.scoped(form)`, `dialog.scoped(wizard)`.
- `dialog.isOpen` es reactivo: ¿este componente tiene un diálogo abierto?
- Los toasts no se cierran al desmontar: «Guardado» sigue visible en la siguiente página.
- En la Options API: `this.$dialog.confirm(…)` y `this.$toast.success(…)`.
- `vue` es dependencia opcional: solo se necesita si importas `nexus-dialogs/vue`.

### React

```tsx
// main.tsx (opcional: solo si quieres configurar idioma, tema o toasts)
import { NexusDialogsProvider } from 'nexus-dialogs/react'

root.render(
  <NexusDialogsProvider scheme="auto" toast={{ position: 'top-right' }}>
    <App />
  </NexusDialogsProvider>,
)
```

```tsx
import { useDialog, useForm, useToast } from 'nexus-dialogs/react'
import { confirmDelete } from 'nexus-dialogs/patterns'

function Empleados() {
  const dialog = useDialog()
  const { form, scoped } = useForm()
  const toast = useToast()

  async function eliminar(empleado: Empleado) {
    if ((await dialog.confirm({ title: `¿Eliminar a ${empleado.nombre}?`, danger: true })).confirmed) toast.success('Eliminado')
  }

  async function nuevo() {
    const r = await form({ title: 'Nuevo empleado', fields: [{ name: 'nombre', label: 'Nombre', required: true }] })
    if (r.confirmed) guardar(r.value)
  }
  // …
}
```

- Es el mismo comportamiento que en Vue: los diálogos que abre el componente **se cierran solos al desmontarlo** (por ejemplo, si el usuario cambia de ruta con uno abierto). La promesa termina con `reason: 'program'`, así que no sigas actualizando el estado del componente si ya no existe.
- `useDialog()` trae `alert`, `confirm`, `prompt`, `open`, `success`, `error`, `warning` e `info`. `useForm()` trae `form`, `wizard` y `formFromJSON`. Los dos incluyen `isOpen` (el componente se vuelve a renderizar al cambiar), `closeAll()` y `scoped()` para el resto: `scoped(confirmDelete)`, `scoped(pickRows)`, `scoped(importData)`.
- Las funciones que devuelven los hooks son **estables entre renders**: puedes ponerlas en las dependencias de `useEffect` o `useCallback`. Envuelve con `scoped()` una sola vez (fuera del render o con `useMemo`).
- Funciona con `StrictMode`. Los toasts no se cierran al desmontar: «Guardado» sigue visible en la siguiente pantalla.
- `NexusDialogsProvider` no pinta nada propio y configura antes de que corran los efectos de los hijos. Si no necesitas configurar nada, no hace falta.
- Con Next.js, úsalos en componentes de cliente (`'use client'`). Importar el paquete no toca el DOM, así que el render en servidor no falla.
- Cada diálogo queda a nombre del componente que lo pidió (también los anidados), aunque dos componentes tengan diálogos abiertos a la vez: al desmontar uno se cierran solo los suyos. Un diálogo abierto desde fuera de los hooks no es de nadie.
- `react` (18 o superior) es dependencia opcional: solo se necesita si importas `nexus-dialogs/react`.

### Angular

Funciones de inyección y señales, sin decoradores (Angular 16 o superior; con o sin zone.js):

```ts
// app.config.ts (opcional: solo para idioma, tema, esquema, dirección o toasts)
import { provideNexusDialogs } from 'nexus-dialogs/angular'

export const appConfig: ApplicationConfig = {
  providers: [provideNexusDialogs({ scheme: 'auto', toast: { position: 'top-right' } })],
}
```

```ts
// En un componente o servicio
import { Component } from '@angular/core'
import { injectDialog, injectForm, injectToast } from 'nexus-dialogs/angular'
import { confirmDelete } from 'nexus-dialogs/patterns'

@Component({
  selector: 'app-empleados',
  template: `<button (click)="borrar()" [disabled]="dialog.isOpen()">Borrar</button>`,
})
export class Empleados {
  dialog = injectDialog()
  forms = injectForm()
  toast = injectToast()
  private confirmarBorrado = this.dialog.scoped(confirmDelete)

  async borrar() {
    if (await this.confirmarBorrado({ what: 'a Laura Méndez' })) this.toast.success('Eliminada')
  }
}
```

- `injectDialog()` trae `alert`, `confirm`, `prompt`, `open`, `success`, `error`, `warning` e `info`; `injectForm()` trae `form`, `wizard` y `formFromJSON`. Los dos incluyen `isOpen` (una **señal**), `closeAll()` y `scoped()` para recetas y otras funciones que abren diálogos.
- Llámalas en un contexto de inyección (campo de la clase, constructor o `inject`). Los diálogos que abre el componente se cierran solos cuando Angular lo destruye, por ejemplo al cambiar de ruta; los toasts no.
- Cada diálogo queda a nombre del componente que lo pidió, aunque haya varios abiertos a la vez.
- `@angular/core` (16 o superior) es dependencia opcional y este módulo solo existe como ESM, igual que Angular. Importar el paquete no toca el DOM, así que SSR no falla.

### ¿Vienes de SweetAlert2?

Cambia el import y tu código sigue funcionando (si usas `html`, agrega una vez `configure({ strictHtml: false })`, ver abajo):

```ts
// antes: import Swal from 'sweetalert2'
import Swal from 'nexus-dialogs/swal'

const r = await Swal.fire({
  title: '¿Estás seguro?',
  text: 'No podrás revertirlo',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar',
})
if (r.isConfirmed) eliminar()
```

Sin bundler, cambia el `<script>` de SweetAlert2 por este (define `window.Swal`):

```html
<script src="https://cdn.jsdelivr.net/npm/nexus-dialogs/dist/nexus-dialogs.swal.iife.js"></script>
```

En este build no hay `import`, así que la configuración global se hace con `Swal.configure(…)`, el mismo objeto que `configure()` de `nexus-dialogs`:

```html
<script>
  Swal.configure({ strictHtml: false }) // con HTML tuyo
  // o, con datos de usuario: Swal.configure({ sanitize: (h) => DOMPurify.sanitize(h) })
</script>
```

**Qué cubre**: `Swal.fire(título, html, icono)` y `Swal.fire({…})`, `Swal.mixin`, toasts (`toast: true`, `position`, `timer`), botones confirm/deny/cancel, `input` (text, email, password, number, tel, url, date, week, range, file, textarea, select, radio, checkbox) con `inputOptions`, `inputValidator`, `validationMessage`, `inputAutoTrim`, `inputAutoFocus` y `returnInputValueOnDeny`, `preConfirm`, `preDeny`, `timer` (con `stopTimer`, `resumeTimer`, `toggleTimer`, `increaseTimer`, `getTimerLeft`), `imageUrl`, `iconHtml`, `progressSteps`, `reverseButtons`, `allowEnterKey`, `draggable`, `template`, `theme` (light, dark y auto), `target`, los `aria-label` de los botones, los ganchos `willOpen`, `didOpen`, `willClose`, `didClose` y `didDestroy`, el resultado `{ isConfirmed, isDenied, isDismissed, value, dismiss }`, `Swal.DismissReason` y los métodos `close(resultado)`, `update` (título, texto, html, icono, imagen, pasos, pie y botones), `isVisible`, `showLoading`, `hideLoading`, `isLoading`, `getLoader` (con `loaderHtml`), `argsToParams`, `isValidParameter`, `isUpdatableParameter`, `bindClickHandler`, `showValidationMessage`, `resetValidationMessage`, `enableButtons`, `disableButtons`, `enableInput`, `disableInput`, los accesores (`getPopup`, `getContainer`, `getTitle`, `getHtmlContainer`, `getIcon`, `getImage`, `getInput`, `getActions`, `getFooter`, `getCloseButton`, `getTimerProgressBar`, `getProgressSteps`, `getFocusableElements`…) y `clickConfirm` y similares.

**Qué cambia a propósito**:
- Se aplica el [estándar de botones](#4-estándar-de-botones). Una confirmación cuyo botón dice «eliminar», «borrar» o «delete» pasa sola a **peligro**: botón rojo y el foco en Cancelar. Fuérzalo con `danger: true`.
- `confirmButtonColor`, `customClass` y similares se ignoran; los colores vienen del tema.
- El orden de los botones es siempre Cancelar, Denegar, Confirmar (la acción principal a la derecha).
- Los textos por omisión salen en el idioma configurado («Aceptar», «Cancelar»).
- Los toasts usan la cola de `nexus-dialogs/toast`; la posición es una sola para todos.
- `footer` se muestra como texto plano (sin etiquetas). `html` también sale como texto por omisión (`strictHtml`, desde la 0.5.0): con contenido tuyo usa `configure({ strictHtml: false })` (en el build sin bundler, `Swal.configure(…)`); con contenido de fuera, `configure({ sanitize })`.
- El contenido vive dentro del Shadow DOM: en vez de `document.getElementById('x')` usa `Swal.getHtmlContainer().querySelector('#x')`. El «popup» que reciben los ganchos y devuelve `getPopup()` es el panel, así que `popup.querySelector(…)` funciona.
- `theme` entiende `light`, `dark` y `auto`; `target` monta el diálogo en ese elemento pero sigue siendo modal; `reverseButtons: true` pone Confirmar primero; `template` no acepta `<swal-function-param>`.
- Sin equivalente: `Swal.version`, `topLayer`, `showClass`/`hideClass` y `animation` (el movimiento sale del tema y respeta «reducir movimiento»).

Cuando tengas tiempo, pasa a la API propia (`dialog.confirm`, recetas): es más corta y tiene tipos más precisos. En el sitio hay una [guía de migración](https://urieldomingezm.github.io/nexus-dialogs/migracion.html) con ejemplos de antes y después que puedes ejecutar, equivalencias y una lista de verificación.

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

Contenido propio con `render(ctx)` (devuelve un nodo) o `html` (una cadena sale como texto salvo que configures `sanitize` o `strictHtml: false`, y entonces solo con HTML tuyo; **nunca con datos del usuario**: `title` y `text` siempre son texto plano y seguros).

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

**Columnas responsive.** `columns: 2` reparte los campos en dos columnas y, en un teléfono, **se queda en dos** mientras quepan campos de unos 9 rem (si no, baja a una). `columns: 'auto'` usa tantas columnas como quepan (3 en escritorio, 2 en un teléfono) y los campos largos (`textarea`, `radio`, `segmented`, `items`, `address`, `signature`, `file`, `daterange`, `otp`) ocupan toda la fila; con `span: 2` fuerzas cualquier otro campo a fila completa, y con `span: 1` lo contrario. El ancho mínimo por columna en escritorio se ajusta con `--nd-col-min` (11 rem); en un teléfono nunca baja de 8.75 rem y no pasa de dos columnas.

**Botones y encabezado en teléfono.** Los botones del pie van en una sola fila (hasta 3 por fila, en columnas iguales; si no caben, bajan). Cuando el diálogo lleva icono, el contenido `html` usa todo el ancho en lugar de quedar sangrado bajo el título.

**Tipos de campo**: `text`, `email`, `tel`, `url`, `password`, `number`, `date`, `time`, `textarea`, `select`, `radio`, `segmented`, `checkbox`, `switch`, los [avanzados](#campos-avanzados) `combobox`, `file`, `daterange`, `otp` e `items`, y para México:

- `money`: muestra `$ 12,500.50 MXN` al salir del campo, teclado numérico en celular, devuelve `number`. Cambia `currency` y `locale` si hace falta.
- `rfc`, `curp`, `nss`, `clabe`, `postal`: ver [Validadores de México](#9-validadores-de-méxico).

### Campos avanzados

Cinco tipos más, con teclado, lector de pantalla y validación incluidos:

| Tipo | Para | Devuelve |
|---|---|---|
| `combobox` | Buscar y elegir (clientes, empleados), uno o varios | `string` o `string[]` |
| `file` | Subir archivos, con arrastrar y soltar | `File`, `File[]` o lo que devuelva `upload` |
| `daterange` | Periodos con atajos («Quincena actual») | `{ from, to }` en `AAAA-MM-DD` |
| `otp` | Código de verificación | `string` |
| `items` | Filas repetibles con totales (partidas, conceptos) | arreglo de filas |

**Buscar y seleccionar**

```ts
{ name: 'cliente', label: 'Cliente', type: 'combobox', required: true,
  search: (q) => api.clientes.buscar(q),     // o `options: [...]` para una lista fija
  creatable: (texto) => api.clientes.crear(texto) }, // ofrece «Crear «texto»» si no existe

{ name: 'equipo', label: 'Equipo', type: 'combobox', multiple: true, maxItems: 3,
  options: [{ value: 'ana', label: 'Ana Torres', description: 'Almacén', group: 'Almacén' }, …] }
```

Busca sin acentos («nomina» encuentra «Nómina»). Flechas para moverse, Enter elige y Esc cierra solo la lista. En múltiple, cada elegido es un chip con su botón «Quitar» y Retroceso borra el último. Con `search`, espera 250 ms a que dejes de escribir.

**Subir archivos**

```ts
{ name: 'ine', label: 'INE', type: 'file', multiple: true, maxFiles: 2,
  accept: '.pdf,image/*', maxSize: 5 * 1024 * 1024,
  upload: (file, progreso) => api.subir(file, progreso) } // opcional: sube al agregarlo
```

Siempre hay botón «Elegir archivos» además de arrastrar. Los archivos de otro tipo o demasiado pesados no se agregan y se avisa por qué. Con `upload`, cada archivo muestra su progreso y, si falla, «Reintentar». El formulario no se envía mientras algo se esté subiendo.

**Rango de fechas**

```ts
{ name: 'periodo', label: 'Periodo', type: 'daterange', required: true, maxDays: 31 }
```

Atajos: Hoy, Esta semana, Quincena actual, Este mes, Mes pasado y Últimos 30 días. Cambia los tuyos con `presets: [{ label: 'Bimestre', range: () => [inicio, fin] }]` o quítalos con `presets: false`. También admite `min` y `max` en `AAAA-MM-DD`.

**Código de verificación**

```ts
{ name: 'codigo', label: 'Código', type: 'otp', length: 6 }
```

Es un solo campo con cajas visuales: pegar funciona, el celular sugiere el código del SMS (`one-time-code`) y al completarlo pulsa el botón principal (`autoSubmit: false` para evitarlo).

**Filas repetibles con totales**

```ts
{ name: 'partidas', label: 'Partidas', type: 'items', required: true, maxRows: 20, addText: 'Agregar partida',
  fields: [
    { name: 'concepto', label: 'Concepto', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, value: 1 },
    { name: 'precio', label: 'Precio unitario', type: 'money', required: true },
  ],
  totals: (filas) => {
    const subtotal = filas.reduce((s, f) => s + (f.cantidad ?? 0) * (f.precio ?? 0), 0)
    return [
      { label: 'Subtotal', value: pesos(subtotal) },
      { label: 'IVA', value: pesos(subtotal * 0.16) },
      { label: 'Total', value: pesos(subtotal * 1.16) },
    ]
  } }
```

Cada fila valida sus campos (los errores se marcan en la fila) y tiene su botón «Quitar fila N». Los totales se recalculan al escribir. En celular, cada fila se apila como tarjeta.

#### `phone`: teléfono con lada

```ts
{ name: 'telefono', label: 'Teléfono', type: 'phone', required: true }
```

Lada a elegir (+52 por omisión; cambia la lista con `countries` y la inicial con `dialCode`). Se formatea mientras se escribe (`81 1234 5678`, `222 123 4567`), valida el número de dígitos de cada país y entrega el número completo: `'+528112345678'`. Acepta ese mismo formato como valor inicial. `formatPhone(digitos, lada)` está exportado.

#### `address`: dirección por código postal

```ts
{ name: 'domicilio', label: 'Domicilio', type: 'address', required: true,
  lookupPostalCode: async (cp) => {
    const r = await fetch(`/api/cp/${cp}`) // tu API o SEPOMEX
    return r.ok ? r.json() : null // { state, municipality, neighborhoods: [...] }
  } }
```

Al escribir los 5 dígitos llena estado y municipio; con varias colonias ofrece la lista, con una la pone directo. Si el CP no existe, avisa y deja escribir todo a mano. La librería no trae catálogo (pesaría megas): tú decides de dónde sale. Valor: `{ postalCode, state, municipality, neighborhood, street }`; si es obligatorio, dice qué parte falta. Para no depender de una API, usa el [catálogo SEPOMEX](#catálogo-sepomex-sin-api).

#### Calendario en `daterange`

```ts
{ name: 'vacaciones', label: 'Fechas', type: 'daterange', calendar: true, maxDays: 20 }
```

Con `calendar: true` el rango se elige en un calendario en la pantalla (dos clics, en cualquier orden) y las fechas se escriben como `dd/mm/aaaa`, sin el selector del navegador. Teclado completo: flechas (día y semana), Re Pág / Av Pág (mes), Inicio / Fin (semana), Enter para elegir. Respeta `min`, `max` y los atajos. Semana de lunes a domingo.

**Días hábiles.** Con `businessDays: true` muestra «8 días hábiles» bajo las fechas, el calendario raya los fines de semana y marca en naranja los festivos, y `maxDays` pasa a contar solo hábiles (los festivos no gastan vacaciones). Los festivos de ley salen del artículo 74 de la LFT (`mexicanHolidays(año)` en `nexus-dialogs/mx`); los de la empresa van en `holidays: ['2026-12-24']`. Con `businessDays: 'custom'` solo cuentan los tuyos.

```ts
{ name: 'vacaciones', label: 'Días', type: 'daterange', calendar: true, businessDays: true, holidays: ['2026-12-24', '2026-12-31'], maxDays: 12 }
```

En `nexus-dialogs/mx` también están `businessDays(desde, hasta)`, `isBusinessDay(fecha)` y `addBusinessDays(fecha, n)` (fechas límite), sin DOM: sirven en el servidor.

**Fecha sola.** `{ type: 'date', calendar: true }` escribe `dd/mm/aaaa` y abre el calendario con el botón, con ↓ o con Alt+Enter. Se despliega en la capa superior del navegador, así que no lo recorta el diálogo.

#### `signature`: firma en pantalla

```ts
{ name: 'firma', label: 'Firma del empleado', type: 'signature', required: true }
```

Se firma con el dedo, el mouse o la pluma. Para quien usa teclado o no puede trazar, «Escribir mi nombre» lo dibuja con letra manuscrita. El valor es la imagen en PNG (`data:image/png;base64,…`), lista para guardarla o ponerla en un PDF.

**Validación**: `required`, `minLength`, `maxLength`, `min`, `max`, `pattern` (+ `patternMessage`) y `validate(valor, valores)` por campo, que puede ser async («¿ya existe este RFC?»). Al enviar con errores aparece un **resumen arriba con enlaces** a cada campo, cada campo queda con `aria-invalid` y su mensaje ligado con `aria-describedby`.

**Campos condicionales**: `visible: (valores) => boolean`, o declarativo con `visibleIf: { field: 'tipo', equals: 'empresa' }` (también `notEquals`, `in: [...]`, `filled`, y `all`, `any`, `not` para combinar). Los ocultos no se validan ni se envían.

**Borrador automático**: con `draftKey: 'alta-empleado'` lo que se escribe se guarda en el navegador (`localStorage`, sin contraseñas ni archivos). Si se cierra la pestaña o se recarga, al volver a abrir pregunta «¿Continuar donde te quedaste?». Se borra al enviar o al elegir «Descartar» / «Empezar de nuevo». Con `draftPrompt: false` restaura sin preguntar.

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

**Pasos condicionales**: `when` en el paso (función o la misma condición declarativa de `visibleIf`) lo muestra solo si aplica con lo contestado antes. La barra, el «Paso 1 de N», la revisión y los valores enviados se ajustan solos.

```ts
{ title: 'Datos fiscales', when: { field: 'tipo', equals: 'empresa' }, fields: [/* … */] }
```

El asistente también acepta `draftKey`: además de los valores, recuerda en qué paso iba.

Cada paso valida antes de avanzar, «Atrás» nunca pierde datos, Enter avanza, el título del paso recibe el foco para que el lector de pantalla lo anuncie («Paso 2 de 3») y en celular el indicador muestra solo el paso actual. `onStepChange(i, valores)` avisa cada cambio.

### Formularios desde JSON

Para que cada empresa tenga sus propios formularios (guardados en tu base de datos), descríbelos en JSON y ábrelos con `formFromJSON`. Las funciones van por nombre y las pasas en `resolvers`; con `steps` se abre un asistente.

```ts
import { formFromJSON } from 'nexus-dialogs/forms'

const esquema = {
  title: 'Solicitud de permiso',
  columns: 2,
  fields: [
    { name: 'motivo', label: 'Motivo', type: 'select', required: true, options: ['Personal', 'Médico', 'Otro'] },
    { name: 'otro', label: '¿Cuál?', required: true, visibleIf: { field: 'motivo', equals: 'Otro' } },
    { name: 'rfc', label: 'RFC', type: 'rfc', validate: 'rfcLibre' },
  ],
}
const r = await formFromJSON(esquema, { resolvers: { rfcLibre: async (rfc) => ((await existe(rfc)) ? 'Ya está registrado' : null) } })
```

Un tipo desconocido o un resolver que falta rechaza la promesa con un mensaje claro (sin abrir nada). `fieldsFromJSON()` convierte solo los campos, por si quieres armarlos tú.

### Importar CSV o Excel

```ts
import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importar empleados',
  columns: [
    { name: 'numero', label: 'Número de empleado', required: true, unique: true },
    { name: 'nombre', label: 'Nombre completo', required: true, aliases: ['empleado'] },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
    { name: 'ingreso', label: 'Fecha de ingreso', type: 'date' },
    { name: 'salario', label: 'Salario diario', type: 'number' },
  ],
  onImport: (filas) => api.post('/empleados/lote', filas), // con «Importando…»; si falla, el error se muestra
})
```

Tres pasos: elegir el archivo (CSV o `.xlsx`, sin dependencias), relacionar las columnas (se relacionan solas por nombre, sin acentos y con abreviaturas como «No. empleado») y revisar: cuántas filas están bien y cuáles tienen error («Fila 5 · RFC no es válido»). Solo se importan las válidas. Tipos: `text`, `number` (acepta `$1,234.50` y `1.234,50`), `date` (`dd/mm/aaaa`, ISO o fecha de Excel), `boolean` (sí/no, 1/0, x), `email`, `rfc`, `curp`, `nss`, `clabe`, `postal`. «Descargar plantilla» baja un CSV con los encabezados.

Las piezas sirven por separado: `readSpreadsheet(file)`, `parseCSV(texto)`, `guessMapping()`, `processRows()`, `convert()`.

### Elegir de una tabla

```ts
import { pickRows } from 'nexus-dialogs/table'

const r = await pickRows({
  title: 'Agregar participantes',
  rows: empleados, // o load: ({ search, page, pageSize }) => api.get(...) → { rows, total }
  rowKey: 'numero',
  columns: [
    { key: 'numero', label: 'Núm.' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'salario', label: 'Salario', align: 'right', format: (v) => pesos(v) },
  ],
  isDisabled: (e) => e.baja, // no se pueden elegir
  max: 30,
})
if (r.confirmed) agregar(r.value)
```

Búsqueda sin acentos, páginas, «seleccionar todos los de esta página», clic en cualquier parte de la fila y la selección se conserva al buscar o cambiar de página. `multiple: false` para elegir una sola. En celular la tabla se desplaza a lo ancho.

Con `onExport` aparece «Exportar seleccionados: Excel · CSV» (o «Exportar todo» si no hay selección): `onExport: (rows, format) => exportData(rows, { columns, format, filename: 'empleados' })`.

### Pestañas

```ts
import { tabsDialog } from 'nexus-dialogs/tabs'

await tabsDialog({
  title: 'Ana Torres Reyes',
  header: 'Citado · Auxiliar administrativo', // texto o un nodo, sobre las pestañas
  tabs: [
    { id: 'general', label: 'Datos generales', content: () => tarjetaGeneral(candidato) },
    { id: 'cita', label: 'Cita y entrevista', badge: 1, content: async () => tarjetaCita(await api.cita(id)) },
  ],
})
```

El detalle de un candidato, la ficha de un empleado, una encuesta con varias secciones. El contenido de cada pestaña es **texto, un nodo o una función** (se llama la primera vez que se abre la pestaña y puede ser `async`: mientras tanto sale «Cargando…», y si falla, un aviso). Para HTML en cadena usa `html: '…'`, que pasa por `sanitize` / `strictHtml` como el `html` de cualquier diálogo.

- **Accesible**: `tablist` / `tab` / `tabpanel` enlazados; flechas (invertidas en RTL), Inicio y Fin; las pestañas deshabilitadas se saltan; el foco empieza en la activa.
- **Altura estable** (`height: 'stable'`, por omisión): el diálogo mide lo que la pestaña más alta y no brinca al cambiar. Con `height: 'auto'` mide lo que la activa. Si el contenido es más alto que la pantalla, la lista de pestañas se queda fija arriba y solo se desplaza el contenido.
- **Estilos**: `variant: 'underline'` (por omisión) o `'segmented'`. `badge` muestra un número o un texto corto junto a la etiqueta.
- Por omisión un solo botón «Cerrar»; pasa `buttons` para otra cosa (por ejemplo, Guardar y Cancelar).

Para ponerlas dentro de otro diálogo (`dialog.open` con `render`, un `form`…): `const t = tabs({ tabs: [...] })` devuelve `{ el, current, select(id), panel(id), setBadge(id, n), setDisabled(id, bool) }`; inserta `t.el` y agrega `styles: TABS_CSS` al diálogo.

### Tamaños y diseño adaptable

Hay dos cosas que se pueden configurar, y no se confunden: el **ancho del diálogo** (`size`) y el **tamaño del contenido** (`scale`).

| Opción | Valores | Qué cambia |
|---|---|---|
| `size` (diálogo) | `sm` 400 px, `md` 480, `lg` 640, `xl` 860 o un número | El ancho. En celular el diálogo central se vuelve hoja inferior |
| `scale` en `tabs` | `sm` 34 px, `md` 42 (por omisión), `lg` 50 | Alto y letra de las pestañas |
| `scale` en `timeline` | `sm` marcador de 24 px, `md` 32 (por omisión), `lg` 40 | Marcador y letra de las etapas |
| `fill` en `tabs` | `true` / `false` | Las pestañas se reparten todo el ancho (por omisión, solo en `segmented`) |
| `layout` en `timeline` | `vertical` (por omisión) / `horizontal` | Etapas en columna o en una fila (abre en `xl`) |

Se adaptan al **ancho del contenedor**, no al de la pantalla: sirven igual en un diálogo, un panel lateral o una hoja inferior. Las pestañas se compactan y la lista se desplaza si no caben; el seguimiento `horizontal` vuelve solo a vertical cuando el contenedor mide menos de 36 rem.

Para medidas propias, variables CSS con `theme` (o en tu hoja): `--nd-tab-height`, `--nd-tab-font-size`, `--nd-tab-padding`, `--nd-tl-marker`, `--nd-tl-title` y `--nd-tl-text`.

```ts
await tabsDialog({ title: 'Resultado', size: 'sm', scale: 'sm', fill: true, tabs, theme: { '--nd-tab-height': '38px' } })
await timelineDialog({ title: 'Contratación', layout: 'horizontal', scale: 'lg', steps })
```

### Seguimiento por etapas

```ts
import { timelineDialog } from 'nexus-dialogs/timeline'

await timelineDialog({
  title: 'Torres Reyes Ana Lucía',
  steps: [
    { id: 'cita', title: 'Cita', description: 'Cita registrada; falta confirmar asistencia.', date: '13/11/2026', status: 'current' },
    { id: 'docs', title: 'Documentos', description: 'Sin expediente recibido todavía.', status: 'pending' },
  ],
  footnote: 'Los estados salen de los registros del sistema.',
})
```

El avance de un candidato, un trámite o un pedido. Estados: `done`, `current`, `pending`, `error` y `skipped`. Cada etapa **dice su estado con texto** («Completada», «En curso», «Pendiente»…), no solo con color; `statusLabel` pone otro texto («Esperando al candidato»). Arriba va «2 de 6 etapas completadas · 33 %» con una barra de progreso (`progressbar`); las etapas `skipped` no cuentan. La etapa en curso se anuncia como paso actual (`aria-current="step"`). `date` acepta texto libre o una `Date` (se formatea según el idioma); sin fecha sale «Sin dato» (`emptyDate` lo cambia u oculta). `summary: false` quita el resumen; un texto lo reemplaza.

Con el diálogo abierto, `onOpen: (ctx, t) => …` entrega el control: `t.setStatus('docs', 'done', { date: new Date() })` actualiza la etapa, el resumen y la barra; `t.progress()` devuelve `{ done, total, percent }`. Para ponerlo dentro de otro diálogo: `timeline({ steps })` y `styles: TIMELINE_CSS`.

### Exportar a Excel o CSV

```ts
import { exportData } from 'nexus-dialogs/import'

await exportData(empleados, {
  filename: 'empleados',
  sheet: 'Empleados',
  columns: [
    { key: 'numero', label: 'Número' },
    { key: 'nombre', label: 'Nombre completo' },
    { key: 'ingreso', label: 'Fecha de ingreso', type: 'date' }, // fecha de verdad en Excel
    { key: 'salario', label: 'Salario diario', type: 'number' },
  ],
}) // descarga empleados.xlsx; con format: 'csv', empleados.csv
```

Sin dependencias: el .xlsx se arma aquí mismo, con encabezados en negrita, fila fija, filtros, anchos según el contenido y fechas y números reales. `toXLSX()` y `toCSV()` devuelven el archivo sin descargarlo (para subirlo o mandarlo por correo).

### Plantillas de RR. HH.

Nueve formularios listos, en JSON puro (se guardan en tu base de datos y se ajustan por empresa): `altaEmpleado` (asistente de 4 pasos con revisión), `vacaciones` (calendario con días hábiles), `permiso`, `incapacidad` (IMSS), `baja` (motivo, finiquito, entrega y firma) `gastos` (partidas y comprobantes), `evaluacion` (competencias de 1 a 5, resultado y compromisos), `capacitacion` (curso, asistentes y constancia DC-3) y `cambioPuesto` (ascenso, transferencia o cambio de sueldo con aprobación).

```ts
import { formFromJSON } from 'nexus-dialogs/forms'
import { plantillas, sinResolvers } from 'nexus-dialogs/rrhh'

await formFromJSON(plantillas.vacaciones, { values: { empleado: 'Ana Torres' } })
// Alta usa funciones por nombre (rfcLibre, curpLibre, buscarCP): pásalas en resolvers, o quítalas:
await formFromJSON(sinResolvers(plantillas.altaEmpleado))
```

### Catálogo SEPOMEX sin API

Para llenar el domicilio por código postal sin depender de un servicio externo, sirve el catálogo oficial desde tu sitio:

1. Descarga el TXT en [correosdemexico.gob.mx](https://www.correosdemexico.gob.mx) («Descarga tu código postal»).
2. Conviértelo en archivos pequeños por prefijo: `npx nexus-dialogs-sepomex CPdescarga.txt public/cp`
3. Úsalo:

```ts
import { sepomexLookup } from 'nexus-dialogs/sepomex'
const lookupPostalCode = sepomexLookup({ baseUrl: '/cp/' })
// { name: 'domicilio', label: 'Domicilio', type: 'address', lookupPostalCode }
```

Cada búsqueda baja solo el archivo de su prefijo (unos KB) y lo guarda en memoria. Para actualizar, repite los pasos 1 y 2.

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

Temas incluidos: `light`, `dark`, `bootstrap`, `tailwind`, `tailwindDark`, `material`.

### Tailwind, Bootstrap y el modo claro y oscuro de tu página

`themes.tailwind` es la paleta clara y `themes.tailwindDark` su par oscuro (slate e indigo). `followPageScheme` observa el modo de tu página y cambia entre las dos, también cuando la persona usa un interruptor de tema:

```ts
import { configure } from 'nexus-dialogs'
import { toast } from 'nexus-dialogs/toast'
import { themes, followPageScheme } from 'nexus-dialogs/themes'

followPageScheme(
  ({ scheme, theme }) => {
    configure({ scheme, theme })
    toast.configure({ scheme, theme })
  },
  { light: themes.tailwind, dark: themes.tailwindDark },
)
```

Qué entiende como «oscuro»:

| Tu página | Opción |
|---|---|
| Tailwind con `darkMode: 'class'` (v3) o `@custom-variant dark` (v4): `<html class="dark">` | por omisión (`strategy: 'class'`) |
| Tailwind sin configurar, que sigue el modo del sistema | `strategy: 'media'` |
| Bootstrap 5.3 (`data-bs-theme="dark"`) o `data-theme="dark"` | por omisión; con `light: themes.bootstrap` |
| Otra clase para el modo oscuro | `darkClass: 'tema-noche'` |

Devuelve una función que deja de observar. Los diálogos que se abran después salen en el modo nuevo; uno ya abierto conserva el que tenía. Sin esto, `configure({ theme: themes.tailwind })` fija colores claros y no cambian con el modo de la página. Para CSS propio de un diálogo: `styles: '.title { … }'` y `className`.

El CSS se aplica con hojas de estilo construibles (`adoptedStyleSheets`), así que funciona con una Content-Security-Policy estricta sin `unsafe-inline`.

## 11. Idioma y textos

Español por omisión. Inglés con `configure({ lang: 'en' })` (y `toast.configure({ lang: 'en' })`). Cambia textos sueltos:

```ts
configure({ labels: { cancel: 'Cerrar', submit: 'Guardar cambios' } })
```

Otros idiomas se registran; lo que no traduzcas se ve en inglés. Portugués (Brasil) y francés vienen listos en `nexus-dialogs/locales`:

```ts
import { registerLanguage, configure, pageLanguage } from 'nexus-dialogs'
import { pt } from 'nexus-dialogs/locales'

registerLanguage('pt', pt)
configure({ lang: 'pt' })            // o { lang: pageLanguage() } para seguir a <html lang>
```

Detalle, plugins (`use`) y tipos de campo propios (`registerField`): [Plugins e idiomas](https://urieldomingezm.github.io/nexus-dialogs/plugins.html).

### Derecha a izquierda (RTL)

Los diálogos y toasts siguen la dirección de tu página: con `<html dir="rtl">` todo se espeja (botón ×, orden de los botones, iconos, interruptores, calendario con las flechas invertidas, tablas y listas). También se puede fijar a mano:

```ts
configure({ dir: 'rtl' })              // 'ltr' | 'rtl' | 'auto' (por omisión: la de la página)
await dialog.alert({ title: 'مرحبا', dir: 'rtl' }) // solo este diálogo
```

Los teléfonos se escriben siempre de izquierda a derecha. `placement: 'left' | 'right'` y las posiciones de los toasts (`top-left`…) son físicas: en una página RTL elige el lado que quieras.

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
| `NexusDialogs` (plugin), `useDialog`, `useToast` | `nexus-dialogs/vue` |
| `NexusDialogsProvider`, `useDialog`, `useForm`, `useToast` | `nexus-dialogs/react` |
| `provideNexusDialogs`, `injectDialog`, `injectForm`, `injectToast` | `nexus-dialogs/angular` |
| `Swal` (por omisión), `DismissReason` | `nexus-dialogs/swal` |
| `configure({ lang, labels, theme, scheme, dir, defaults, sheetOnMobile })` | Global |

Eventos en `document`: `nexus-dialogs:open` y `nexus-dialogs:close` (con `detail.dialog`).

La API pública completa, generada de los tipos, está en [`api/nexus-dialogs.api.md`](api/nexus-dialogs.api.md).

## 13. Compatibilidad

- Navegadores actuales: Chrome/Edge 111+, Firefox 113+, Safari 16.4+ (usa `<dialog>` modal y `color-mix()`). Probado en Chromium, Firefox y WebKit. Función por función, qué pasa si falta alguna y la política de versiones y de soporte: [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html). Cómo actualizar sin sorpresas: [Versionado y migraciones](https://urieldomingezm.github.io/nexus-dialogs/versiones.html).
- **nexus-tours**: los diálogos son `<dialog open>` de verdad, así que los tours los detectan y pueden explicar lo que hay dentro.
- Bootstrap, Tailwind, SweetAlert2: sin choques de `z-index` ni de CSS. Para migrar de SweetAlert2, ver [¿Vienes de SweetAlert2?](#vienes-de-sweetalert2).
- Seguridad: [`docs/seguridad.md`](docs/seguridad.md). Para reportar una vulnerabilidad, [`SECURITY.md`](SECURITY.md).
- Vue 3.3+ con `nexus-dialogs/vue`. React 18+ con `nexus-dialogs/react`. Angular 16+ con `nexus-dialogs/angular`. CI instala y prueba cada una en su versión mínima y en la última (matriz en [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html), salida de [`compat/matriz.json`](compat/matriz.json)).
- Node 18 o más (probado en 18, 20, 22 y 24). SSR: importar no toca el DOM; los diálogos se abren solo en el navegador.

## 14. Desarrollo

```bash
npm ci
npm run dev           # página de pruebas en test/paginas/
npm run build:site    # sitio de documentación en site-dist/ (necesita npm run build antes)
npm run test:unit     # Vitest + happy-dom
npm run test:e2e      # Playwright (Chromium, Firefox, WebKit) + axe
npm run build && npm run size && npm run api:check && npm run check:paquete
npm run compat:check  # la matriz de compatibilidad coincide con package.json y docs/soporte.md
npm run bench         # tamaños, tiempos y memoria repetibles (docs/rendimiento.md)
```

Ejemplos completos de principio a fin (alta de empleado, cierre de quincena, importar empleados): [`examples/`](examples/). Tamaños y tiempos: [Rendimiento](https://urieldomingezm.github.io/nexus-dialogs/rendimiento.html).

¿Quieres colaborar? Lee [`CONTRIBUTING.md`](CONTRIBUTING.md). Ver [CHANGELOG](CHANGELOG.md).

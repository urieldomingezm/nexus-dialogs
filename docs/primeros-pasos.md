# Primeros pasos

Cinco minutos: instalar, abrir tu primer diálogo y resolver tres casos de todos los días. No necesitas leer la guía completa para empezar; cuando te haga falta algo más, el último apartado te dice dónde buscarlo.

## 1. Instalar

```bash
npm i nexus-dialogs
```

Sin bundler, con un `<script>` desde un CDN, también sirve: ver la [guía](https://urieldomingezm.github.io/nexus-dialogs/guia.html#1-instalación).

## 2. Tu primer diálogo: confirmar una operación

```ts
import { dialog } from 'nexus-dialogs'

const r = await dialog.confirm({
  title: '¿Enviar el pedido?',
  text: 'Se avisará al almacén.',
  confirmText: 'Enviar',
})

if (r.confirmed) await enviarPedido()
```

Cancelar, cerrar con Esc o hacer clic fuera **no es un error**: la promesa resuelve siempre con `{ confirmed, denied, value, reason }`. Si lo que borras no tiene vuelta atrás, agrega `danger: true` y el foco queda en Cancelar.

## 3. Pedir datos: crear un cliente

```ts
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'

const nuevo = await form<{ nombre: string; correo: string }>({
  title: 'Nuevo cliente',
  submitText: 'Crear cliente',
  fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'correo', label: 'Correo', type: 'email', required: true },
  ],
  preConfirm: (v) => api.clientes.crear(v), // muestra «Procesando…»; si lanza, el error se ve dentro del diálogo
})

if (nuevo.confirmed) toast.success('Cliente creado')
```

La validación (campos obligatorios, correo válido) y los errores de cada campo ya vienen hechos.

## 4. Registrar una compra

```ts
const compra = await form({
  title: 'Registrar compra',
  columns: 2,
  fields: [
    { name: 'proveedor', label: 'Proveedor', required: true },
    { name: 'producto', label: 'Producto', type: 'select', options: ['Papelería', 'Limpieza', 'Equipo'], required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true },
    { name: 'importe', label: 'Importe', type: 'money', min: 1, required: true },
  ],
  validate: (v) => (v.importe > 50000 ? { importe: 'Más de $50,000 requiere orden de compra.' } : undefined),
})
```

`validate` revisa varios campos a la vez y devuelve un mensaje por campo.

## 5. Importar productos desde Excel o CSV

```ts
import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importar productos',
  columns: [
    { name: 'sku', label: 'SKU', required: true, unique: true },
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'precio', label: 'Precio', type: 'number' },
  ],
  onImport: (filas) => api.post('/productos/lote', filas),
})
```

El usuario elige el archivo, se relacionan las columnas solas por nombre y se revisa cuántas filas están bien antes de importar. Todo corre en el navegador.

## Qué sigue

| Si necesitas… | Ve a |
|---|---|
| Recetas de todos los días (borrar, sin guardar, sesión, aprobar) | [Guía: recetas](https://urieldomingezm.github.io/nexus-dialogs/guia.html#3-recetas-lo-de-todos-los-días-en-una-línea) |
| Más campos, columnas y asistentes | [Guía: formularios](https://urieldomingezm.github.io/nexus-dialogs/guia.html#6-formularios) y [asistentes](https://urieldomingezm.github.io/nexus-dialogs/guia.html#7-asistentes-wizard) |
| Pestañas, tablas y seguimiento por etapas | [Guía: tablas, pestañas y seguimiento](https://urieldomingezm.github.io/nexus-dialogs/guia.html#elegir-de-una-tabla) |
| Vue, React o Angular | [Guía: Vue 3](https://urieldomingezm.github.io/nexus-dialogs/guia.html#vue-3), [React](https://urieldomingezm.github.io/nexus-dialogs/guia.html#react) y [Angular](https://urieldomingezm.github.io/nexus-dialogs/guia.html#angular) |
| Plantillas de RR. HH. y validadores de México (RFC, CURP, NSS, CLABE) | [Guía: plantillas de RR. HH.](https://urieldomingezm.github.io/nexus-dialogs/guia.html#plantillas-de-rr-hh) y [validadores](https://urieldomingezm.github.io/nexus-dialogs/guia.html#9-validadores-de-méxico) |
| Cambiar desde SweetAlert2 | [Migrar](https://urieldomingezm.github.io/nexus-dialogs/migracion.html) |
| Probar todo en vivo | [Ejemplos](https://urieldomingezm.github.io/nexus-dialogs/ejemplos.html) |
| Qué garantiza cada módulo y qué no hace | [Limitaciones y garantías](https://urieldomingezm.github.io/nexus-dialogs/limitaciones.html#garantías-por-módulo) |

Una forma estable de extender la librería sin tocar su código: ganchos que corren con **todos** los diálogos (también los de `form`, `wizard`, `confirmDelete`…), tipos de campo propios para los formularios y textos en otros idiomas.

## Instalar un plugin

Un plugin es un objeto con un `name` y, si quieres, `install` y ganchos:

```ts
import { use, type Plugin } from 'nexus-dialogs'

const auditoria: Plugin = {
  name: 'auditoria',
  // Se llama una vez al instalar. Recibe `configure` y `labels`.
  install: ({ configure }) => configure({ defaults: { dismissible: { backdrop: false } } }),
  // Antes de abrir: devuelve las opciones cambiadas (o nada, si solo observas).
  beforeOpen: (o) => ({ ...o, title: o.title ?? 'Aviso' }),
  // Con el diálogo ya en pantalla.
  afterOpen: (ctx, o) => console.log('abrió', o.title, ctx.dialog),
  // Después de cerrar, con el resultado.
  afterClose: (r, o) => registrar({ titulo: o.title, confirmado: r.confirmed, motivo: r.reason }),
}

use(auditoria) // true; con el mismo nombre otra vez no hace nada y devuelve false
```

| Función | Qué hace |
|---|---|
| `use(plugin)` | Instala el plugin. Devuelve `false` si ya había uno con ese nombre |
| `unuse(name)` | Lo quita. Devuelve `false` si no estaba |
| `plugins()` | Los nombres de los instalados, en orden |

## Cómo se comportan los ganchos

- Corren **en el orden en que se instalaron**. Con `beforeOpen`, cada plugin recibe las opciones que dejó el anterior.
- Valen para todo lo que abre un diálogo: `dialog.*`, `form`, `wizard`, las recetas, `toast` no (los toasts no son diálogos).
- `afterOpen` y `afterClose` van **después** del `onOpen` y del `onClose` que el propio diálogo pida.
- Un gancho que lanza un error se escribe en la consola (`console.error(nombre, gancho, error)`) y **no** impide abrir ni cerrar el diálogo ni detiene a los demás plugins.
- No instales ni quites plugins desde dentro de un gancho.
- Si ya habías abierto un diálogo, los ganchos de un plugin nuevo no le llegan: solo a los que se abran después.

## Tipos de campo propios

Con `registerField` (en `nexus-dialogs/forms`) un plugin agrega un tipo que se usa como cualquier otro en `form()` y `wizard()`:

```ts
import { registerField } from 'nexus-dialogs/forms'

const quitar = registerField('rating', (ctx, valor) => {
  const el = document.createElement('input')
  el.id = ctx.id // la etiqueta del campo apunta aquí
  el.type = 'number'
  el.min = '1'
  el.max = '5'
  el.value = String(valor ?? 3)
  return {
    el,
    value: () => Number(el.value),
    focus: () => el.focus(),
    invalid: (on) => el.toggleAttribute('aria-invalid', on),
    validate: () => (Number(el.value) >= 1 ? null : 'Elige de 1 a 5.'),
    summary: () => `${el.value} de 5`, // lo que se ve en la revisión del asistente
  }
})

await form({ title: 'Evalúa', fields: [{ name: 'nota', label: 'Nota', type: 'rating' }] })
quitar() // lo deja de registrar
```

El control devuelve su `el`, `value()`, `focus()` e `invalid(on)`; `validate`, `summary`, `group` (usa `<fieldset>` en lugar de `<label>`) y `lazy` son opcionales (el tipo `CustomControl` los describe). La etiqueta, la ayuda y el mensaje de error los pone la librería. No se puede reemplazar un tipo que ya existe: `registerField` lanza un error.

Como los controles viven dentro del Shadow DOM del diálogo, su CSS debe ir con ellos: un `<style>` dentro de `el`, o estilos en línea.

## Textos en otros idiomas

Español e inglés vienen incluidos. Otros idiomas se registran con `registerLanguage`; lo que no traduzcas se ve en inglés:

```ts
import { registerLanguage, configure, pageLanguage } from 'nexus-dialogs'
import { pt, fr } from 'nexus-dialogs/locales' // portugués (Brasil) y francés, listos

registerLanguage('pt', pt)
configure({ lang: 'pt' }) // o configure({ lang: pageLanguage() }) para seguir a <html lang>
```

- Los códigos regionales se reducen al principal: `pt-BR` es `pt`, tanto al registrar como al configurar.
- Solo el núcleo y los toasts usan los textos registrados (`toast.configure({ lang: 'pt' })` para los avisos). Las recetas (`configurePatterns`), las tablas, la importación y demás módulos tienen sus propios textos y, en un idioma registrado, salen en inglés hasta que los cambies con la función de configuración de cada módulo.
- Puedes completar un idioma por partes: llamar otra vez a `registerLanguage` con el mismo código **mezcla** con lo ya registrado. Hazlo antes de `configure({ lang })`.
- `nexus-dialogs/locales` es un archivo aparte (1.3 KB): si no lo importas, no pesa.

## Qué se promete

`use`, `unuse`, `plugins`, la forma de `Plugin` (`name`, `install`, `beforeOpen`, `afterOpen`, `afterClose`), `registerField`, `CustomControl`, `registerLanguage` y `labelsFor` son API pública: cambiarlos cuenta como cambio que rompe y `npm run api:check` lo vigila ([Versionado y migraciones](https://urieldomingezm.github.io/nexus-dialogs/versiones.html)).

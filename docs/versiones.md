Cómo se numeran las versiones, cómo leer el CHANGELOG y qué hacer antes y después de actualizar. La política completa y lo que se soporta está en [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html); aquí va la parte práctica.

## Cómo se numeran las versiones

Se sigue [versionado semántico](https://semver.org/lang/es/) (`mayor.menor.parche`):

| Cambio | Ejemplo | Qué esperar |
|---|---|---|
| **Parche** | `1.0.0` → `1.0.1` | Solo correcciones. Actualizar es seguro |
| **Menor** | `1.0.x` → `1.1.0` | Solo agrega. (Hasta la `0.x`, una menor podía romper) |
| **Mayor** | `1.x` → `2.0` | Puede romper. Lo que se quite se avisó como obsoleto una versión menor antes |

Qué cuenta como «romper» (quitar o renombrar una exportación pública, cambiar lo que devuelve una función, cambiar un valor por omisión que altera el resultado o subir el mínimo de un navegador) está en [Soporte](https://urieldomingezm.github.io/nexus-dialogs/soporte.html#versiones).

## Cómo leer el CHANGELOG

Cada versión del [CHANGELOG](https://github.com/urieldomingezm/nexus-dialogs/blob/main/CHANGELOG.md) se divide en apartados, siempre en este orden:

- **Cambios que rompen:** lo que hay que revisar antes de actualizar, cada uno con cómo migrar. Si el apartado no existe, esa versión no rompe nada.
- **Agregado** y **Cambiado:** funciones nuevas y ajustes de comportamiento.
- **Obsoleto:** lo que se quitará más adelante y con qué sustituirlo.
- **Corregido:** errores y seguridad.

## Antes de actualizar

1. **Elige cómo fijar la versión.** Desde la `1.0` puedes usar `"nexus-dialogs": "^1.0.0"`: las versiones menores y los parches no rompen. Si prefieres que una instalación nueva nunca cambie sola, usa la versión exacta, sin `^` ni `~`.
2. **Lee «Cambios que rompen»** de cada versión entre la tuya y la nueva, no solo de la última.
3. **Busca en tu código** lo que menciona cada cambio (el nombre de la función o la opción).
4. **Revisa los tipos:** `tsc` marca las exportaciones quitadas o renombradas y las opciones que cambiaron de forma.
5. **Actualiza y corre tus pruebas.** Si tienes pruebas de interfaz, los diálogos son `<dialog>` nativos con `data-nexus-dialog`, así que tus selectores no deberían cambiar.

## Qué se vigila para no romperte

- `npm run api:check` falla si la API pública cambia sin actualizar su reporte, así que un cambio en las exportaciones nunca pasa en silencio.
- `test/tipos/contratos.ts` fija lo que devuelve cada función ([Contratos](https://urieldomingezm.github.io/nexus-dialogs/contratos.html)).
- Cada versión se prueba en Chromium, Firefox y WebKit, y el paquete publicado se instala y se usa desde Node, Vite y webpack antes de salir.

## Migraciones conocidas

| Desde | Hacia | Qué cambia | Cómo migrar |
|---|---|---|---|
| `0.5.x` | `1.0.0` | Nada rompe: la `1.0.0` solo fija la API pública y el versionado semántico | Actualiza y corre tus pruebas |
| `0.4.x` | `0.5.0` | `strictHtml` es `true` por omisión: el `html` en cadena se muestra como texto | Con contenido propio, `configure({ strictHtml: false })`. Con contenido de fuera, `configure({ sanitize: (h) => DOMPurify.sanitize(h) })`. Los `Node` y los textos no cambian |

Las migraciones nuevas se agregan aquí cuando salen. Para venir desde SweetAlert2 hay una guía aparte: [Migrar de SweetAlert2](https://urieldomingezm.github.io/nexus-dialogs/migracion.html).

## Cuando algo se va a quitar

Una función que se vaya a retirar sigue funcionando una versión menor completa, marcada como `@deprecated` en los tipos (tu editor la tacha) y listada en «Obsoleto» del CHANGELOG con su reemplazo. Solo se quita en la siguiente versión mayor. (En la `0.x` el aviso podía durar menos, pero siempre aparecía en «Cambios que rompen».)

## Si la actualización te rompe algo

Vuelve a la versión anterior (`npm install nexus-dialogs@1.0.0`) y abre un [issue](https://github.com/urieldomingezm/nexus-dialogs/issues) con la versión de la que vienes, a la que vas y un caso mínimo. Si el cambio no estaba en «Cambios que rompen», es un error del CHANGELOG y se corrige.

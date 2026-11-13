Qué navegadores y versiones se soportan, qué pasa cuando falta una función del navegador, cuánto dura el soporte de cada versión y cómo se evita que una actualización te rompa la aplicación.

## Navegadores

El mínimo sale de las funciones nativas que usa la librería. Cada función se prueba en Chromium, Firefox y WebKit (el motor de Safari) en cada cambio; **no** se prueban versiones viejas por separado: los mínimos vienen de la documentación de cada función, no de haberlas ejecutado.

| Función | Chrome / Edge | Firefox | Safari | Si falta |
|---|---|---|---|---|
| `<dialog>` modal (`showModal()`) | 37 | 98 | 15.4 | Se muestra como `<dialog open>` sin capa superior ni fondo inerte |
| `color-mix()` | 111 | 113 | 16.2 | Los colores derivados del acento no se calculan |
| Hojas de estilo construibles | 73 | 101 | 16.4 | Se usa un `<style>` de respaldo (con CSP estricta necesita `configure({ nonce })`) |
| Consultas de contenedor (`@container`) | 105 | 110 | 16 | Las pestañas y la línea de tiempo no se adaptan al ancho de su contenedor |
| `100dvh` | 108 | 101 | 15.4 | Sin esta unidad, un diálogo muy alto no se limita a la altura visible de la pantalla |
| `:has()` | 105 | 121 | 15.4 | Solo cosmético: el calendario de rangos no resalta el intervalo y las etiquetas con avatar pierden un relleno |

**Mínimos de la librería:** Chrome y Edge 111, Firefox 113, Safari 16.4. En Firefox 113 a 120 todo funciona y solo se pierde el resaltado del rango en el calendario (`:has()`).

No hay soporte para Internet Explorer ni para versiones de Safari anteriores a la 16.4. Subir uno de estos mínimos cuenta como cambio que rompe y se avisa en el CHANGELOG.

### Frameworks y entornos

| | Versión |
|---|---|
| Vue (`nexus-dialogs/vue`) | 3.3 o más |
| React (`nexus-dialogs/react`) | 18 o más (probado con 18 y 19) |
| Angular (`nexus-dialogs/angular`) | 16 o más, solo ESM |
| Node (compilar, SSR) | 18 o más; importar no toca el DOM y abrir un diálogo en el servidor falla con un error explícito |
| TypeScript | Tipos incluidos; se revisan con `@arethetypeswrong` en cada cambio |

## Versiones

- **0.x (hoy).** Una versión menor (`0.5` → `0.6`) puede traer cambios que rompen. Siempre aparecen en el CHANGELOG bajo «Cambios que rompen», con cómo migrar. Fija la versión exacta (`"nexus-dialogs": "0.5.4"`) hasta que quieras actualizar.
- **Desde la 1.0.** Solo una versión mayor rompe. Lo que se vaya a quitar se marca como obsoleto una versión menor antes.
- **Qué cuenta como romper:** quitar o renombrar una exportación pública, cambiar lo que devuelve una función ([contratos](https://urieldomingezm.github.io/nexus-dialogs/contratos.html)), cambiar un valor por omisión que altera el resultado y subir el mínimo de un navegador o de un framework.
- **Qué no cuenta:** el aspecto exacto dentro de lo que pide el estándar de botones y la accesibilidad, correcciones de errores y de seguridad, y lo que no está en la API pública.
- **Cómo se vigila:** `npm run api:check` falla si la API pública cambia sin actualizar su reporte, y `test/tipos/contratos.ts` fija lo que devuelve cada función.

## Soporte

Una sola persona mantiene la librería, así que esto es de buena fe, no un contrato.

| | Qué esperar |
|---|---|
| **Vulnerabilidades** | Acuse en 7 días y primera valoración en 14 ([`SECURITY.md`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/SECURITY.md)). Se corrige la última versión publicada (desde la 1.0, la última 1.x) |
| **Errores** | Se atienden en la última versión. Con un caso mínimo que lo reproduzca, la corrección es mucho más rápida |
| **Accesibilidad** | Tiene prioridad sobre las funciones nuevas |
| **Versiones anteriores** | No reciben correcciones; la actualización de una menor a la siguiente se acompaña con la guía de migración del CHANGELOG |
| **Publicación** | Cada versión se sube a npm en espera y no es pública hasta que su responsable la aprueba con 2FA |

Lo que no se promete: un calendario fijo de versiones, soporte para navegadores fuera de la tabla ni compatibilidad con parches de terceros sobre la librería.

## Uso en producción

Esta librería nació para sistemas internos de empresa y se ha probado en uso real: su adaptador de SweetAlert2 corre en una aplicación web de producción de seguimiento de reclutadores, donde sustituyó a SweetAlert2 sin cambiar el código de las pantallas. Es **un caso interno y sin nombre**: todavía no hay un caso externo público que lo respalde, y por eso las [limitaciones](https://urieldomingezm.github.io/nexus-dialogs/limitaciones.html) lo dicen así.

Si la usas en un proyecto, aunque todo haya salido bien, cuéntalo con [«Lo probé en mi proyecto»](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=adopcion.yml): qué diálogos usas, en qué tipo de aplicación (sin datos sensibles) y cómo te fue. Cada caso real se suma aquí, con tu permiso.

Mientras tanto, lo que respalda la estabilidad se puede comprobar: pruebas unitarias con umbrales de cobertura, pruebas en tres navegadores, axe en cada tema, fugas de memoria, CSP y Trusted Types, y los [ejemplos completos](https://github.com/urieldomingezm/nexus-dialogs/tree/main/examples) ejecutándose en cada cambio. Los números de tamaño y rendimiento se repiten con `npm run bench` ([Rendimiento](https://urieldomingezm.github.io/nexus-dialogs/rendimiento.html)).

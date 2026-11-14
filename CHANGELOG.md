# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado

- `daterange` con `periods: true`: una lista de periodos con un calendario siempre visible, para elegir rangos («17 al 19 nov») y días sueltos no corridos («25 nov») en el mismo campo. Sin atajos ni cajas de texto; cada periodo se quita con la ×. El valor es `{ from, to }[]`, los periodos se ordenan y no pueden traslaparse, y `maxDays` cuenta el total. La plantilla de capacitación de `rrhh` lo usa. El `daterange` de un solo rango no cambia.
- `icon` en cada pestaña: un nodo (por ejemplo un SVG) o las clases de tu fuente de iconos, antes de la etiqueta.

### Cambiado

- Pestañas (`tabs`, `tabsDialog`): el aspecto por omisión es ahora `variant: 'soft'`: las pestañas se reparten todo el ancho, con el contenido centrado y la activa sobre un fondo suave del color de acento; el contador es una pastilla pequeña. Con muchas pestañas conservan un ancho mínimo y la lista se desplaza. Para el de antes usa `variant: 'underline'`.

- Los textos de la interfaz del sitio (buscador, copiar, tema, volver arriba) los resuelve ahora [`nexus-i18n`](https://www.npmjs.com/package/nexus-i18n), la librería de idiomas de las librerías NEXUS: idioma desde `<html lang>`, respaldo en español y `{n}`. Es una dependencia de desarrollo del sitio (no entra en el paquete). Los diccionarios con funciones y listas (demostración, Mini ERP, Migrar, Pruebas) siguen como estaban.

## [1.0.0] - 2026-11-13

### Corregido

- La barra de desplazamiento vertical del cuerpo de los modales y de la lista de los `select` con búsqueda (combobox) se ocultaba sola en macOS, iOS y Windows con barras flotantes, y era difícil usarla con el ratón. Ahora es una barra fija de 12 px, siempre visible (en Firefox, con `scrollbar-color`).
- Las pruebas de React usaban `act` de `react`, que no existe antes de la 18.3; ahora también corren con 18.0 a 18.2.
- Sitio de documentación, «Míralo en acción»: la demostración ya no se queda parada para siempre. Cambiar de apariencia no la afecta, elegir una escena la reproduce y la deja lista para usarse, y si nadie la toca durante 12 segundos sigue sola con la siguiente (lo mismo si alguien la usa y se va). En el teléfono, empezar a desplazar la página sobre la maqueta ya no la detiene: solo un toque completo, el teclado o escribir. En pantallas de menos de 400 px los submenús muestran solo el título.
- Sitio de documentación en el teléfono: el menú abierto con un grupo desplegado medía más que la pantalla y los últimos enlaces (y el botón de cerrar) quedaban fuera de alcance. Ahora el menú nunca pasa de la altura de la pantalla, solo se desplazan los enlaces y el botón de cerrar y el buscador se quedan a la vista.

### Agregado

- **Descubrible por asistentes de IA:** el sitio publica `llms.txt` (índice breve en inglés, con las direcciones tomadas del menú) y `llms-full.txt` (la guía y los documentos en inglés en un solo Markdown), cada página enlaza el índice con `<link rel="alternate">`, la portada lleva datos estructurados (schema.org) y el repositorio trae `AGENTS.md` con instrucciones para agentes de programación. Se generan en `npm run build:site`. Más palabras clave en `package.json`.
- Sitio de documentación en cuatro idiomas (español, English, Português y Français): el selector de la cabecera lleva a la misma página en `/en`, `/pt` o `/fr`, con la cabecera, el menú, el buscador, el pie y los botones en ese idioma (y los diálogos y avisos de las demostraciones también). Todo el sitio está completo en inglés (documentos, Guía, Migrar, Mini ERP, Ejemplos, Pruebas y Playground; `site/src/ejemplos-def.en.ts` trae los ejemplos); la portada y su maqueta, en los cuatro idiomas; lo que aún no tiene traducción sale en español con un aviso y marcado con su idioma. Cada página lleva su `hreflang` y el sitemap las incluye. `npm run idiomas` genera las páginas por idioma y `npm run idiomas:check` (CI) comprueba que estén al día; una prueba verifica que cada traducción tenga las mismas secciones, tablas y bloques de código que el original.
- `CONTRIBUTING.md` con la guía para contribuir, y plantilla de issue «Incompatibilidad».
- Matriz de compatibilidad verificada: `compat/matriz.json` es la fuente única de los mínimos y de las versiones que se prueban. `npm run compat` regenera las tablas de `docs/soporte.md`, `npm run compat:check` comprueba `package.json`, el README y esas tablas, y CI instala Vue 3.3, React 18.0, Angular 16.0 y las últimas, y prueba el paquete en Node 18, 20, 22 y 24 (`npm run check:node`).
- **Rendimiento repetible:** `npm run bench` mide el tamaño de cada archivo (gzip y brotli), lo que pesa usar solo una parte y los tiempos y la memoria en Chromium; `--write` actualiza la nueva página [Rendimiento](docs/rendimiento.md).
- **Soporte:** página [Soporte](docs/soporte.md) con la matriz de navegadores función por función (qué pasa si falta una), frameworks, política de versiones y de soporte, y el caso de uso en producción.
- **Ejemplos completos** en `examples/` (alta de empleado, cierre de quincena, importar empleados): se revisan como código y se ejecutan en un navegador en cada cambio.
- **Accesibilidad:** pruebas del árbol de accesibilidad (lo que recibe un lector de pantalla) de los recorridos clave y un formulario de reporte «Prueba con lector de pantalla» para llenar la tabla de resultados.

### Añadido

- Sitio de documentación: sección «Míralo en acción» con una maqueta que se puede usar (borrar con «Deshacer», formulario con validación y aprobar con motivo; un cursor la recorre sola hasta que alguien la toca) y un selector de apariencia (Nexus, Material, Bootstrap, Tailwind, Oscuro) que también cambia los diálogos y toasts reales de la página; cifras de la portada que cuentan hasta su valor; buscador con `/` o `Ctrl`/`⌘`+`K` (páginas, encabezados y ejemplos) y botón para volver arriba.
- Sitio de documentación: partículas conectadas en la portada, aparición suave de las secciones al hacer scroll, chispas al confirmar un ejemplo y un texto que se escribe solo. Son decorativas, no usan dependencias, se detienen con la pestaña oculta o fuera de pantalla, usan menos partículas en celular y se apagan con «reducir movimiento».
- Sitio de documentación: el fondo de la maqueta ahora imita una lista de personal (con nombres, áreas y estados de muestra) en lugar de barras vacías; la maqueta suma las escenas Vacaciones (días hábiles en vivo), Asistente (pasos con «Atrás»), Importar y Sin guardar, y un «Ver código» que muestra el código real de la escena elegida.
- Sitio de documentación: sección «Una pieza en lugar de varias», insignias de la portada (versión confirmada con npm, tamaño del núcleo, licencia y CI), esqueleto brillante mientras llegan las descargas, transición suave entre páginas (View Transitions) y un brillo que sigue al puntero en los botones principales. Todo se apaga con «reducir movimiento».
- Sitio de documentación: página «Versionado y migraciones» (`docs/versiones.md`): cómo se numeran las versiones, cómo leer el CHANGELOG, qué hacer antes de actualizar, lo que se vigila para no romper y la tabla de migraciones conocidas.
- Sitio de documentación: **Playground** (`playground.html`): editor de JavaScript con «Ejecutar» (Ctrl + Enter), ejemplos de la galería precargados, `await` sin envolver, `console.log` en «Resultado» y «Copiar enlace» que lleva el código en la dirección. Corre con el código de esta versión y no envía nada a ningún servidor.
- `npm run bench -- --json archivo` guarda las mediciones y `--comparar archivo` las compara con otra versión: tamaños, casos de uso parcial y tiempos. Un tamaño que crece más de 3 % hace fallar el comando.
- Ejemplos completos nuevos en `examples/`: baja de empleado (escribir el nombre y «Deshacer»), aprobar vacaciones (aprobar con comentario o rechazar con motivo) y sesión por expirar. Cada uno se ejecuta en el navegador en cada cambio.
- **Plugins**: `use(plugin)`, `unuse(name)` y `plugins()` en `nexus-dialogs`. Un plugin tiene `name` y, opcionalmente, `install`, `beforeOpen` (puede cambiar las opciones), `afterOpen` y `afterClose`; los ganchos corren con todos los diálogos (también `form`, `wizard` y las recetas), en orden de instalación, y uno que falla se registra en la consola sin romper nada. Los paquetes que no usan plugins (como `swal` para el navegador) no cargan su código.
- **`registerField(tipo, fábrica)`** en `nexus-dialogs/forms`: tipos de campo propios para `form()` y `wizard()` (devuelve una función que lo quita). `Field.type` acepta cualquier cadena.
- **Más idiomas**: `registerLanguage(código, textos)`, `labelsFor(código)` y `pageLanguage()` (el de `<html lang>`) en `nexus-dialogs`; `configure({ lang })` y `toast.configure({ lang })` aceptan cualquier idioma registrado (`pt-BR` se usa como `pt`) y lo que no se traduzca se ve en inglés. Nuevo `nexus-dialogs/locales` con portugués (Brasil) y francés (1.3 KB, aparte). Las recetas, tablas, importación y demás módulos siguen con sus textos en español e inglés.
- Sitio de documentación: página «Plugins e idiomas».

### Cambiado

- **Versión 1.0.** Desde esta versión la API pública sigue el versionado semántico: solo una versión mayor rompe (qué cuenta como romper, en Soporte). No hay cambios que rompen respecto a la 0.5.4. Se actualizan Soporte, Versiones, Limitaciones, `SECURITY.md` y el README: solo se corrige la última 1.x y se puede usar `^1.0.0`.
- `language()` devuelve `string` (antes `'es' | 'en'`) porque ahora puede ser un idioma registrado. Quien compare con `'es'` o `'en'` no cambia; solo afecta a un tipo propio construido sobre su resultado.
- `nexus-dialogs/toast` ya no lleva su propia copia de los textos: los toma del núcleo (`nexus-dialogs`), que es dependencia del paquete. Pesa 1 KB menos.

### Corregido

- Combobox: cuando la búsqueda falla (o no hay resultados), la lista ya no queda como un `listbox` sin opciones (axe: `aria-required-children`); mientras no hay opciones es un grupo.
- Sitio de documentación: en la cabecera, «buscar», «github», «npm» y «tema» ahora miden lo mismo y quedan alineados; en celular angosto «buscar» pasa a ser una lupa y el nombre de la marca ya no se parte en dos líneas.
- Sitio de documentación: en «Míralo en acción», al elegir otra escena (Borrar, Formulario, Aprobar) esta se reproduce sola, con el cursor escribiendo y pulsando, y al terminar queda lista para usarse. Antes solo se abría quieta.
- Sitio de documentación: el buscador, la demo y las animaciones comunes no llegaban a la web publicada, porque el build descartaba los archivos que solo se importan por su efecto (`sideEffects: false`). Ahora se conservan, y el CI revisa el sitio construido (`scripts/revisar-sitio.mjs`).

## [0.5.4] - 2026-11-12

### Corregido

- Diálogos sin botones de pie (por ejemplo `showConfirmButton: false` con un menú de acciones en `html`): el contenido ya no queda pegado al borde inferior ni parece cortado; ahora deja el mismo margen que con botones.

## [0.5.3] - 2026-11-12

### Corregido

- Celulares con teclado en pantalla (Android Chrome): la hoja inferior se ajusta a la zona visible, así que los botones de acción quedan sobre el teclado, y las listas flotantes (combobox, select, calendario) se colocan pegadas al campo en vez de aparecer arriba de la pantalla. Usa `visualViewport`.

### Cambiado

- Sitio de documentación: el menú se organiza en submenús (Empezar, Probar, Referencia, Migrar) con una línea que describe cada página, y el pie de página pasa a cuatro columnas de enlaces (Documentación, Referencia, Migración, Proyecto). En la portada, la cifra «0 dependencias» se cambia por las descargas semanales de npm.

## [0.5.2] - 2026-11-12

### Agregado

- Sitio de documentación: página **Pruebas** (mesa de pruebas). Se elige el tema (Nexus, Tailwind, Bootstrap, Material) y el modo (claro, oscuro, como el sistema), se abren los diálogos de verdad, se marca una lista de revisión que se guarda en el navegador y se copia un resumen (versión, navegador, apariencia) o se abre un reporte con esos datos ya llenos.
- **Tailwind en modo oscuro**: `themes.tailwindDark`, el par oscuro de `themes.tailwind` (slate e indigo, con axe en verde), y `followPageScheme()` en `nexus-dialogs/themes`, que sigue el modo claro u oscuro de la página (`<html class="dark">` de Tailwind v3 y v4, `data-bs-theme` de Bootstrap 5.3, `data-theme`, o el modo del sistema con `strategy: 'media'`) y llama a tu `configure` en cada cambio. Sin dependencias.

### Cambiado

- Documentación: la accesibilidad se presenta como objetivo WCAG 2.2 AA con pruebas automáticas, no como certificación; la promesa de que los diálogos nunca rechazan se limita a las operaciones de diálogo y nombra las funciones que sí pueden rechazar.
- Los ejemplos de `tabs` y `timeline` usan datos neutrales.

## [0.5.1] - 2026-11-12

### Corregido

- **Build sin bundler (`nexus-dialogs.swal.iife.js`): el `html` salía siempre como texto.** Sin `configure` en el build, el empaquetador dejaba fijo el valor por omisión de `strictHtml` y `sanitize` nunca se consultaba, así que no había forma de mostrar HTML. Ahora `setHtml` respeta ambos, igual que `nexus-dialogs.all.iife.js`.

### Agregado

- **`Swal.configure(…)`** en `nexus-dialogs/swal` y en el build sin bundler: configuración global (`strictHtml`, `sanitize`, `theme`, `scheme`…) donde no hay `import`. Prueba en navegador sobre el archivo `swal.iife` compilado para que no vuelva a pasar.

## [0.5.0] - 2026-11-12

### Corregido

- `loading` (pantalla de espera): el indicador al girar creaba una barra de desplazamiento y quedaba pegado y cortado abajo. Ahora tiene espacio por debajo y el cuerpo no se desplaza.

### Cambios que rompen

- **`strictHtml` es `true` por omisión.** El `html` en cadena (`html` de `dialog.*` y, en `nexus-dialogs/swal`, `html`, `iconHtml`, `closeButtonHtml` y `loaderHtml`) ya no se interpreta: se muestra como texto, salvo que configures un `sanitize`. Para volver al comportamiento anterior con contenido propio: `configure({ strictHtml: false })`. Con contenido de fuera: `configure({ sanitize: (h) => DOMPurify.sanitize(h) })`. Los `Node` y los textos no cambian. Esto es lo que más afecta a quien migra de SweetAlert2.

### Agregado

- **Tamaños y diseño adaptable** en `tabs` y `timeline`: `scale` (`sm` / `md` / `lg`), `fill` en las pestañas y `layout: 'horizontal'` en el seguimiento, que vuelve solo a vertical en un contenedor angosto (container queries). Variables `--nd-tab-height`, `--nd-tab-font-size`, `--nd-tab-padding`, `--nd-tl-marker`, `--nd-tl-title` y `--nd-tl-text`. `size` sigue siendo el ancho del diálogo.
- **`nexus-dialogs/timeline`**: seguimiento por etapas, suelto (`timeline()`) o en un diálogo (`timelineDialog()`). Estados `done`/`current`/`pending`/`error`/`skipped` dichos con texto, fecha (texto o `Date`), resumen «N de M etapas completadas · P %» con barra `progressbar`, `aria-current="step"`, `setStatus()` con el diálogo abierto. Región con nombre y enfocable para que el teclado pueda desplazar listas largas. `timeline.js` pesa 2.6 KB min+gzip (límite 3 KB).
- **`nexus-dialogs/tabs`**: pestañas accesibles, sueltas (`tabs()`) o dentro de un diálogo (`tabsDialog()`). Contenido en texto, nodo o función (perezosa y `async`), insignias, `segmented` o `underline`, flechas/Inicio/Fin (RTL incluido), altura estable al cambiar de pestaña y lista fija al desplazar. Núcleo y demás subrutas sin cambios de tamaño; `tabs.js` pesa 2.8 KB min+gzip (límite 3 KB).
- **`columns: 'auto'`** en `form`, `wizard` y `formFromJSON`: columnas responsive (2 en un teléfono, 3 en escritorio) con los campos largos a fila completa. `columns: 2` ahora se queda en dos columnas en un teléfono mientras quepan campos de ~9 rem. Variable `--nd-col-min`.

### Cambiado

- En teléfono, los botones del pie van en una sola fila (hasta 3 columnas) en lugar de apilados.
- Con icono, el contenido `html` ocupa todo el ancho del encabezado, sin hueco bajo el icono.
- Empaquetado: el CSS que vive en plantillas de texto se encoge al compilar (`scripts/css-en-plantillas.mjs`: sin comentarios ni saltos de línea). Los comentarios del CSS ya no cuestan bytes al usuario. `nexus-dialogs.all.js` queda en 40.9 KB, dentro de su límite de 41 KB, que no se tocó.

### Corregido

- **Doble confirmación.** Pulsar «Confirmar» (o un botón con `onClick` asíncrono) dos veces mientras la primera acción sigue en curso ya no ejecuta `preConfirm`/`onClick` dos veces.
- **Cancelar durante `collect`/`preConfirm` asíncrono** ya no deja el diálogo cerrado y luego ejecuta `preConfirm`; el resultado es `cancel`.
- **Validación asíncrona obsoleta.** En formularios, una respuesta tardía de un campo ya no pisa el mensaje de una validación más reciente.
- **Contenedor quitado del DOM.** Si la aplicación elimina el `target` con el diálogo abierto (por ejemplo, un cambio de ruta), la promesa se resuelve con `reason: 'program'` y se libera el bloqueo de scroll.
- `nexus-dialogs/mx`: los validadores devuelven `false` (no lanzan) con `undefined`, `null` o números.

### Agregado

- Documentación: [`docs/swal-compat.md`](docs/swal-compat.md) (los 84 parámetros de SweetAlert2 clasificados como compatible, parcial, ignorado o sin soporte, con una prueba que impide que la tabla se desactualice), [`docs/contratos.md`](docs/contratos.md) (tres familias de resultado, fijadas con el compilador en `test/tipos/`) y [`docs/limitaciones.md`](docs/limitaciones.md) (limitaciones conocidas, navegadores, política de versiones y cobertura). Páginas nuevas en el sitio. La librería se presenta como biblioteca de interfaces transaccionales para aplicaciones empresariales.
- Pruebas de uso intensivo en navegador: zoom 200 %, diálogos anidados, 40 ciclos de abrir y cerrar, formulario con varios errores y contenedor quitado. Umbrales de cobertura y de fugas más estrictos.
- El núcleo pasa a 10.8 KB gzip como máximo (antes 10.5).

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

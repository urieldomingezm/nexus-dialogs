# Accesibilidad

nexus-dialogs apunta a **WCAG 2.2 nivel AA** como objetivo de conformidad. No es una certificación ni una auditoría externa: lo que sigue son las pruebas que sí se hacen. Esta página dice con claridad qué se prueba de forma automática en cada cambio, qué todavía se revisa a mano y cómo repetir esa revisión.

## Qué se prueba automáticamente

Todo corre en el CI en cada cambio (`test/e2e/accesibilidad.spec.mjs` y `test/e2e/sitio.spec.mjs`), en Chromium, Firefox y WebKit. axe-core se ejecuta en Chromium y WebKit; en Firefox se omite porque, junto con Playwright, hace caer la página cuando el DOM cambia mucho (los mismos flujos sí pasan sin axe).

| Qué | Cómo se prueba |
|---|---|
| **Reglas de WCAG 2.2 A y AA** (axe-core) | Formulario con errores, confirmación de peligro y toast, en cada tema y esquema |
| **Contraste de color** | Parte de axe: 4.5:1 en texto y 3:1 en iconos y bordes, en las 6 combinaciones de tema de la tabla de abajo |
| **Teclado** | Tab recorre todo el formulario sin salir del diálogo; Enter avanza en el asistente; Esc cierra |
| **Foco** | Foco inicial correcto, el resumen de errores recibe el foco y sus enlaces llevan al campo con `aria-invalid` y `aria-describedby`; al cerrar vuelve al botón que abrió el diálogo |
| **Movimiento reducido** | Con `prefers-reduced-motion` no queda ninguna animación corriendo |
| **Reflow** | A 320 px de ancho (zoom de 400 %) el diálogo no desborda la pantalla |
| **Colores forzados** | Con `forced-colors: active` los botones conservan su borde |
| **Sitio de documentación** | axe en todas sus páginas |
| **Árbol de accesibilidad** | Lo que recibe un lector de pantalla (rol, nombre y estado de cada elemento, y su orden) en la confirmación de peligro, el borrado con nombre, el formulario con errores, la sesión por expirar y el toast (`test/e2e/lectores.spec.mjs`, Chromium) |
| **Casos extremos** | Varios diálogos a la vez, desmontar un componente con un diálogo abierto, validaciones asíncronas que fallan, archivos corruptos, SSR y navegadores sin alguna API nativa (`test/unit/extremos.test.ts`, `test/unit/ssr.test.ts`) |

### Temas y esquemas probados

| Tema | Esquema | Nota |
|---|---|---|
| `light` (el de siempre) | claro y oscuro | Sigue el esquema del sistema con `scheme: 'auto'` |
| `dark` | oscuro | |
| `bootstrap`, `tailwind`, `material` | claro | Son paletas claras: úsalas con `scheme: 'light'` |

Si creas un tema propio, cuida el contraste del botón de peligro (texto blanco sobre el fondo rojo ≥ 4.5:1), del texto de error sobre el resumen y de los bordes de los campos (≥ 3:1). La prueba `accesibilidad.spec.mjs` sirve de plantilla: agrega tu tema a `COMBINACIONES`.

## Qué NO cubren las pruebas automáticas

axe, el árbol de accesibilidad y las pruebas de teclado no sustituyen a una persona usando un lector de pantalla: no pueden juzgar si un anuncio es claro, si el orden de lectura tiene sentido ni cómo cambia entre lectores y navegadores. Esa revisión se hace a mano.

### Guion de prueba manual

Haz estos recorridos con cada combinación de la tabla de resultados y anota lo que ocurre. Usa la [página de pruebas](https://github.com/urieldomingezm/nexus-dialogs/tree/main/test/paginas) (`npm run dev`, luego `/test/paginas/`) o los [ejemplos del sitio](https://urieldomingezm.github.io/nexus-dialogs/ejemplos.html).

1. **Alerta** (`dialog.alert`): al abrirse se anuncia como diálogo, con su título y su texto. Al cerrarla el foco vuelve al botón que la abrió.
2. **Confirmación de peligro** (`confirmDelete`): el foco empieza en «Cancelar» y se anuncia el texto de lo que se va a borrar.
3. **Formulario con errores**: al enviar vacío, se anuncia el resumen de errores; cada enlace lleva al campo; el campo se lee como «no válido» junto con su mensaje.
4. **Asistente** (`wizard`): se anuncia el paso actual («paso 2 de 3»); al avanzar, el foco entra al primer campo.
5. **Toast**: el aviso se anuncia sin quitarle el foco a lo que estás haciendo; «Deshacer» se alcanza con Tab.
6. **Calendario** (`type: 'date'` con `calendar`): las flechas mueven el día, Re Pág / Av Pág cambian de mes, y el día elegido se anuncia completo.
7. **Importar** (`importData`): el cuadro de arrastrar archivos tiene un botón alternativo; el resumen de errores por fila se lee en orden.

### Resultados

Cada fila se llena cuando alguien hace la revisión, con el formulario [«Prueba con lector de pantalla»](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=lector-de-pantalla.yml). «Pendiente» significa que aún no se ha hecho; no se afirma compatibilidad con un lector que no se haya probado.

| Lector de pantalla | Navegador | Sistema | Fecha | Resultado |
|---|---|---|---|---|
| NVDA | Firefox / Chrome | Windows | — | Pendiente |
| JAWS | Chrome / Edge | Windows | — | Pendiente |
| VoiceOver | Safari | macOS | — | Pendiente |
| VoiceOver | Safari | iOS | — | Pendiente |
| TalkBack | Chrome | Android | — | Pendiente |

## ¿Encontraste un problema?

Abre un [issue](https://github.com/urieldomingezm/nexus-dialogs/issues) con el lector de pantalla, el navegador, el sistema y los pasos. Los problemas de accesibilidad tienen prioridad sobre las funciones nuevas.

Qué es nexus-dialogs, cómo se divide y qué tan probado está cada pedazo. La idea: que quien solo necesita un `confirm` cargue el núcleo y nada más.

## Posicionamiento

nexus-dialogs es una **infraestructura de interacción para aplicaciones empresariales**: no solo avisa y pregunta, también captura datos, guía procesos de varios pasos, importa y exporta, y trae lo que un sistema administrativo mexicano necesita (RFC, CURP, NSS, CLABE, plantillas de RR. HH.). Tiene un adaptador de SweetAlert2 para migrar sin reescribir, pero no se plantea como un reemplazo más de esa librería.

| Librería | Enfoque principal |
|---|---|
| SweetAlert2 | Alertas y diálogos |
| Notiflix | Notificaciones y loaders |
| Tippy.js | Tooltips y popovers |
| nexus-dialogs | Diálogos, formularios y flujos empresariales |

No es una comparación función por función; sirve para ubicar el espacio que ocupa.

## Los tres niveles

Cada nivel solo puede importar del mismo nivel o de uno inferior. Una prueba automática (`test/unit/capas.test.ts`) lo verifica en cada cambio.

| Nivel | Qué incluye | Subrutas | Peso (min+gzip) |
|---|---|---|---|
| **Núcleo** | Alertas, confirmaciones, `prompt`, `dialog.open`, temas por variables, idioma, RTL | `nexus-dialogs` | ~10 KB |
| **UI avanzada** | Formularios y asistentes, toasts con cola, tablas con selección, recetas (borrar, aprobar, guardar…), temas listos | `forms`, `toast`, `table`, `patterns`, `themes` | 0.9 – 23 KB cada una |
| **Empresa** | Plantillas de RR. HH., importar y exportar CSV/Excel, validadores y catálogos de México | `rrhh`, `import`, `mx`, `sepomex` | 0.5 – 10 KB cada una |
| **Integraciones** | Vue 3, React 18+, Angular 16+ y compatibilidad con SweetAlert2 | `vue`, `react`, `angular`, `swal` | 0.8 – 7.5 KB cada una |

`mx` es de funciones puras y también sirve en Node; `sepomex` solo consulta, con `fetch`, la carpeta de archivos JSON que tú publiques. Ninguno de los dos importa nada del resto de la librería. Cada subruta es un archivo aparte: si no la importas, no se descarga. Los límites de tamaño se revisan en cada cambio (`npm run size`).

## Qué está validado y qué no

| Cosa | Estado |
|---|---|
| Pruebas unitarias, de casos extremos y de SSR | Automatizadas en cada cambio |
| E2E en Chromium, Firefox y WebKit con axe | Automatizadas en cada cambio |
| Contraste y teclado por tema | Automatizadas (6 combinaciones de tema y esquema) |
| Instalación del paquete publicado (Node ESM/CJS, TypeScript, Vite, webpack) | Automatizada |
| Lectores de pantalla (NVDA, JAWS, VoiceOver, TalkBack) | **Pendiente**: ver [Accesibilidad](https://urieldomingezm.github.io/nexus-dialogs/accesibilidad.html) |
| Uso en aplicaciones de producción | **Por validar**: la librería se está probando dentro de Nexus; todavía no hay un caso público de uso real |

Si la usas en producción y encuentras algo, [cuéntalo](https://github.com/urieldomingezm/nexus-dialogs/issues): esa es la información que más falta.

## Para quién es cada decisión

- ¿Solo necesitas confirmar y avisar? Instala y usa el núcleo; el resto no se carga.
- ¿Tu sistema captura datos? Agrega `forms` y, si es de México, `mx`.
- ¿Es un sistema de RR. HH.? `rrhh` trae las plantillas (alta, baja, vacaciones, permiso, incapacidad, gastos, evaluación, capacitación y cambio de puesto) sobre `forms`.
- ¿Ya usas SweetAlert2? `swal` te deja migrar poco a poco; ver la [guía de migración](https://urieldomingezm.github.io/nexus-dialogs/migracion.html) y sus diferencias de comportamiento.

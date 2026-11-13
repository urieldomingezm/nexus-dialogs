What nexus-dialogs is, how it is divided and how well tested each piece is. The idea: whoever only needs a `confirm` loads the core and nothing else.

## Positioning

nexus-dialogs is an **interaction infrastructure for business applications**: it doesn't just notify and ask, it also captures data, guides multi-step processes, imports and exports, and brings what a Mexican administrative system needs (RFC, CURP, NSS, CLABE, HR templates). It has a SweetAlert2 adapter so you can migrate without rewriting, but it is not positioned as one more replacement for that library.

| Library | Main focus |
|---|---|
| SweetAlert2 | Alerts and dialogs |
| Notiflix | Notifications and loaders |
| Tippy.js | Tooltips and popovers |
| nexus-dialogs | Dialogs, forms and business flows |

It is not a function-by-function comparison; it helps locate the space it occupies.

## The three levels

Each level can only import from the same level or a lower one. An automated test (`test/unit/capas.test.ts`) checks this on every change.

| Level | What it includes | Subpaths | Size (min+gzip) |
|---|---|---|---|
| **Core** | Alerts, confirmations, `prompt`, `dialog.open`, variable-based themes, language, RTL | `nexus-dialogs` | ~10 KB |
| **Advanced UI** | Forms and wizards, queued toasts, tables with selection, recipes (delete, approve, save…), ready-made themes | `forms`, `toast`, `table`, `patterns`, `themes` | 0.9 – 23 KB each |
| **Business** | HR templates, CSV/Excel import and export, Mexican validators and catalogs | `rrhh`, `import`, `mx`, `sepomex` | 0.5 – 10 KB each |
| **Integrations** | Vue 3, React 18+, Angular 16+ and SweetAlert2 compatibility | `vue`, `react`, `angular`, `swal` | 0.8 – 7.5 KB each |

`mx` is made of pure functions and also works in Node; `sepomex` only queries, with `fetch`, the folder of JSON files that you publish. Neither imports anything from the rest of the library. Each subpath is a separate file: if you don't import it, it isn't downloaded. Size limits are checked on every change (`npm run size`).

## What is validated and what is not

| Thing | Status |
|---|---|
| Unit, edge-case and SSR tests | Automated on every change |
| E2E in Chromium, Firefox and WebKit with axe | Automated on every change |
| Contrast and keyboard per theme | Automated (6 theme and scheme combinations) |
| Installing the published package (Node ESM/CJS, TypeScript, Vite, webpack) and core *tree-shaking* | Automated |
| CSP (styles with and without nonce) and Trusted Types | Automated in Chromium |
| Memory leaks (300 dialogs, forms and toasts) | Automated in Chromium |
| Export without formula injection | Automated, with local LibreOffice; **Excel: not tested** |
| Screen readers (NVDA, JAWS, VoiceOver, TalkBack) | **Pending**: see [Accessibility](https://urieldomingezm.github.io/nexus-dialogs/en/accesibilidad.html) |
| Use in production applications | **To be validated**: the library is being tested inside Nexus; there is no public real-world case yet |

If you use it in production and find something, [tell us](https://github.com/urieldomingezm/nexus-dialogs/issues): that is the information we lack the most.

## Who each decision is for

- Do you only need to confirm and notify? Install and use the core; the rest is not loaded.
- Does your system capture data? Add `forms` and, if you are in Mexico, `mx`.
- Is it an HR system? `rrhh` brings the templates (hiring, termination, vacation, leave, sick leave, expenses, evaluation, training and position change) on top of `forms`.
- Already using SweetAlert2? `swal` lets you migrate gradually; see the [migration guide](https://urieldomingezm.github.io/nexus-dialogs/en/migracion.html) and its behavior differences.

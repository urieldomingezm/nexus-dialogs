What nexus-dialogs does **not** do, which browsers it is tested with, how it is versioned and how much of the code the tests cover. The best thing about a library you want to use seriously is that it says clearly how far it goes.

## In one sentence

nexus-dialogs is a **library of transactional interfaces for business applications**: the part of your system where someone confirms, captures, approves, imports or corrects data. It is not a design system, nor a state manager, nor a full data table.

## Known limitations

- **Screen readers not tested by hand.** There are automated tests (axe, keyboard, focus, zoom, contrast), but NVDA, JAWS, VoiceOver and TalkBack are **pending**. See [Accessibility](https://urieldomingezm.github.io/nexus-dialogs/en/accesibilidad.html).
- **No public production cases yet.** The library is designed for real systems and is being tested inside Nexus; there is one unnamed internal production case, but no public external case backs it up yet. See [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html#use-in-production).
- **Dialogs stack, they are not queued.** Two consecutive `dialog.alert` calls are shown one on top of the other, not one after the other. If you need a queue, wait for the first one's promise.
- **Browser only.** Importing the library in Node (SSR) works; opening a dialog there fails with an explicit error. The validators in `nexus-dialogs/mx` do run in Node.
- **Content lives in a Shadow DOM.** Your CSS doesn't affect it (it is customized with themes and `--nd-*` variables) and `document.querySelector` doesn't see it. Playwright and Cypress pierce it; Testing Library needs `within(host.shadowRoot)`.
- **File upload without cancellation.** The `file` field shows progress and retry, but it cannot abort an upload in progress: if you close the dialog, your `upload` function keeps going until it finishes.
- **Excel, only the basics.** The first sheet is read as text and dates; there are no formulas, styles or multiple sheets. When exporting, one sheet is written with headers, numbers, dates and widths.
- **Excel export has not been opened in Microsoft Excel**, only in LibreOffice. See [Security](https://urieldomingezm.github.io/nexus-dialogs/en/seguridad.html).
- **Toasts share a position.** There is a single queue and a single position for all of them.
- **Languages: Spanish and English built in.** Portuguese and French come in `nexus-dialogs/locales`; more languages are added with `registerLanguage` or `labels`.
- **Postal codes (`sepomex`)** need you to publish the catalog's JSON files yourself.
- **Drafts in `localStorage`.** Passwords and files are never stored; if storage fails or is full, the form keeps working without a draft.
- **Angular, ESM only and 16 or later.** React 18 or later; Vue 3.3 or later.
- **SweetAlert2 compatibility is partial on purpose.** See the [matrix](https://urieldomingezm.github.io/nexus-dialogs/en/swal-compat.html).

## Guarantees by module

Everything is 0.x: a minor version may bring breaking changes (always announced in the CHANGELOG). This table says how settled each module is, not that it has been validated by external users (see above: there are no public production cases yet).

- **Stable**: it has three or more minor versions, its API is pinned in the report (`npm run api:check`) and in the type contracts, and unit and browser tests cover it.
- **Maturing**: more recent, with less use, or with a limitation that conditions it. Use it, but read its limitation and pin the version.
- **Partial**: it covers a part on purpose.

| Module | Status | Since | Main limitation |
|---|---|---|---|
| `nexus-dialogs` (core) | Stable | 0.1.0 | Dialogs stack, they are not queued; browser only |
| `forms` | Stable | 0.1.0 | Drafts in `localStorage`; file upload cannot be cancelled |
| `toast` | Stable | 0.1.0 | A single queue and a single position |
| `themes` | Stable | 0.1.0 | Customized with `--nd-*` variables, not with your CSS (Shadow DOM) |
| `patterns` | Stable | 0.1.0 | Texts in Spanish and English; more languages with `labels` |
| `mx` | Stable | 0.1.0 | The RFC does not compute the homoclave and nothing queries SAT, IMSS or banks |
| `vue` | Maturing | 0.3.0 | Vue 3.3 or later |
| `react` | Maturing | 0.4.0 | React 18 or later |
| `angular` | Maturing | 0.3.0 | ESM only and Angular 16 or later |
| `swal` | Partial | 0.3.0 | Compatible on purpose only in part: see the [matrix](https://urieldomingezm.github.io/nexus-dialogs/en/swal-compat.html). `html` comes out as text by default |
| `import` (import and export) | Maturing | 0.4.0 | Excel only the basics; the export has not been opened in Microsoft Excel, only in LibreOffice |
| `table` | Maturing | 0.4.0 | Choosing rows; not a full data table |
| `rrhh` | Maturing | 0.4.0 | JSON templates that you adapt to your rules; you must provide the `resolvers` |
| `sepomex` | Maturing | 0.4.0 | You publish the catalog's JSON files |
| `tabs` | Maturing | 0.5.0 | New: tabs with content as text, node or function |
| `timeline` | Maturing | 0.5.0 | New: step-by-step tracking |

Accessibility has its own note: there are automated tests, but screen readers are pending manual validation (see [Accessibility](https://urieldomingezm.github.io/nexus-dialogs/en/accesibilidad.html)).

## Browsers

| Browser | Minimum | Tests |
|---|---|---|
| Chrome / Edge | 111 | Current Chromium on every change |
| Firefox | 113 | Current Firefox on every change (axe does not run in Firefox because of a tool limitation) |
| Safari | 16.4 | Current WebKit on every change |

The minimums come from the modal `<dialog>`, `color-mix()` and constructable stylesheets; without the latter a fallback `<style>` is used (with a strict CSP, it needs `configure({ nonce })`). Old versions are not tested separately. There is no support for Internet Explorer. Which feature requires which version and the support policy: [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html).

## Versions and breaking changes

The library follows [SemVer](https://semver.org/):

- **0.x (today).** A minor version (`0.4` → `0.5`) may bring breaking changes. They **always** appear in the CHANGELOG under "Breaking changes", with how to migrate.
- **From 1.0.** Only a major version breaks. Before removing something it is marked as deprecated a minor version earlier and announced in the CHANGELOG.
- **What counts as breaking:** removing or renaming a public export, changing what a function returns ([contracts](https://urieldomingezm.github.io/nexus-dialogs/en/contratos.html)), changing a default value that alters the result (for example, `strictHtml`), raising the minimum of a browser or framework.
- **What does not count:** the exact look (colors, spacing) within what the button standard and accessibility ask for, bug and security fixes, and what is not in the public API (`api/nexus-dialogs.api.md`).
- **How it is watched:** `npm run api:check` fails if the public API changes without updating its report, and `test/tipos/contratos.ts` pins what each function returns.
- **Security fixes:** only in the latest published version. See `SECURITY.md`.

## Test coverage

Coverage of the unit tests (Vitest, measured in the latest review): **lines 90%, statements 88%, functions 87%, branches 79%**. CI fails if it drops below the thresholds (89 / 86 / 85 / 76). On top of that come the real-browser tests (Playwright, Chromium, Firefox and WebKit) that do not count in that percentage: accessibility, keyboard, CSP, Trusted Types, memory leaks and the documentation site.

Coverage measures which lines run, not that they are well tested; that is why the edge-case tests (`extremos`, `auditoria`, `seguridad`, `exportacion`) are written from what can go wrong, not from what is left to cover.

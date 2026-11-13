Which browsers and versions are supported, what happens when a browser feature is missing, how long each version is supported and how to keep an update from breaking your application.

## Browsers

The minimum comes from the native features the library uses. Each feature is tested in Chromium, Firefox and WebKit (Safari's engine) on every change; old versions are **not** tested separately: the minimums come from each feature's documentation, not from having run them.

| Feature | Chrome / Edge | Firefox | Safari | If missing |
|---|---|---|---|---|
| Modal `<dialog>` (`showModal()`) | 37 | 98 | 15.4 | Shown as `<dialog open>` without a top layer or inert background |
| `color-mix()` | 111 | 113 | 16.2 | Colors derived from the accent are not computed |
| Constructable stylesheets | 73 | 101 | 16.4 | A fallback `<style>` is used (with a strict CSP it needs `configure({ nonce })`) |
| Container queries (`@container`) | 105 | 110 | 16 | Tabs and the timeline don't adapt to their container's width |
| `100dvh` | 108 | 101 | 15.4 | Without this unit, a very tall dialog is not limited to the visible height of the screen |
| `:has()` | 105 | 121 | 15.4 | Cosmetic only: the range calendar doesn't highlight the interval and avatar labels lose some padding |

**Library minimums:** Chrome and Edge 111, Firefox 113, Safari 16.4. In Firefox 113 to 120 everything works and only the range highlight in the calendar is lost (`:has()`).

There is no support for Internet Explorer or for Safari versions earlier than 16.4. Raising one of these minimums counts as a breaking change and is announced in the CHANGELOG.

### Frameworks and environments

<!-- compat:inicio -->
**What runs in CI (compatibility matrix).** The rows come from [`compat/matriz.json`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/compat/matriz.json): CI installs each listed version and runs the tests of its wrapper, so what says "runs" is what really runs. `npm run compat:check` fails if this table, `package.json` or the README don't match that file.

#### Browsers

| Browser | Minimum | Engine CI runs (e2e) |
|---|---|---|
| Chrome and Edge | 111 | Chromium |
| Firefox | 113 | Firefox |
| Safari | 16.4 | WebKit |

CI runs the e2e tests with the version of each engine that Playwright ships; old versions are not tested separately.

#### Frameworks

| Framework | Declared minimum | Versions CI runs |
|---|---|---|
| Vue (`nexus-dialogs/vue`) | 3.3 or later | 3.3 (minimum), latest |
| React (`nexus-dialogs/react`) | 18 or later | 18.0 (minimum), 18 (latest), latest |
| Angular (`nexus-dialogs/angular`) | 16 or later. ESM only. | 16.0 (minimum), 19, latest |

#### Node

| Minimum | Versions CI runs | What is checked |
|---|---|---|
| 18 | 18, 20, 22, 24 | Importing (ESM and CJS) and failing with a clear error without a DOM. The library is built with Node 22. |
<!-- compat:fin -->

Types are included and checked with `@arethetypeswrong` on every change. Importing the library doesn't touch the DOM and opening a dialog on the server fails with an explicit error.

## Versions

- **0.x (today).** A minor version (`0.5` → `0.6`) may bring breaking changes. They always appear in the CHANGELOG under "Breaking changes", with how to migrate. Pin the exact version (`"nexus-dialogs": "0.5.4"`) until you want to upgrade.
- **From 1.0.** Only a major version breaks. Whatever is going to be removed is marked as deprecated a minor version earlier.
- **What counts as breaking:** removing or renaming a public export, changing what a function returns ([contracts](https://urieldomingezm.github.io/nexus-dialogs/en/contratos.html)), changing a default value that alters the result and raising the minimum of a browser or framework.
- **What does not count:** the exact look within what the button standard and accessibility ask for, bug and security fixes, and what is not in the public API.
- **How it is watched:** `npm run api:check` fails if the public API changes without updating its report, and `test/tipos/contratos.ts` pins what each function returns.

## Support

One person maintains the library, so this is good faith, not a contract.

| | What to expect |
|---|---|
| **Vulnerabilities** | Acknowledgement within 7 days and first assessment within 14 ([`SECURITY.md`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/SECURITY.md)). The latest published version is fixed (from 1.0, the latest 1.x) |
| **Bugs** | Handled in the latest version. With a minimal case that reproduces it, the fix is much faster |
| **Accessibility** | Takes priority over new features |
| **Previous versions** | They don't receive fixes; upgrading from one minor to the next comes with the migration guide in the CHANGELOG |
| **Publishing** | Each version is uploaded to npm on hold and is not public until its owner approves it with 2FA |

What is not promised: a fixed release calendar, support for browsers outside the table or compatibility with third-party patches on the library.

## Use in production

This library was born for internal company systems and has been tested in real use: its SweetAlert2 adapter runs in a production web application for recruiter tracking, where it replaced SweetAlert2 without changing the screens' code. It is **one internal, unnamed case**: there is still no public external case to back it up, and that is why the [limitations](https://urieldomingezm.github.io/nexus-dialogs/en/limitaciones.html) say so.

If you use it in a project, even if everything went well, tell us with ["I tried it in my project"](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=adopcion.yml): which dialogs you use, in what kind of application (no sensitive data) and how it went. Each real case is added here, with your permission.

Meanwhile, what backs stability can be checked: unit tests with coverage thresholds, tests in three browsers, axe in every theme, memory leaks, CSP and Trusted Types, and the [complete examples](https://github.com/urieldomingezm/nexus-dialogs/tree/main/examples) running on every change. Size and performance numbers are repeated with `npm run bench` ([Performance](https://urieldomingezm.github.io/nexus-dialogs/en/rendimiento.html)).

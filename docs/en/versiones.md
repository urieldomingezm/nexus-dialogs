How versions are numbered, how to read the CHANGELOG and what to do before and after upgrading. The full policy and what is supported is in [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html); this is the practical part.

## How versions are numbered

[Semantic versioning](https://semver.org/) is followed (`major.minor.patch`):

| Change | Example | What to expect |
|---|---|---|
| **Patch** | `0.5.3` → `0.5.4` | Fixes only. Upgrading is safe |
| **Minor** | `0.5.x` → `0.6.0` | While we are on `0.x`, **it may break**. From `1.0`, it only adds |
| **Major** | `1.x` → `2.0` | May break. Whatever is removed was announced as deprecated a minor version earlier |

What counts as "breaking" (removing or renaming a public export, changing what a function returns, changing a default value that alters the result, or raising a browser minimum) is in [Support](https://urieldomingezm.github.io/nexus-dialogs/en/soporte.html#versions).

## How to read the CHANGELOG

Each version in the [CHANGELOG](https://github.com/urieldomingezm/nexus-dialogs/blob/main/CHANGELOG.md) (in Spanish) is divided into sections, always in this order:

- **Breaking changes** ("Cambios que rompen"): what to check before upgrading, each with how to migrate. If the section doesn't exist, that version breaks nothing.
- **Added** ("Agregado") and **Changed** ("Cambiado"): new features and behavior adjustments.
- **Deprecated** ("Obsoleto"): what will be removed later and what to replace it with.
- **Fixed** ("Corregido"): bugs and security.

## Before upgrading

1. **Pin the exact version** while you are on `0.x`: `"nexus-dialogs": "0.5.4"`, without `^` or `~`. That way a fresh install never changes version on its own.
2. **Read "Breaking changes"** for every version between yours and the new one, not just the latest.
3. **Search your code** for what each change mentions (the function or option name).
4. **Check the types:** `tsc` flags removed or renamed exports and options that changed shape.
5. **Upgrade and run your tests.** If you have UI tests, dialogs are native `<dialog>` elements with `data-nexus-dialog`, so your selectors should not change.

## What is watched so it doesn't break you

- `npm run api:check` fails if the public API changes without updating its report, so a change in the exports never goes unnoticed.
- `test/tipos/contratos.ts` pins what each function returns ([Contracts](https://urieldomingezm.github.io/nexus-dialogs/en/contratos.html)).
- Each version is tested in Chromium, Firefox and WebKit, and the published package is installed and used from Node, Vite and webpack before release.

## Known migrations

| From | To | What changes | How to migrate |
|---|---|---|---|
| `0.4.x` | `0.5.0` | `strictHtml` is `true` by default: string `html` is shown as text | With your own content, `configure({ strictHtml: false })`. With outside content, `configure({ sanitize: (h) => DOMPurify.sanitize(h) })`. `Node`s and plain texts don't change |

New migrations are added here as they come out. For coming from SweetAlert2 there is a separate guide: [Migrate from SweetAlert2](https://urieldomingezm.github.io/nexus-dialogs/en/migracion.html).

## When something is going to be removed

From `1.0`, a function that is going to be retired keeps working for one full minor version, marked `@deprecated` in the types (your editor strikes it through) and listed under "Deprecated" in the CHANGELOG with its replacement. It is only removed in the next major version. In `0.x` the notice may last less, but it always appears under "Breaking changes".

## If the upgrade breaks something

Go back to the previous version (`npm install nexus-dialogs@0.5.4`) and open an [issue](https://github.com/urieldomingezm/nexus-dialogs/issues) with the version you come from, the one you are going to and a minimal case. If the change was not in "Breaking changes", it is a CHANGELOG error and it gets fixed.

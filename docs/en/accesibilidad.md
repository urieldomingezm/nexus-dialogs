# Accessibility

nexus-dialogs aims at **WCAG 2.2 level AA** as its conformance target. It is not a certification or an external audit: what follows are the tests that are actually run. This page says clearly what is tested automatically on every change, what is still checked by hand and how to repeat that check.

## What is tested automatically

Everything runs in CI on every change (`test/e2e/accesibilidad.spec.mjs` and `test/e2e/sitio.spec.mjs`), in Chromium, Firefox and WebKit. axe-core runs in Chromium and WebKit; in Firefox it is skipped because, together with Playwright, it crashes the page when the DOM changes a lot (the same flows do pass without axe).

| What | How it is tested |
|---|---|
| **WCAG 2.2 A and AA rules** (axe-core) | Form with errors, danger confirmation and toast, in each theme and scheme |
| **Color contrast** | Part of axe: 4.5:1 for text and 3:1 for icons and borders, in the 6 theme combinations in the table below |
| **Keyboard** | Tab goes through the whole form without leaving the dialog; Enter advances in the wizard; Esc closes |
| **Focus** | Correct initial focus, the error summary receives focus and its links lead to the field with `aria-invalid` and `aria-describedby`; on closing, focus returns to the button that opened the dialog |
| **Reduced motion** | With `prefers-reduced-motion` no animation is left running |
| **Reflow** | At 320 px wide (400% zoom) the dialog does not overflow the screen |
| **Forced colors** | With `forced-colors: active` the buttons keep their border |
| **Documentation site** | axe on all its pages |
| **Accessibility tree** | What a screen reader receives (role, name and state of each element, and their order) in the danger confirmation, delete by name, form with errors, session about to expire and the toast (`test/e2e/lectores.spec.mjs`, Chromium) |
| **Edge cases** | Several dialogs at once, unmounting a component with an open dialog, failing async validations, corrupt files, SSR and browsers lacking a native API (`test/unit/extremos.test.ts`, `test/unit/ssr.test.ts`) |

### Themes and schemes tested

| Theme | Scheme | Note |
|---|---|---|
| `light` (the usual one) | light and dark | Follows the system scheme with `scheme: 'auto'` |
| `dark` | dark | |
| `bootstrap`, `tailwind`, `material` | light | These are light palettes: use them with `scheme: 'light'` |

If you create your own theme, watch the contrast of the danger button (white text on the red background ≥ 4.5:1), of the error text over the summary and of the field borders (≥ 3:1). The `accesibilidad.spec.mjs` test serves as a template: add your theme to `COMBINACIONES`.

## What the automatic tests do NOT cover

axe, the accessibility tree and the keyboard tests do not replace a person using a screen reader: they cannot judge whether an announcement is clear, whether the reading order makes sense or how it changes between readers and browsers. That check is done by hand.

### Manual test script

Do these walkthroughs with each combination in the results table and note what happens. Use the [test page](https://github.com/urieldomingezm/nexus-dialogs/tree/main/test/paginas) (`npm run dev`, then `/test/paginas/`) or the [site examples](https://urieldomingezm.github.io/nexus-dialogs/en/ejemplos.html).

1. **Alert** (`dialog.alert`): when opened it is announced as a dialog, with its title and text. On closing, focus returns to the button that opened it.
2. **Danger confirmation** (`confirmDelete`): focus starts on "Cancel" and the text of what is about to be deleted is announced.
3. **Form with errors**: when submitting empty, the error summary is announced; each link leads to the field; the field is read as "invalid" together with its message.
4. **Wizard** (`wizard`): the current step is announced ("step 2 of 3"); when advancing, focus enters the first field.
5. **Toast**: the notice is announced without taking focus away from what you are doing; "Undo" is reachable with Tab.
6. **Calendar** (`type: 'date'` with `calendar`): arrows move the day, Page Up / Page Down change month, and the chosen day is announced in full.
7. **Import** (`importData`): the file drop zone has an alternative button; the per-row error summary is read in order.

### Results

Each row is filled in when someone does the check, with the ["Screen reader test"](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=lector-de-pantalla.yml) form. "Pending" means it has not been done yet; compatibility with a reader that has not been tested is not claimed.

| Screen reader | Browser | System | Date | Result |
|---|---|---|---|---|
| NVDA | Firefox / Chrome | Windows | — | Pending |
| JAWS | Chrome / Edge | Windows | — | Pending |
| VoiceOver | Safari | macOS | — | Pending |
| VoiceOver | Safari | iOS | — | Pending |
| TalkBack | Chrome | Android | — | Pending |

## Found a problem?

Open an [issue](https://github.com/urieldomingezm/nexus-dialogs/issues) with the screen reader, the browser, the system and the steps. Accessibility problems take priority over new features.

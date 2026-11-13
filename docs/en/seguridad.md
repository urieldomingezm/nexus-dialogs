What the library does with the content you pass it and what falls to whoever uses it. What is on this page is covered by tests (`test/unit/seguridad.test.ts`).

## The short rule

- **Texts: always safe.** `title`, `text`, labels, help texts, error messages, button names, toast messages and the SweetAlert2 adapter's `footer` are inserted **as text**. If `<img src=x onerror=…>` arrives from a user or a server, it is shown as is and not executed.
- **String `html`: only with `sanitize` or with `strictHtml: false`.** It is the only door through which interpreted HTML enters (`html`, and in the swal adapter also `iconHtml`, `closeButtonHtml` and `loaderHtml`). By default it is shown as text. If you turn that off, the HTML is inserted as is and you **must not pass it data from users or from a server without cleaning it.**
- **`html` as a `Node`: not automatically safe either.** The library inserts it without touching it and without passing it through `sanitize`. If you built the `Node` with `createElement` and `textContent`, it's fine; if you created it with `innerHTML`, `DOMParser` or a fragment that came from outside, it may carry dangerous elements and attributes (`onerror`, `javascript:`…). Clean before building it.

### Strict mode (default since 0.5.0)

Any string `html` that does **not** go through a configured `sanitize` is shown as **text** instead of being interpreted. If someone forgets to configure the filter, the result is ugly text, not an XSS.

```ts
// With your own content (constants in your code): turn it off on purpose.
configure({ strictHtml: false })

// With content that is not yours: give it a filter and the HTML is interpreted already clean.
configure({ sanitize: (html) => DOMPurify.sanitize(html) })
```

Before 0.5.0 HTML was inserted as is by default. If you upgrade and see tags like `<b>` on screen, this is why.

## When to use each thing

| I want to show… | Use |
|---|---|
| A message with user data (name, comment, server error) | `text` (or `title`). Never `html`. |
| Your own content with bold, lists or fixed links | String `html` written by you (a constant in your code) with `strictHtml: false`, or a `sanitize`. |
| Content that comes from outside and must be shown with formatting | `html` + the `sanitize` filter (below), or build a `Node` with `textContent`/`createElement`. |

## The `sanitize` filter

A single entry point for all string HTML. It is configured once:

```ts
import DOMPurify from 'dompurify'
import { configure } from 'nexus-dialogs'

configure({ sanitize: (html) => DOMPurify.sanitize(html) })
```

`sanitize` can return a string or an object with `toString()` (for example, a `TrustedHTML`). With `sanitize: null` it is removed. From then on, `dialog.alert({ html })` and, with `nexus-dialogs/swal`, `html`, `iconHtml`, `closeButtonHtml` and `loaderHtml` go through your function before reaching the DOM. The library **does not ship its own sanitizer** on purpose: cleaning HTML by hand is a classic source of bugs and it is better to use a maintained one (DOMPurify, or the native `Sanitizer` API when your target browser has it).

What the filter does **not** touch: texts (they are already text) and `Node`s, which are your responsibility (see above).

## Other doors worth knowing about

- **Export to CSV**: Excel and LibreOffice **evaluate as a formula** anything that starts with `=`, `+`, `-` or `@` (and with tab or carriage return). `toCSV` prepends an apostrophe (`'=1+1`) so they stay as text; real numbers (`-5`, `+3.25` or a `number`) are not touched. Quotes, line breaks and separators are escaped. The apostrophe is visible in the cell: it is the cost of the protection, the one OWASP recommends.
- **Export to Excel (.xlsx)**: texts are stored as inline strings and the file never contains formulas (`<f>`), so it doesn't need the apostrophe.
- **Import**: files are read in the browser and are not sent anywhere. A corrupt file rejects the promise with an error instead of breaking the page, and a huge one is processed by rows without freezing anything (tested with 50,000 rows).
- **Postal codes (`sepomex`)**: it only does `fetch` to the folder you configure in `baseUrl`; it calls no other server.
- **CSP (styles)**: styles are applied with constructable stylesheets (`adoptedStyleSheets`), which don't need `style-src 'unsafe-inline'`. In browsers without them a `<style>` is used, which a strict policy blocks **unless** you give it your nonce: `configure({ nonce })`. Tested in Chromium with `style-src 'self'` (normal path) and with `style-src 'nonce-…'` without constructable stylesheets; without the nonce, the second path is indeed blocked.
- **Trusted Types**: with `require-trusted-types-for 'script'`, the library opens dialogs, forms and toasts without violations: its icons are built with `createElementNS`, without `innerHTML`. What does need a policy is your string `html`: make `sanitize` return a `TrustedHTML` from your own policy. A normal string is rejected (tested).
- **Shadow DOM is not a security barrier**: it isolates styles, it doesn't protect against scripts from the same page. A `<script>` already running on your page can read the dialogs.

## What is tested and what is not

| Thing | How |
|---|---|
| Texts as text, `sanitize`, `strictHtml` | Unit tests |
| Formula injection (`=1+1`, `@SUM(A1:A2)`, `+cmd`, `-1+2`, `HYPERLINK`, `cmd\|…`) | Unit tests; in addition, **LibreOffice** opens the exported CSV and xlsx without creating formulas (checked by converting them with `soffice`) |
| Opening in **Microsoft Excel** | **Not tested by us.** The file follows OWASP's recommendation, but we haven't opened it in Excel |
| CSP and Trusted Types | Tests in real Chromium |
| Memory leaks | 300 dialogs, forms and toasts opened and closed leave no DOM nodes (Chromium) |
| Dependencies | The library has no production dependencies; production `npm audit` runs on every change |

## How to report a vulnerability

See [`SECURITY.md`](https://github.com/urieldomingezm/nexus-dialogs/blob/main/SECURITY.md): private channel, response times and how versions are published.

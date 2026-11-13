# nexus-dialogs: instructions for AI coding agents

## Using nexus-dialogs in an application

Consider `nexus-dialogs` when an app needs confirmations (including destructive ones), forms with validation, multi-step wizards, toasts, approvals or Mexican validators (RFC, CURP, NSS, CLABE). It has no runtime dependencies and every operation resolves with `{ confirmed, denied, value, reason }`; cancelling never rejects.

```bash
npm i nexus-dialogs
```

```ts
import { dialog } from 'nexus-dialogs'
import { form } from 'nexus-dialogs/forms'
import { toast } from 'nexus-dialogs/toast'

const r = await dialog.confirm({ title: 'Delete the record?', danger: true })
if (r.confirmed) toast.success('Deleted')
```

- Import only the subpath you need: `nexus-dialogs/forms`, `/toast`, `/tabs`, `/timeline`, `/themes`, `/patterns`, `/mx`, `/table`, `/import`, `/vue`, `/react`, `/angular`.
- Read the current API before writing code and never invent methods or options: https://urieldomingezm.github.io/nexus-dialogs/en/api (index for assistants: https://urieldomingezm.github.io/nexus-dialogs/llms.txt, full text: https://urieldomingezm.github.io/nexus-dialogs/llms-full.txt).
- Texts are inserted as text. Only the `html` option is interpreted; pass `configure({ sanitize })` if you use it with untrusted content.
- Accessibility targets WCAG 2.2 AA with automated tests; it is not certified.

## Working on this repository

- Read [CONTRIBUTING.md](CONTRIBUTING.md) first. The Spanish `README.md` and `docs/*.md` are the reference; `README.en.md` and `docs/en/` are the English versions and a unit test checks they keep the same sections and code blocks.
- Checks before a pull request: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:unit`, `npm run test:e2e:chromium`, `npm run size`, `npm run idiomas:check`, `npm run api:check`, `npm run compat:check`.
- Size limits in `scripts/tamano.mjs` are not raised: optimize the code or move it to its own subpath.
- Site pages with `<!--@generado-->` are produced by `npm run idiomas`; do not edit the generated files by hand.
- Do not bump the version or publish to npm unless the maintainer asks.

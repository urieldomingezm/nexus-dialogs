The published sizes and timings can be measured again on your machine with a single command. Here is what is measured, how, and the numbers from the latest measurement.

## How to repeat it

```bash
npm ci
npm run build
npm run bench             # prints the tables
npm run bench -- --write  # also updates this page
```

Timings use Chromium with Playwright; if you already have one installed, `PW_CHROMIUM=/path/to/chrome npm run bench`.

### Compare two versions

To know whether a change made the library heavier or slower, save the measurement of the base version and compare it with yours, on the same machine:

```bash
git checkout main && npm run build && npm run bench -- --json base.json
git checkout my-branch && npm run build && npm run bench -- --comparar base.json
```

The table shows, for each file, each "use only a part" case and each timing, the value before, the current one and the change in percent. If a size grows by more than 3%, the command exits with an error (sizes don't depend on the machine; timings do, so they are only reported).

## What is measured and what is not

- **Size of each file.** The published file is minified with esbuild and compressed with gzip and with brotli. It is the same thing `npm run size` measures (with its per-file limits), plus brotli.
- **Using only a part.** A minimal application that imports only `dialog`, or `dialog` and `form`, or only the validators, bundled with esbuild. It serves to check that what you don't use doesn't travel.
- **Timings.** From the call to `dialog.alert()` or `form()` until the dialog is on screen with its button ready, with reduced animations to measure the library and not the transition. Median and 95th percentile of many repetitions, after a warm-up. The first dialog is measured separately (cold start).
- **Memory.** JavaScript heap before and after hundreds of openings and closings, with forced garbage collection.
- **What is not measured:** network load time, other libraries (nobody is compared against here) or slow devices. A low-end phone will be several times slower than the machine in this measurement: measure on yours.

The per-file size limits are enforced by CI (`npm run size`); timings and memory are informative and fail nothing.

## Results

<!--bench-->
**Environment of this measurement:** Intel(R) Xeon(R) Processor @ 2.30GHz · linux 6.18.44-fc-v445 · Node v22.23.4 · Chromium 153.0.8010.12.

### Size of each file

| File | min + gzip | min + brotli |
|---|---|---|
| `nexus-dialogs.js` | 10.81 KB | 9.62 KB |
| `nexus-dialogs.all.js` | 41.37 KB | 35.50 KB |
| `forms.js` | 23.22 KB | 20.82 KB |
| `toast.js` | 6.24 KB | 5.48 KB |
| `themes.js` | 1.36 KB | 1.19 KB |
| `patterns.js` | 6.17 KB | 5.49 KB |
| `mx.js` | 1.08 KB | 0.98 KB |
| `swal.js` | 7.52 KB | 6.80 KB |
| `import.js` | 10.08 KB | 9.03 KB |
| `table.js` | 3.57 KB | 3.13 KB |
| `rrhh.js` | 3.97 KB | 3.58 KB |
| `sepomex.js` | 0.53 KB | 0.46 KB |
| `vue.js` | 0.84 KB | 0.75 KB |
| `react.js` | 1.03 KB | 0.94 KB |
| `angular.js` | 0.94 KB | 0.84 KB |

### What using only a part weighs (with a bundler)

| Case | min + gzip | min + brotli |
|---|---|---|
| Only `dialog` (alerts and confirmations) | 10.08 KB | 9.03 KB |
| `dialog` + `form` | 31.88 KB | 27.36 KB |
| Only Mexican validators (`mx`) | 0.28 KB | 0.26 KB |

### Timings in Chromium (reduced animations)

From the function call until the dialog is on screen with its button ready.

| Scenario | Median | p95 |
|---|---|---|
| First dialog (cold start) | 8.5 ms | — |
| `dialog.alert`, 200 openings | 0.4 ms | 0.7 ms |
| `form` with 20 fields, 50 openings | 1.5 ms | 3.9 ms |

### Memory

After 200 openings and closings of `dialog.alert` (with garbage collection before and after), the JavaScript heap changed **+12 KB** and **0** dialogs were left in the DOM.
<!--/bench-->

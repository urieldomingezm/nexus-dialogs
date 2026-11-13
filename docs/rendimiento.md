Los tamaños y tiempos que se publican se pueden volver a medir en tu máquina con un solo comando. Aquí está qué se mide, cómo y los números de la última medición.

## Cómo repetirlo

```bash
npm ci
npm run build
npm run bench             # imprime las tablas
npm run bench -- --write  # además actualiza esta página
```

Los tiempos usan Chromium con Playwright; si ya tienes uno instalado, `PW_CHROMIUM=/ruta/a/chrome npm run bench`.

## Qué se mide y qué no

- **Tamaño de cada archivo.** El archivo publicado se minifica con esbuild y se comprime con gzip y con brotli. Es lo mismo que mide `npm run size` (con sus límites por archivo), más brotli.
- **Usar solo una parte.** Una aplicación mínima que importa solo `dialog`, o `dialog` y `form`, o solo los validadores, empaquetada con esbuild. Sirve para comprobar que lo que no usas no viaja.
- **Tiempos.** Desde la llamada a `dialog.alert()` o `form()` hasta que el diálogo está en pantalla con su botón listo, con animaciones reducidas para medir la librería y no la transición. Mediana y percentil 95 de muchas repeticiones, después de un calentamiento. El primer diálogo se mide aparte (arranque en frío).
- **Memoria.** Montón de JavaScript antes y después de cientos de aperturas y cierres, con recolección de basura forzada.
- **Lo que no se mide:** el tiempo de carga de red, otras librerías (aquí no se compara contra nadie) ni dispositivos lentos. Un teléfono de gama baja será varias veces más lento que el equipo de esta medición: mide en el tuyo.

Los límites de tamaño por archivo los hace cumplir el CI (`npm run size`); los tiempos y la memoria son informativos y no hacen fallar nada.

## Resultados

<!--bench-->
**Entorno de esta medición:** Intel(R) Xeon(R) Processor @ 2.30GHz · linux 6.18.44-fc-v445 · Node v22.23.4 · Chromium 153.0.8010.12.

### Tamaño de cada archivo

| Archivo | min + gzip | min + brotli |
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

### Lo que pesa usar solo una parte (con un bundler)

| Caso | min + gzip | min + brotli |
|---|---|---|
| Solo `dialog` (alertas y confirmaciones) | 10.08 KB | 9.03 KB |
| `dialog` + `form` | 31.88 KB | 27.36 KB |
| Solo validadores de México (`mx`) | 0.28 KB | 0.26 KB |

### Tiempos en Chromium (animaciones reducidas)

De la llamada a la función hasta que el diálogo está en pantalla con su botón listo.

| Escenario | Mediana | p95 |
|---|---|---|
| Primer diálogo (arranque en frío) | 8.5 ms | — |
| `dialog.alert`, 200 aperturas | 0.4 ms | 0.7 ms |
| `form` de 20 campos, 50 aperturas | 1.5 ms | 3.9 ms |

### Memoria

Tras 200 aperturas y cierres de `dialog.alert` (con recolección de basura antes y después), el montón de JavaScript cambió **+12 KB** y quedaron **0** diálogos en el DOM.
<!--/bench-->

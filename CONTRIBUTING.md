# Cómo contribuir a nexus-dialogs

Gracias por querer ayudar. Esta guía es corta a propósito: lo que necesitas para abrir un issue o un PR que se pueda revisar rápido.

Una sola persona mantiene la librería, así que las respuestas son de buena fe y sin calendario fijo ([qué esperar](https://urieldomingezm.github.io/nexus-dialogs/soporte.html)). Un caso mínimo que reproduzca el problema acelera todo.

## Antes de empezar

| Quiero… | Qué hacer |
|---|---|
| Reportar un error | [Reportar un error](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=error.yml), con versión, navegador y código mínimo |
| Avisar que algo no funciona en mi navegador, framework o Node | [Incompatibilidad](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=compatibilidad.yml): sirve para corregir la [matriz de compatibilidad](https://urieldomingezm.github.io/nexus-dialogs/soporte.html) |
| Contar cómo me fue usándola | [Lo probé en mi proyecto](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=adopcion.yml); hoy es lo que más ayuda |
| Reportar un problema con lector de pantalla | [Lector de pantalla](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=lector-de-pantalla.yml); la accesibilidad va antes que las funciones nuevas |
| Proponer una mejora | [Mejora](https://github.com/urieldomingezm/nexus-dialogs/issues/new?template=mejora.yml) **antes** de escribir código, para acordar el enfoque |
| Reportar una vulnerabilidad | En privado, como dice [`SECURITY.md`](SECURITY.md). **Nunca** en un issue público |

## Preparar el entorno

Necesitas Node 22 (para compilar; los usuarios de la librería pueden tener Node 18 o más).

```bash
git clone https://github.com/urieldomingezm/nexus-dialogs.git
cd nexus-dialogs
npm ci
npm run dev                          # página de pruebas en test/paginas/
npx playwright install               # una vez, para las pruebas e2e
```

## Qué correr antes de abrir el PR

```bash
npm run lint && npm run format:check && npm run typecheck
npm run test:unit                    # Vitest + happy-dom
npm run test:e2e                     # Playwright en Chromium, Firefox y WebKit, con axe
npm run build && npm run size        # y npm run api:check si tocaste la API pública
npm run build:site                   # si tocaste el sitio de documentación (site/ o docs/)
npm run compat:check                 # si tocaste versiones mínimas o soporte
```

`npm run format` arregla el formato. CI repite todo esto y además corre las pruebas con las versiones mínimas de Vue, React, Angular y Node.

## Reglas del proyecto

- **Los límites de tamaño no se suben.** `npm run size` falla si un bundle crece. Si te pasas, optimiza el código (separa lo que no todos usan en su propia subruta, quita duplicados) en vez de aumentar el límite en `scripts/tamano.mjs`.
- **Capas.** El núcleo no importa de la UI avanzada, ni esta de la capa de empresa ([arquitectura](https://urieldomingezm.github.io/nexus-dialogs/arquitectura.html)). `test/unit/capas.test.ts` lo comprueba.
- **API pública.** Quitar, renombrar o cambiar lo que devuelve una exportación rompe la compatibilidad. Si cambia a propósito, corre `npm run build && npm run api` y anótalo en el CHANGELOG bajo «Cambios que rompen», con cómo migrar.
- **Accesibilidad primero.** Teclado completo, foco que vuelve a su sitio, roles correctos y contraste. Toda pantalla nueva pasa axe (WCAG 2.2 AA) en tema claro y oscuro.
- **Sin dependencias en producción.** La librería no tiene ninguna y así se queda.
- **Sin ejemplos con datos reales** ni nombres de clientes o empresas. Usa personas y empresas inventadas.
- **Textos en español** en la documentación, el CHANGELOG y los mensajes de la librería. Los otros idiomas viven en `src/locales.ts`; si tocas una traducción y no hablas el idioma, dilo en el PR para que lo revise alguien nativo.

## Cómo es un buen PR

1. Una sola idea por PR. Si encuentras otra cosa por el camino, abre otro.
2. Pruebas: una unitaria (`test/unit`) o e2e (`test/e2e`) que fallaba antes y pasa ahora.
3. Documentación: README o `docs/` si cambia cómo se usa, y una línea en el CHANGELOG bajo «Sin publicar».
4. Revisado en celular y con teclado si cambia lo que se dibuja.
5. Mensaje de commit en español, con prefijo (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`), por ejemplo `fix: el combobox sin opciones ya no marca error en axe`.
6. Llena la plantilla del PR y enlaza el issue (`Cierra #12`).

No hace falta cambiar la versión: la sube quien mantiene al publicar (`npm run nueva-version`).

## La matriz de compatibilidad

Qué navegadores, versiones de Node y de Vue, React y Angular se soportan sale de un único archivo, [`compat/matriz.json`](compat/matriz.json). De él salen las tablas de `docs/soporte.md` y las versiones que CI instala y prueba.

- ¿Cambia un mínimo, o quieres agregar una versión a la matriz? Edita `compat/matriz.json`, corre `npm run compat` (regenera `docs/soporte.md`) y `npm run compat:check` (comprueba `package.json` y el README). Subir un mínimo cuenta como cambio que rompe.
- ¿Quieres probar una versión en tu máquina? `npm i --no-save react@18.0.0 react-dom@18.0.0 && npx vitest run test/unit/react.test.ts`, y `npm ci` para volver a lo normal. `npm run check:node` (con `npm run build` antes) prueba el paquete con tu versión de Node.

## Conducta

Trata a todas las personas con respeto. Se critican las ideas y el código, no a quien los escribió. Un comentario despectivo o un ataque personal es motivo para cerrar el hilo.

## Licencia

Al enviar un PR aceptas que tu contribución se publique con la misma licencia del proyecto ([`LICENSE`](LICENSE)).

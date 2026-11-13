# Ejemplos completos

Flujos de principio a fin con lo que se hace en una empresa: nada de pantallas sueltas, sino varias piezas de la librería juntas. Usan un servidor en memoria (`api-falsa.ts`) para correr solos; en tu aplicación se sustituye por tus llamadas.

| Ejemplo | Qué junta |
|---|---|
| [`alta-de-empleado.ts`](alta-de-empleado.ts) | Asistente de tres pasos con RFC y CURP validados, revisión final, «Procesando…» y aviso |
| [`cierre-de-quincena.ts`](cierre-de-quincena.ts) | Pantalla de espera, timbrado por lote con vista previa y progreso, error parcial y reintento |
| [`importar-incidencias.ts`](importar-incidencias.ts) | Importar CSV o Excel: columnas relacionadas solas, filas con error y solo se guardan las válidas |
| [`baja-de-empleado.ts`](baja-de-empleado.ts) | Borrado grande: escribir el nombre, lo que se pierde, «Procesando…» y aviso con «Deshacer» |
| [`aprobar-vacaciones.ts`](aprobar-vacaciones.ts) | Aprobación con detalle y aviso de empalme; aprobar con comentario o rechazar con motivo |
| [`sesion-por-expirar.ts`](sesion-por-expirar.ts) | Cuenta regresiva accesible; extender o cerrar la sesión, también cuando se acaba el tiempo |

Cada ejemplo se comprueba en cada cambio: `npm run typecheck` los revisa como código y `test/e2e/ejemplos.spec.mjs` los ejecuta en un navegador con una persona (el guion) contestándolos, con axe en cada pantalla.

Para verlos funcionar: `npm run dev` y abre `/test/paginas/ejemplos.html`. En la consola del navegador: `await ejemplos.altaDeEmpleado()`.

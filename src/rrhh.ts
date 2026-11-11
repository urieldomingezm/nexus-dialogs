/**
 * Plantillas de formularios de Recursos Humanos, en JSON puro (sin funciones): se pueden guardar en tu base de datos,
 * ajustar por empresa y abrir con `formFromJSON`.
 *
 * ```ts
 * import { formFromJSON } from 'nexus-dialogs/forms'
 * import { plantillas } from 'nexus-dialogs/rrhh'
 *
 * const r = await formFromJSON(plantillas.vacaciones, { values: { empleado: 'Ana Torres' } })
 * // o con tus funciones: resolvers: { rfcLibre, buscarCP }
 * ```
 * Cada plantilla trae `validate`/`lookupPostalCode` por nombre solo donde hace falta; si no pasas el resolver,
 * usa `sinResolvers(plantilla)` para quitarlos.
 */
import type { FormSchema, JSONField } from './forms'

const TEL: JSONField = { name: 'telefono', label: 'Teléfono', type: 'phone', required: true }
const CORREO: JSONField = { name: 'correo', label: 'Correo', type: 'email', required: true }

/** Alta de empleado: asistente de 4 pasos con revisión. Resolvers opcionales: `rfcLibre`, `curpLibre`, `buscarCP`. */
export const altaEmpleado: FormSchema = {
  title: 'Alta de empleado',
  submitText: 'Dar de alta',
  draftKey: 'rrhh-alta',
  review: true,
  steps: [
    {
      title: 'Datos personales',
      columns: 2,
      fields: [
        { name: 'nombre', label: 'Nombre(s)', required: true, autocomplete: 'given-name' },
        { name: 'apellidos', label: 'Apellidos', required: true, autocomplete: 'family-name' },
        { name: 'nacimiento', label: 'Fecha de nacimiento', type: 'date', calendar: true, required: true },
        { name: 'sexo', label: 'Sexo', type: 'segmented', options: ['Mujer', 'Hombre', 'Otro'] },
        { name: 'curp', label: 'CURP', type: 'curp', required: true, validate: 'curpLibre' },
        { name: 'rfc', label: 'RFC', type: 'rfc', required: true, validate: 'rfcLibre' },
        { name: 'nss', label: 'NSS (IMSS)', type: 'nss', help: 'Si aún no lo tiene, déjalo vacío.' },
        {
          name: 'estadoCivil',
          label: 'Estado civil',
          type: 'select',
          options: ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)'],
        },
      ],
    },
    {
      title: 'Contacto y domicilio',
      fields: [
        { ...TEL, name: 'telefono' },
        { ...CORREO, name: 'correo' },
        { name: 'domicilio', label: 'Domicilio', type: 'address', required: true, lookupPostalCode: 'buscarCP' },
        {
          name: 'emergencia',
          label: 'Contacto de emergencia',
          type: 'items',
          minRows: 1,
          maxRows: 2,
          fields: [
            { name: 'nombre', label: 'Nombre', required: true },
            { name: 'parentesco', label: 'Parentesco', required: true },
            { name: 'telefono', label: 'Teléfono', type: 'phone', required: true },
          ],
        },
      ],
    },
    {
      title: 'Puesto y sueldo',
      columns: 2,
      fields: [
        { name: 'puesto', label: 'Puesto', required: true },
        { name: 'area', label: 'Área o departamento', required: true },
        { name: 'ingreso', label: 'Fecha de ingreso', type: 'date', calendar: true, required: true },
        { name: 'jefe', label: 'Jefe directo' },
        {
          name: 'contrato',
          label: 'Tipo de contrato',
          type: 'select',
          required: true,
          options: ['Indeterminado', 'Determinado', 'Por obra', 'Periodo de prueba', 'Capacitación inicial'],
        },
        {
          name: 'fin',
          label: 'Termina el',
          type: 'date',
          calendar: true,
          visibleIf: { field: 'contrato', in: ['Determinado', 'Por obra', 'Periodo de prueba', 'Capacitación inicial'] },
        },
        { name: 'jornada', label: 'Jornada', type: 'segmented', options: ['Diurna', 'Mixta', 'Nocturna'], value: 'Diurna' },
        { name: 'salarioDiario', label: 'Salario diario', type: 'money', required: true, min: 0 },
        {
          name: 'periodo',
          label: 'Pago',
          type: 'segmented',
          options: ['Semanal', 'Catorcenal', 'Quincenal', 'Mensual'],
          value: 'Quincenal',
        },
        { name: 'esquema', label: 'Esquema', type: 'select', options: ['Nómina', 'Honorarios', 'Mixto'], value: 'Nómina' },
      ],
    },
    {
      title: 'Pago y documentos',
      fields: [
        { name: 'banco', label: 'Banco', required: true },
        { name: 'clabe', label: 'CLABE', type: 'clabe', required: true },
        {
          name: 'documentos',
          label: 'Documentos',
          type: 'file',
          multiple: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 5_000_000,
          help: 'INE, CURP, comprobante de domicilio, acta de nacimiento, NSS y constancia de situación fiscal.',
        },
        { name: 'aviso', label: 'El empleado recibió el aviso de privacidad', type: 'checkbox', required: true },
      ],
    },
  ],
}

/** Solicitud de vacaciones: calendario, días hábiles y quién cubre. */
export const vacaciones: FormSchema = {
  title: 'Solicitud de vacaciones',
  submitText: 'Enviar solicitud',
  draftKey: 'rrhh-vacaciones',
  fields: [
    { name: 'empleado', label: 'Empleado', required: true, autocomplete: 'name' },
    { name: 'fechas', label: 'Días', type: 'daterange', calendar: true, businessDays: true, presets: false, required: true, maxDays: 20 },
    { name: 'cubre', label: 'Quién cubre tus pendientes', help: 'Nombre de la persona que atenderá tus tareas.' },
    { name: 'comentario', label: 'Comentario para tu jefe', type: 'textarea', maxLength: 500 },
  ],
}

/** Permiso o ausencia: motivo, con o sin goce, fechas u horas. */
export const permiso: FormSchema = {
  title: 'Solicitud de permiso',
  submitText: 'Enviar solicitud',
  columns: 2,
  fields: [
    { name: 'empleado', label: 'Empleado', required: true, span: 2 },
    {
      name: 'motivo',
      label: 'Motivo',
      type: 'select',
      required: true,
      options: ['Asunto personal', 'Trámite oficial', 'Cita médica', 'Fallecimiento de familiar', 'Matrimonio', 'Paternidad', 'Otro'],
    },
    { name: 'goce', label: 'Con goce de sueldo', type: 'switch' },
    { name: 'otro', label: '¿Cuál?', required: true, span: 2, visibleIf: { field: 'motivo', equals: 'Otro' } },
    { name: 'duracion', label: 'Duración', type: 'segmented', options: ['Horas', 'Días'], value: 'Días', span: 2 },
    {
      name: 'fechas',
      label: 'Días',
      type: 'daterange',
      calendar: true,
      businessDays: true,
      presets: false,
      required: true,
      span: 2,
      visibleIf: { field: 'duracion', equals: 'Días' },
    },
    { name: 'dia', label: 'Día', type: 'date', calendar: true, required: true, visibleIf: { field: 'duracion', equals: 'Horas' } },
    {
      name: 'horas',
      label: 'Horas',
      type: 'number',
      min: 1,
      max: 8,
      step: 0.5,
      required: true,
      visibleIf: { field: 'duracion', equals: 'Horas' },
    },
    {
      name: 'comprobante',
      label: 'Comprobante',
      type: 'file',
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5_000_000,
      span: 2,
      help: 'Si aplica (cita, acta, citatorio…).',
    },
    { name: 'comentario', label: 'Comentario', type: 'textarea', span: 2 },
  ],
}

/** Incapacidad del IMSS: folio, tipo, días y el certificado. */
export const incapacidad: FormSchema = {
  title: 'Registro de incapacidad',
  submitText: 'Registrar',
  columns: 2,
  fields: [
    { name: 'empleado', label: 'Empleado', required: true, span: 2 },
    {
      name: 'folio',
      label: 'Folio del certificado',
      required: true,
      pattern: '^[A-Z0-9]{6,12}$',
      help: 'Como aparece en el certificado del IMSS.',
    },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['Enfermedad general', 'Riesgo de trabajo', 'Maternidad'] },
    {
      name: 'ramo',
      label: 'Ramo',
      type: 'select',
      required: true,
      options: ['Inicial', 'Subsecuente', 'Recaída', 'Alta'],
      visibleIf: { field: 'tipo', in: ['Enfermedad general', 'Riesgo de trabajo'] },
    },
    {
      name: 'periodo',
      label: 'Periodo',
      type: 'select',
      required: true,
      options: ['Prenatal', 'Posnatal', 'Enlace'],
      visibleIf: { field: 'tipo', equals: 'Maternidad' },
    },
    { name: 'fechas', label: 'Días amparados', type: 'daterange', calendar: true, presets: false, required: true, span: 2 },
    {
      name: 'certificado',
      label: 'Certificado (foto o PDF)',
      type: 'file',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 8_000_000,
      span: 2,
    },
    { name: 'notas', label: 'Notas', type: 'textarea', span: 2 },
  ],
}

/** Baja de empleado: asistente con motivo, finiquito y entrega. */
export const baja: FormSchema = {
  title: 'Baja de empleado',
  submitText: 'Dar de baja',
  draftKey: 'rrhh-baja',
  review: true,
  steps: [
    {
      title: 'Motivo',
      fields: [
        { name: 'empleado', label: 'Empleado', required: true },
        { name: 'fecha', label: 'Último día laborado', type: 'date', calendar: true, required: true },
        {
          name: 'motivo',
          label: 'Motivo',
          type: 'radio',
          required: true,
          options: [
            { value: 'renuncia', label: 'Renuncia voluntaria' },
            { value: 'despido', label: 'Despido (rescisión por el patrón)' },
            { value: 'termino', label: 'Término del contrato' },
            { value: 'mutuo', label: 'Mutuo acuerdo' },
            { value: 'fallecimiento', label: 'Fallecimiento' },
          ],
        },
        {
          name: 'causa',
          label: 'Causa',
          type: 'textarea',
          required: true,
          visibleIf: { field: 'motivo', equals: 'despido' },
          help: 'Será la base del aviso de rescisión.',
        },
        { name: 'recontratable', label: 'Recontratable', type: 'switch', value: true },
      ],
    },
    {
      title: 'Finiquito',
      columns: 2,
      fields: [
        { name: 'diasPendientes', label: 'Días trabajados sin pagar', type: 'number', min: 0, required: true },
        { name: 'vacacionesPendientes', label: 'Días de vacaciones pendientes', type: 'number', min: 0, required: true },
        { name: 'primaVacacional', label: 'Prima vacacional', type: 'money', min: 0 },
        { name: 'aguinaldo', label: 'Aguinaldo proporcional', type: 'money', min: 0 },
        {
          name: 'indemnizacion',
          label: 'Indemnización (3 meses)',
          type: 'money',
          min: 0,
          visibleIf: { field: 'motivo', in: ['despido', 'mutuo'] },
        },
        { name: 'primaAntiguedad', label: 'Prima de antigüedad', type: 'money', min: 0 },
        { name: 'descuentos', label: 'Descuentos (préstamos, faltantes)', type: 'money', min: 0 },
        { name: 'total', label: 'Total a pagar', type: 'money', required: true, min: 0, span: 2 },
      ],
    },
    {
      title: 'Entrega',
      fields: [
        {
          name: 'entrega',
          label: 'Entregó',
          type: 'items',
          fields: [
            { name: 'articulo', label: 'Artículo', required: true },
            { name: 'estado', label: 'Estado', type: 'select', options: ['Bueno', 'Regular', 'Dañado', 'No entregado'], value: 'Bueno' },
          ],
        },
        { name: 'accesos', label: 'Se cancelaron accesos y correo', type: 'checkbox', required: true },
        { name: 'imss', label: 'Se presentó la baja ante el IMSS', type: 'checkbox' },
        { name: 'firma', label: 'Firma del empleado', type: 'signature' },
      ],
    },
  ],
}

/** Comprobación de gastos: partidas con totales y comprobantes. */
export const gastos: FormSchema = {
  title: 'Comprobación de gastos',
  submitText: 'Enviar a revisión',
  draftKey: 'rrhh-gastos',
  fields: [
    { name: 'empleado', label: 'Empleado', required: true },
    { name: 'concepto', label: 'Motivo del gasto', required: true, help: 'Viaje a Monterrey, insumos de oficina…' },
    { name: 'periodo', label: 'Periodo', type: 'daterange', calendar: true, required: true },
    {
      name: 'partidas',
      label: 'Gastos',
      type: 'items',
      minRows: 1,
      fields: [
        { name: 'fecha', label: 'Fecha', type: 'date', required: true },
        {
          name: 'categoria',
          label: 'Categoría',
          type: 'select',
          required: true,
          options: ['Transporte', 'Hospedaje', 'Alimentos', 'Gasolina', 'Casetas', 'Papelería', 'Otro'],
        },
        { name: 'descripcion', label: 'Descripción', required: true },
        { name: 'importe', label: 'Importe', type: 'money', required: true, min: 0 },
      ],
    },
    { name: 'anticipo', label: 'Anticipo recibido', type: 'money', min: 0, value: 0 },
    {
      name: 'comprobantes',
      label: 'Comprobantes (facturas XML/PDF, tickets)',
      type: 'file',
      multiple: true,
      accept: '.xml,.pdf,.jpg,.jpeg,.png',
      maxSize: 8_000_000,
    },
    { name: 'clabe', label: 'CLABE para el reembolso', type: 'clabe', help: 'Si es distinta a la de nómina.' },
  ],
}

/** Evaluación de desempeño: datos, competencias calificadas de 1 a 5, resultados y compromisos. */
export const evaluacion: FormSchema = {
  title: 'Evaluación de desempeño',
  submitText: 'Guardar evaluación',
  draftKey: 'rrhh-evaluacion',
  review: true,
  steps: [
    {
      title: 'Datos',
      columns: 2,
      fields: [
        { name: 'empleado', label: 'Empleado evaluado', required: true },
        { name: 'puesto', label: 'Puesto', required: true },
        { name: 'evaluador', label: 'Evaluador', required: true },
        {
          name: 'periodo',
          label: 'Periodo evaluado',
          type: 'select',
          required: true,
          options: ['Primer trimestre', 'Segundo trimestre', 'Tercer trimestre', 'Cuarto trimestre', 'Anual'],
        },
        { name: 'fecha', label: 'Fecha de la evaluación', type: 'date', calendar: true, required: true },
      ],
    },
    {
      title: 'Competencias',
      fields: [
        {
          name: 'competencias',
          label: 'Califica de 1 (necesita mejorar) a 5 (sobresaliente)',
          type: 'items',
          minRows: 1,
          addText: 'Agregar competencia',
          fields: [
            {
              name: 'competencia',
              label: 'Competencia',
              type: 'select',
              required: true,
              options: [
                'Calidad del trabajo',
                'Productividad',
                'Trabajo en equipo',
                'Comunicación',
                'Iniciativa',
                'Puntualidad y asistencia',
                'Liderazgo',
              ],
            },
            { name: 'calificacion', label: 'Calificación', type: 'segmented', required: true, options: ['1', '2', '3', '4', '5'] },
            { name: 'comentario', label: 'Comentario' },
          ],
        },
      ],
    },
    {
      title: 'Resultado y compromisos',
      fields: [
        { name: 'fortalezas', label: 'Fortalezas', type: 'textarea', required: true, maxLength: 600 },
        { name: 'mejoras', label: 'Áreas de mejora', type: 'textarea', required: true, maxLength: 600 },
        {
          name: 'resultado',
          label: 'Resultado general',
          type: 'radio',
          required: true,
          options: [
            { value: 'supera', label: 'Supera lo esperado' },
            { value: 'cumple', label: 'Cumple lo esperado' },
            { value: 'parcial', label: 'Cumple parcialmente' },
            { value: 'no', label: 'No cumple' },
          ],
        },
        {
          name: 'compromisos',
          label: 'Compromisos para el siguiente periodo',
          type: 'items',
          maxRows: 5,
          addText: 'Agregar compromiso',
          fields: [
            { name: 'accion', label: 'Acción', required: true },
            { name: 'fecha', label: 'Fecha límite', type: 'date' },
          ],
        },
        { name: 'firmaEmpleado', label: 'Firma del empleado (de enterado)', type: 'signature' },
      ],
    },
  ],
}

/** Registro de capacitación: curso, fechas, asistentes y constancia (DC-3 de la STPS cuando aplica). */
export const capacitacion: FormSchema = {
  title: 'Registro de capacitación',
  submitText: 'Registrar capacitación',
  draftKey: 'rrhh-capacitacion',
  columns: 2,
  fields: [
    { name: 'curso', label: 'Nombre del curso', required: true, span: 2 },
    {
      name: 'tema',
      label: 'Tema',
      type: 'select',
      required: true,
      options: ['Seguridad e higiene', 'Habilidades técnicas', 'Habilidades blandas', 'Normatividad', 'Inducción', 'Otro'],
    },
    { name: 'modalidad', label: 'Modalidad', type: 'segmented', options: ['Presencial', 'En línea', 'Mixta'], value: 'Presencial' },
    { name: 'instructor', label: 'Instructor o proveedor', required: true },
    { name: 'agente', label: 'Agente capacitador (registro STPS)', help: 'Solo si la constancia DC-3 la expide un agente externo.' },
    { name: 'fechas', label: 'Fechas', type: 'daterange', calendar: true, required: true, span: 2 },
    { name: 'horas', label: 'Duración en horas', type: 'number', min: 1, required: true },
    { name: 'costo', label: 'Costo total', type: 'money', min: 0 },
    {
      name: 'asistentes',
      label: 'Asistentes',
      type: 'items',
      minRows: 1,
      span: 2,
      addText: 'Agregar asistente',
      fields: [
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'puesto', label: 'Puesto' },
        { name: 'resultado', label: 'Resultado', type: 'select', options: ['Acreditó', 'No acreditó', 'Asistió'], value: 'Acreditó' },
      ],
    },
    { name: 'dc3', label: 'Se entregó constancia DC-3', type: 'switch', span: 2 },
    {
      name: 'evidencias',
      label: 'Evidencias (lista de asistencia, fotos, constancias)',
      type: 'file',
      multiple: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 8_000_000,
      span: 2,
    },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', span: 2, maxLength: 500 },
  ],
}

/** Cambio de puesto: ascenso, transferencia o cambio de sueldo, con aprobación. */
export const cambioPuesto: FormSchema = {
  title: 'Cambio de puesto',
  submitText: 'Enviar a aprobación',
  draftKey: 'rrhh-cambio-puesto',
  review: true,
  steps: [
    {
      title: 'Movimiento',
      fields: [
        { name: 'empleado', label: 'Empleado', required: true },
        {
          name: 'tipo',
          label: 'Tipo de movimiento',
          type: 'radio',
          required: true,
          options: [
            { value: 'ascenso', label: 'Ascenso' },
            { value: 'transferencia', label: 'Transferencia de área' },
            { value: 'sueldo', label: 'Solo cambio de sueldo' },
            { value: 'descenso', label: 'Cambio a un puesto de menor nivel' },
          ],
        },
        { name: 'fecha', label: 'Fecha efectiva', type: 'date', calendar: true, required: true },
        {
          name: 'aceptacion',
          label: 'El empleado aceptó el cambio por escrito',
          type: 'checkbox',
          visibleIf: { field: 'tipo', in: ['descenso', 'transferencia'] },
          required: true,
          help: 'Un cambio de condiciones de trabajo requiere su consentimiento.',
        },
      ],
    },
    {
      title: 'Antes y después',
      columns: 2,
      fields: [
        { name: 'puestoActual', label: 'Puesto actual', required: true },
        {
          name: 'puestoNuevo',
          label: 'Puesto nuevo',
          required: true,
          visibleIf: { field: 'tipo', in: ['ascenso', 'transferencia', 'descenso'] },
        },
        { name: 'areaActual', label: 'Área actual' },
        { name: 'areaNueva', label: 'Área nueva', visibleIf: { field: 'tipo', in: ['ascenso', 'transferencia', 'descenso'] } },
        { name: 'sueldoActual', label: 'Salario diario actual', type: 'money', min: 0, required: true },
        { name: 'sueldoNuevo', label: 'Salario diario nuevo', type: 'money', min: 0, required: true },
        { name: 'jefeNuevo', label: 'Jefe directo nuevo' },
      ],
    },
    {
      title: 'Justificación',
      fields: [
        { name: 'motivo', label: 'Motivo del cambio', type: 'textarea', required: true, maxLength: 600 },
        { name: 'solicita', label: 'Solicita', required: true },
        {
          name: 'documentos',
          label: 'Documentos de apoyo',
          type: 'file',
          multiple: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 8_000_000,
        },
        { name: 'firma', label: 'Firma de quien autoriza', type: 'signature' },
      ],
    },
  ],
}

/** Todas las plantillas por nombre. */
export const plantillas = { altaEmpleado, vacaciones, permiso, incapacidad, baja, gastos, evaluacion, capacitacion, cambioPuesto } as const
export type PlantillaRRHH = keyof typeof plantillas

/** Copia de la plantilla sin las funciones por nombre (`validate`, `lookupPostalCode`…), para abrirla sin resolvers. */
export function sinResolvers(schema: FormSchema): FormSchema {
  const POR_NOMBRE = ['validate', 'lookupPostalCode', 'search', 'upload', 'totals'] as const
  const quitar = <T extends object>(o: T, claves: readonly string[]): T =>
    Object.fromEntries(Object.entries(o).filter(([k]) => !claves.includes(k))) as T
  const limpiar = (c: JSONField): JSONField => ({ ...quitar(c, POR_NOMBRE), ...(c.fields ? { fields: c.fields.map(limpiar) } : {}) })
  return {
    ...quitar(schema, ['validate']),
    ...(schema.fields ? { fields: schema.fields.map(limpiar) } : {}),
    ...(schema.steps ? { steps: schema.steps.map((p) => ({ ...quitar(p, ['validate']), fields: p.fields.map(limpiar) })) } : {}),
  }
}

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

/** Todas las plantillas por nombre. */
export const plantillas = { altaEmpleado, vacaciones, permiso, incapacidad, baja, gastos } as const
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

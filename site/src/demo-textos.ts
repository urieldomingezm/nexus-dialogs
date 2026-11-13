// Textos de la maqueta de la portada y de los botones de «Pruébalo aquí mismo», en el idioma de la página.
// El español es la referencia: lo que no esté en otro idioma sale en español. Los nombres de personas son de muestra y no se traducen.
import { idioma } from './textos'

const es = {
  what: 'a Laura Méndez',
  eliminada: 'Laura Méndez eliminada',
  borrarTitulo: '¿Eliminar a Laura Méndez?',
  borrarTexto: 'Se eliminará su registro. Esta acción no se puede deshacer.',
  cancelar: 'Cancelar',
  eliminar: 'Eliminar',
  gastoTitulo: 'Nuevo gasto',
  rfcEt: 'RFC del proveedor',
  importeEt: 'Importe',
  conceptoEt: 'Concepto',
  guardar: 'Guardar',
  aprobarTitulo: 'Solicitud de vacaciones',
  aprobarTexto: 'Laura Méndez pide 5 días hábiles, del 18 al 22 de diciembre.',
  motivoEt: 'Motivo (obligatorio al rechazar)',
  rechazar: 'Rechazar',
  aprobar: 'Aprobar',
  vacTitulo: 'Solicitar vacaciones',
  fechasEt: 'Fechas',
  desde: 'Desde',
  hasta: 'Hasta',
  vacAyuda: 'Elige las fechas: se cuentan solo días hábiles (máximo 12).',
  enviar: 'Enviar',
  asisTitulo: 'Alta de empleado',
  paso: (p: number) => `Paso ${p} de 3`,
  nombreCompleto: 'Nombre completo',
  siguiente: 'Siguiente',
  atras: 'Atrás',
  areaEt: 'Área',
  puestos: ['Ventas', 'Contabilidad', 'Operaciones'],
  revisa: 'Revisa antes de terminar:',
  nombre: 'Nombre',
  darAlta: 'Dar de alta',
  impTitulo: 'Importar empleados',
  vistaPrevia: 'Vista previa del archivo',
  lista: 'Lista',
  rfcMal: 'RFC no válido',
  filasListas: (ok: number) => `${ok} filas listas y 1 con error (se omitirá).`,
  elegirArchivo: 'Elegir empleados.csv',
  importar: 'Importar',
  importarN: (ok: number) => `Importar ${ok}`,
  descTitulo: '¿Salir sin guardar?',
  descTexto: 'Cambiaste el salario diario de $ 980.00 a $ 1,150.00. Si sales, se pierde.',
  descartar: 'Descartar',
  seguirEd: 'Seguir editando',
  rfcInvalido: 'El RFC no es válido (13 caracteres, como XAXX010101000).',
  rfcObligatorio: 'El RFC es obligatorio.',
  importeMayor: 'Escribe un importe mayor a cero.',
  importeObligatorio: 'El importe es obligatorio.',
  motivoRechazo: 'Cuéntale el motivo para poder rechazar.',
  primerDia: 'Elige el primer día.',
  ultimoDia: 'Elige el último día.',
  antesDelPrimero: 'No puede ser antes del primer día.',
  maximo: 'Máximo 12 días hábiles.',
  nombreObligatorio: 'El nombre es obligatorio.',
  primeroArchivo: 'Primero elige un archivo.',
  cancelado: 'Cancelado, no se guardó nada',
  enviadoAprob: 'Enviado a aprobación',
  aprobada: 'Solicitud aprobada',
  rechazada: 'Solicitud rechazada',
  vacEnviada: 'Solicitud de vacaciones enviada',
  altaOk: 'Empleado dado de alta',
  importados: 'Se importaron 3 empleados',
  descartados: 'Cambios descartados',
  sigues: 'Sigues editando',
  deshecho: 'Cambio deshecho',
  deshacer: 'Deshacer',
  motivoEj: 'Cubre su equipo',
  guardado: 'Empleado guardado',
  solicitudEnviada: 'Solicitud enviada',
  dias: (n: number) => `${n} ${n === 1 ? 'día hábil' : 'días hábiles'}${n > 12 ? ' (máximo 12)' : ''}`,
  oscuro: 'Oscuro',
  estado: (n: string) => `Los diálogos de esta página salen ahora con la apariencia ${n}.`,
  // «Ver código»: lo que se escribe de verdad para cada escena (los textos van en el idioma de la página).
  codBorrar: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'a Laura Méndez' })) {
  // eliminar
}`,
  codFormulario: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Nuevo gasto',
  fields: [
    { name: 'rfc', label: 'RFC del proveedor', type: 'rfc', required: true },
    { name: 'importe', label: 'Importe', type: 'money', required: true, min: 1 },
  ],
})
if (r.confirmed) guardar(r.values)`,
  codAprobar: `import { approval } from 'nexus-dialogs/patterns'

const r = await approval({
  title: 'Vacaciones de Laura Méndez',
  details: [{ label: 'Días hábiles', value: '5' }],
  reasons: ['Cubre otro turno', 'Sin saldo'],
})`,
  codVacaciones: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Solicitar vacaciones',
  fields: [
    { name: 'dias', label: 'Fechas', type: 'daterange',
      calendar: true, businessDays: true, maxDays: 12, required: true },
  ],
})`,
  codAsistente: `import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'Alta de empleado',
  review: true,
  steps: [
    { title: 'Datos', fields: [{ name: 'nombre', label: 'Nombre completo', required: true }] },
    { title: 'Área', fields: [{ name: 'area', label: 'Área', type: 'select', options: ['Ventas', 'Contabilidad'] }] },
  ],
})`,
  codImportar: `import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importar empleados',
  columns: [
    { name: 'nombre', label: 'Nombre completo', required: true },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
  ],
  onImport: (filas) => api.importar(filas),
})`,
  codDescartar: `import { unsavedChanges } from 'nexus-dialogs/patterns'

const r = await unsavedChanges({
  changes: [{ label: 'Salario diario', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => guardar(),
})`,
}

type Textos = typeof es

const en: Textos = {
  what: 'Laura Méndez',
  eliminada: 'Laura Méndez deleted',
  borrarTitulo: 'Delete Laura Méndez?',
  borrarTexto: 'Their record will be deleted. This action cannot be undone.',
  cancelar: 'Cancel',
  eliminar: 'Delete',
  gastoTitulo: 'New expense',
  rfcEt: 'Supplier RFC',
  importeEt: 'Amount',
  conceptoEt: 'Description',
  guardar: 'Save',
  aprobarTitulo: 'Vacation request',
  aprobarTexto: 'Laura Méndez asks for 5 business days, from December 18 to 22.',
  motivoEt: 'Reason (required when rejecting)',
  rechazar: 'Reject',
  aprobar: 'Approve',
  vacTitulo: 'Request vacation',
  fechasEt: 'Dates',
  desde: 'From',
  hasta: 'To',
  vacAyuda: 'Choose the dates: only business days are counted (maximum 12).',
  enviar: 'Send',
  asisTitulo: 'New employee',
  paso: (p) => `Step ${p} of 3`,
  nombreCompleto: 'Full name',
  siguiente: 'Next',
  atras: 'Back',
  areaEt: 'Area',
  puestos: ['Sales', 'Accounting', 'Operations'],
  revisa: 'Review before finishing:',
  nombre: 'Name',
  darAlta: 'Hire',
  impTitulo: 'Import employees',
  vistaPrevia: 'File preview',
  lista: 'Ready',
  rfcMal: 'Invalid RFC',
  filasListas: (ok) => `${ok} rows ready and 1 with an error (it will be skipped).`,
  elegirArchivo: 'Choose employees.csv',
  importar: 'Import',
  importarN: (ok) => `Import ${ok}`,
  descTitulo: 'Leave without saving?',
  descTexto: 'You changed the daily salary from $ 980.00 to $ 1,150.00. If you leave, it is lost.',
  descartar: 'Discard',
  seguirEd: 'Keep editing',
  rfcInvalido: 'The RFC is not valid (13 characters, like XAXX010101000).',
  rfcObligatorio: 'The RFC is required.',
  importeMayor: 'Enter an amount greater than zero.',
  importeObligatorio: 'The amount is required.',
  motivoRechazo: 'Give the reason so you can reject.',
  primerDia: 'Choose the first day.',
  ultimoDia: 'Choose the last day.',
  antesDelPrimero: 'It cannot be before the first day.',
  maximo: 'Maximum 12 business days.',
  nombreObligatorio: 'The name is required.',
  primeroArchivo: 'Choose a file first.',
  cancelado: 'Cancelled, nothing was saved',
  enviadoAprob: 'Sent for approval',
  aprobada: 'Request approved',
  rechazada: 'Request rejected',
  vacEnviada: 'Vacation request sent',
  altaOk: 'Employee hired',
  importados: '3 employees imported',
  descartados: 'Changes discarded',
  sigues: 'You keep editing',
  deshecho: 'Change undone',
  deshacer: 'Undo',
  motivoEj: 'Covers their team',
  guardado: 'Employee saved',
  solicitudEnviada: 'Request sent',
  dias: (n) => `${n} business ${n === 1 ? 'day' : 'days'}${n > 12 ? ' (maximum 12)' : ''}`,
  oscuro: 'Dark',
  estado: (n) => `The dialogs on this page now use the ${n} appearance.`,
  codBorrar: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'Laura Méndez' })) {
  // delete
}`,
  codFormulario: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'New expense',
  fields: [
    { name: 'rfc', label: 'Supplier RFC', type: 'rfc', required: true },
    { name: 'amount', label: 'Amount', type: 'money', required: true, min: 1 },
  ],
})
if (r.confirmed) save(r.values)`,
  codAprobar: `import { approval } from 'nexus-dialogs/patterns'

const r = await approval({
  title: 'Vacation of Laura Méndez',
  details: [{ label: 'Business days', value: '5' }],
  reasons: ['Covers another shift', 'No balance'],
})`,
  codVacaciones: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Request vacation',
  fields: [
    { name: 'days', label: 'Dates', type: 'daterange',
      calendar: true, businessDays: true, maxDays: 12, required: true },
  ],
})`,
  codAsistente: `import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'New employee',
  review: true,
  steps: [
    { title: 'Details', fields: [{ name: 'name', label: 'Full name', required: true }] },
    { title: 'Area', fields: [{ name: 'area', label: 'Area', type: 'select', options: ['Sales', 'Accounting'] }] },
  ],
})`,
  codImportar: `import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Import employees',
  columns: [
    { name: 'name', label: 'Full name', required: true },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
  ],
  onImport: (rows) => api.importEmployees(rows),
})`,
  codDescartar: `import { unsavedChanges } from 'nexus-dialogs/patterns'

const r = await unsavedChanges({
  changes: [{ label: 'Daily salary', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => save(),
})`,
}

const pt: Textos = {
  what: 'Laura Méndez',
  eliminada: 'Laura Méndez excluída',
  borrarTitulo: 'Excluir Laura Méndez?',
  borrarTexto: 'O registro será excluído. Esta ação não pode ser desfeita.',
  cancelar: 'Cancelar',
  eliminar: 'Excluir',
  gastoTitulo: 'Nova despesa',
  rfcEt: 'RFC do fornecedor',
  importeEt: 'Valor',
  conceptoEt: 'Descrição',
  guardar: 'Salvar',
  aprobarTitulo: 'Pedido de férias',
  aprobarTexto: 'Laura Méndez pede 5 dias úteis, de 18 a 22 de dezembro.',
  motivoEt: 'Motivo (obrigatório ao rejeitar)',
  rechazar: 'Rejeitar',
  aprobar: 'Aprovar',
  vacTitulo: 'Solicitar férias',
  fechasEt: 'Datas',
  desde: 'De',
  hasta: 'Até',
  vacAyuda: 'Escolha as datas: contam só dias úteis (máximo 12).',
  enviar: 'Enviar',
  asisTitulo: 'Admissão de funcionário',
  paso: (p) => `Passo ${p} de 3`,
  nombreCompleto: 'Nome completo',
  siguiente: 'Próximo',
  atras: 'Voltar',
  areaEt: 'Área',
  puestos: ['Vendas', 'Contabilidade', 'Operações'],
  revisa: 'Revise antes de concluir:',
  nombre: 'Nome',
  darAlta: 'Admitir',
  impTitulo: 'Importar funcionários',
  vistaPrevia: 'Prévia do arquivo',
  lista: 'Pronta',
  rfcMal: 'RFC inválido',
  filasListas: (ok) => `${ok} linhas prontas e 1 com erro (será ignorada).`,
  elegirArchivo: 'Escolher funcionarios.csv',
  importar: 'Importar',
  importarN: (ok) => `Importar ${ok}`,
  descTitulo: 'Sair sem salvar?',
  descTexto: 'Você mudou o salário diário de $ 980.00 para $ 1,150.00. Se sair, perde a alteração.',
  descartar: 'Descartar',
  seguirEd: 'Continuar editando',
  rfcInvalido: 'O RFC não é válido (13 caracteres, como XAXX010101000).',
  rfcObligatorio: 'O RFC é obrigatório.',
  importeMayor: 'Digite um valor maior que zero.',
  importeObligatorio: 'O valor é obrigatório.',
  motivoRechazo: 'Informe o motivo para poder rejeitar.',
  primerDia: 'Escolha o primeiro dia.',
  ultimoDia: 'Escolha o último dia.',
  antesDelPrimero: 'Não pode ser antes do primeiro dia.',
  maximo: 'Máximo de 12 dias úteis.',
  nombreObligatorio: 'O nome é obrigatório.',
  primeroArchivo: 'Primeiro escolha um arquivo.',
  cancelado: 'Cancelado, nada foi salvo',
  enviadoAprob: 'Enviado para aprovação',
  aprobada: 'Pedido aprovado',
  rechazada: 'Pedido rejeitado',
  vacEnviada: 'Pedido de férias enviado',
  altaOk: 'Funcionário admitido',
  importados: '3 funcionários importados',
  descartados: 'Alterações descartadas',
  sigues: 'Você continua editando',
  deshecho: 'Alteração desfeita',
  deshacer: 'Desfazer',
  motivoEj: 'Cobre a equipe dele',
  guardado: 'Funcionário salvo',
  solicitudEnviada: 'Pedido enviado',
  dias: (n) => `${n} ${n === 1 ? 'dia útil' : 'dias úteis'}${n > 12 ? ' (máximo 12)' : ''}`,
  oscuro: 'Escuro',
  estado: (n) => `Os diálogos desta página agora usam a aparência ${n}.`,
  codBorrar: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'Laura Méndez' })) {
  // excluir
}`,
  codFormulario: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Nova despesa',
  fields: [
    { name: 'rfc', label: 'RFC do fornecedor', type: 'rfc', required: true },
    { name: 'valor', label: 'Valor', type: 'money', required: true, min: 1 },
  ],
})
if (r.confirmed) salvar(r.values)`,
  codAprobar: `import { approval } from 'nexus-dialogs/patterns'

const r = await approval({
  title: 'Férias de Laura Méndez',
  details: [{ label: 'Dias úteis', value: '5' }],
  reasons: ['Cobre outro turno', 'Sem saldo'],
})`,
  codVacaciones: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Solicitar férias',
  fields: [
    { name: 'dias', label: 'Datas', type: 'daterange',
      calendar: true, businessDays: true, maxDays: 12, required: true },
  ],
})`,
  codAsistente: `import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'Admissão de funcionário',
  review: true,
  steps: [
    { title: 'Dados', fields: [{ name: 'nome', label: 'Nome completo', required: true }] },
    { title: 'Área', fields: [{ name: 'area', label: 'Área', type: 'select', options: ['Vendas', 'Contabilidade'] }] },
  ],
})`,
  codImportar: `import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importar funcionários',
  columns: [
    { name: 'nome', label: 'Nome completo', required: true },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
  ],
  onImport: (linhas) => api.importar(linhas),
})`,
  codDescartar: `import { unsavedChanges } from 'nexus-dialogs/patterns'

const r = await unsavedChanges({
  changes: [{ label: 'Salário diário', from: '$ 980.00', to: '$ 1,150.00' }],
  onSave: () => salvar(),
})`,
}

const fr: Textos = {
  what: 'Laura Méndez',
  eliminada: 'Laura Méndez supprimée',
  borrarTitulo: 'Supprimer Laura Méndez ?',
  borrarTexto: 'Son dossier sera supprimé. Cette action est irréversible.',
  cancelar: 'Annuler',
  eliminar: 'Supprimer',
  gastoTitulo: 'Nouvelle dépense',
  rfcEt: 'RFC du fournisseur',
  importeEt: 'Montant',
  conceptoEt: 'Libellé',
  guardar: 'Enregistrer',
  aprobarTitulo: 'Demande de congés',
  aprobarTexto: 'Laura Méndez demande 5 jours ouvrés, du 18 au 22 décembre.',
  motivoEt: 'Motif (obligatoire en cas de refus)',
  rechazar: 'Refuser',
  aprobar: 'Approuver',
  vacTitulo: 'Demander des congés',
  fechasEt: 'Dates',
  desde: 'Du',
  hasta: 'Au',
  vacAyuda: 'Choisissez les dates : seuls les jours ouvrés comptent (maximum 12).',
  enviar: 'Envoyer',
  asisTitulo: 'Embauche d’un employé',
  paso: (p) => `Étape ${p} sur 3`,
  nombreCompleto: 'Nom complet',
  siguiente: 'Suivant',
  atras: 'Retour',
  areaEt: 'Service',
  puestos: ['Ventes', 'Comptabilité', 'Opérations'],
  revisa: 'Vérifiez avant de terminer :',
  nombre: 'Nom',
  darAlta: 'Embaucher',
  impTitulo: 'Importer des employés',
  vistaPrevia: 'Aperçu du fichier',
  lista: 'Prête',
  rfcMal: 'RFC invalide',
  filasListas: (ok) => `${ok} lignes prêtes et 1 avec une erreur (elle sera ignorée).`,
  elegirArchivo: 'Choisir employes.csv',
  importar: 'Importer',
  importarN: (ok) => `Importer ${ok}`,
  descTitulo: 'Quitter sans enregistrer ?',
  descTexto: 'Vous avez changé le salaire journalier de 980,00 $ à 1 150,00 $. Si vous quittez, la modification est perdue.',
  descartar: 'Abandonner',
  seguirEd: 'Continuer à modifier',
  rfcInvalido: 'Le RFC n’est pas valide (13 caractères, comme XAXX010101000).',
  rfcObligatorio: 'Le RFC est obligatoire.',
  importeMayor: 'Saisissez un montant supérieur à zéro.',
  importeObligatorio: 'Le montant est obligatoire.',
  motivoRechazo: 'Indiquez le motif pour pouvoir refuser.',
  primerDia: 'Choisissez le premier jour.',
  ultimoDia: 'Choisissez le dernier jour.',
  antesDelPrimero: 'Ne peut pas précéder le premier jour.',
  maximo: 'Maximum 12 jours ouvrés.',
  nombreObligatorio: 'Le nom est obligatoire.',
  primeroArchivo: 'Choisissez d’abord un fichier.',
  cancelado: 'Annulé, rien n’a été enregistré',
  enviadoAprob: 'Envoyé pour approbation',
  aprobada: 'Demande approuvée',
  rechazada: 'Demande refusée',
  vacEnviada: 'Demande de congés envoyée',
  altaOk: 'Employé embauché',
  importados: '3 employés importés',
  descartados: 'Modifications abandonnées',
  sigues: 'Vous continuez à modifier',
  deshecho: 'Modification annulée',
  deshacer: 'Annuler',
  motivoEj: 'Couvre son équipe',
  guardado: 'Employé enregistré',
  solicitudEnviada: 'Demande envoyée',
  dias: (n) => `${n} ${n === 1 ? 'jour ouvré' : 'jours ouvrés'}${n > 12 ? ' (maximum 12)' : ''}`,
  oscuro: 'Sombre',
  estado: (n) => `Les dialogues de cette page utilisent maintenant l’apparence ${n}.`,
  codBorrar: `import { confirmDelete } from 'nexus-dialogs/patterns'

if (await confirmDelete({ what: 'Laura Méndez' })) {
  // supprimer
}`,
  codFormulario: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Nouvelle dépense',
  fields: [
    { name: 'rfc', label: 'RFC du fournisseur', type: 'rfc', required: true },
    { name: 'montant', label: 'Montant', type: 'money', required: true, min: 1 },
  ],
})
if (r.confirmed) enregistrer(r.values)`,
  codAprobar: `import { approval } from 'nexus-dialogs/patterns'

const r = await approval({
  title: 'Congés de Laura Méndez',
  details: [{ label: 'Jours ouvrés', value: '5' }],
  reasons: ['Couvre un autre service', 'Solde insuffisant'],
})`,
  codVacaciones: `import { form } from 'nexus-dialogs/forms'

const r = await form({
  title: 'Demander des congés',
  fields: [
    { name: 'jours', label: 'Dates', type: 'daterange',
      calendar: true, businessDays: true, maxDays: 12, required: true },
  ],
})`,
  codAsistente: `import { wizard } from 'nexus-dialogs/forms'

const r = await wizard({
  title: 'Embauche d’un employé',
  review: true,
  steps: [
    { title: 'Données', fields: [{ name: 'nom', label: 'Nom complet', required: true }] },
    { title: 'Service', fields: [{ name: 'service', label: 'Service', type: 'select', options: ['Ventes', 'Comptabilité'] }] },
  ],
})`,
  codImportar: `import { importData } from 'nexus-dialogs/import'

const r = await importData({
  title: 'Importer des employés',
  columns: [
    { name: 'nom', label: 'Nom complet', required: true },
    { name: 'rfc', label: 'RFC', type: 'rfc', unique: true },
  ],
  onImport: (lignes) => api.importer(lignes),
})`,
  codDescartar: `import { unsavedChanges } from 'nexus-dialogs/patterns'

const r = await unsavedChanges({
  changes: [{ label: 'Salaire journalier', from: '980,00 $', to: '1 150,00 $' }],
  onSave: () => enregistrer(),
})`,
}

export const d: Textos = { es, en, pt, fr }[idioma]

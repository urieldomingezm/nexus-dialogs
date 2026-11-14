# API pública de nexus-dialogs

> Generado por `npm run api` a partir de `dist/*.d.ts`. No lo edites a mano.
> Si tu PR cambia este archivo, cambia la API: revisa que sea intencional y anótalo en el CHANGELOG.

## `nexus-dialogs`

```ts
function alert(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>>;

type ButtonRole = 'confirm' | 'cancel' | 'deny' | 'custom';

interface ButtonSpec {
    id: string;
    text: string;
    role?: ButtonRole;
    variant?: ButtonVariant;
    onClick?: (ctx: DialogContext) => unknown;
    value?: unknown;
    disabled?: boolean;
    hidden?: boolean;
}

type ButtonVariant = 'primary' | 'cancel' | 'danger' | 'secondary';

function closeDialog(el: HTMLDialogElement, value?: unknown): boolean;

type CloseReason = 'confirm' | 'cancel' | 'deny' | 'escape' | 'backdrop' | 'close' | 'timer' | 'program' | (string & {});

function configure(c: GlobalConfig): void;

function confirm(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>>;

const dialog: {
    alert: typeof alert;
    confirm: typeof confirm;
    prompt: typeof prompt;
    open: <T = unknown>(opciones: DialogOptions<T> & {
        render?: (ctx: DialogContext) => Node | null | void;
    }) => Promise<DialogResult<T>>;
    success: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    error: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    warning: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    info: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    close: (value?: unknown) => void;
    closeAll: () => void;
    isOpen: () => boolean;
};

interface DialogContext {
    readonly dialog: HTMLDialogElement;
    readonly root: ShadowRoot;
    readonly body: HTMLElement;
    close(reason?: CloseReason, value?: unknown, confirmed?: boolean): void;
    setLoading(loading: boolean, text?: string): void;
    setError(message: string | null): void;
    setTitle(title: string): void;
    setButtons(buttons: ButtonSpec[]): void;
    button(id: string): HTMLButtonElement | null;
    readonly timer?: TimerControl;
}

type DialogInput<T> = DialogOptions<T> | string;

interface DialogOptions<T = unknown> {
    title?: string;
    text?: string;
    html?: string | Node;
    icon?: IconName;
    placement?: Placement;
    size?: Size;
    buttons?: ButtonSpec[];
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    showCancel?: boolean;
    requireText?: string;
    timer?: number;
    timerProgress?: boolean;
    dismissible?: boolean | Dismissible;
    preConfirm?: (value: T | undefined, ctx: DialogContext) => unknown;
    beforeClose?: (reason: CloseReason, ctx: DialogContext) => boolean | Promise<boolean>;
    initialFocus?: 'confirm' | 'cancel' | 'first-field' | (string & {});
    footnote?: string;
    className?: string;
    styles?: string;
    theme?: Record<string, string>;
    scheme?: Scheme;
    dir?: 'ltr' | 'rtl';
    onOpen?: (ctx: DialogContext) => void;
    onClose?: (result: DialogResult<T>) => void;
}

interface DialogResult<T = unknown> {
    confirmed: boolean;
    denied: boolean;
    value: T | undefined;
    reason: CloseReason;
}

interface Dismissible {
    escape?: boolean;
    backdrop?: boolean;
    closeButton?: boolean;
}

const en: Labels;

interface EngineOptions<T> extends DialogOptions<T> {
    role?: 'dialog' | 'alertdialog';
    render?: (ctx: DialogContext) => Node | null | void;
    collect?: (ctx: DialogContext) => T | typeof INVALID | Promise<T | typeof INVALID>;
    onAction?: (button: ButtonSpec, ctx: DialogContext) => boolean | Promise<boolean>;
    moduleCss?: string;
    target?: Element;
    allowEnter?: boolean;
    onLoading?: (loading: boolean, ctx: DialogContext) => void;
    onClosing?: (ctx: DialogContext) => void;
}

const es: Labels;

interface GlobalConfig {
    lang?: string;
    labels?: Partial<Labels>;
    theme?: Record<string, string>;
    scheme?: Scheme;
    dir?: 'ltr' | 'rtl' | 'auto';
    defaults?: Partial<DialogOptions<any>>;
    sheetOnMobile?: boolean;
    sanitize?: ((html: string) => string | {
        toString(): string;
    }) | null;
    strictHtml?: boolean;
    nonce?: string;
}

type IconName = 'success' | 'error' | 'warning' | 'info' | 'question' | 'delete' | 'clock';

const INVALID: unique symbol;

const labels: () => Labels;

interface Labels {
    ok: string;
    confirm: string;
    cancel: string;
    close: string;
    loading: string;
    required: string;
    typeToConfirm: string;
    typeToConfirmHelp: string;
    invalidEmail: string;
    invalidUrl: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    pattern: string;
    invalidRfc: string;
    invalidCurp: string;
    invalidNss: string;
    invalidClabe: string;
    invalidPostal: string;
    errorSummary: string;
    next: string;
    back: string;
    submit: string;
    review: string;
    edit: string;
    step: string;
    discardTitle: string;
    discardText: string;
    discard: string;
    keepEditing: string;
    select: string;
    yes: string;
    no: string;
    notifications: string;
    dismiss: string;
    success: string;
    error: string;
    warning: string;
    info: string;
}

const labelsFor: (code: string) => Labels;

const language: () => string;

const open: <T = unknown>(opciones: DialogOptions<T> & {
    render?: (ctx: DialogContext) => Node | null | void;
}) => Promise<DialogResult<T>>;

function openDialog<T = unknown>(opciones: EngineOptions<T>): Promise<DialogResult<T>>;

const pageLanguage: () => string;

type Placement = 'center' | 'right' | 'left' | 'bottom';

interface Plugin {
    name: string;
    install?(api: PluginApi): void;
    beforeOpen?(opciones: EngineOptions<any>): EngineOptions<any> | void;
    afterOpen?(ctx: DialogContext, opciones: EngineOptions<any>): void;
    afterClose?(resultado: DialogResult<any>, opciones: EngineOptions<any>): void;
}

interface PluginApi {
    configure: typeof configure;
    labels: typeof labels;
}

const plugins: () => string[];

function prompt(opciones: PromptOptions): Promise<DialogResult<string>>;

interface PromptOptions extends DialogOptions<string> {
    label?: string;
    input?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
    value?: string;
    placeholder?: string;
    help?: string;
    options?: (string | {
        value: string;
        label: string;
    })[];
    required?: boolean;
    maxLength?: number;
    autocomplete?: string;
    inputmode?: string;
    validate?: (value: string) => string | void | null | undefined | Promise<string | void | null | undefined>;
}

function registerLanguage(code: string, textos: Partial<Labels>): void;

type Scheme = 'light' | 'dark' | 'auto';

const setHtml: (el: Element, html: string) => void;

type Size = 'sm' | 'md' | 'lg' | 'xl' | number;

interface TimerControl {
    left(): number;
    running(): boolean;
    stop(): number;
    resume(): number;
    increase(ms: number): number;
}

function unuse(name: string): boolean;

function use(plugin: Plugin): boolean;

const version: string;
```

## `nexus-dialogs/forms`

```ts
interface Address {
    postalCode: string;
    state: string;
    municipality: string;
    neighborhood: string;
    street: string;
}

type Condition = {
    field: string;
    equals?: unknown;
    notEquals?: unknown;
    in?: unknown[];
    filled?: boolean;
} | {
    all: Condition[];
} | {
    any: Condition[];
} | {
    not: Condition;
};

interface CustomControl {
    el: HTMLElement;
    value(): unknown;
    focus(): void;
    invalid(on: boolean): void;
    validate?(): string | null | undefined | Promise<string | null | undefined>;
    summary?(): string;
    group?: boolean;
    lazy?: boolean;
}

interface DatePreset {
    label: string;
    range: () => [
        Date,
        Date
    ];
}

const DEFAULT_COUNTRIES: PhoneCountry[];

function defaultDatePresets(): DatePreset[];

interface Field {
    name: string;
    label: string;
    type?: FieldType;
    value?: unknown;
    placeholder?: string;
    help?: string;
    required?: boolean;
    options?: Option[];
    min?: number | string;
    max?: number | string;
    step?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp | string;
    patternMessage?: string;
    validate?: (value: any, values: Record<string, unknown>) => Msg | Promise<Msg>;
    autocomplete?: string;
    inputmode?: string;
    span?: 1 | 2;
    visibleIf?: Condition;
    countries?: PhoneCountry[];
    dialCode?: string;
    lookupPostalCode?: (postalCode: string) => Promise<PostalLookup | null> | PostalLookup | null;
    visible?: (values: Record<string, unknown>) => boolean;
    disabled?: boolean;
    currency?: string;
    locale?: string;
    multiple?: boolean;
    search?: (query: string) => Promise<Option[]> | Option[];
    creatable?: boolean | ((text: string) => Option | Promise<Option>);
    maxItems?: number;
    avatars?: boolean;
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    upload?: (file: File, progress: (percent: number) => void) => Promise<unknown>;
    presets?: false | DatePreset[];
    maxDays?: number;
    calendar?: boolean;
    businessDays?: boolean | 'custom';
    holidays?: string[];
    length?: number;
    autoSubmit?: boolean;
    fields?: Field[];
    minRows?: number;
    maxRows?: number;
    addText?: string;
    totals?: (rows: Record<string, any>[]) => {
        label: string;
        value: string;
    }[];
}

interface FieldContext {
    id: string;
    describedBy: string;
    field: Field;
    required: boolean;
    nested: (fields: Field[], values: Record<string, unknown>, onChange: () => void) => NestedFieldSet;
}

type FieldFactory = (ctx: FieldContext, valor: unknown) => CustomControl;

function fieldsFromJSON(campos: JSONField[], resolvers?: Record<string, (...args: any[]) => any>): Field[];

type FieldType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'radio' | 'segmented' | 'checkbox' | 'switch' | 'money' | 'rfc' | 'curp' | 'nss' | 'clabe' | 'postal' | 'combobox' | 'file' | 'daterange' | 'otp' | 'items' | 'phone' | 'address' | 'signature' | (string & {});

function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>>;

function formatPhone(digitos: string, dial?: string): string;

type FormColumns = 1 | 2 | 'auto';

function formFromJSON<T extends Record<string, unknown> = Record<string, unknown>>(schema: FormSchema | string, opts?: FromJSONOptions<T>): Promise<DialogResult<T>>;

interface FormOptions<T> extends ConBorrador, Omit<DialogOptions<T>, 'requireText'> {
    fields: Field[];
    values?: Partial<T>;
    columns?: FormColumns;
    validate?: (values: T) => Record<string, string> | void | Promise<Record<string, string> | void>;
    submitText?: string;
    confirmDiscard?: boolean;
}

interface FormSchema {
    title: string;
    text?: string;
    columns?: FormColumns;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    submitText?: string;
    cancelText?: string;
    draftKey?: string;
    fields?: JSONField[];
    steps?: JSONStep[];
    review?: boolean | string;
    validate?: string;
}

interface FromJSONOptions<T> {
    resolvers?: Record<string, (...args: any[]) => any>;
    values?: Partial<T>;
    options?: Partial<FormOptions<T> & WizardOptions<T>>;
}

interface JSONField extends Omit<Field, Funciones> {
    pattern?: string;
    validate?: string;
    search?: string;
    creatable?: boolean | string;
    upload?: string;
    totals?: string;
    lookupPostalCode?: string;
    presets?: false;
    fields?: JSONField[];
}

interface JSONStep extends Omit<WizardStep, 'fields' | 'validate' | 'when'> {
    fields: JSONField[];
    when?: Condition;
    validate?: string;
}

function matches(c: Condition, v: Record<string, unknown>): boolean;

type Option = string | {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
    group?: string;
    avatar?: string;
};

interface PhoneCountry {
    dial: string;
    label: string;
    digits?: number;
}

interface PostalLookup {
    state: string;
    municipality: string;
    neighborhoods: string[];
    city?: string;
}

function registerField(tipo: string, fabrica: Fabrica): () => void;

function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>>;

interface WizardOptions<T> extends ConBorrador, Omit<DialogOptions<T>, 'requireText'> {
    steps: WizardStep[];
    values?: Partial<T>;
    review?: boolean | string;
    submitText?: string;
    nextText?: string;
    backText?: string;
    confirmDiscard?: boolean;
    onStepChange?: (index: number, values: Partial<T>) => void;
}

interface WizardStep {
    title: string;
    description?: string;
    fields: Field[];
    columns?: FormColumns;
    validate?: (values: Record<string, unknown>) => Record<string, string> | void | Promise<Record<string, string> | void>;
    when?: ((values: Record<string, unknown>) => boolean) | Condition;
}
```

## `nexus-dialogs/toast`

```ts
function configureToast(c: ToastConfig): void;

function dismiss(id?: string): void;

interface PromiseMessages<T> {
    loading: string;
    success: string | ((value: T) => string);
    error: string | ((error: any) => string);
}

function toast(message: string | ToastOptions, opciones?: ToastOptions): string;
namespace toast {
    var success: Atajo;
    var error: Atajo;
    var warning: Atajo;
    var info: Atajo;
    var loading: Atajo;
    var promise: <T>(p: Promise<T>, m: PromiseMessages<T>, opciones?: ToastOptions) => Promise<T>;
    var update: typeof import("./toast.js").update;
    var dismiss: typeof import("./toast.js").dismiss;
    var configure: typeof configureToast;
}

interface ToastAction {
    label: string;
    onClick: (id: string) => void;
}

interface ToastConfig {
    position?: ToastPosition;
    max?: number;
    duration?: number;
    lang?: string;
    scheme?: Scheme;
    dir?: 'ltr' | 'rtl' | 'auto';
    theme?: Record<string, string>;
}

interface ToastOptions {
    id?: string;
    title?: string;
    message?: string;
    type?: ToastType;
    duration?: number;
    action?: ToastAction;
    closable?: boolean;
    onClose?: (id: string) => void;
}

type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';

function update(id: string, cambios: ToastOptions): void;
```

## `nexus-dialogs/themes`

```ts
function applyTheme(theme: Theme, el?: HTMLElement): void;

function followPageScheme(aplicar: (modo: {
    scheme: PageScheme;
    theme: Theme;
}) => void, opciones?: FollowPageSchemeOptions): () => void;

interface FollowPageSchemeOptions {
    strategy?: 'class' | 'media';
    darkClass?: string;
    light?: Theme;
    dark?: Theme;
}

function fromBootstrap(el?: Element): Theme;

type PageScheme = 'light' | 'dark';

type Theme = Record<string, string>;

const themes: {
    light: Theme;
    dark: Theme;
    bootstrap: Theme;
    tailwind: Theme;
    tailwindDark: Theme;
    material: Theme;
};
```

## `nexus-dialogs/patterns`

```ts
function approval(o: ApprovalOptions): Promise<ApprovalResult>;

interface ApprovalOptions {
    title: string;
    subtitle?: string;
    details?: {
        label: string;
        value: string;
    }[];
    warning?: string;
    reasons?: string[];
    minReasonLength?: number;
    allowRequestInfo?: boolean;
    approveText?: string;
    onApprove?: (comment: string) => unknown;
    onReject?: (comment: string, reason?: string) => unknown;
    onRequestInfo?: (comment: string) => unknown;
}

interface ApprovalResult {
    decision: 'approved' | 'rejected' | 'info' | 'cancelled';
    comment: string;
    reason?: string;
}

function bulkAction<T>(o: BulkActionOptions<T>): Promise<BulkActionResult<T>>;

interface BulkActionOptions<T> {
    title: string;
    items: T[];
    label: (item: T) => string;
    describe?: (item: T) => string;
    skip?: (item: T) => string | false | null | undefined;
    run: (item: T) => unknown;
    confirmText?: string | ((n: number) => string);
    concurrency?: number;
    preview?: number;
}

interface BulkActionResult<T> {
    confirmed: boolean;
    done: T[];
    failed: {
        item: T;
        error: string;
    }[];
    skipped: {
        item: T;
        reason: string;
    }[];
}

interface Change {
    label: string;
    from?: string;
    to?: string;
}

function choose<V extends string>(o: ChooseOptions<V>): Promise<V | null>;

interface ChooseOption<V extends string> {
    value: V;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface ChooseOptions<V extends string> {
    title: string;
    text?: string;
    options: ChooseOption<V>[];
    value?: V;
    confirmText?: string;
}

function configurePatterns(textos: Partial<Textos>): void;

function confirmDelete(o: ConfirmDeleteOptions): Promise<boolean>;

interface ConfirmDeleteOptions {
    what: string;
    name?: string;
    consequences?: string[];
    requireName?: boolean;
    irreversible?: boolean;
    confirmText?: string;
    onConfirm?: () => unknown;
}

function loading<R>(texto: string, tarea: Promise<R> | (() => Promise<R> | R)): Promise<R>;
namespace loading {
    var open: typeof abrirCarga;
}

interface LoadingHandle {
    update(text: string): void;
    close(): void;
}

function sessionTimeout(o?: SessionTimeoutOptions): Promise<'extend' | 'logout' | 'expired'>;

interface SessionTimeoutOptions {
    seconds?: number;
    text?: string;
}

function unsavedChanges(o?: UnsavedChangesOptions): Promise<'save' | 'discard' | 'keep'>;

interface UnsavedChangesOptions {
    changes?: Change[];
    canSave?: boolean;
    onSave?: () => unknown;
}

function watchIdle(o: WatchIdleOptions): {
    stop: () => void;
    reset: () => void;
};

interface WatchIdleOptions {
    minutes: number;
    warnSeconds?: number;
    onExtend?: () => unknown;
    onLogout: (reason: 'logout' | 'expired') => unknown;
    text?: string;
}
```

## `nexus-dialogs/mx`

```ts
function addBusinessDays(date: string, n: number, o?: BusinessDaysOptions): string;

function businessDays(from: string, to: string, o?: BusinessDaysOptions): number;

interface BusinessDaysOptions {
    holidays?: string[];
    mexican?: boolean;
    weekend?: number[];
}

function isBusinessDay(date: string, o?: BusinessDaysOptions): boolean;

function isCLABE(valor: string): boolean;

function isCURP(valor: string): boolean;

function isNSS(valor: string): boolean;

const isPostalCode: (valor: string) => boolean;

function isRFC(valor: string): boolean;

function mexicanHolidays(year: number): string[];

const normalize: (v: string) => string;
```

## `nexus-dialogs/vue`

```ts
const NexusDialogs: {
    install(app: App, opciones?: PluginOptions): void;
};

interface PluginOptions extends GlobalConfig {
    toast?: ToastConfig;
}

function useDialog(): UseDialogReturn;

interface UseDialogReturn {
    alert: typeof base.alert;
    confirm: typeof base.confirm;
    prompt: typeof base.prompt;
    open: typeof base.open;
    success: typeof base.success;
    error: typeof base.error;
    warning: typeof base.warning;
    info: typeof base.info;
    isOpen: Readonly<Ref<boolean>>;
    closeAll: () => void;
    scoped: <F extends Fn>(fn: F) => F;
}

const useToast: () => typeof toast;
```

## `nexus-dialogs/angular`

```ts
function injectDialog(): InjectDialogReturn;

interface InjectDialogReturn {
    alert: typeof base.alert;
    confirm: typeof base.confirm;
    prompt: typeof base.prompt;
    open: typeof base.open;
    success: typeof base.success;
    error: typeof base.error;
    warning: typeof base.warning;
    info: typeof base.info;
    isOpen: Signal<boolean>;
    closeAll: () => void;
    scoped: <F extends Fn>(fn: F) => F;
}

function injectForm(): InjectFormReturn;

interface InjectFormReturn {
    form: typeof form;
    wizard: typeof wizard;
    formFromJSON: typeof formFromJSON;
    isOpen: Signal<boolean>;
    closeAll: () => void;
    scoped: <F extends Fn>(fn: F) => F;
}

const injectToast: () => typeof toast;

interface PluginOptions extends GlobalConfig {
    toast?: ToastConfig;
}

function provideNexusDialogs(opciones?: PluginOptions): EnvironmentProviders;
```

## `nexus-dialogs/react`

```ts
function NexusDialogsProvider({ children, ...opciones }: NexusDialogsProviderProps): ReactNode;

interface NexusDialogsProviderProps extends PluginOptions {
    children?: ReactNode;
}

interface PluginOptions extends GlobalConfig {
    toast?: ToastConfig;
}

function useDialog(): UseDialogReturn;

interface UseDialogReturn {
    alert: typeof base.alert;
    confirm: typeof base.confirm;
    prompt: typeof base.prompt;
    open: typeof base.open;
    success: typeof base.success;
    error: typeof base.error;
    warning: typeof base.warning;
    info: typeof base.info;
    isOpen: boolean;
    closeAll: () => void;
    scoped: <F extends Fn>(fn: F) => F;
}

function useForm(): UseFormReturn;

interface UseFormReturn {
    form: typeof form;
    wizard: typeof wizard;
    formFromJSON: typeof formFromJSON;
    isOpen: boolean;
    closeAll: () => void;
    scoped: <F extends Fn>(fn: F) => F;
}

const useToast: () => typeof toast;
```

## `nexus-dialogs/swal`

```ts
const Swal: {
    fire: (...args: [
        SweetAlertOptions
    ] | [
        string?,
        string?,
        SweetAlertIcon?
    ]) => Promise<SweetAlertResult>;
    mixin: (mas: SweetAlertOptions) => any;
    configure: (c: GlobalConfig) => void;
    close: (resultado?: Partial<SweetAlertResult>) => void;
    isVisible: () => boolean;
    isLoading: () => boolean;
    showLoading: () => void;
    hideLoading: () => void;
    showValidationMessage: (mensaje: string) => void;
    resetValidationMessage: () => void;
    update: typeof actualizar;
    getContainer: () => HTMLDialogElement;
    getPopup: () => HTMLElement | null;
    getTitle: () => HTMLElement | null;
    getHtmlContainer: () => HTMLElement | null;
    getIcon: () => HTMLElement | null;
    getIconContent: () => HTMLElement | null;
    getImage: () => HTMLElement | null;
    getCloseButton: () => HTMLElement | null;
    getActions: () => HTMLElement | null;
    getFooter: () => HTMLElement | null;
    getTimerProgressBar: () => HTMLElement | null;
    getProgressSteps: () => HTMLElement | null;
    getValidationMessage: () => HTMLElement | null;
    getInputLabel: () => HTMLElement | null;
    getLoader: () => HTMLElement | null;
    getFocusableElements: () => HTMLElement[];
    getInput: () => HTMLElement | null;
    getConfirmButton: () => HTMLButtonElement | null;
    getCancelButton: () => HTMLButtonElement | null;
    getDenyButton: () => HTMLButtonElement | null;
    clickConfirm: () => void | undefined;
    clickCancel: () => void | undefined;
    clickDeny: () => void | undefined;
    enableButtons: () => void;
    disableButtons: () => void;
    enableInput: () => void;
    disableInput: () => void;
    getTimerLeft: () => number | undefined;
    isTimerRunning: () => boolean | undefined;
    stopTimer: () => number | undefined;
    resumeTimer: () => number | undefined;
    toggleTimer: () => number | undefined;
    increaseTimer: (ms: number) => number | undefined;
    argsToParams: (args: unknown[]) => SweetAlertOptions;
    isValidParameter: (nombre: string) => boolean;
    isUpdatableParameter: (nombre: string) => boolean;
    bindClickHandler: (atributo?: string) => void;
    DismissReason: {
        readonly cancel: "cancel";
        readonly backdrop: "backdrop";
        readonly close: "close";
        readonly esc: "esc";
        readonly timer: "timer";
    };
};

const DismissReason: {
    readonly cancel: "cancel";
    readonly backdrop: "backdrop";
    readonly close: "close";
    readonly esc: "esc";
    readonly timer: "timer";
};
type DismissReason = (typeof DismissReason)[keyof typeof DismissReason];

const Swal: {
    fire: (...args: [
        SweetAlertOptions
    ] | [
        string?,
        string?,
        SweetAlertIcon?
    ]) => Promise<SweetAlertResult>;
    mixin: (mas: SweetAlertOptions) => any;
    configure: (c: GlobalConfig) => void;
    close: (resultado?: Partial<SweetAlertResult>) => void;
    isVisible: () => boolean;
    isLoading: () => boolean;
    showLoading: () => void;
    hideLoading: () => void;
    showValidationMessage: (mensaje: string) => void;
    resetValidationMessage: () => void;
    update: typeof actualizar;
    getContainer: () => HTMLDialogElement;
    getPopup: () => HTMLElement | null;
    getTitle: () => HTMLElement | null;
    getHtmlContainer: () => HTMLElement | null;
    getIcon: () => HTMLElement | null;
    getIconContent: () => HTMLElement | null;
    getImage: () => HTMLElement | null;
    getCloseButton: () => HTMLElement | null;
    getActions: () => HTMLElement | null;
    getFooter: () => HTMLElement | null;
    getTimerProgressBar: () => HTMLElement | null;
    getProgressSteps: () => HTMLElement | null;
    getValidationMessage: () => HTMLElement | null;
    getInputLabel: () => HTMLElement | null;
    getLoader: () => HTMLElement | null;
    getFocusableElements: () => HTMLElement[];
    getInput: () => HTMLElement | null;
    getConfirmButton: () => HTMLButtonElement | null;
    getCancelButton: () => HTMLButtonElement | null;
    getDenyButton: () => HTMLButtonElement | null;
    clickConfirm: () => void | undefined;
    clickCancel: () => void | undefined;
    clickDeny: () => void | undefined;
    enableButtons: () => void;
    disableButtons: () => void;
    enableInput: () => void;
    disableInput: () => void;
    getTimerLeft: () => number | undefined;
    isTimerRunning: () => boolean | undefined;
    stopTimer: () => number | undefined;
    resumeTimer: () => number | undefined;
    toggleTimer: () => number | undefined;
    increaseTimer: (ms: number) => number | undefined;
    argsToParams: (args: unknown[]) => SweetAlertOptions;
    isValidParameter: (nombre: string) => boolean;
    isUpdatableParameter: (nombre: string) => boolean;
    bindClickHandler: (atributo?: string) => void;
    DismissReason: {
        readonly cancel: "cancel";
        readonly backdrop: "backdrop";
        readonly close: "close";
        readonly esc: "esc";
        readonly timer: "timer";
    };
};

type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

type SweetAlertInput = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time' | 'month' | 'week' | 'range' | 'file' | 'textarea' | 'select' | 'radio' | 'checkbox';

interface SweetAlertOptions {
    title?: string;
    titleText?: string;
    text?: string;
    html?: string | HTMLElement;
    icon?: SweetAlertIcon;
    footer?: string;
    toast?: boolean;
    position?: 'top' | 'top-start' | 'top-end' | 'center' | 'center-start' | 'center-end' | 'bottom' | 'bottom-start' | 'bottom-end';
    width?: number | string;
    timer?: number;
    timerProgressBar?: boolean;
    showConfirmButton?: boolean;
    showDenyButton?: boolean;
    showCancelButton?: boolean;
    showCloseButton?: boolean;
    confirmButtonText?: string;
    denyButtonText?: string;
    cancelButtonText?: string;
    focusConfirm?: boolean;
    focusCancel?: boolean;
    focusDeny?: boolean;
    allowOutsideClick?: boolean | (() => boolean);
    allowEscapeKey?: boolean | (() => boolean);
    input?: SweetAlertInput;
    inputLabel?: string;
    inputPlaceholder?: string;
    inputValue?: string | number | boolean;
    inputOptions?: Opciones | Promise<Opciones>;
    inputAttributes?: Record<string, string>;
    inputValidator?: Validador;
    validationMessage?: string;
    preConfirm?: (inputValue: any) => any;
    preDeny?: (value: any) => any;
    willOpen?: (popup: HTMLElement) => void;
    didOpen?: (popup: HTMLElement) => void;
    didRender?: (popup: HTMLElement) => void;
    willClose?: (popup: HTMLElement) => void;
    didClose?: () => void;
    iconHtml?: string;
    imageUrl?: string;
    imageWidth?: number | string;
    imageHeight?: number | string;
    imageAlt?: string;
    progressSteps?: string[];
    currentProgressStep?: number;
    progressStepsDistance?: number | string;
    inputAutoTrim?: boolean;
    inputAutoFocus?: boolean;
    returnInputValueOnDeny?: boolean;
    reverseButtons?: boolean;
    allowEnterKey?: boolean;
    theme?: string;
    target?: string | HTMLElement;
    draggable?: boolean;
    template?: string | HTMLTemplateElement;
    closeButtonHtml?: string;
    loaderHtml?: string;
    closeButtonAriaLabel?: string;
    confirmButtonAriaLabel?: string;
    denyButtonAriaLabel?: string;
    cancelButtonAriaLabel?: string;
    didDestroy?: () => void;
    danger?: boolean;
    [otra: string]: unknown;
}

interface SweetAlertResult<T = any> {
    isConfirmed: boolean;
    isDenied: boolean;
    isDismissed: boolean;
    value?: T;
    dismiss?: DismissReason;
}
```

## `nexus-dialogs/import`

```ts
function convert(raw: string, tipo?: ImportType): unknown;

function downloadTemplate(columnas: ImportColumn[], nombre?: string): void;

function excelDate(serie: number): string;

interface ExportColumn<R = Record<string, unknown>> {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'boolean';
    format?: (value: any, row: R) => string | number | boolean | null | undefined;
}

function exportData<R>(rows: R[], o: ExportOptions<R> & {
    format?: 'xlsx' | 'csv';
}): Promise<void>;

interface ExportOptions<R = Record<string, unknown>> {
    columns: ExportColumn<R>[];
    filename?: string;
    sheet?: string;
}

function guessMapping(encabezados: string[], columnas: ImportColumn[]): Record<string, number>;

interface ImportColumn {
    name: string;
    label: string;
    type?: ImportType;
    required?: boolean;
    unique?: boolean;
    aliases?: string[];
    validate?: (value: any, row: Record<string, unknown>) => string | null | undefined | void;
}

function importData<T = Record<string, unknown>>(o: ImportOptions<T>): Promise<DialogResult<ImportResult<T>>>;

interface ImportError {
    row: number;
    column?: string;
    message: string;
}

interface ImportOptions<T> extends Omit<DialogOptions<ImportResult<T>>, 'render' | 'buttons' | 'collect'> {
    columns: ImportColumn[];
    maxRows?: number;
    template?: string | false;
    onImport?: (rows: T[]) => unknown | Promise<unknown>;
}

interface ImportResult<T> {
    rows: T[];
    errors: ImportError[];
}

type ImportType = 'text' | 'number' | 'date' | 'boolean' | 'email' | 'rfc' | 'curp' | 'nss' | 'clabe' | 'postal';

function parseCSV(texto: string, separador?: string): string[][];

function processRows<T = Record<string, unknown>>(datos: string[][], columnas: ImportColumn[], mapa: Record<string, number>, primeraFila?: number): ImportResult<T>;

function readSpreadsheet(file: File | Blob): Promise<string[][]>;

function readXLSX(file: Blob): Promise<string[][]>;

function toCSV<R>(rows: R[], columns: ExportColumn<R>[], separador?: string): string;

function toXLSX<R>(rows: R[], o: ExportOptions<R>): Promise<Blob>;
```

## `nexus-dialogs/locales`

```ts
const fr: Labels;

const pt: Labels;
```

## `nexus-dialogs/timeline`

```ts
type StepStatus = 'done' | 'current' | 'pending' | 'error' | 'skipped';

function timeline(o: TimelineOptions): TimelineControl;

const TIMELINE_CSS: string;

interface TimelineControl {
    readonly el: HTMLElement;
    progress(): TimelineProgress;
    setStatus(id: string, status: StepStatus, extra?: Partial<Pick<TimelineStep, 'date' | 'description' | 'statusLabel'>>): boolean;
}

function timelineDialog<T = unknown>(o: TimelineDialogOptions<T>): Promise<DialogResult<T>>;

interface TimelineDialogOptions<T = unknown> extends TimelineOptions, Omit<DialogOptions<T>, 'html' | 'onOpen'> {
    onOpen?: (ctx: DialogContext, control: TimelineControl) => void;
}

interface TimelineOptions {
    steps: TimelineStep[];
    summary?: boolean | string;
    emptyDate?: string;
    label?: string;
    scale?: 'sm' | 'md' | 'lg';
    layout?: 'vertical' | 'horizontal';
}

interface TimelineProgress {
    done: number;
    total: number;
    percent: number;
}

interface TimelineStep {
    id: string;
    title: string;
    description?: string;
    date?: string | Date | null;
    status: StepStatus;
    statusLabel?: string;
}
```

## `nexus-dialogs/tabs`

```ts
interface TabInfo {
    id: string;
    panel: HTMLElement;
    ctx?: DialogContext;
}

function tabs(o: TabsOptions, ctx?: DialogContext): TabsControl;

const TABS_CSS: string;

interface TabsControl {
    readonly el: HTMLElement;
    readonly current: string;
    select(id: string, focus?: boolean): boolean;
    panel(id: string): HTMLElement | null;
    setBadge(id: string, badge: string | number | null): void;
    setDisabled(id: string, disabled: boolean): void;
}

function tabsDialog<T = unknown>(o: TabsDialogOptions<T>): Promise<DialogResult<T>>;

interface TabsDialogOptions<T = unknown> extends TabsOptions, Omit<DialogOptions<T>, 'html' | 'onOpen'> {
    header?: string | Node;
    onOpen?: (ctx: DialogContext, control: TabsControl) => void;
}

interface TabsOptions {
    tabs: TabSpec[];
    initial?: string;
    label?: string;
    variant?: 'soft' | 'underline' | 'segmented';
    scale?: 'sm' | 'md' | 'lg';
    fill?: boolean;
    height?: 'stable' | 'auto';
    onChange?: (id: string, control: TabsControl) => void;
}

interface TabSpec {
    id: string;
    label: string;
    content?: Contenido | ((info: TabInfo) => Contenido | Promise<Contenido>);
    html?: string;
    badge?: string | number;
    disabled?: boolean;
    icon?: string | Node;
}
```

## `nexus-dialogs/table`

```ts
function pickRows<R = Record<string, unknown>>(o: PickRowsOptions<R>): Promise<DialogResult<R[]>>;

interface PickRowsOptions<R> extends Omit<DialogOptions<R[]>, 'render' | 'buttons' | 'collect'> {
    columns: TableColumn<R>[];
    rows?: R[];
    load?: (q: {
        search: string;
        page: number;
        pageSize: number;
    }) => Promise<TablePage<R>> | TablePage<R>;
    rowKey?: string | ((row: R) => string);
    multiple?: boolean;
    selected?: string[];
    isDisabled?: (row: R) => boolean;
    pageSize?: number;
    min?: number;
    max?: number;
    searchPlaceholder?: string;
    onExport?: (rows: R[], format: 'xlsx' | 'csv') => unknown | Promise<unknown>;
}

interface TableColumn<R> {
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    format?: (value: any, row: R) => string;
}

interface TablePage<R> {
    rows: R[];
    total: number;
}
```

## `nexus-dialogs/sepomex`

```ts
function buildSepomexShards(texto: string): Record<string, SepomexShard>;

function sepomexLookup(o: SepomexOptions): (cp: string) => Promise<SepomexResult | null>;

interface SepomexOptions {
    baseUrl: string;
    fetch?: (url: string) => Promise<{
        ok: boolean;
        json(): Promise<unknown>;
    }>;
}

interface SepomexResult {
    state: string;
    municipality: string;
    city?: string;
    neighborhoods: string[];
}

type SepomexShard = Record<string, [
    string,
    string,
    string,
    string[]
]>;
```

## `nexus-dialogs/rrhh`

```ts
const altaEmpleado: FormSchema;

const baja: FormSchema;

const cambioPuesto: FormSchema;

const capacitacion: FormSchema;

const evaluacion: FormSchema;

const gastos: FormSchema;

const incapacidad: FormSchema;

const permiso: FormSchema;

type PlantillaRRHH = keyof typeof plantillas;

const plantillas: {
    readonly altaEmpleado: FormSchema;
    readonly vacaciones: FormSchema;
    readonly permiso: FormSchema;
    readonly incapacidad: FormSchema;
    readonly baja: FormSchema;
    readonly gastos: FormSchema;
    readonly evaluacion: FormSchema;
    readonly capacitacion: FormSchema;
    readonly cambioPuesto: FormSchema;
};

function sinResolvers(schema: FormSchema): FormSchema;

const vacaciones: FormSchema;
```

## `nexus-dialogs/all`

```ts
function addBusinessDays(date: string, n: number, o?: BusinessDaysOptions): string;

function alert(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>>;

function applyTheme(theme: Theme, el?: HTMLElement): void;

function approval(o: ApprovalOptions): Promise<ApprovalResult>;

interface ApprovalOptions {
    title: string;
    subtitle?: string;
    details?: {
        label: string;
        value: string;
    }[];
    warning?: string;
    reasons?: string[];
    minReasonLength?: number;
    allowRequestInfo?: boolean;
    approveText?: string;
    onApprove?: (comment: string) => unknown;
    onReject?: (comment: string, reason?: string) => unknown;
    onRequestInfo?: (comment: string) => unknown;
}

interface ApprovalResult {
    decision: 'approved' | 'rejected' | 'info' | 'cancelled';
    comment: string;
    reason?: string;
}

function bulkAction<T>(o: BulkActionOptions<T>): Promise<BulkActionResult<T>>;

interface BulkActionOptions<T> {
    title: string;
    items: T[];
    label: (item: T) => string;
    describe?: (item: T) => string;
    skip?: (item: T) => string | false | null | undefined;
    run: (item: T) => unknown;
    confirmText?: string | ((n: number) => string);
    concurrency?: number;
    preview?: number;
}

interface BulkActionResult<T> {
    confirmed: boolean;
    done: T[];
    failed: {
        item: T;
        error: string;
    }[];
    skipped: {
        item: T;
        reason: string;
    }[];
}

function businessDays(from: string, to: string, o?: BusinessDaysOptions): number;

interface BusinessDaysOptions {
    holidays?: string[];
    mexican?: boolean;
    weekend?: number[];
}

type ButtonRole = 'confirm' | 'cancel' | 'deny' | 'custom';

interface ButtonSpec {
    id: string;
    text: string;
    role?: ButtonRole;
    variant?: ButtonVariant;
    onClick?: (ctx: DialogContext) => unknown;
    value?: unknown;
    disabled?: boolean;
    hidden?: boolean;
}

type ButtonVariant = 'primary' | 'cancel' | 'danger' | 'secondary';

interface Change {
    label: string;
    from?: string;
    to?: string;
}

function choose<V extends string>(o: ChooseOptions<V>): Promise<V | null>;

interface ChooseOption<V extends string> {
    value: V;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface ChooseOptions<V extends string> {
    title: string;
    text?: string;
    options: ChooseOption<V>[];
    value?: V;
    confirmText?: string;
}

function closeDialog(el: HTMLDialogElement, value?: unknown): boolean;

type CloseReason = 'confirm' | 'cancel' | 'deny' | 'escape' | 'backdrop' | 'close' | 'timer' | 'program' | (string & {});

function configure(c: GlobalConfig): void;

function configurePatterns(textos: Partial<Textos>): void;

function confirm(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>>;

function confirmDelete(o: ConfirmDeleteOptions): Promise<boolean>;

interface ConfirmDeleteOptions {
    what: string;
    name?: string;
    consequences?: string[];
    requireName?: boolean;
    irreversible?: boolean;
    confirmText?: string;
    onConfirm?: () => unknown;
}

const dialog: {
    alert: typeof alert;
    confirm: typeof confirm;
    prompt: typeof prompt;
    open: <T = unknown>(opciones: DialogOptions<T> & {
        render?: (ctx: DialogContext) => Node | null | void;
    }) => Promise<DialogResult<T>>;
    success: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    error: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    warning: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    info: (opciones: DialogInput<true>, text?: string) => Promise<DialogResult<true>>;
    close: (value?: unknown) => void;
    closeAll: () => void;
    isOpen: () => boolean;
};

interface DialogContext {
    readonly dialog: HTMLDialogElement;
    readonly root: ShadowRoot;
    readonly body: HTMLElement;
    close(reason?: CloseReason, value?: unknown, confirmed?: boolean): void;
    setLoading(loading: boolean, text?: string): void;
    setError(message: string | null): void;
    setTitle(title: string): void;
    setButtons(buttons: ButtonSpec[]): void;
    button(id: string): HTMLButtonElement | null;
    readonly timer?: TimerControl;
}

type DialogInput<T> = DialogOptions<T> | string;

interface DialogOptions<T = unknown> {
    title?: string;
    text?: string;
    html?: string | Node;
    icon?: IconName;
    placement?: Placement;
    size?: Size;
    buttons?: ButtonSpec[];
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    showCancel?: boolean;
    requireText?: string;
    timer?: number;
    timerProgress?: boolean;
    dismissible?: boolean | Dismissible;
    preConfirm?: (value: T | undefined, ctx: DialogContext) => unknown;
    beforeClose?: (reason: CloseReason, ctx: DialogContext) => boolean | Promise<boolean>;
    initialFocus?: 'confirm' | 'cancel' | 'first-field' | (string & {});
    footnote?: string;
    className?: string;
    styles?: string;
    theme?: Record<string, string>;
    scheme?: Scheme;
    dir?: 'ltr' | 'rtl';
    onOpen?: (ctx: DialogContext) => void;
    onClose?: (result: DialogResult<T>) => void;
}

interface DialogResult<T = unknown> {
    confirmed: boolean;
    denied: boolean;
    value: T | undefined;
    reason: CloseReason;
}

interface Dismissible {
    escape?: boolean;
    backdrop?: boolean;
    closeButton?: boolean;
}

const en: Labels;

interface EngineOptions<T> extends DialogOptions<T> {
    role?: 'dialog' | 'alertdialog';
    render?: (ctx: DialogContext) => Node | null | void;
    collect?: (ctx: DialogContext) => T | typeof INVALID | Promise<T | typeof INVALID>;
    onAction?: (button: ButtonSpec, ctx: DialogContext) => boolean | Promise<boolean>;
    moduleCss?: string;
    target?: Element;
    allowEnter?: boolean;
    onLoading?: (loading: boolean, ctx: DialogContext) => void;
    onClosing?: (ctx: DialogContext) => void;
}

const es: Labels;

function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>>;

function formatPhone(digitos: string, dial?: string): string;

function formFromJSON<T extends Record<string, unknown> = Record<string, unknown>>(schema: FormSchema | string, opts?: FromJSONOptions<T>): Promise<DialogResult<T>>;

function fromBootstrap(el?: Element): Theme;

interface GlobalConfig {
    lang?: string;
    labels?: Partial<Labels>;
    theme?: Record<string, string>;
    scheme?: Scheme;
    dir?: 'ltr' | 'rtl' | 'auto';
    defaults?: Partial<DialogOptions<any>>;
    sheetOnMobile?: boolean;
    sanitize?: ((html: string) => string | {
        toString(): string;
    }) | null;
    strictHtml?: boolean;
    nonce?: string;
}

type IconName = 'success' | 'error' | 'warning' | 'info' | 'question' | 'delete' | 'clock';

const INVALID: unique symbol;

function isBusinessDay(date: string, o?: BusinessDaysOptions): boolean;

function isCLABE(valor: string): boolean;

function isCURP(valor: string): boolean;

function isNSS(valor: string): boolean;

const isPostalCode: (valor: string) => boolean;

function isRFC(valor: string): boolean;

const labels: () => Labels;

interface Labels {
    ok: string;
    confirm: string;
    cancel: string;
    close: string;
    loading: string;
    required: string;
    typeToConfirm: string;
    typeToConfirmHelp: string;
    invalidEmail: string;
    invalidUrl: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    pattern: string;
    invalidRfc: string;
    invalidCurp: string;
    invalidNss: string;
    invalidClabe: string;
    invalidPostal: string;
    errorSummary: string;
    next: string;
    back: string;
    submit: string;
    review: string;
    edit: string;
    step: string;
    discardTitle: string;
    discardText: string;
    discard: string;
    keepEditing: string;
    select: string;
    yes: string;
    no: string;
    notifications: string;
    dismiss: string;
    success: string;
    error: string;
    warning: string;
    info: string;
}

const labelsFor: (code: string) => Labels;

const language: () => string;

function loading<R>(texto: string, tarea: Promise<R> | (() => Promise<R> | R)): Promise<R>;
namespace loading {
    var open: typeof abrirCarga;
}

interface LoadingHandle {
    update(text: string): void;
    close(): void;
}

function mexicanHolidays(year: number): string[];

const normalize: (v: string) => string;

const open: <T = unknown>(opciones: DialogOptions<T> & {
    render?: (ctx: DialogContext) => Node | null | void;
}) => Promise<DialogResult<T>>;

function openDialog<T = unknown>(opciones: EngineOptions<T>): Promise<DialogResult<T>>;

const pageLanguage: () => string;

type Placement = 'center' | 'right' | 'left' | 'bottom';

interface Plugin {
    name: string;
    install?(api: PluginApi): void;
    beforeOpen?(opciones: EngineOptions<any>): EngineOptions<any> | void;
    afterOpen?(ctx: DialogContext, opciones: EngineOptions<any>): void;
    afterClose?(resultado: DialogResult<any>, opciones: EngineOptions<any>): void;
}

interface PluginApi {
    configure: typeof configure;
    labels: typeof labels;
}

const plugins: () => string[];

function prompt(opciones: PromptOptions): Promise<DialogResult<string>>;

interface PromptOptions extends DialogOptions<string> {
    label?: string;
    input?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
    value?: string;
    placeholder?: string;
    help?: string;
    options?: (string | {
        value: string;
        label: string;
    })[];
    required?: boolean;
    maxLength?: number;
    autocomplete?: string;
    inputmode?: string;
    validate?: (value: string) => string | void | null | undefined | Promise<string | void | null | undefined>;
}

function registerLanguage(code: string, textos: Partial<Labels>): void;

type Scheme = 'light' | 'dark' | 'auto';

function sessionTimeout(o?: SessionTimeoutOptions): Promise<'extend' | 'logout' | 'expired'>;

interface SessionTimeoutOptions {
    seconds?: number;
    text?: string;
}

const setHtml: (el: Element, html: string) => void;

type Size = 'sm' | 'md' | 'lg' | 'xl' | number;

const themes: {
    light: Theme;
    dark: Theme;
    bootstrap: Theme;
    tailwind: Theme;
    tailwindDark: Theme;
    material: Theme;
};

interface TimerControl {
    left(): number;
    running(): boolean;
    stop(): number;
    resume(): number;
    increase(ms: number): number;
}

function toast(message: string | ToastOptions, opciones?: ToastOptions): string;
namespace toast {
    var success: Atajo;
    var error: Atajo;
    var warning: Atajo;
    var info: Atajo;
    var loading: Atajo;
    var promise: <T>(p: Promise<T>, m: PromiseMessages<T>, opciones?: ToastOptions) => Promise<T>;
    var update: typeof import("./toast.js").update;
    var dismiss: typeof import("./toast.js").dismiss;
    var configure: typeof configureToast;
}

function unsavedChanges(o?: UnsavedChangesOptions): Promise<'save' | 'discard' | 'keep'>;

interface UnsavedChangesOptions {
    changes?: Change[];
    canSave?: boolean;
    onSave?: () => unknown;
}

function unuse(name: string): boolean;

function use(plugin: Plugin): boolean;

const version: string;

function watchIdle(o: WatchIdleOptions): {
    stop: () => void;
    reset: () => void;
};

interface WatchIdleOptions {
    minutes: number;
    warnSeconds?: number;
    onExtend?: () => unknown;
    onLogout: (reason: 'logout' | 'expired') => unknown;
    text?: string;
}

function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>>;
```

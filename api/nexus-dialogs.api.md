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
}

const es: Labels;

interface GlobalConfig {
    lang?: 'es' | 'en';
    labels?: Partial<Labels>;
    theme?: Record<string, string>;
    scheme?: Scheme;
    defaults?: Partial<DialogOptions<any>>;
    sheetOnMobile?: boolean;
}

type IconName = 'success' | 'error' | 'warning' | 'info' | 'question';

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

const language: () => "es" | "en";

const open: <T = unknown>(opciones: DialogOptions<T> & {
    render?: (ctx: DialogContext) => Node | null | void;
}) => Promise<DialogResult<T>>;

function openDialog<T = unknown>(opciones: EngineOptions<T>): Promise<DialogResult<T>>;

type Placement = 'center' | 'right' | 'left' | 'bottom';

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

type Scheme = 'light' | 'dark' | 'auto';

type Size = 'sm' | 'md' | 'lg' | 'xl' | number;

const version: string;
```

## `nexus-dialogs/forms`

```ts
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
    visible?: (values: Record<string, unknown>) => boolean;
    disabled?: boolean;
    currency?: string;
    locale?: string;
}

type FieldType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'radio' | 'segmented' | 'checkbox' | 'switch' | 'money' | 'rfc' | 'curp' | 'nss' | 'clabe' | 'postal';

function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>>;

interface FormOptions<T> extends Omit<DialogOptions<T>, 'requireText'> {
    fields: Field[];
    values?: Partial<T>;
    columns?: 1 | 2;
    validate?: (values: T) => Record<string, string> | void | Promise<Record<string, string> | void>;
    submitText?: string;
    confirmDiscard?: boolean;
}

type Option = string | {
    value: string;
    label: string;
    disabled?: boolean;
};

function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>>;

interface WizardOptions<T> extends Omit<DialogOptions<T>, 'requireText'> {
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
    columns?: 1 | 2;
    validate?: (values: Record<string, unknown>) => Record<string, string> | void | Promise<Record<string, string> | void>;
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
    lang?: 'es' | 'en';
    scheme?: Scheme;
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

function fromBootstrap(el?: Element): Theme;

type Theme = Record<string, string>;

const themes: {
    light: Theme;
    dark: Theme;
    bootstrap: Theme;
    tailwind: Theme;
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
function isCLABE(valor: string): boolean;

function isCURP(valor: string): boolean;

function isNSS(valor: string): boolean;

const isPostalCode: (valor: string) => boolean;

function isRFC(valor: string): boolean;

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
    close: (_result?: Partial<SweetAlertResult>) => void;
    isVisible: () => boolean;
    isLoading: () => boolean;
    showLoading: () => void;
    hideLoading: () => void;
    showValidationMessage: (mensaje: string) => void;
    resetValidationMessage: () => void;
    update: (o: Pick<SweetAlertOptions, "title" | "titleText">) => void;
    getPopup: () => HTMLDialogElement;
    getInput: () => HTMLElement | null;
    getConfirmButton: () => HTMLButtonElement | null;
    getCancelButton: () => HTMLButtonElement | null;
    getDenyButton: () => HTMLButtonElement | null;
    clickConfirm: () => void | undefined;
    clickCancel: () => void | undefined;
    clickDeny: () => void | undefined;
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
    close: (_result?: Partial<SweetAlertResult>) => void;
    isVisible: () => boolean;
    isLoading: () => boolean;
    showLoading: () => void;
    hideLoading: () => void;
    showValidationMessage: (mensaje: string) => void;
    resetValidationMessage: () => void;
    update: (o: Pick<SweetAlertOptions, "title" | "titleText">) => void;
    getPopup: () => HTMLDialogElement;
    getInput: () => HTMLElement | null;
    getConfirmButton: () => HTMLButtonElement | null;
    getCancelButton: () => HTMLButtonElement | null;
    getDenyButton: () => HTMLButtonElement | null;
    clickConfirm: () => void | undefined;
    clickCancel: () => void | undefined;
    clickDeny: () => void | undefined;
    DismissReason: {
        readonly cancel: "cancel";
        readonly backdrop: "backdrop";
        readonly close: "close";
        readonly esc: "esc";
        readonly timer: "timer";
    };
};

type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

type SweetAlertInput = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time' | 'month' | 'textarea' | 'select' | 'radio' | 'checkbox';

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

## `nexus-dialogs/all`

```ts
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
}

const es: Labels;

function form<T extends Record<string, unknown> = Record<string, unknown>>(o: FormOptions<T>): Promise<DialogResult<T>>;

function fromBootstrap(el?: Element): Theme;

interface GlobalConfig {
    lang?: 'es' | 'en';
    labels?: Partial<Labels>;
    theme?: Record<string, string>;
    scheme?: Scheme;
    defaults?: Partial<DialogOptions<any>>;
    sheetOnMobile?: boolean;
}

type IconName = 'success' | 'error' | 'warning' | 'info' | 'question';

const INVALID: unique symbol;

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

const language: () => "es" | "en";

function loading<R>(texto: string, tarea: Promise<R> | (() => Promise<R> | R)): Promise<R>;
namespace loading {
    var open: typeof abrirCarga;
}

interface LoadingHandle {
    update(text: string): void;
    close(): void;
}

const normalize: (v: string) => string;

const open: <T = unknown>(opciones: DialogOptions<T> & {
    render?: (ctx: DialogContext) => Node | null | void;
}) => Promise<DialogResult<T>>;

function openDialog<T = unknown>(opciones: EngineOptions<T>): Promise<DialogResult<T>>;

type Placement = 'center' | 'right' | 'left' | 'bottom';

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

type Scheme = 'light' | 'dark' | 'auto';

function sessionTimeout(o?: SessionTimeoutOptions): Promise<'extend' | 'logout' | 'expired'>;

interface SessionTimeoutOptions {
    seconds?: number;
    text?: string;
}

type Size = 'sm' | 'md' | 'lg' | 'xl' | number;

const themes: {
    light: Theme;
    dark: Theme;
    bootstrap: Theme;
    tailwind: Theme;
    material: Theme;
};

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

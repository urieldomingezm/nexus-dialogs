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

type FieldType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'radio' | 'segmented' | 'checkbox' | 'switch' | 'money' | 'rfc';

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

## `nexus-dialogs/all`

```ts
function alert(opciones: DialogInput<true>, text?: string): Promise<DialogResult<true>>;

function applyTheme(theme: Theme, el?: HTMLElement): void;

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

const version: string;

function wizard<T extends Record<string, unknown> = Record<string, unknown>>(o: WizardOptions<T>): Promise<DialogResult<T>>;
```

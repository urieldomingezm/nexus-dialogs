What part of SweetAlert2 `nexus-dialogs/swal` covers and what it doesn't. Compatibility is not absolute and is not meant to be: it is a door to migrate gradually toward the library's own API. This table is verified on every change (`test/unit/swal-matriz.test.ts`): if the adapter recognizes a parameter that is not here, or a "compatible" one has no test, CI fails. The status column in this English page uses the Spanish page's table as its source: if they differ, the Spanish one is authoritative.

## What each status means

| Status | Meaning |
|---|---|
| **compatible** | Does the same as in SweetAlert2 and has a test. |
| **partial** | Works with a limitation or a difference (see the note). |
| **ignored** | Accepted so your code doesn't fail, but has no effect: the look is decided by the button standard and the theme. |
| **unsupported** | Accepted and does nothing because it has no equivalent. |

## Parameters

| Parameter | Status | Note |
|---|---|---|
| `title` | compatible |  |
| `titleText` | compatible |  |
| `text` | compatible |  |
| `html` | partial | Shown as text by default (`strictHtml`); with your own content, `configure({ strictHtml: false })` (without a bundler, `Swal.configure(…)`). |
| `icon` | compatible |  |
| `footer` | partial | Shown as plain text: tags are removed. |
| `toast` | partial | Uses the `nexus-dialogs/toast` queue; it doesn't accept all of a dialog's parameters. |
| `position` | partial | Only for toasts, and it changes the position of **all** toasts (there is a single queue). |
| `width` | partial | Only numbers and `px`; with other units the standard width is used. |
| `timer` | compatible |  |
| `timerProgressBar` | compatible |  |
| `showConfirmButton` | compatible |  |
| `showDenyButton` | compatible |  |
| `showCancelButton` | compatible |  |
| `showCloseButton` | compatible |  |
| `confirmButtonText` | compatible |  |
| `denyButtonText` | compatible |  |
| `cancelButtonText` | compatible |  |
| `focusCancel` | compatible |  |
| `focusDeny` | compatible |  |
| `allowOutsideClick` | compatible |  |
| `allowEscapeKey` | compatible |  |
| `input` | compatible |  |
| `inputLabel` | compatible |  |
| `inputPlaceholder` | compatible |  |
| `inputValue` | compatible |  |
| `inputOptions` | compatible |  |
| `inputAttributes` | compatible |  |
| `inputValidator` | compatible |  |
| `validationMessage` | compatible |  |
| `preConfirm` | compatible |  |
| `preDeny` | compatible |  |
| `willOpen` | compatible |  |
| `didOpen` | compatible |  |
| `didRender` | compatible |  |
| `willClose` | compatible |  |
| `didClose` | compatible |  |
| `didDestroy` | compatible |  |
| `iconHtml` | partial | Goes through `sanitize` / `strictHtml` like `html`. |
| `imageUrl` | compatible |  |
| `imageWidth` | compatible |  |
| `imageHeight` | compatible |  |
| `imageAlt` | compatible |  |
| `progressSteps` | compatible |  |
| `currentProgressStep` | compatible |  |
| `progressStepsDistance` | compatible |  |
| `closeButtonHtml` | partial | Goes through `sanitize` / `strictHtml` like `html`. |
| `closeButtonAriaLabel` | compatible |  |
| `confirmButtonAriaLabel` | compatible |  |
| `denyButtonAriaLabel` | compatible |  |
| `cancelButtonAriaLabel` | compatible |  |
| `reverseButtons` | compatible |  |
| `allowEnterKey` | compatible |  |
| `inputAutoFocus` | compatible |  |
| `inputAutoTrim` | compatible |  |
| `returnInputValueOnDeny` | compatible |  |
| `target` | partial | Mounts the dialog in that element, but it is still modal and in the top layer. |
| `theme` | partial | Understands `light`, `dark` and `auto`; the library's themes are chosen with `configure({ theme })`. |
| `template` | partial | Reads `<swal-title>`, `<swal-html>`, `<swal-icon>`, `<swal-image>`, `<swal-input>`, `<swal-button>`, `<swal-footer>` and `<swal-param>`; it doesn't accept `<swal-function-param>`. |
| `draggable` | compatible |  |
| `confirmButtonColor` | ignored | Colors come from the button standard and the theme. |
| `denyButtonColor` | ignored | Same as `confirmButtonColor`. |
| `cancelButtonColor` | ignored | Same as `confirmButtonColor`. |
| `buttonsStyling` | ignored | Buttons always carry the standard style. |
| `customClass` | ignored | The content lives in a Shadow DOM: your CSS classes don't reach it. Use themes. |
| `background` | ignored | Use `configure({ theme })`. |
| `color` | ignored | Use `configure({ theme })`. |
| `padding` | ignored | Spacing is the theme's. |
| `iconColor` | ignored | The icon color depends on the type. |
| `backdrop` | ignored | The backdrop is always the browser's (modal `<dialog>`). |
| `grow` | ignored | Sizes are `size` or `width`. |
| `animation` | unsupported | Motion comes from the theme and respects "reduce motion". |
| `showClass` | unsupported | Same as `animation`. |
| `hideClass` | unsupported | Same as `animation`. |
| `heightAuto` | ignored | Not needed: the dialog doesn't alter the page height. |
| `scrollbarPadding` | ignored | The library compensates for the scrollbar by itself. |
| `topLayer` | unsupported | It is always in the browser's top layer. |
| `stopKeydownPropagation` | ignored | Keyboard propagation is not stopped. |
| `keydownListenerCapture` | ignored | Keyboard events are not captured in the capture phase. |
| `showLoaderOnConfirm` | ignored | With an async `preConfirm` the "processing" indicator is always shown. |
| `showLoaderOnDeny` | ignored | With an async `preDeny` the "processing" indicator is always shown. |
| `focusConfirm` | ignored | The initial focus is decided by the library (on destructive actions, Cancel). |
| `returnFocus` | ignored | On closing, focus always returns to the element that opened the dialog. |
| `loaderHtml` | partial | Goes through `sanitize` / `strictHtml` like `html`. |

## Methods and accessors

Compatible: `Swal.fire`, `mixin`, `close`, `update`, `isVisible`, `showLoading`, `hideLoading`, `isLoading`, `getLoader`, `showValidationMessage`, `resetValidationMessage`, `enableButtons`, `disableButtons`, `enableInput`, `disableInput`, `clickConfirm`, `clickDeny`, `clickCancel`, the accessors (`getPopup`, `getContainer`, `getTitle`, `getHtmlContainer`, `getIcon`, `getImage`, `getInput`, `getActions`, `getFooter`, `getCloseButton`, `getTimerProgressBar`, `getProgressSteps`, `getFocusableElements`…), the timers (`stopTimer`, `resumeTimer`, `toggleTimer`, `increaseTimer`, `getTimerLeft`, `isTimerRunning`), `argsToParams`, `isValidParameter`, `isUpdatableParameter`, `bindClickHandler` and `DismissReason`.

No equivalent: `Swal.version`.

## Intentional differences

- **Buttons**: the order is always Cancel, Deny, Confirm. A confirmation whose button says "delete" or "remove" becomes a danger one, with focus on Cancel.
- **Shadow DOM**: `document.getElementById` doesn't see the content; use `Swal.getHtmlContainer().querySelector(…)`.
- **String `html`**: comes out as text by default (since 0.5.0); see [Security](https://urieldomingezm.github.io/nexus-dialogs/en/seguridad.html).
- **Language**: default texts follow the configured language.

Migration guide with runnable examples: [Migrate from SweetAlert2](https://urieldomingezm.github.io/nexus-dialogs/en/migracion.html).

// CSS del núcleo, dentro del Shadow DOM: el CSS de la página no entra y el nuestro no sale.
// Todo color sale de variables --nd-*: defínelas en :root (se heredan) o con configure({ theme }).
// --_x son internas: valor del usuario o, si no hay, el del esquema claro/oscuro. Diseño v2.

const DARK = `--_bg:var(--nd-bg,#161b26);--_fg:var(--nd-fg,#f5f5f6);--_label:var(--nd-label,#cecfd2);--_muted:var(--nd-muted,#94969c);
  --_subtle:var(--nd-subtle,#85888e);--_border:var(--nd-border,#333741);--_surface:var(--nd-surface,#1f242f);--_line:var(--nd-line,#2b3341);
  --_accent:var(--nd-accent,#8ea4ff);--_accent-fg:var(--nd-accent-contrast,#12142a);
  --_cancel-fg:var(--nd-cancel-fg,#fda29b);--_cancel-border:var(--nd-cancel-border,#7a271a);
  --_danger:var(--nd-danger,#f04438);--_error:var(--nd-error,#fda29b);--_success:var(--nd-success,#47cd89);--_warning:var(--nd-warning,#fdb022);
  --_overlay:var(--nd-overlay,rgba(0,0,0,.6));--_shadow:var(--nd-shadow,0 24px 48px -12px rgba(0,0,0,.6));--_edge:var(--nd-edge,#2b3341);color-scheme:dark;`

export const VARS = `
:host{
  --_accent:var(--nd-accent,#4263eb);--_accent-fg:var(--nd-accent-contrast,#fff);
  --_danger:var(--nd-danger,#d92d20);--_danger-fg:var(--nd-danger-contrast,#fff);
  --_success:var(--nd-success,#079455);--_warning:var(--nd-warning,#dc6803);--_info:var(--nd-info,var(--_accent));
  --_bg:var(--nd-bg,#fff);--_fg:var(--nd-fg,#101828);--_label:var(--nd-label,#344054);--_muted:var(--nd-muted,#475467);--_subtle:var(--nd-subtle,#667085);
  --_border:var(--nd-border,#d0d5dd);--_surface:var(--nd-surface,#f9fafb);--_line:var(--nd-line,#eaecf0);--_edge:var(--nd-edge,rgba(16,24,40,.06));
  --_cancel-fg:var(--nd-cancel-fg,#b42318);--_cancel-border:var(--nd-cancel-border,#fecdca);
  --_error:var(--nd-error,#d92d20);
  --_overlay:var(--nd-overlay,rgba(16,18,35,.45));
  --_radius:var(--nd-radius,20px);--_control-radius:var(--nd-control-radius,10px);
  --_font:var(--nd-font,Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
  --_title-font:var(--nd-title-font,var(--_font));
  --_shadow:var(--nd-shadow,0 1px 2px rgba(16,24,40,.06),0 24px 48px -12px rgba(16,24,40,.24));
  --_xs:0 1px 2px rgba(16,24,40,.05);
  --_focus:var(--nd-focus,color-mix(in srgb,var(--_accent) 20%,transparent));
  color-scheme:light;
}
:host([data-scheme=dark]){${DARK}}
@media (prefers-color-scheme:dark){:host([data-scheme=auto]){${DARK}}}
`

/** Botones: compartidos por diálogos y toasts. Sin iconos; el color dice la intención. */
export const BUTTONS = `
.btn{height:40px;padding:0 16px;border-radius:var(--_control-radius);font:600 14px/1 var(--_font);cursor:pointer;border:1px solid transparent;
  display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;box-shadow:var(--_xs);transition:filter .15s,background-color .15s,box-shadow .15s}
.btn:focus-visible{outline:none;box-shadow:var(--_xs),0 0 0 4px var(--_focus)}
.btn:disabled{cursor:not-allowed;opacity:.45}
.btn-primary{background:var(--_accent);color:var(--_accent-fg);box-shadow:var(--_xs),inset 0 -2px 0 rgba(16,24,40,.08)}
.btn-danger{background:var(--_danger);color:var(--_danger-fg);box-shadow:var(--_xs),inset 0 -2px 0 rgba(16,24,40,.08)}
.btn-danger:focus-visible{box-shadow:var(--_xs),0 0 0 4px color-mix(in srgb,var(--_danger) 20%,transparent)}
.btn-cancel{background:var(--_bg);color:var(--_cancel-fg);border-color:var(--_cancel-border)}
.btn-secondary{background:var(--_bg);color:var(--_label);border-color:var(--_border)}
.btn-primary:hover:not(:disabled),.btn-danger:hover:not(:disabled){filter:brightness(.92)}
.btn-cancel:hover:not(:disabled){background:color-mix(in srgb,var(--_cancel-fg) 6%,var(--_bg))}
.btn-secondary:hover:not(:disabled){background:var(--_surface)}
.btn[hidden]{display:none}
`

export const CORE_CSS =
  VARS +
  BUTTONS +
  `
:host{all:initial;position:fixed;inset:0;display:block;font:15px/1.5 var(--_font);color:var(--_fg);-webkit-font-smoothing:antialiased}
*,*::before,*::after{box-sizing:border-box}
.overlay{position:fixed;inset:0;background:var(--_overlay);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);opacity:0;transition:opacity .2s}
.wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
.panel{pointer-events:auto;position:relative;width:min(var(--_w,480px),100%);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;
  background:var(--_bg);color:var(--_fg);border-radius:var(--_radius);box-shadow:var(--_shadow);border:1px solid var(--_edge);overflow:hidden;
  --_from:translateY(8px) scale(.98);opacity:0;transform:var(--_from);transition:opacity .2s,transform .2s cubic-bezier(.2,.8,.2,1)}
[data-state=open] .overlay{opacity:1}
[data-state=open] .panel{opacity:1;transform:none}
.head{padding:24px 24px 0;display:flex;gap:16px;align-items:flex-start}
.head>div{min-width:0;flex:1}
.head.centered{flex-direction:column;align-items:center;text-align:center;padding-top:28px;gap:12px}
.panel.has-x .head>div{padding-right:28px}
.title{margin:0;font:600 18px/28px var(--_title-font);letter-spacing:-.01em;overflow-wrap:anywhere}
.text{margin:4px 0 0;font-size:14px;line-height:20px;color:var(--_muted)}
.text b,.text strong{color:var(--_fg)}
.body{padding:20px 24px 0;overflow:auto;flex:1 1 auto;min-height:0}
.body:empty{display:none}
.foot{margin-top:24px;padding:16px 24px 20px;display:flex;gap:12px;justify-content:flex-end;align-items:center;flex-wrap:wrap;border-top:1px solid var(--_line)}
.foot:empty{display:none}
/* Con tres o más botones, el primero (Cancelar, Guardar borrador) se va a la izquierda. */
.foot>.btn:first-child:nth-last-child(n+3){margin-right:auto}
.foot.plain{border-top:0;padding-top:0}
.foot.plain .btn{flex:1}
.p-right .foot,.p-left .foot{margin-top:auto}
.p-right .body,.p-left .body{flex:0 1 auto}
.note{margin:12px 0 0;font-size:12px;color:var(--_subtle)}
.err{margin:16px 24px 0;padding:10px 12px;border-radius:12px;color:var(--_error);font-size:14px;
  background:color-mix(in srgb,var(--_error) 6%,var(--_bg));border:1px solid color-mix(in srgb,var(--_error) 25%,var(--_bg))}
.err[hidden]{display:none}
.x{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:10px;border:0;background:transparent;color:var(--_subtle);cursor:pointer;display:flex;align-items:center;justify-content:center}
.x:hover{background:var(--_surface);color:var(--_muted)}
.x:focus-visible{outline:none;box-shadow:0 0 0 4px var(--_focus)}
/* Icono de contexto junto al título: cuadro suave con anillo. */
.icon{flex:none;box-sizing:content-box;width:32px;height:32px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb,currentColor 16%,var(--_bg));border:8px solid color-mix(in srgb,currentColor 7%,var(--_bg))}
.icon svg{width:20px;height:20px}
.icon path{stroke-dasharray:40;stroke-dashoffset:40;animation:draw .45s .1s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.i-success{color:var(--_success)}.i-error,.i-delete{color:var(--_danger)}.i-warning,.i-clock{color:var(--_warning)}.i-info,.i-question{color:var(--_info)}
.timer{position:absolute;left:0;bottom:0;height:3px;background:var(--_accent);opacity:.6;width:100%;transform-origin:left}
.body>*+.typed{margin-top:16px}
.typed label{display:block;font-size:14px;font-weight:500;color:var(--_label);margin-bottom:6px}
.typed code{font:600 13px ui-monospace,Menlo,monospace;background:var(--_surface);border:1px solid var(--_line);padding:1px 6px;border-radius:6px;user-select:all;color:var(--_fg)}
.typed small{display:block;margin-top:6px;font-size:13px;color:var(--_subtle)}
.input{width:100%;height:44px;border:1px solid var(--_border);border-radius:var(--_control-radius);padding:0 14px;font:15px var(--_font);
  color:var(--_fg);background:var(--_bg);box-shadow:var(--_xs);transition:border-color .15s,box-shadow .15s}
.input::placeholder{color:color-mix(in srgb,var(--_subtle) 75%,var(--_bg))}
textarea.input{height:auto;min-height:96px;padding:10px 14px;resize:vertical;line-height:1.5}
.input:focus{outline:none;border-color:color-mix(in srgb,var(--_accent) 55%,var(--_bg));box-shadow:var(--_xs),0 0 0 4px var(--_focus)}
.input[aria-invalid=true]{border-color:color-mix(in srgb,var(--_error) 55%,var(--_bg));box-shadow:var(--_xs),0 0 0 4px color-mix(in srgb,var(--_error) 9%,transparent)}
.field{display:flex;flex-direction:column;gap:6px}
.field>label{font-size:14px;font-weight:500;color:var(--_label)}
.msg{font-size:13px;color:var(--_error)}
.msg:empty{display:none}
.help{font-size:13px;color:var(--_subtle)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* Panel lateral y hoja inferior */
.p-right .wrap,.p-left .wrap{padding:0;justify-content:flex-end}
.p-left .wrap{justify-content:flex-start}
.p-right .panel,.p-left .panel{height:100dvh;max-height:none;border-radius:0;width:min(var(--_w,420px),100%);--_from:translateX(24px)}
.p-left .panel{--_from:translateX(-24px)}
.p-bottom .wrap{padding:0;align-items:flex-end}
.p-bottom .panel,.narrow.p-center.sheet .panel{border-radius:24px 24px 0 0;--_from:translateY(24px);max-height:90dvh}
.p-bottom .panel{width:min(var(--_w,640px),100%)}
.p-bottom .panel::before,.narrow.p-center.sheet .panel::before{content:"";display:block;flex:none;width:40px;height:5px;border-radius:3px;background:var(--_border);margin:10px auto 0}
/* .narrow la pone el motor con matchMedia (max-width:560px): WebKit puede no reevaluar @media de hojas adoptadas al cambiar el tamaño. */
.narrow.p-center.sheet .wrap{padding:0;align-items:flex-end}
.narrow.p-center.sheet .panel{width:100%}
.narrow .head{padding:16px 20px 0}.narrow .head.centered{padding-top:20px}.narrow .body{padding:16px 20px 0}
/* Celular: botones táctiles grandes (52 px), a todo lo ancho; el principal arriba. */
.narrow .foot{flex-direction:column-reverse;align-items:stretch;gap:12px;padding:16px 20px 20px;border-top:0;margin-top:20px}
.narrow .foot>.btn{height:52px;border-radius:12px;font-size:16px;width:100%;margin:0}
.narrow .err{margin:16px 20px 0}
@media (prefers-reduced-motion:reduce){.panel,.overlay{transition:none}.icon path{animation:none;stroke-dashoffset:0}}
`

// CSS del núcleo, dentro del Shadow DOM: el CSS de la página no entra y el nuestro no sale.
// Todo color sale de variables --nd-*: defínelas en :root (se heredan) o con configure({ theme }).
// --_x son internas: valor del usuario o, si no hay, el del esquema claro/oscuro.

const DARK = `--_bg:var(--nd-bg,#1d1f2c);--_fg:var(--nd-fg,#eceef6);--_muted:var(--nd-muted,#b4b8cc);
  --_border:var(--nd-border,#454a63);--_surface:var(--nd-surface,#252838);--_line:var(--nd-line,#33374b);
  --_accent:var(--nd-accent,#8ea4ff);--_accent-fg:var(--nd-accent-contrast,#12142a);
  --_cancel-fg:var(--nd-cancel-fg,#ff8a80);--_cancel-border:var(--nd-cancel-border,#8c3a36);
  --_danger:var(--nd-danger,#ef5350);--_error:var(--nd-error,#ff8a80);
  --_overlay:var(--nd-overlay,rgba(0,0,0,.6));color-scheme:dark;`

export const VARS = `
:host{
  --_accent:var(--nd-accent,#4263eb);--_accent-fg:var(--nd-accent-contrast,#fff);
  --_danger:var(--nd-danger,#c62828);--_danger-fg:var(--nd-danger-contrast,#fff);
  --_success:var(--nd-success,#1f9d61);--_warning:var(--nd-warning,#d97706);--_info:var(--nd-info,var(--_accent));
  --_bg:var(--nd-bg,#fff);--_fg:var(--nd-fg,#1c1d26);--_muted:var(--nd-muted,#4b4d5c);
  --_border:var(--nd-border,#c9ccd8);--_surface:var(--nd-surface,#f7f8fb);--_line:var(--nd-line,#e6e8ef);
  --_cancel-fg:var(--nd-cancel-fg,#b42318);--_cancel-border:var(--nd-cancel-border,#e3a29c);
  --_error:var(--nd-error,#b42318);
  --_overlay:var(--nd-overlay,rgba(20,22,34,.5));
  --_radius:var(--nd-radius,18px);--_control-radius:var(--nd-control-radius,10px);
  --_font:var(--nd-font,Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
  --_title-font:var(--nd-title-font,var(--_font));
  --_shadow:var(--nd-shadow,0 24px 60px rgba(10,12,30,.35));
  --_focus:var(--nd-focus,color-mix(in srgb,var(--_accent) 45%,transparent));
  color-scheme:light;
}
:host([data-scheme=dark]){${DARK}}
@media (prefers-color-scheme:dark){:host([data-scheme=auto]){${DARK}}}
`

/** Botones: compartidos por diálogos y toasts. */
export const BUTTONS = `
.btn{height:44px;padding:0 18px;border-radius:var(--_control-radius);font:600 15px/1 var(--_font);cursor:pointer;border:1px solid transparent;
  display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:filter .15s,background-color .15s}
.btn:focus-visible{outline:3px solid var(--_focus);outline-offset:2px}
.btn:disabled{cursor:not-allowed;opacity:.5}
.btn-primary{background:var(--_accent);color:var(--_accent-fg)}
.btn-danger{background:var(--_danger);color:var(--_danger-fg)}
.btn-cancel{background:transparent;color:var(--_cancel-fg);border-color:var(--_cancel-border)}
.btn-secondary{background:transparent;color:var(--_fg);border-color:var(--_border)}
.btn-primary:hover:not(:disabled),.btn-danger:hover:not(:disabled){filter:brightness(.92)}
.btn-cancel:hover:not(:disabled){background:color-mix(in srgb,var(--_cancel-fg) 8%,transparent)}
.btn-secondary:hover:not(:disabled){background:color-mix(in srgb,var(--_fg) 6%,transparent)}
.btn[hidden]{display:none}
`

export const CORE_CSS =
  VARS +
  BUTTONS +
  `
:host{all:initial;position:fixed;inset:0;display:block;font:15px/1.5 var(--_font);color:var(--_fg);-webkit-font-smoothing:antialiased}
*,*::before,*::after{box-sizing:border-box}
.overlay{position:fixed;inset:0;background:var(--_overlay);opacity:0;transition:opacity .2s}
.wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
.panel{pointer-events:auto;position:relative;width:min(var(--_w,480px),100%);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;
  background:var(--_bg);color:var(--_fg);border-radius:var(--_radius);box-shadow:var(--_shadow);overflow:hidden;
  --_from:translateY(8px) scale(.98);opacity:0;transform:var(--_from);transition:opacity .2s,transform .2s cubic-bezier(.2,.8,.2,1)}
[data-state=open] .overlay{opacity:1}
[data-state=open] .panel{opacity:1;transform:none}
.head{padding:26px 28px 0;display:flex;gap:16px;align-items:flex-start}
.head.centered{flex-direction:column;align-items:center;text-align:center}
.title{margin:0;font:700 21px/1.3 var(--_title-font);letter-spacing:-.01em}
.text{margin:6px 0 0;color:var(--_muted)}
.centered .text{margin-top:8px}
.body{padding:16px 28px 0;overflow:auto;flex:1 1 auto;min-height:0}
.body:empty{display:none}
.foot{margin-top:22px;padding:16px 28px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;background:var(--_surface);border-top:1px solid var(--_line)}
.foot:empty{display:none}
.foot.plain{background:transparent;border-top:0;padding-top:4px;justify-content:center}
.p-right .foot,.p-left .foot{margin-top:auto}
.p-right .body,.p-left .body{flex:0 1 auto}
.note{margin:12px 0 0;font-size:12px;color:var(--_muted)}
.err{margin:12px 28px 0;padding:10px 12px;border-radius:var(--_control-radius);color:var(--_error);
  background:color-mix(in srgb,var(--_error) 9%,transparent);font-size:14px}
.err[hidden]{display:none}
.x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:10px;border:0;background:transparent;color:var(--_muted);cursor:pointer;display:flex;align-items:center;justify-content:center}
.x:hover{background:color-mix(in srgb,var(--_fg) 7%,transparent)}
.x:focus-visible{outline:3px solid var(--_focus)}
.icon{flex:none;width:56px;height:56px}
.icon circle.bgc{fill:color-mix(in srgb,currentColor 12%,transparent)}
.icon path{stroke-dasharray:60;stroke-dashoffset:60;animation:draw .5s .1s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.i-success{color:var(--_success)}.i-error{color:var(--_danger)}.i-warning{color:var(--_warning)}.i-info,.i-question{color:var(--_info)}
.timer{position:absolute;left:0;bottom:0;height:4px;background:var(--_accent);opacity:.7;width:100%;transform-origin:left}
.typed label{display:block;font-size:14px;margin-bottom:8px}
.typed code{font:600 13px ui-monospace,Menlo,monospace;background:color-mix(in srgb,var(--_fg) 7%,transparent);padding:2px 6px;border-radius:6px;user-select:all}
.typed small{display:block;margin-top:6px;font-size:13px;color:var(--_muted)}
.input{width:100%;height:44px;border:1px solid var(--_border);border-radius:var(--_control-radius);padding:0 12px;font:15px var(--_font);
  color:var(--_fg);background:var(--_bg)}
textarea.input{height:auto;min-height:96px;padding:10px 12px;resize:vertical}
.input:focus{outline:3px solid var(--_focus);outline-offset:0;border-color:var(--_accent)}
.input[aria-invalid=true]{border:2px solid var(--_error)}
.field{display:flex;flex-direction:column;gap:6px}
.field>label{font-size:14px;font-weight:600}
.msg{font-size:13px;color:var(--_error)}
.msg:empty{display:none}
.help{font-size:13px;color:var(--_muted)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* Panel lateral y hoja inferior */
.p-right .wrap,.p-left .wrap{padding:0;justify-content:flex-end}
.p-left .wrap{justify-content:flex-start}
.p-right .panel,.p-left .panel{height:100dvh;max-height:none;border-radius:0;width:min(var(--_w,420px),100%);--_from:translateX(24px)}
.p-left .panel{--_from:translateX(-24px)}
.p-bottom .wrap{padding:0;align-items:flex-end}
.p-bottom .panel{width:min(var(--_w,640px),100%);border-radius:var(--_radius) var(--_radius) 0 0;--_from:translateY(24px);max-height:90dvh}
.p-bottom .panel::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:var(--_border);margin:10px auto 0}
/* .narrow la pone el motor con matchMedia (max-width:560px): WebKit puede no reevaluar @media de hojas adoptadas al cambiar el tamaño. */
.narrow.p-center.sheet .wrap{padding:0;align-items:flex-end}
.narrow.p-center.sheet .panel{width:100%;border-radius:var(--_radius) var(--_radius) 0 0;--_from:translateY(24px);max-height:90dvh}
.narrow .head{padding:22px 20px 0}.narrow .body{padding:14px 20px 0}.narrow .foot{padding:14px 20px}
.narrow .foot .btn{flex:1 1 auto}
@media (prefers-reduced-motion:reduce){.panel,.overlay{transition:none}.icon path{animation:none;stroke-dashoffset:0}}
`

// Animaciones del sitio, sin dependencias: partículas en la portada, aparición al hacer scroll y chispas al confirmar un ejemplo.
// Todo es decorativo (aria-hidden, sin capturar clics) y se apaga con «reducir movimiento».

const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)')

/** Color de acento del tema actual, listo para el canvas. Si el navegador no lo entiende, un violeta parecido. */
function colorDe(variable: string, otro = 'rgb(124 58 237)'): string {
  const p = document.createElement('span')
  p.style.color = `var(${variable})`
  p.style.display = 'none'
  document.body.appendChild(p)
  const c = getComputedStyle(p).color
  p.remove()
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return otro
  probe.fillStyle = otro
  probe.fillStyle = c // si el navegador no entiende el color, se queda el de respaldo
  return String(probe.fillStyle)
}

// ── Partículas conectadas en la portada ──────────────────────────────────────
interface Punto {
  x: number
  y: number
  vx: number
  vy: number
}

function particulas(hero: HTMLElement): void {
  const lienzo = document.createElement('canvas')
  lienzo.className = 'particulas'
  lienzo.setAttribute('aria-hidden', 'true')
  hero.prepend(lienzo)
  const ctx = lienzo.getContext('2d')
  if (!ctx) return

  let ancho = 0
  let alto = 0
  const puntos: Punto[] = []
  let raton: { x: number; y: number } | null = null
  let color = colorDe('--color-accent')
  let cuadro = 0
  let visible = true
  let n = 0

  function medir(): void {
    const r = hero.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    ancho = r.width
    alto = r.height
    lienzo.width = Math.round(ancho * dpr)
    lienzo.height = Math.round(alto * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Menos puntos en pantallas chicas: cuida la batería y no estorba al texto.
    const cantidad = Math.max(18, Math.min(64, Math.round((ancho * alto) / (ancho < 640 ? 16000 : 13000))))
    while (puntos.length < cantidad)
      puntos.push({ x: Math.random() * ancho, y: Math.random() * alto, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 })
    puntos.length = cantidad
    n = cantidad
  }

  const DIST = 120
  function pintar(): void {
    ctx!.clearRect(0, 0, ancho, alto)
    ctx!.fillStyle = color
    ctx!.strokeStyle = color
    for (let i = 0; i < n; i++) {
      const p = puntos[i]
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > ancho) p.vx *= -1
      if (p.y < 0 || p.y > alto) p.vy *= -1
      if (raton) {
        // El cursor las aparta con suavidad.
        const dx = p.x - raton.x
        const dy = p.y - raton.y
        const d2 = dx * dx + dy * dy
        if (d2 < 9000 && d2 > 1) {
          const f = (1 - d2 / 9000) * 0.6
          p.x += (dx / Math.sqrt(d2)) * f
          p.y += (dy / Math.sqrt(d2)) * f
        }
      }
      ctx!.globalAlpha = 0.8
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
      ctx!.fill()
      for (let j = i + 1; j < n; j++) {
        const q = puntos[j]
        const dx = p.x - q.x
        const dy = p.y - q.y
        const d = dx * dx + dy * dy
        if (d < DIST * DIST) {
          ctx!.globalAlpha = (1 - Math.sqrt(d) / DIST) * 0.42
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(p.x, p.y)
          ctx!.lineTo(q.x, q.y)
          ctx!.stroke()
        }
      }
    }
    ctx!.globalAlpha = 1
  }

  let tic = 0
  function bucle(): void {
    cuadro = 0
    if (!visible || document.hidden || sinMovimiento.matches) return
    // El color se relee de vez en cuando por si cambió el tema.
    if (++tic % 90 === 0) color = colorDe('--color-accent')
    pintar()
    cuadro = requestAnimationFrame(bucle)
  }
  const arrancar = (): void => {
    if (!cuadro && visible && !document.hidden && !sinMovimiento.matches) cuadro = requestAnimationFrame(bucle)
  }

  medir()
  if (sinMovimiento.matches) pintar() // una imagen fija, sin movimiento
  new ResizeObserver(() => {
    medir()
    if (sinMovimiento.matches) pintar()
  }).observe(hero)
  new IntersectionObserver((es) => {
    visible = es[0]?.isIntersecting ?? true
    arrancar()
  }).observe(hero)
  document.addEventListener('visibilitychange', arrancar)
  sinMovimiento.addEventListener('change', () => {
    if (sinMovimiento.matches) {
      cancelAnimationFrame(cuadro)
      cuadro = 0
      pintar()
    } else arrancar()
  })
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect()
    raton = { x: e.clientX - r.left, y: e.clientY - r.top }
  })
  hero.addEventListener('pointerleave', () => (raton = null))
  arrancar()
}

// ── Aparición al hacer scroll ────────────────────────────────────────────────
// Solo se anima lo que empieza fuera de pantalla; lo que ya se ve queda como está. Sin JS o sin IntersectionObserver todo se ve normal.
function aparecer(): void {
  if (sinMovimiento.matches || typeof IntersectionObserver === 'undefined') return
  const candidatos = document.querySelectorAll<HTMLElement>(
    'main section.bloque, main .tarjeta, main .datos, main .insignias',
  )
  const abajo = innerHeight
  const io = new IntersectionObserver(
    (es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue
        const el = e.target
        el.classList.add('visto')
        // Terminada la entrada se quita la clase: no debe competir con otras transformaciones (la inclinación).
        el.addEventListener('transitionend', () => el.classList.remove('revela', 'visto'), { once: true })
        io.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  )
  let orden = 0
  for (const el of candidatos) {
    if (el.getBoundingClientRect().top < abajo) continue
    // Las tarjetas hermanas entran escalonadas, no todas a la vez.
    el.style.setProperty('--retraso', `${(orden++ % 4) * 60}ms`)
    el.classList.add('revela')
    io.observe(el)
  }
}

// ── Chispas al confirmar ─────────────────────────────────────────────────────
const NOMBRES_CHISPAS = ['--color-accent', '--color-accent-soft', '--color-success', '--color-warn']

/** Un pequeño estallido de partículas desde `origen`. No hace nada con «reducir movimiento». */
export function chispas(origen: Element): void {
  if (sinMovimiento.matches) return
  const r = origen.getBoundingClientRect()
  const x0 = r.left + r.width / 2
  const y0 = r.top + r.height / 2
  const lienzo = document.createElement('canvas')
  lienzo.className = 'chispas'
  lienzo.setAttribute('aria-hidden', 'true')
  const dpr = Math.min(devicePixelRatio || 1, 2)
  lienzo.width = innerWidth * dpr
  lienzo.height = innerHeight * dpr
  const ctx = lienzo.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  document.body.appendChild(lienzo)
  const colores = NOMBRES_CHISPAS.map((v) => colorDe(v))
  const piezas = Array.from({ length: 30 }, (_, i) => {
    const a = Math.random() * Math.PI * 2
    const v = 3 + Math.random() * 5
    return {
      x: x0,
      y: y0,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 2,
      g: 0.22,
      t: 5 + Math.random() * 4,
      giro: Math.random() * Math.PI,
      c: colores[i % colores.length],
    }
  })
  const inicio = performance.now()
  const DURACION = 1100
  function cuadro(ahora: number): void {
    const k = (ahora - inicio) / DURACION
    ctx!.clearRect(0, 0, innerWidth, innerHeight)
    if (k >= 1) return void lienzo.remove()
    for (const p of piezas) {
      p.vy += p.g
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.giro += 0.2
      ctx!.globalAlpha = 1 - k * k
      ctx!.fillStyle = p.c
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.giro)
      ctx!.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2)
      ctx!.restore()
    }
    requestAnimationFrame(cuadro)
  }
  requestAnimationFrame(cuadro)
}

/** ¿El resultado de un ejemplo es una confirmación? (`true`, `{ confirmed: true }` o `{ isConfirmed: true }`). */
export function fueConfirmado(res: unknown): boolean {
  if (res === true) return true
  if (res && typeof res === 'object') {
    const o = res as { confirmed?: unknown; isConfirmed?: unknown }
    return o.confirmed === true || o.isConfirmed === true
  }
  return false
}

// ── Texto que se escribe solo ────────────────────────────────────────────────
// El primer texto ya está en el HTML: sin JS o con «reducir movimiento» se queda fijo.
function escribir(): void {
  const nodo = document.querySelector<HTMLElement>('[data-escribe]')
  if (!nodo) return
  const frases = (nodo.dataset.escribe ?? '').split('|').filter(Boolean)
  if (frases.length < 2) return
  let i = 0
  let n = frases[0].length
  let borrando = true
  let t = 0
  function paso(): void {
    if (sinMovimiento.matches) {
      nodo!.textContent = frases[0]
      return
    }
    if (document.hidden) {
      t = window.setTimeout(paso, 500)
      return
    }
    let espera: number
    if (borrando) {
      n--
      espera = 26
      if (n <= 0) {
        // Termina de borrar: sigue la próxima frase.
        borrando = false
        i = (i + 1) % frases.length
        n = 0
        espera = 280
      }
    } else {
      n++
      espera = 55
      if (n >= frases[i].length) {
        borrando = true
        espera = 1800
      }
    }
    nodo!.textContent = frases[i].slice(0, Math.max(n, 0))
    t = window.setTimeout(paso, espera)
  }
  t = window.setTimeout(paso, 2000)
  sinMovimiento.addEventListener('change', () => {
    clearTimeout(t)
    if (sinMovimiento.matches) nodo.textContent = frases[0]
    else {
      i = 0
      n = frases[0].length
      borrando = true
      t = window.setTimeout(paso, 1200)
    }
  })
}

// ── Inclinación 3D de las tarjetas ───────────────────────────────────────────
// Solo con mouse (hover y puntero fino). Las tarjetas anchas se inclinan menos para no marear.
function inclinar(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  let activa: HTMLElement | null = null
  const quitar = (): void => {
    if (!activa) return
    activa.classList.remove('inclina')
    activa.style.removeProperty('--rx')
    activa.style.removeProperty('--ry')
    activa = null
  }
  document.addEventListener(
    'pointermove',
    (e) => {
      if (sinMovimiento.matches) return quitar()
      if (e.buttons) return // seleccionando texto o arrastrando: no se mueve nada
      const t = (e.target as Element).closest<HTMLElement>('main .tarjeta, main .ejemplo')
      if (!t) return quitar()
      if (t !== activa) {
        quitar()
        activa = t
      }
      const r = t.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      const max = r.width > 600 || r.height > 400 ? 1.2 : 3
      t.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`)
      t.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`)
      t.classList.add('inclina')
    },
    { passive: true },
  )
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget) quitar()
  })
  addEventListener('blur', quitar)
}

// ── Arranque ─────────────────────────────────────────────────────────────────
const hero = document.querySelector<HTMLElement>('.hero:not(.chico)')
if (hero) particulas(hero)
aparecer()
escribir()
inclinar()

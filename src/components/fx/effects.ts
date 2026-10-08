/**
 * Effets de célébration, sans dépendance : explosion d'étoiles et de confettis sur un canvas
 * plein écran éphémère, et texte flottant (« +4 XP »). Tout est coupé si l'utilisateur
 * a demandé moins d'animations dans Windows.
 */

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTE = ['#ffb938', '#3ee6b0', '#8b6cff', '#ff6f9c', '#fff3c4'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: 'star' | 'rect' | 'dot';
  life: number;
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

/** Explosion de particules depuis un point (ou le centre). `power` règle la quantité. */
export function burst(origin?: { x: number; y: number }, power: 'small' | 'big' = 'small'): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight / 2;
  const count = power === 'big' ? 160 : 36;
  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (power === 'big' ? 6 : 3.5) * (0.4 + Math.random());
    const shapes: Particle['shape'][] = ['star', 'rect', 'dot'];
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (power === 'big' ? 4 : 2),
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * (power === 'big' ? 8 : 5),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
      shape: shapes[Math.floor(Math.random() * shapes.length)]!,
      life: 1,
    };
  });

  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(32, now - last) / 16;
    last = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive += 1;
      p.vy += 0.18 * dt;
      p.vx *= 0.99;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.life -= 0.011 * dt;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') drawStar(ctx, p.size);
      else if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive > 0) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}

/** Centre d'un élément, pour faire partir un effet de l'endroit où l'utilisateur a cliqué. */
export function centerOf(el: Element | null | undefined): { x: number; y: number } | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Texte qui s'envole et disparaît (« +4 XP », « Combo x3 ! »). */
export function floatText(text: string, origin?: { x: number; y: number }, tone: 'xp' | 'combo' = 'xp'): void {
  const el = document.createElement('div');
  el.className = `fx-float fx-float-${tone}`;
  el.textContent = text;
  el.style.left = `${origin?.x ?? window.innerWidth / 2}px`;
  el.style.top = `${origin?.y ?? window.innerHeight / 2}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  if (prefersReducedMotion()) setTimeout(() => el.remove(), 900);
}

/** Changement d'écran animé (API View Transitions de Chromium/WebView2), avec repli instantané. */
export function withViewTransition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !prefersReducedMotion()) doc.startViewTransition(update);
  else update();
}

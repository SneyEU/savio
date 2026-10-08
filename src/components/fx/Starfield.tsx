import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Ciel étoilé vivant en arrière-plan : scintillement, léger parallaxe à la souris,
 * et une étoile filante de temps en temps. Désactivé si l'utilisateur préfère moins d'animations.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shooting: ShootingStar | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((width * height) / 5200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.2 + Math.random() * 0.8,
        r: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.8,
      }));
    };

    const starColor = () => getComputedStyle(document.documentElement).getPropertyValue('--c-ink').trim() || '#ffffff';

    const draw = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = starColor();
      for (const s of stars) {
        const twinkle = reduced ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(now / 1000 * s.speed + s.phase));
        const px = s.x + pointerX * 14 * s.z;
        const py = s.y + pointerY * 10 * s.z;
        ctx.globalAlpha = twinkle * s.z * 0.9;
        ctx.beginPath();
        ctx.arc(px, py, s.r * s.z + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        if (!shooting && Math.random() < 0.0016 * dt) {
          shooting = { x: Math.random() * width * 0.7, y: Math.random() * height * 0.35, vx: 0.9, vy: 0.38, life: 1 };
        }
        if (shooting) {
          const tail = 120;
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - tail * shooting.vx, shooting.y - tail * shooting.vy);
          grad.addColorStop(0, `rgba(255, 214, 120, ${shooting.life})`);
          grad.addColorStop(1, 'rgba(255, 214, 120, 0)');
          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - tail * shooting.vx, shooting.y - tail * shooting.vy);
          ctx.stroke();
          shooting.x += shooting.vx * dt * 0.9;
          shooting.y += shooting.vy * dt * 0.9;
          shooting.life -= dt / 1400;
          if (shooting.life <= 0 || shooting.x > width + 200) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      pointerX = e.clientX / window.innerWidth - 0.5;
      pointerY = e.clientY / window.innerHeight - 0.5;
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) window.addEventListener('pointermove', onPointer);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}

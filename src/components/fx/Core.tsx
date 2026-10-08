import { useEffect, useRef } from 'react';
import { reducedMotion } from './motion';

export type CoreState = 'idle' | 'thinking' | 'speaking' | 'listening';

interface CoreProps {
  state: CoreState;
  /** Intensité de la voix (0 → 1), lue à chaque image pendant que le noyau parle ou écoute. */
  level?: { current: number };
  size?: number;
}

const PALETTE: Record<CoreState, { core: string; ring: string }> = {
  idle: { core: '232, 176, 75', ring: '241, 233, 214' },
  thinking: { core: '124, 196, 255', ring: '124, 196, 255' },
  speaking: { core: '92, 225, 182', ring: '232, 176, 75' },
  listening: { core: '255, 122, 89', ring: '255, 122, 89' },
};

interface Mote {
  orbit: number;
  angle: number;
  speed: number;
  size: number;
}

/**
 * Le Noyau : la présence visuelle du tuteur IA.
 * Au repos il respire lentement ; quand il réfléchit, ses orbites se resserrent et accélèrent ;
 * quand il parle, il pulse au rythme de la voix. Les transitions entre états sont continues (interpolation).
 */
export function Core({ state, level, size = 260 }: CoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = reducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const c = size / 2;
    const motes: Mote[] = Array.from({ length: 54 }, (_, i) => ({
      orbit: i % 3,
      angle: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.006,
      size: 0.8 + Math.random() * 1.8,
    }));

    // Valeurs interpolées pour des transitions douces entre états.
    let tightness = 1;
    let velocity = 1;
    let pulse = 0;
    let colorMix = { core: [232, 176, 75], ring: [241, 233, 214] };
    let frame = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const parse = (rgb: string) => rgb.split(',').map((v) => Number(v.trim()));

    const draw = (now: number) => {
      const s = stateRef.current;
      const target = PALETTE[s];
      tightness = lerp(tightness, s === 'thinking' ? 0.72 : 1, 0.06);
      velocity = lerp(velocity, s === 'thinking' ? 3.2 : s === 'speaking' ? 1.6 : 1, 0.05);
      const voice = s === 'speaking' || s === 'listening' ? (level?.current ?? 0) : 0;
      pulse = lerp(pulse, voice, 0.25);
      const tc = parse(target.core);
      const tr = parse(target.ring);
      colorMix = {
        core: colorMix.core.map((v, i) => lerp(v, tc[i]!, 0.05)),
        ring: colorMix.ring.map((v, i) => lerp(v, tr[i]!, 0.05)),
      };
      const core = colorMix.core.map(Math.round).join(',');
      const ring = colorMix.ring.map(Math.round).join(',');

      ctx.clearRect(0, 0, size, size);
      const breath = still ? 0 : Math.sin(now / 1100) * 0.04;
      const r = size * 0.16 * (1 + breath + pulse * 0.35);

      // Halo
      const halo = ctx.createRadialGradient(c, c, r * 0.4, c, c, size * 0.5);
      halo.addColorStop(0, `rgba(${core}, ${0.42 + pulse * 0.3})`);
      halo.addColorStop(0.45, `rgba(${core}, 0.08)`);
      halo.addColorStop(1, `rgba(${core}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(c, c, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Orbites (ellipses inclinées différemment)
      for (let o = 0; o < 3; o++) {
        const rx = size * (0.24 + o * 0.075) * tightness;
        const ry = rx * (0.36 + o * 0.12);
        const rot = (o * Math.PI) / 3 + (still ? 0 : now / (9000 - o * 1500));
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${ring}, ${0.16 + (s === 'thinking' ? 0.14 : 0)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (const m of motes) {
          if (m.orbit !== o) continue;
          if (!still) m.angle += m.speed * velocity;
          const x = Math.cos(m.angle) * rx;
          const y = Math.sin(m.angle) * ry;
          const front = Math.sin(m.angle) > 0;
          ctx.fillStyle = `rgba(${ring}, ${front ? 0.95 : 0.35})`;
          ctx.beginPath();
          ctx.arc(x, y, m.size * (front ? 1.1 : 0.7), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Noyau
      const body = ctx.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.1, c, c, r);
      body.addColorStop(0, 'rgba(255, 250, 235, 1)');
      body.addColorStop(0.5, `rgba(${core}, 1)`);
      body.addColorStop(1, `rgba(${core}, 0.75)`);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();

      // Onde de voix : anneau qui s'échappe quand on parle
      if (pulse > 0.05) {
        ctx.strokeStyle = `rgba(${core}, ${pulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c, c, r * (1.35 + pulse * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!still || s !== 'idle') frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [size, level]);

  const labels: Record<CoreState, string> = {
    idle: 'Le tuteur est prêt',
    thinking: 'Le tuteur réfléchit',
    speaking: 'Le tuteur parle',
    listening: 'Le tuteur t’écoute',
  };

  return (
    <div className={`core core-${state}`} style={{ width: size, height: size, ['viewTransitionName' as string]: 'savio-core' }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} role="img" aria-label={labels[state]} />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { subjectColor, subjectMeta } from '../core/content/catalog';
import type { SubjectId } from '../core/domain/types';
import type { SubjectRecommendation } from '../core/engine/sessionPlanner';
import type { LevelProgress } from '../core/gamification/xp';
import { reducedMotion } from './fx/motion';

interface OrreryProps {
  level: LevelProgress;
  totalXp: number;
  subjects: readonly SubjectRecommendation[];
  strength: Readonly<Record<SubjectId, number>>;
  onPick: (subjectId: SubjectId) => void;
}

const W = 720;
const H = 460;
const CX = W / 2;
const CY = H / 2;
/** Aplatissement des orbites : donne l'impression de regarder le système de biais. */
const TILT = 0.38;

interface Body {
  rec: SubjectRecommendation;
  radius: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
  glyph: string;
  label: string;
}

/**
 * Le planétarium : ton niveau est le soleil, tes matières sont des planètes.
 * Plus une matière est maîtrisée, plus sa planète est grosse. Celles qui ont des cartes à réviser pulsent.
 * Les positions sont calculées à chaque image et écrites directement dans le DOM (aucun re-rendu React).
 */
export function Orrery({ level, totalXp, subjects, strength, onPick }: OrreryProps) {
  const planetRefs = useRef<(SVGGElement | null)[]>([]);
  const stageRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hovered;

  const bodies: Body[] = useMemo(() => {
    const n = Math.max(1, subjects.length);
    const inner = 118;
    const outer = Math.min(330, inner + n * 42);
    return subjects.map((rec, i) => {
      const s = strength[rec.subjectId] ?? 0;
      const meta = subjectMeta(rec.subjectId);
      return {
        rec,
        radius: n === 1 ? (inner + outer) / 2 : inner + ((outer - inner) * i) / (n - 1),
        size: 21 + s * 17,
        speed: 0.00018 / (1 + i * 0.35),
        phase: (i * 2.399) % (Math.PI * 2), // angle d'or : répartition naturelle
        color: subjectColor(rec.subjectId),
        glyph: meta?.glyph ?? '•',
        label: meta?.label ?? rec.subjectId,
      };
    });
  }, [subjects, strength]);

  useEffect(() => {
    const still = reducedMotion();
    let frame = 0;
    let tiltX = 0;
    let target = 0;
    const start = performance.now();
    const onPointer = (e: PointerEvent) => {
      target = (e.clientY / window.innerHeight - 0.5) * 0.12;
    };
    window.addEventListener('pointermove', onPointer);

    const place = (now: number) => {
      tiltX += (target - tiltX) * 0.05;
      const t = now - start;
      bodies.forEach((b, i) => {
        const g = planetRefs.current[i];
        if (!g) return;
        // Une planète survolée ralentit fortement : on peut la viser facilement.
        const angle = b.phase + (still ? 0 : t * b.speed * (hoveredRef.current === i ? 0.08 : 1));
        const x = CX + Math.cos(angle) * b.radius;
        const y = CY + Math.sin(angle) * b.radius * (TILT + tiltX);
        const depth = (Math.sin(angle) + 1) / 2; // 0 = derrière, 1 = devant
        const scale = 0.72 + depth * 0.42;
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`);
        g.style.opacity = String(0.55 + depth * 0.45);
        // Derrière le soleil quand la planète passe au fond.
        g.dataset.behind = Math.sin(angle) < -0.15 && Math.abs(Math.cos(angle)) * b.radius < 90 ? 'true' : 'false';
      });
      if (!still) frame = requestAnimationFrame(place);
    };
    frame = requestAnimationFrame(place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [bodies]);

  const circumference = 2 * Math.PI * 74;
  const hoveredBody = hovered !== null ? bodies[hovered] : undefined;

  return (
    <div className="orrery">
      <svg ref={stageRef} viewBox={`0 0 ${W} ${H}`} className="orrery-svg" role="group" aria-label="Ton système de matières">
        <defs>
          <radialGradient id="sun-core" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#fff4d6" />
            <stop offset="38%" stopColor="#f3c565" />
            <stop offset="100%" stopColor="#b8721c" />
          </radialGradient>
          <radialGradient id="sun-halo">
            <stop offset="0%" stopColor="#e8b04b" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#e8b04b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#e8b04b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="planet-shade" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {bodies.map((b, i) => (
          <ellipse
            key={`orbit-${b.rec.subjectId}`}
            className={hovered === i ? 'orbit-line is-hot' : 'orbit-line'}
            cx={CX}
            cy={CY}
            rx={b.radius}
            ry={b.radius * TILT}
            style={{ animationDelay: `${200 + i * 90}ms` }}
          />
        ))}

        <g className="sun" style={{ ['viewTransitionName' as string]: 'savio-core' }}>
          <circle cx={CX} cy={CY} r="150" fill="url(#sun-halo)" className="sun-halo" />
          <circle cx={CX} cy={CY} r="74" className="xp-track" />
          <circle
            cx={CX}
            cy={CY}
            r="74"
            className="xp-ring"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - level.ratio)}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
          <circle cx={CX} cy={CY} r="58" fill="url(#sun-core)" className="sun-body" />
          <text x={CX} y={CY - 6} className="sun-level" textAnchor="middle">
            {level.level}
          </text>
          <text x={CX} y={CY + 22} className="sun-caption" textAnchor="middle">
            NIVEAU
          </text>
        </g>

        {bodies.map((b, i) => (
          <g
            key={b.rec.subjectId}
            ref={(el) => {
              planetRefs.current[i] = el;
            }}
            className={`planet planet-${b.rec.action}`}
            style={{ ['--planet' as string]: b.color, animationDelay: `${400 + i * 110}ms` }}
            tabIndex={0}
            role="button"
            aria-label={`${b.label} : ${statusText(b.rec)}. Lancer une séance.`}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            onClick={() => onPick(b.rec.subjectId)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(b.rec.subjectId)}
          >
            {b.rec.action === 'review' && <circle r={b.size + 9} className="planet-pulse" />}
            <circle r={b.size} className="planet-body" />
            <circle r={b.size} fill="url(#planet-shade)" pointerEvents="none" />
            <text className="planet-glyph" textAnchor="middle" dy="0.35em" style={{ fontSize: `${Math.max(13, b.size * 0.78)}px` }}>
              {b.glyph}
            </text>
            {b.rec.dueCount > 0 && (
              <g transform={`translate(${b.size * 0.8} ${-b.size * 0.8})`} className="planet-badge">
                <circle r="10" />
                <text textAnchor="middle" dy="0.35em">
                  {b.rec.dueCount > 99 ? '99+' : b.rec.dueCount}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      <div className={hoveredBody ? 'orrery-caption is-on' : 'orrery-caption'} aria-live="polite">
        {hoveredBody ? (
          <>
            <strong style={{ color: hoveredBody.color }}>{hoveredBody.label}</strong>
            <span>
              {statusText(hoveredBody.rec)} · maîtrise {Math.round((strength[hoveredBody.rec.subjectId] ?? 0) * 100)} %
            </span>
            <em>Clique pour lancer une séance</em>
          </>
        ) : (
          <>
            <strong>{totalXp} XP</strong>
            <span>
              encore {level.xpForNextLevel - level.xpIntoLevel} XP avant le niveau {level.level + 1}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function statusText(rec: SubjectRecommendation): string {
  if (rec.action === 'review') return `${rec.dueCount} à réviser`;
  if (rec.action === 'learn') return `${rec.newAvailable} nouveauté${rec.newAvailable > 1 ? 's' : ''}`;
  return 'à jour';
}

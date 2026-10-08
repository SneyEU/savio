import { GOAL_TIERS, tierFor } from '../core/gamification/goals';

interface GoalPickerProps {
  value: number;
  onChange: (minutes: number) => void;
}

/**
 * Choix de l'objectif quotidien en paliers, présentés comme les étapes d'un parcours.
 * Inspiré des sélecteurs à jalons (21st.dev « Gradient Selector Card »), réécrit pour Savio.
 */
export function GoalPicker({ value, onChange }: GoalPickerProps) {
  const current = tierFor(value);
  const index = Math.max(
    0,
    GOAL_TIERS.findIndex((t) => t.minutes === current.minutes),
  );

  return (
    <div className="goal-picker">
      <div className="goal-picker-summary" aria-live="polite">
        <span className="goal-picker-minutes">{value} min</span>
        <span className="goal-picker-label">{current.label}</span>
        <span className="muted">{current.hint}</span>
      </div>

      <div className="goal-picker-track" role="radiogroup" aria-label="Objectif quotidien">
        <span className="goal-picker-fill" style={{ width: `${(index / (GOAL_TIERS.length - 1)) * 100}%` }} aria-hidden="true" />
        {GOAL_TIERS.map((tier, i) => (
          <button
            key={tier.minutes}
            type="button"
            role="radio"
            aria-checked={tier.minutes === value}
            aria-label={`${tier.label}, ${tier.minutes} minutes par jour`}
            className={i <= index ? 'goal-dot is-on' : 'goal-dot'}
            onClick={() => onChange(tier.minutes)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(GOAL_TIERS[Math.min(GOAL_TIERS.length - 1, i + 1)]!.minutes);
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(GOAL_TIERS[Math.max(0, i - 1)]!.minutes);
            }}
          >
            <span className="goal-dot-value">{tier.minutes}</span>
          </button>
        ))}
      </div>

      <p className="muted goal-picker-note">C’est un objectif, pas une limite : une fois atteint, tu peux continuer autant que tu veux.</p>
    </div>
  );
}

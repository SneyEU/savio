/**
 * Titre dont les lettres arrivent une à une avec inertie.
 * Le texte complet reste lisible par les lecteurs d'écran (aria-label), les lettres sont décoratives.
 */
export function SplitText({ text, className, delay = 0, as: Tag = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'p' | 'span' }) {
  const words = text.split(' ');
  let index = 0;
  return (
    <Tag className={`split ${className ?? ''}`} aria-label={text}>
      {words.map((word, w) => (
        <span key={w} className="split-word" aria-hidden="true">
          {[...word].map((char) => {
            const i = index++;
            return (
              <span key={i} className="split-char" style={{ animationDelay: `${delay + i * 28}ms` }}>
                {char}
              </span>
            );
          })}
          {w < words.length - 1 && <span className="split-space"> </span>}
        </span>
      ))}
    </Tag>
  );
}

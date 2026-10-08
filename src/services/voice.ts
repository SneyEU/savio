/**
 * Lecture à voix haute avec les voix installées sur l'ordinateur (API Web Speech de WebView2).
 * Gratuit, local, sans compte. Les voix plus naturelles (Piper, Kokoro) arriveront en phase 2.
 */

export interface SpeakHandle {
  stop(): void;
}

export function voiceAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Retire la mise en forme Markdown et les flèches de cartes avant de lire le texte. */
export function speakableText(text: string): string {
  return text
    .replace(/[*_`#>]/g, '')
    .replace(/\s*(?:→|->|=>)\s*/g, ' : ')
    .replace(/\n{2,}/g, '. ')
    .trim();
}

function frenchVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith('fr') && /natural|online/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith('fr'));
}

/**
 * Lit le texte et alimente `level` (0 → 1) à chaque mot prononcé, pour que le Noyau pulse au rythme de la voix.
 */
export function speak(text: string, level: { current: number }, callbacks: { onStart?: () => void; onEnd?: () => void } = {}): SpeakHandle {
  if (!voiceAvailable()) {
    callbacks.onEnd?.();
    return { stop: () => undefined };
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(speakableText(text));
  utterance.lang = 'fr-FR';
  const voice = frenchVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 1;

  let decay = 0;
  const fall = () => {
    level.current *= 0.86;
    if (level.current > 0.02) decay = window.setTimeout(fall, 40);
  };
  utterance.onstart = () => callbacks.onStart?.();
  utterance.onboundary = (e) => {
    // Chaque mot fait « battre » le noyau ; l'intensité suit la longueur du mot.
    level.current = Math.min(1, 0.45 + (e.charLength ?? 4) / 14);
    clearTimeout(decay);
    decay = window.setTimeout(fall, 60);
  };
  utterance.onend = () => {
    level.current = 0;
    callbacks.onEnd?.();
  };
  utterance.onerror = () => {
    level.current = 0;
    callbacks.onEnd?.();
  };
  synth.speak(utterance);

  return {
    stop() {
      synth.cancel();
      level.current = 0;
    },
  };
}

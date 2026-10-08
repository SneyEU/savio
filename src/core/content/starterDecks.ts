/**
 * Contenu de démarrage — rédigé pour Savio, publié sous CC BY-SA 4.0.
 * Les contenus religieux indiquent leur référence ; ne garder ici que des points
 * faisant consensus. Les points sujets à divergence iront dans le module RAG sourcé (phase 3).
 */
import type { ReviewItemKind, Skill, SubjectId } from '../domain/types';

export interface StarterCard {
  key: string;
  skillId: string;
  kind: ReviewItemKind;
  front: string;
  back: string;
  note?: string;
  source?: string;
}

export interface StarterDeck {
  subjectId: SubjectId;
  skills: Skill[];
  cards: StarterCard[];
}

const spanish: StarterDeck = {
  subjectId: 'spanish',
  skills: [
    { id: 'es.greetings', subjectId: 'spanish', title: 'Salutations', prerequisites: [] },
    { id: 'es.ser-estar', subjectId: 'spanish', title: 'Ser et estar', prerequisites: ['es.greetings'] },
    { id: 'es.numbers', subjectId: 'spanish', title: 'Nombres de 1 à 10', prerequisites: [] },
  ],
  cards: [
    { key: 'es-1', skillId: 'es.greetings', kind: 'vocabulary', front: 'Bonjour', back: 'Hola', note: '« Buenos días » le matin.' },
    { key: 'es-2', skillId: 'es.greetings', kind: 'vocabulary', front: 'Merci beaucoup', back: 'Muchas gracias' },
    { key: 'es-3', skillId: 'es.greetings', kind: 'vocabulary', front: 'Comment ça va ?', back: '¿Qué tal?', note: 'Plus formel : « ¿Cómo está usted? »' },
    { key: 'es-4', skillId: 'es.greetings', kind: 'vocabulary', front: 'À bientôt', back: 'Hasta pronto' },
    { key: 'es-5', skillId: 'es.ser-estar', kind: 'rule', front: 'Ser ou estar : « Je suis fatigué »', back: 'Estoy cansado', note: 'État passager → estar.' },
    { key: 'es-6', skillId: 'es.ser-estar', kind: 'rule', front: 'Ser ou estar : « Je suis français »', back: 'Soy francés', note: 'Identité, origine → ser.' },
    { key: 'es-7', skillId: 'es.ser-estar', kind: 'rule', front: 'Ser ou estar : « Le café est à Madrid »', back: 'El café está en Madrid', note: 'Localisation → estar.' },
    { key: 'es-8', skillId: 'es.numbers', kind: 'vocabulary', front: 'trois', back: 'tres' },
    { key: 'es-9', skillId: 'es.numbers', kind: 'vocabulary', front: 'sept', back: 'siete' },
    { key: 'es-10', skillId: 'es.numbers', kind: 'vocabulary', front: 'dix', back: 'diez' },
  ],
};

const english: StarterDeck = {
  subjectId: 'english',
  skills: [
    { id: 'en.daily', subjectId: 'english', title: 'Expressions du quotidien', prerequisites: [] },
    { id: 'en.false-friends', subjectId: 'english', title: 'Faux amis', prerequisites: [] },
  ],
  cards: [
    { key: 'en-1', skillId: 'en.daily', kind: 'vocabulary', front: 'Je suis en retard', back: "I'm running late" },
    { key: 'en-2', skillId: 'en.daily', kind: 'vocabulary', front: 'Ça ne me dérange pas', back: "I don't mind" },
    { key: 'en-3', skillId: 'en.daily', kind: 'vocabulary', front: 'Pouvez-vous répéter ?', back: 'Could you say that again?' },
    { key: 'en-4', skillId: 'en.false-friends', kind: 'definition', front: '« actually » signifie…', back: 'en fait / en réalité', note: '« actuellement » se dit « currently ».' },
    { key: 'en-5', skillId: 'en.false-friends', kind: 'definition', front: '« library » signifie…', back: 'bibliothèque', note: '« librairie » se dit « bookshop ».' },
    { key: 'en-6', skillId: 'en.false-friends', kind: 'definition', front: '« eventually » signifie…', back: 'finalement / à terme', note: '« éventuellement » se dit « possibly ».' },
  ],
};

const chess: StarterDeck = {
  subjectId: 'chess',
  skills: [
    { id: 'chess.values', subjectId: 'chess', title: 'Valeur des pièces', prerequisites: [] },
    { id: 'chess.opening-principles', subjectId: 'chess', title: "Principes d'ouverture", prerequisites: ['chess.values'] },
    { id: 'chess.rules', subjectId: 'chess', title: 'Règles spéciales', prerequisites: [] },
  ],
  cards: [
    { key: 'ch-1', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’un cavalier', back: '3 points', note: 'Pion 1, fou 3, tour 5, dame 9.' },
    { key: 'ch-2', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’une tour', back: '5 points' },
    { key: 'ch-3', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’une dame', back: '9 points' },
    { key: 'ch-4', skillId: 'chess.opening-principles', kind: 'concept', front: 'Trois principes d’ouverture', back: 'Contrôler le centre, développer les pièces mineures, mettre le roi à l’abri (roquer).' },
    { key: 'ch-5', skillId: 'chess.opening-principles', kind: 'concept', front: 'Pourquoi éviter de sortir la dame trop tôt ?', back: 'Elle devient une cible : l’adversaire se développe en l’attaquant et gagne du temps.' },
    { key: 'ch-6', skillId: 'chess.rules', kind: 'rule', front: 'Prise en passant : quand est-elle possible ?', back: 'Juste après qu’un pion adverse a avancé de deux cases et s’est placé à côté de votre pion ; uniquement au coup suivant.' },
    { key: 'ch-7', skillId: 'chess.rules', kind: 'rule', front: 'Peut-on roquer pour sortir d’un échec ?', back: 'Non. On ne peut pas roquer en étant en échec, ni en traversant une case attaquée.' },
  ],
};

const islam: StarterDeck = {
  subjectId: 'islam',
  skills: [
    { id: 'islam.pillars', subjectId: 'islam', title: "Les piliers de l'islam", prerequisites: [] },
    { id: 'islam.sira-basics', subjectId: 'islam', title: 'Sîra : repères', prerequisites: [] },
  ],
  cards: [
    {
      key: 'is-1',
      skillId: 'islam.pillars',
      kind: 'fact',
      front: "Quels sont les cinq piliers de l'islam ?",
      back: 'L’attestation de foi (shahâda), la prière (salât), l’aumône légale (zakât), le jeûne du Ramadan (sawm) et le pèlerinage (hajj) pour qui en a la capacité.',
      source: 'Sahîh al-Bukhârî n° 8 ; Sahîh Muslim n° 16',
    },
    {
      key: 'is-2',
      skillId: 'islam.pillars',
      kind: 'fact',
      front: 'Combien de prières obligatoires par jour ?',
      back: 'Cinq : Fajr, Dhuhr, ‘Asr, Maghrib, ‘Ishâ’.',
      source: 'Sahîh al-Bukhârî n° 349 (récit de l’ascension)',
    },
    {
      key: 'is-3',
      skillId: 'islam.pillars',
      kind: 'fact',
      front: 'Quel verset prescrit le jeûne aux croyants ?',
      back: 'Sourate Al-Baqara, verset 183.',
      source: 'Coran 2:183',
    },
    {
      key: 'is-4',
      skillId: 'islam.pillars',
      kind: 'fact',
      front: 'Le pèlerinage (hajj) est obligatoire pour qui ?',
      back: 'Pour celui qui en a la capacité (physique et matérielle), une fois dans sa vie.',
      source: 'Coran 3:97',
    },
    {
      key: 'is-5',
      skillId: 'islam.sira-basics',
      kind: 'fact',
      front: 'Quels sont les premiers versets révélés selon le récit rapporté par Bukhârî ?',
      back: 'Le début de la sourate Al-‘Alaq (96:1-5), « Lis… ».',
      source: 'Sahîh al-Bukhârî n° 3 ; Coran 96:1-5',
    },
  ],
};

export const STARTER_DECKS: Partial<Record<SubjectId, StarterDeck>> = { spanish, english, chess, islam };

export const SUBJECT_CATALOG: { id: SubjectId; label: string; emoji: string; hasStarterContent: boolean }[] = [
  { id: 'spanish', label: 'Espagnol', emoji: '🇪🇸', hasStarterContent: true },
  { id: 'english', label: 'Anglais', emoji: '🇬🇧', hasStarterContent: true },
  { id: 'chess', label: 'Échecs', emoji: '♟', hasStarterContent: true },
  { id: 'islam', label: 'Islam', emoji: '☪', hasStarterContent: true },
  { id: 'arabic', label: 'Arabe', emoji: '🔤', hasStarterContent: false },
  { id: 'french', label: 'Français', emoji: '🇫🇷', hasStarterContent: false },
  { id: 'german', label: 'Allemand', emoji: '🇩🇪', hasStarterContent: false },
  { id: 'italian', label: 'Italien', emoji: '🇮🇹', hasStarterContent: false },
  { id: 'math', label: 'Mathématiques', emoji: '∑', hasStarterContent: false },
];

export function subjectLabel(id: SubjectId): string {
  return SUBJECT_CATALOG.find((s) => s.id === id)?.label ?? id;
}

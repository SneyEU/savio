/**
 * Decks de démarrage — religions. Contenu original, CC BY-SA 4.0.
 * Règle : uniquement des points largement admis au sein de chaque tradition, chacun avec une référence.
 * Les questions qui font débat entre écoles sont réservées au module sourcé (RAG, phase 3).
 */
import { deck, type StarterDeck } from './types';

export const RELIGION_DECKS: StarterDeck[] = [
  deck(
    'islam',
    [
      { id: 'islam.pillars', title: "Les piliers de l'islam" },
      { id: 'islam.sira-basics', title: 'Sîra : repères' },
    ],
    [
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
      { key: 'is-3', skillId: 'islam.pillars', kind: 'fact', front: 'Quel verset prescrit le jeûne aux croyants ?', back: 'Sourate Al-Baqara, verset 183.', source: 'Coran 2:183' },
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
  ),
  deck(
    'christianity',
    [
      { id: 'chr.texts', title: 'Les textes' },
      { id: 'chr.feasts', title: 'Fêtes et traditions' },
    ],
    [
      {
        key: 'chr-1',
        skillId: 'chr.texts',
        kind: 'fact',
        front: 'Quels sont les quatre Évangiles du Nouveau Testament ?',
        back: 'Matthieu, Marc, Luc et Jean.',
        source: 'Nouveau Testament',
      },
      {
        key: 'chr-2',
        skillId: 'chr.texts',
        kind: 'fact',
        front: 'Où trouve-t-on la prière du Notre Père ?',
        back: 'Dans l’Évangile selon Matthieu et dans celui selon Luc.',
        source: 'Matthieu 6:9-13 ; Luc 11:2-4',
      },
      {
        key: 'chr-3',
        skillId: 'chr.feasts',
        kind: 'fact',
        front: 'Que célèbre Pâques pour les chrétiens ?',
        back: 'La résurrection de Jésus.',
        source: 'Matthieu 28 ; Marc 16 ; Luc 24 ; Jean 20',
      },
      {
        key: 'chr-4',
        skillId: 'chr.feasts',
        kind: 'fact',
        front: 'Que célèbre Noël ?',
        back: 'La naissance de Jésus.',
        source: 'Luc 2:1-20 ; Matthieu 1:18-2:12',
      },
      {
        key: 'chr-5',
        skillId: 'chr.feasts',
        kind: 'fact',
        front: 'Quelles sont les trois grandes branches du christianisme ?',
        back: 'Le catholicisme, l’orthodoxie et le protestantisme.',
        note: 'Il existe aussi les Églises orientales anciennes (copte, arménienne…).',
      },
    ],
  ),
  deck(
    'judaism',
    [
      { id: 'jud.texts', title: 'Les textes' },
      { id: 'jud.feasts', title: 'Fêtes et pratiques' },
    ],
    [
      {
        key: 'jud-1',
        skillId: 'jud.texts',
        kind: 'fact',
        front: 'Quels sont les cinq livres de la Torah ?',
        back: 'Genèse (Bereshit), Exode (Shemot), Lévitique (Vayikra), Nombres (Bamidbar), Deutéronome (Devarim).',
        source: 'Torah (Pentateuque)',
      },
      {
        key: 'jud-2',
        skillId: 'jud.texts',
        kind: 'fact',
        front: 'Quelle prière proclame l’unicité de Dieu ?',
        back: 'Le Shema Israël : « Écoute, Israël, l’Éternel est notre Dieu, l’Éternel est un. »',
        source: 'Deutéronome 6:4',
      },
      {
        key: 'jud-3',
        skillId: 'jud.feasts',
        kind: 'fact',
        front: 'Quand commence et finit le Shabbat ?',
        back: 'Du vendredi au coucher du soleil jusqu’au samedi soir, à la tombée de la nuit.',
        source: 'Genèse 2:2-3 ; Exode 20:8-11',
      },
      {
        key: 'jud-4',
        skillId: 'jud.feasts',
        kind: 'fact',
        front: 'Que commémore Pessa’h (la Pâque juive) ?',
        back: 'La sortie d’Égypte des Hébreux.',
        source: 'Exode 12',
      },
      {
        key: 'jud-5',
        skillId: 'jud.feasts',
        kind: 'fact',
        front: 'Qu’est-ce que Yom Kippour ?',
        back: 'Le jour du Grand Pardon, consacré au jeûne et à la prière.',
        source: 'Lévitique 16:29-31 ; 23:27',
      },
    ],
  ),
];

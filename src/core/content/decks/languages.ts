/** Decks de démarrage — langues. Contenu original, CC BY-SA 4.0. */
import { deck, type StarterDeck } from './types';

const basics = (prefix: string, rows: [string, string, string?][]) =>
  rows.map(([front, back, note], i) => ({
    key: `${prefix}-${i + 1}`,
    skillId: `${prefix}.basics`,
    kind: 'vocabulary' as const,
    front,
    back,
    note,
  }));

export const LANGUAGE_DECKS: StarterDeck[] = [
  deck(
    'spanish',
    [
      { id: 'es.greetings', title: 'Salutations' },
      { id: 'es.ser-estar', title: 'Ser et estar', prerequisites: ['es.greetings'] },
      { id: 'es.numbers', title: 'Nombres de 1 à 10' },
    ],
    [
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
  ),
  deck(
    'english',
    [
      { id: 'en.daily', title: 'Expressions du quotidien' },
      { id: 'en.false-friends', title: 'Faux amis' },
    ],
    [
      { key: 'en-1', skillId: 'en.daily', kind: 'vocabulary', front: 'Je suis en retard', back: "I'm running late" },
      { key: 'en-2', skillId: 'en.daily', kind: 'vocabulary', front: 'Ça ne me dérange pas', back: "I don't mind" },
      { key: 'en-3', skillId: 'en.daily', kind: 'vocabulary', front: 'Pouvez-vous répéter ?', back: 'Could you say that again?' },
      { key: 'en-4', skillId: 'en.false-friends', kind: 'definition', front: '« actually » signifie…', back: 'en fait / en réalité', note: '« actuellement » se dit « currently ».' },
      { key: 'en-5', skillId: 'en.false-friends', kind: 'definition', front: '« library » signifie…', back: 'bibliothèque', note: '« librairie » se dit « bookshop ».' },
      { key: 'en-6', skillId: 'en.false-friends', kind: 'definition', front: '« eventually » signifie…', back: 'finalement / à terme', note: '« éventuellement » se dit « possibly ».' },
    ],
  ),
  deck(
    'german',
    [{ id: 'de.basics', title: 'Premiers mots' }],
    basics('de', [
      ['Bonjour', 'Guten Tag', '« Hallo » est plus familier.'],
      ['Merci', 'Danke'],
      ['S’il vous plaît', 'Bitte', '« Bitte » veut aussi dire « de rien ».'],
      ['Au revoir', 'Auf Wiedersehen', 'Familier : « Tschüss ».'],
      ['Je m’appelle…', 'Ich heiße…'],
    ]),
  ),
  deck(
    'italian',
    [{ id: 'it.basics', title: 'Premiers mots' }],
    basics('it', [
      ['Bonjour', 'Buongiorno'],
      ['Merci', 'Grazie'],
      ['S’il vous plaît', 'Per favore'],
      ['Au revoir', 'Arrivederci', 'Familier : « Ciao ».'],
      ['Je m’appelle…', 'Mi chiamo…'],
    ]),
  ),
  deck(
    'portuguese',
    [{ id: 'pt.basics', title: 'Premiers mots' }],
    basics('pt', [
      ['Bonjour', 'Bom dia'],
      ['Merci', 'Obrigado / Obrigada', 'Accordé selon la personne qui parle : obrigado (homme), obrigada (femme).'],
      ['S’il vous plaît', 'Por favor'],
      ['Au revoir', 'Tchau', 'Plus formel : « Adeus ».'],
      ['Je m’appelle…', 'Chamo-me… (Portugal) / Eu me chamo… (Brésil)'],
    ]),
  ),
  deck(
    'dutch',
    [{ id: 'nl.basics', title: 'Premiers mots' }],
    basics('nl', [
      ['Bonjour', 'Goedendag', 'Courant : « Hallo » ou « Hoi ».'],
      ['Merci', 'Dank je wel', 'Vouvoiement : « Dank u wel ».'],
      ['S’il vous plaît', 'Alsjeblieft', 'Vouvoiement : « Alstublieft ».'],
      ['Au revoir', 'Tot ziens'],
      ['Je m’appelle…', 'Ik heet…'],
    ]),
  ),
  deck(
    'arabic',
    [{ id: 'ar.basics', title: 'Premiers mots' }],
    basics('ar', [
      ['Bonjour', 'مرحبا (marḥaban)'],
      ['La paix soit sur vous', 'السلام عليكم (as-salāmu ʿalaykum)', 'Réponse : وعليكم السلام (wa ʿalaykum as-salām).'],
      ['Merci', 'شكرا (shukran)'],
      ['Oui', 'نعم (naʿam)'],
      ['Non', 'لا (lā)'],
    ]),
  ),
  deck(
    'japanese',
    [{ id: 'ja.basics', title: 'Premiers mots' }],
    basics('ja', [
      ['Bonjour', 'こんにちは (konnichiwa)'],
      ['Merci', 'ありがとう (arigatō)', 'Plus poli : ありがとうございます (arigatō gozaimasu).'],
      ['Oui', 'はい (hai)'],
      ['Excusez-moi / pardon', 'すみません (sumimasen)'],
      ['Au revoir', 'さようなら (sayōnara)', 'Souvent remplacé par « じゃあね » (jā ne) entre amis.'],
    ]),
  ),
  deck(
    'chinese',
    [{ id: 'zh.basics', title: 'Premiers mots' }],
    basics('zh', [
      ['Bonjour', '你好 (nǐ hǎo)'],
      ['Merci', '谢谢 (xièxie)'],
      ['Pardon', '对不起 (duìbuqǐ)'],
      ['Au revoir', '再见 (zàijiàn)'],
      ['Je m’appelle…', '我叫… (wǒ jiào…)'],
    ]),
  ),
];

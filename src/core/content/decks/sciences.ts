/** Decks de démarrage — maths et sciences. Contenu original, CC BY-SA 4.0. */
import { deck, type StarterDeck } from './types';

export const SCIENCE_DECKS: StarterDeck[] = [
  deck(
    'math',
    [
      { id: 'math.algebra', title: 'Identités remarquables' },
      { id: 'math.geometry', title: 'Géométrie' },
      { id: 'math.analysis', title: 'Dérivées', prerequisites: ['math.algebra'] },
    ],
    [
      { key: 'ma-1', skillId: 'math.algebra', kind: 'formula', front: '(a + b)² = ?', back: 'a² + 2ab + b²' },
      { key: 'ma-2', skillId: 'math.algebra', kind: 'formula', front: '(a − b)(a + b) = ?', back: 'a² − b²' },
      { key: 'ma-3', skillId: 'math.geometry', kind: 'formula', front: 'Aire d’un disque de rayon r', back: 'π r²' },
      { key: 'ma-4', skillId: 'math.geometry', kind: 'rule', front: 'Théorème de Pythagore', back: 'Dans un triangle rectangle d’hypoténuse c : a² + b² = c².' },
      { key: 'ma-5', skillId: 'math.analysis', kind: 'formula', front: 'Dérivée de xⁿ', back: 'n·xⁿ⁻¹' },
    ],
  ),
  deck(
    'physics',
    [{ id: 'phy.basics', title: 'Lois fondamentales' }],
    [
      { key: 'ph-1', skillId: 'phy.basics', kind: 'formula', front: 'Deuxième loi de Newton', back: 'F = m·a' },
      { key: 'ph-2', skillId: 'phy.basics', kind: 'fact', front: 'Vitesse de la lumière dans le vide', back: '299 792 458 m/s (environ 300 000 km/s).' },
      { key: 'ph-3', skillId: 'phy.basics', kind: 'formula', front: 'Loi d’Ohm', back: 'U = R·I' },
    ],
  ),
];

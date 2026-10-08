/** Decks de démarrage — jeux de stratégie. Contenu original, CC BY-SA 4.0. */
import { deck, type StarterDeck } from './types';

export const STRATEGY_DECKS: StarterDeck[] = [
  deck(
    'chess',
    [
      { id: 'chess.values', title: 'Valeur des pièces' },
      { id: 'chess.opening-principles', title: "Principes d'ouverture", prerequisites: ['chess.values'] },
      { id: 'chess.rules', title: 'Règles spéciales' },
    ],
    [
      { key: 'ch-1', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’un cavalier', back: '3 points', note: 'Pion 1, fou 3, tour 5, dame 9.' },
      { key: 'ch-2', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’une tour', back: '5 points' },
      { key: 'ch-3', skillId: 'chess.values', kind: 'fact', front: 'Valeur conventionnelle d’une dame', back: '9 points' },
      { key: 'ch-4', skillId: 'chess.opening-principles', kind: 'concept', front: 'Trois principes d’ouverture', back: 'Contrôler le centre, développer les pièces mineures, mettre le roi à l’abri (roquer).' },
      { key: 'ch-5', skillId: 'chess.opening-principles', kind: 'concept', front: 'Pourquoi éviter de sortir la dame trop tôt ?', back: 'Elle devient une cible : l’adversaire se développe en l’attaquant et gagne du temps.' },
      { key: 'ch-6', skillId: 'chess.rules', kind: 'rule', front: 'Prise en passant : quand est-elle possible ?', back: 'Juste après qu’un pion adverse a avancé de deux cases et s’est placé à côté de votre pion ; uniquement au coup suivant.' },
      { key: 'ch-7', skillId: 'chess.rules', kind: 'rule', front: 'Peut-on roquer pour sortir d’un échec ?', back: 'Non. On ne peut pas roquer en étant en échec, ni en traversant une case attaquée.' },
    ],
  ),
  deck(
    'shogi',
    [{ id: 'shogi.rules', title: 'Règles du shogi' }],
    [
      { key: 'sh-1', skillId: 'shogi.rules', kind: 'fact', front: 'Taille du plateau de shogi', back: '9 × 9 cases, soit 81 cases.' },
      { key: 'sh-2', skillId: 'shogi.rules', kind: 'rule', front: 'Que devient une pièce capturée au shogi ?', back: 'Elle passe dans la réserve du joueur qui l’a prise, qui peut ensuite la parachuter sur le plateau.', note: 'C’est la grande différence avec les échecs occidentaux.' },
      { key: 'sh-3', skillId: 'shogi.rules', kind: 'rule', front: 'Où se fait la promotion au shogi ?', back: 'Dans la zone de promotion : les trois dernières rangées, côté adversaire.' },
      { key: 'sh-4', skillId: 'shogi.rules', kind: 'rule', front: 'Peut-on parachuter un pion pour mater directement ?', back: 'Non, le mat par parachutage de pion (uchifuzume) est interdit.' },
      { key: 'sh-5', skillId: 'shogi.rules', kind: 'rule', front: 'Peut-on avoir deux pions non promus sur la même colonne ?', back: 'Non, c’est le « nifu », une faute qui fait perdre la partie.' },
    ],
  ),
  deck(
    'xiangqi',
    [{ id: 'xq.rules', title: 'Règles du xiangqi' }],
    [
      { key: 'xq-1', skillId: 'xq.rules', kind: 'fact', front: 'Sur quoi se jouent les pièces au xiangqi ?', back: 'Sur les intersections d’une grille de 9 × 10 lignes, coupée en deux par une « rivière ».' },
      { key: 'xq-2', skillId: 'xq.rules', kind: 'rule', front: 'Le général peut-il quitter le palais ?', back: 'Non, il reste dans le palais de 3 × 3 intersections.' },
      { key: 'xq-3', skillId: 'xq.rules', kind: 'rule', front: 'Les deux généraux peuvent-ils se faire face ?', back: 'Non : ils ne doivent jamais se trouver face à face sur une même colonne sans pièce entre eux.' },
      { key: 'xq-4', skillId: 'xq.rules', kind: 'rule', front: 'Comment le canon capture-t-il ?', back: 'Il doit sauter par-dessus exactement une pièce (de n’importe quel camp) pour prendre.' },
      { key: 'xq-5', skillId: 'xq.rules', kind: 'rule', front: 'Les éléphants peuvent-ils traverser la rivière ?', back: 'Non, ils restent dans leur propre camp.' },
    ],
  ),
  deck(
    'go',
    [{ id: 'go.rules', title: 'Règles du go' }],
    [
      { key: 'go-1', skillId: 'go.rules', kind: 'fact', front: 'Taille du goban standard', back: '19 × 19 lignes.', note: 'Les débutants commencent souvent en 9 × 9.' },
      { key: 'go-2', skillId: 'go.rules', kind: 'definition', front: 'Qu’est-ce qu’une liberté au go ?', back: 'Une intersection vide directement adjacente à une pierre ou à un groupe.' },
      { key: 'go-3', skillId: 'go.rules', kind: 'rule', front: 'Quand un groupe est-il capturé ?', back: 'Quand il n’a plus aucune liberté.' },
      { key: 'go-4', skillId: 'go.rules', kind: 'rule', front: 'Que dit la règle du ko ?', back: 'On ne peut pas reprendre immédiatement si cela recrée la position précédente.' },
      { key: 'go-5', skillId: 'go.rules', kind: 'definition', front: 'Qu’est-ce que le komi ?', back: 'Les points de compensation donnés à Blanc, qui joue en second.' },
    ],
  ),
  deck(
    'draughts',
    [{ id: 'dr.rules', title: 'Règles des dames internationales' }],
    [
      { key: 'dr-1', skillId: 'dr.rules', kind: 'fact', front: 'Taille du damier aux dames internationales', back: '10 × 10 cases, 20 pions par joueur.' },
      { key: 'dr-2', skillId: 'dr.rules', kind: 'rule', front: 'La prise est-elle obligatoire ?', back: 'Oui, et il faut choisir la rafle qui prend le plus de pièces.' },
      { key: 'dr-3', skillId: 'dr.rules', kind: 'rule', front: 'Comment se déplace une dame ?', back: 'En diagonale, d’autant de cases libres qu’elle le souhaite.' },
      { key: 'dr-4', skillId: 'dr.rules', kind: 'rule', front: 'Un pion peut-il prendre en arrière ?', back: 'Oui, aux dames internationales un pion prend en avant comme en arrière.' },
    ],
  ),
];

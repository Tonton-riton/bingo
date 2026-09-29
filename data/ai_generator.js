/**
 * AI Career Bingo Generator
 * Generates custom, coherent bingo grids for Football Career / Manager mode
 * based on grid size (3x3, 4x4, 5x5), difficulty degree, and thematic focus.
 */

'use strict';

const CHALLENGES_DATABASE = [
  // ─── FACILE (1-2 pts) ────────────────────────────────────────────────────────
  {
    id: 'clean_sheet_home',
    icon: '🛡️',
    title: 'Clean Sheet Domicile',
    description: 'Enchaîner 5 matchs sans encaisser de but à domicile en championnat',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Défense',
    themes: ['realistic', 'defense', 'classic']
  },
  {
    id: 'balance_pos',
    icon: '💰',
    title: 'Balance Positive',
    description: 'Bénéfice transferts >= +10M€ sur les mercatos de la saison',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Finance',
    themes: ['realistic', 'moneyball', 'classic']
  },
  {
    id: 'academie_debut',
    icon: '🌱',
    title: 'Éclosion Académie',
    description: 'Promouvoir 3 jeunes du centre de formation et leur faire jouer 10+ matchs',
    constraint: '1 saison | D2',
    points: 1,
    difficulty: 'easy',
    category: 'Formation',
    themes: ['realistic', 'academy', 'classic']
  },
  {
    id: 'tactique_stable',
    icon: '📋',
    title: 'Tactique Immuable',
    description: 'Conserver exactement le même dispositif tactique sur 100% des matchs',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Tactique',
    themes: ['realistic', 'classic']
  },
  {
    id: 'festival_offensif',
    icon: '🔥',
    title: 'Festival Offensif',
    description: 'Marquer 5 buts ou plus dans un seul match officiel',
    constraint: '1 match | Toutes comp.',
    points: 1,
    difficulty: 'easy',
    category: 'Attaque',
    themes: ['classic', 'fun']
  },
  {
    id: 'recrue_libre',
    icon: '🤝',
    title: 'Coup de Maître Gratuit',
    description: 'Signer un joueur libre de contrat qui participe à 10+ buts ou clean sheets',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Transferts',
    themes: ['realistic', 'moneyball', 'classic']
  },
  {
    id: 'remontada_express',
    icon: '⚡',
    title: 'Remontada Épique',
    description: 'Gagner un match officiel après avoir été mené par 2 buts d’écart',
    constraint: '1 match | Toutes comp.',
    points: 1,
    difficulty: 'easy',
    category: 'Mental',
    themes: ['classic', 'fun', 'rivalry']
  },
  {
    id: 'rigueur_salaire',
    icon: '📉',
    title: 'Rigueur Salariale',
    description: 'Baisser la masse salariale du club de 15% tout en restant dans le Top 6',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Finance',
    themes: ['realistic', 'moneyball']
  },
  {
    id: 'vocation_selection',
    icon: '🌍',
    title: 'Vocation Internationale',
    description: 'Un joueur issu de votre centre de formation appelé en équipe nationale',
    constraint: '1-2 saisons | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Formation',
    themes: ['academy', 'classic']
  },
  {
    id: 'confiance_dirigeants',
    icon: '👔',
    title: 'Confiance Totale',
    description: 'Terminer la saison avec une note de confiance du Conseil d’Admin > 85',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Gestion',
    themes: ['realistic', 'classic']
  },
  {
    id: 'roi_passe_accessible',
    icon: '👟',
    title: 'Distributeur de Caviar',
    description: 'Avoir un joueur avec au moins 12 passes décisives en championnat',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Attaque',
    themes: ['classic']
  },
  {
    id: 'buteur_starter',
    icon: '⚽',
    title: 'Renard des Surfaces',
    description: 'Avoir un buteur qui atteint la barre des 18 buts en championnat',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Attaque',
    themes: ['classic']
  },
  {
    id: 'remplacant_or',
    icon: '⏱️',
    title: 'Super-Sub Décisif',
    description: 'Faire marquer un joueur entrant en cours de jeu à 4 reprises dans la saison',
    constraint: '1 saison | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Tactique',
    themes: ['realistic', 'classic']
  },
  {
    id: 'derby_aller',
    icon: '⚔️',
    title: 'Honneur du Derby',
    description: 'Gagner le match aller contre votre plus grand rival historique',
    constraint: '1 match | D2/D1',
    points: 1,
    difficulty: 'easy',
    category: 'Rivalité',
    themes: ['rivalry', 'classic']
  },

  // ─── MOYEN / ÉQUILIBRÉ (2-3 pts) ───────────────────────────────────────────
  {
    id: 'invincibilite_dom',
    icon: '🛡️',
    title: 'Invincibilité Domicile',
    description: '0 défaite à domicile sur toute la saison en championnat',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Défense',
    themes: ['realistic', 'defense', 'classic']
  },
  {
    id: 'attaque_mitraillette',
    icon: '🎯',
    title: 'Attaque Mitraillette',
    description: 'Marquer 75 buts ou plus en championnat sur la saison',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Attaque',
    themes: ['classic', 'fun']
  },
  {
    id: 'forteresse_def',
    icon: '🧱',
    title: 'Forteresse Défensive',
    description: 'Terminer meilleure défense du championnat avec moins de 28 buts encaissés',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Défense',
    themes: ['realistic', 'defense']
  },
  {
    id: 'mercato_gele',
    icon: '🔒',
    title: 'Mercato Totalement Gelé',
    description: '0 achat et 0 prêt entrant pendant l’intégralité de la saison',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Transferts',
    themes: ['realistic', 'academy']
  },
  {
    id: 'montee_directe',
    icon: '🚀',
    title: 'Montée Directe',
    description: 'Obtenir la promotion en division supérieure (1ère ou 2ème place)',
    constraint: '1-2 saisons | D2',
    points: 2,
    difficulty: 'medium',
    category: 'Succès',
    themes: ['realistic', 'classic']
  },
  {
    id: 'vente_galactique',
    icon: '💎',
    title: 'Vente Galactique',
    description: 'Vente sèche d’un joueur pour un montant supérieur ou égal à 50M€',
    constraint: '1-3 saisons | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Transferts',
    themes: ['moneyball', 'classic']
  },
  {
    id: 'joker_adversaire',
    icon: '🃏',
    title: 'JOKER ADVERSAIRE',
    description: 'Défi secret ou contrainte imposée en direct par votre rival de stream',
    constraint: '1 saison | Choix rival',
    points: 2,
    difficulty: 'medium',
    category: 'Rivalité',
    themes: ['rivalry', 'fun']
  },
  {
    id: 'discipline_podium',
    icon: '🟥',
    title: 'Discipline & Podium',
    description: 'Recevoir au moins 5 cartons rouges dans la saison et finir dans le Top 4',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Discipline',
    themes: ['fun', 'realistic']
  },
  {
    id: 'soulier_or_club',
    icon: '👟',
    title: 'Soulier d’Or Club',
    description: 'Avoir le meilleur buteur officiel du championnat avec 25+ buts marqués',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Attaque',
    themes: ['classic']
  },
  {
    id: 'coffre_fort',
    icon: '🏦',
    title: 'Coffre-Fort 100M€',
    description: 'Accumuler au moins 100M€ de budget transfert disponible dans les caisses',
    constraint: '2-3 saisons | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Finance',
    themes: ['moneyball']
  },
  {
    id: 'duo_choc',
    icon: '👥',
    title: 'Duo Explosif',
    description: 'Deux joueurs de l’effectif dépassent chacun les 15 buts en championnat',
    constraint: '1 saison | D2/D1',
    points: 2,
    difficulty: 'medium',
    category: 'Attaque',
    themes: ['classic']
  },
  {
    id: 'catenaccio_italien',
    icon: '🛡️',
    title: 'Catenaccio Pur',
    description: 'Gagner 6 matchs consécutifs sans jamais encaisser le moindre but',
    constraint: '1 saison | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Défense',
    themes: ['defense', 'realistic']
  },
  {
    id: 'maitre_derby',
    icon: '⚔️',
    title: 'Maître du Derby',
    description: 'Battre son rival historique à l’aller ET au retour en championnat',
    constraint: '1 saison | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Rivalité',
    themes: ['rivalry', 'classic']
  },
  {
    id: 'plus_value_x3',
    icon: '📈',
    title: 'Plus-Value x3',
    description: 'Revendre un joueur au moins 3 fois le montant déboursé pour son achat',
    constraint: '1-3 saisons | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Transferts',
    themes: ['moneyball', 'realistic']
  },
  {
    id: 'pepite_80',
    icon: '⭐',
    title: 'Pépite Générationnelle',
    description: 'Développer un jeune issu de votre centre de formation jusqu’à 80+ GEN',
    constraint: '2-4 saisons | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Formation',
    themes: ['academy', 'classic']
  },
  {
    id: 'epopee_coupe',
    icon: '🏆',
    title: 'Épopée en Coupe',
    description: 'Atteindre le dernier carré (demi-finale ou finale) de la coupe nationale',
    constraint: '1-2 saisons | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Coupe',
    themes: ['classic', 'realistic']
  },
  {
    id: 'onze_formation',
    icon: '🎓',
    title: 'Onze 100% Formation',
    description: 'Titulariser 7+ joueurs de l’académie lors d’une victoire officielle',
    constraint: '1-3 saisons | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Formation',
    themes: ['academy']
  },
  {
    id: 'maestro_milieu',
    icon: '🪄',
    title: 'Maestro du Milieu',
    description: 'Un milieu central cumule au moins 10 buts ET 10 passes décisives',
    constraint: '1 saison | D2/D1',
    points: 3,
    difficulty: 'medium',
    category: 'Attaque',
    themes: ['classic']
  },

  // ─── DIFFICILE / HARDCORE (3-4 pts) ─────────────────────────────────────────
  {
    id: 'invaincu_exterieur',
    icon: '🚌',
    title: 'Conquérants Extérieurs',
    description: 'Moins de 2 défaites à l’extérieur sur toute la saison de championnat',
    constraint: '1 saison | D2/D1',
    points: 3,
    difficulty: 'hard',
    category: 'Défense',
    themes: ['defense', 'realistic']
  },
  {
    id: 'jackpot_100m',
    icon: '💸',
    title: 'Jackpot Historique',
    description: 'Vente sèche d’un seul joueur pour un montant supérieur ou égal à 100M€',
    constraint: '2-4 saisons | D1',
    points: 4,
    difficulty: 'hard',
    category: 'Transferts',
    themes: ['moneyball', 'classic']
  },
  {
    id: 'sacre_coupe',
    icon: '🏆',
    title: 'Victoire en Coupe',
    description: 'Soulever la Coupe Nationale en battant un club de division supérieure',
    constraint: '1-3 saisons | D2/D1',
    points: 4,
    difficulty: 'hard',
    category: 'Coupe',
    themes: ['classic', 'realistic']
  },
  {
    id: 'monstre_academie_85',
    icon: '🌟',
    title: 'Légende de l’Académie',
    description: 'Amener un joueur pur produit de votre centre de formation à 85+ GEN',
    constraint: '3-5 saisons | D2/D1',
    points: 4,
    difficulty: 'hard',
    category: 'Formation',
    themes: ['academy']
  },
  {
    id: 'champion_express',
    icon: '🏎️',
    title: 'Champion Express',
    description: 'Valider mathématiquement le titre de champion au moins 4 journées avant la fin',
    constraint: '1-3 saisons | D2/D1',
    points: 4,
    difficulty: 'hard',
    category: 'Succès',
    themes: ['classic', 'realistic']
  },
  {
    id: 'humiliation_rival',
    icon: '🥊',
    title: 'Humiliation Rivale',
    description: 'Écraser votre rival historique avec au moins 4 buts d’écart dans le derby',
    constraint: '1 match | D2/D1',
    points: 4,
    difficulty: 'hard',
    category: 'Rivalité',
    themes: ['rivalry', 'fun']
  },
  {
    id: 'centurion_filets',
    icon: '💣',
    title: 'Centurion des Filets',
    description: 'Marquer plus de 90 buts en championnat sur une seule saison',
    constraint: '1 saison | D2/D1',
    points: 4,
    difficulty: 'hard',
    category: 'Attaque',
    themes: ['classic', 'fun']
  },
  {
    id: 'qualification_c1',
    icon: '⭐',
    title: 'Billet pour les Étoiles',
    description: 'Qualifier le club pour la plus prestigieuse compétition européenne (C1)',
    constraint: '2-4 saisons | D1',
    points: 4,
    difficulty: 'hard',
    category: 'Succès',
    themes: ['realistic', 'classic']
  },

  // ─── LÉGENDAIRE / ESPORT (5 pts) ───────────────────────────────────────────
  {
    id: 'titre_supreme_d1',
    icon: '🥇',
    title: 'Titre Suprême D1',
    description: 'Être sacré Champion de Première Division (D1) avec votre club',
    constraint: '2-5 saisons | D1',
    points: 5,
    difficulty: 'legendary',
    category: 'Succès',
    themes: ['classic', 'realistic']
  },
  {
    id: 'les_invincibles',
    icon: '👑',
    title: 'Les Invincibles',
    description: 'Terminer une saison complète de championnat avec ZERO défaite au compteur',
    constraint: '1 saison complète | D2/D1',
    points: 5,
    difficulty: 'legendary',
    category: 'Succès',
    themes: ['classic', 'defense']
  },
  {
    id: 'ballon_or_club',
    icon: '🌟',
    title: 'Trophée Ballon d’Or',
    description: 'Avoir un joueur de votre équipe élu Ballon d’Or ou dans le XI Mondial de l’Année',
    constraint: '2-5 saisons | D1',
    points: 5,
    difficulty: 'legendary',
    category: 'Trophée',
    themes: ['classic', 'academy']
  },
  {
    id: 'sacre_europeen',
    icon: '🏆',
    title: 'Gloire Continentale',
    description: 'Remporter la plus prestigieuse coupe européenne avec votre équipe',
    constraint: '3-6 saisons | D1',
    points: 5,
    difficulty: 'legendary',
    category: 'Trophée',
    themes: ['classic', 'realistic']
  },
  {
    id: 'grand_chelem_triplet',
    icon: '🔱',
    title: 'Le Triplé Historique',
    description: 'Réaliser le triplé magique dans la même saison : Championnat + Coupe + Europe',
    constraint: '1 saison | D1',
    points: 5,
    difficulty: 'legendary',
    category: 'Succès',
    themes: ['classic', 'realistic']
  }
];

const THEMES_CONFIG = {
  classic: {
    label: '⚽ Carrière Standard & Équilibrée',
    description: 'Le format classique de simulation : montée, transferts, derbys et progression.'
  },
  academy: {
    label: '👶 Académie & 100% Jeunes',
    description: 'Axé sur le centre de formation, la détection des pépites et zéro dépense folle.'
  },
  moneyball: {
    label: '💰 Moneyball & Mercato Business',
    description: 'Achat revente, plus-values géantes, gestion de la masse salariale et budget 100M€.'
  },
  defense: {
    label: '🛡️ Catenaccio & Mur Défensif',
    description: 'Clean sheets, invincibilité, forteresse à domicile et organisation tactique de fer.'
  },
  rivalry: {
    label: '⚔️ Derbys & Rivalités Stream',
    description: 'Défis piquants, jokers adverses, écraser le rival et remporter les chocs décisifs.'
  },
  fun: {
    label: '🎲 Mode Fun & Chaos',
    description: 'Cartons rouges, remontadas folles, contraintes déjantées pour animer le live stream.'
  },
  mixed: {
    label: '🌟 Mix Universel Complet',
    description: 'Sélection variée touchant tous les aspects d’une carrière de football complète.'
  }
};

const DIFFICULTY_CONFIG = {
  easy: {
    label: '🟢 Facile / Saison 1',
    description: 'Défis accessibles (1-2 pts) parfaits pour débuter une nouvelle carrière sans bloquer.',
    pointWeights: { 1: 0.65, 2: 0.35, 3: 0.0, 4: 0.0, 5: 0.0 },
    allowedDiffs: ['easy', 'medium']
  },
  medium: {
    label: '🟡 Équilibré / Standard',
    description: 'Mélange optimal de défis accessibles (1-2 pts) et de quelques défis relevés (3 pts).',
    pointWeights: { 1: 0.30, 2: 0.50, 3: 0.20, 4: 0.0, 5: 0.0 },
    allowedDiffs: ['easy', 'medium', 'hard']
  },
  hard: {
    label: '🔴 Difficile / Hardcore',
    description: 'Défis exigeants (2-4 pts) qui demandent rigueur tactique et plusieurs saisons de jeu.',
    pointWeights: { 1: 0.10, 2: 0.35, 3: 0.40, 4: 0.15, 5: 0.0 },
    allowedDiffs: ['medium', 'hard', 'legendary']
  },
  legendary: {
    label: '👑 Légendaire / Esport',
    description: 'Le défi ultime pour streamers chevronnés avec titres de D1, Ballon d’Or et Triplés (3-5 pts).',
    pointWeights: { 1: 0.0, 2: 0.15, 3: 0.35, 4: 0.25, 5: 0.25 },
    allowedDiffs: ['medium', 'hard', 'legendary']
  }
};

/**
 * Procedurally generates a full grid of challenges.
 * @param {object} options { size: 3|4|5, difficulty: string, theme: string }
 * @returns {object} { name, description, size, challenges }
 */
function generateGrid(options = {}) {
  const size = [3, 4, 5].includes(parseInt(options.size)) ? parseInt(options.size) : 5;
  const targetCount = size * size;
  const difficulty = DIFFICULTY_CONFIG[options.difficulty] ? options.difficulty : 'medium';
  const theme = THEMES_CONFIG[options.theme] ? options.theme : 'mixed';

  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const themeConfig = THEMES_CONFIG[theme];

  // Filter pool
  let pool = CHALLENGES_DATABASE.filter(c => {
    // Check difficulty eligibility
    if (!diffConfig.allowedDiffs.includes(c.difficulty)) return false;
    // Check theme eligibility
    if (theme !== 'mixed' && !c.themes.includes(theme)) return false;
    return true;
  });

  // If pool too small for specific theme, fallback to mixed of this difficulty
  if (pool.length < targetCount) {
    const fallback = CHALLENGES_DATABASE.filter(c => diffConfig.allowedDiffs.includes(c.difficulty));
    pool = [...pool, ...fallback.filter(f => !pool.some(p => p.id === f.id))];
  }

  // If still not enough, take from all database
  if (pool.length < targetCount) {
    pool = [...pool, ...CHALLENGES_DATABASE.filter(c => !pool.some(p => p.id === c.id))];
  }

  // Shuffle pool using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick targetCount items
  const selected = shuffled.slice(0, targetCount).map((item, idx) => ({
    id: idx,
    icon: item.icon || '🎯',
    title: item.title,
    description: item.description,
    constraint: item.constraint,
    points: item.points,
    category: item.category || 'Défi'
  }));

  // Give a dynamic title
  const diffLabels = {
    easy: 'Facile',
    medium: 'Équilibré',
    hard: 'Hardcore',
    legendary: 'Légendaire'
  };

  const title = `Bingo ${size}x${size} — ${diffLabels[difficulty]} (${themeConfig.label.split(' ')[1] || 'Carrière'})`;
  const desc = `Grille ${size}x${size} (${targetCount} défis) générée par IA • Difficulté : ${diffLabels[difficulty]} • Thème : ${themeConfig.label}`;

  return {
    name: title,
    description: desc,
    size,
    challenges: selected
  };
}

/**
 * Generate a single replacement challenge
 */
function generateSingleChallenge(options = {}) {
  const difficulty = options.difficulty || 'medium';
  const theme = options.theme || 'mixed';
  const excludeTitles = Array.isArray(options.excludeTitles) ? options.excludeTitles : [];

  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

  let candidates = CHALLENGES_DATABASE.filter(c => {
    if (excludeTitles.includes(c.title)) return false;
    if (!diffConfig.allowedDiffs.includes(c.difficulty)) return false;
    if (theme !== 'mixed' && !c.themes.includes(theme)) return false;
    return true;
  });

  if (!candidates.length) {
    candidates = CHALLENGES_DATABASE.filter(c => !excludeTitles.includes(c.title));
  }
  if (!candidates.length) {
    candidates = CHALLENGES_DATABASE;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    icon: picked.icon || '🎯',
    title: picked.title,
    description: picked.description,
    constraint: picked.constraint,
    points: picked.points,
    category: picked.category || 'Défi'
  };
}

module.exports = {
  CHALLENGES_DATABASE,
  THEMES_CONFIG,
  DIFFICULTY_CONFIG,
  generateGrid,
  generateSingleChallenge
};

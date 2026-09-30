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
  },

  // ─── SPÉCIFIQUE : CARRIÈRE EA FC / FIFA (25 DÉFIS) ──────────────────────────
  {
    id: 'fifa_ca_obj',
    icon: '👔',
    title: 'Objectif CA Validé',
    description: 'Valider l’objectif prioritaire fixé par le Conseil d’Administration (Jeunes ou Marque)',
    constraint: '1 saison | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Gestion',
    gameMode: 'fifa',
    themes: ['fifa', 'classic', 'realistic']
  },
  {
    id: 'fifa_pepite_5star',
    icon: '🌟',
    title: 'Pépite Académie 5★',
    description: 'Dénicher un jeune du centre avec 5★ Gestes Techniques ou Mauvais Pied',
    constraint: '1-2 saisons | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Formation',
    gameMode: 'fifa',
    themes: ['fifa', 'academy', 'classic']
  },
  {
    id: 'fifa_sharpness_100',
    icon: '⚡',
    title: 'Tranchant 100% au Choc',
    description: 'Avoir les 11 titulaires avec un Tranchant au maximum (100) avant un match clé',
    constraint: '1 match | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Préparation',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_dev_plan',
    icon: '📈',
    title: 'Changement de Poste',
    description: 'Convertir un joueur avec succès à un nouveau poste grâce au Plan de Développement',
    constraint: '1 saison | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Tactique',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_release_clause',
    icon: '💸',
    title: 'Clause Libératoire Payée',
    description: 'Activer et payer la clause libératoire d’un crack le dernier jour du mercato',
    constraint: 'Mercato | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Transferts',
    gameMode: 'fifa',
    themes: ['fifa', 'moneyball']
  },
  {
    id: 'fifa_remontada_script',
    icon: '🔥',
    title: 'Script Brisé (0-2 à 3-2)',
    description: 'Être mené 0-2 à la mi-temps et arracher la victoire manette en main',
    constraint: '1 match joué | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Match Joué',
    gameMode: 'fifa',
    themes: ['fifa', 'fun', 'rivalry']
  },
  {
    id: 'fifa_simu_master',
    icon: '🖥️',
    title: 'Simulation Parfaite (x3)',
    description: 'Gagner 3 matchs consécutifs en simulation rapide sans encaisser plus de 1 but',
    constraint: '3 matchs | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Simulation',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_press_conference',
    icon: '🎤',
    title: 'Moral d’Acier en Conf',
    description: 'Répondre en conférence de presse et mettre le moral de tout l’effectif au vert',
    constraint: '1 conf d’après-match | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Médias',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_unhappy_resolved',
    icon: '😤',
    title: 'Titulaire en Colère Apaisé',
    description: 'Titulariser un joueur mécontent de son temps de jeu et le faire marquer un but',
    constraint: '1 match | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Gestion',
    gameMode: 'fifa',
    themes: ['fifa', 'fun']
  },
  {
    id: 'fifa_free_agent',
    icon: '🆓',
    title: 'Braquage Agent Libre',
    description: 'Signer un joueur libre de contrat avec un général de 78+ sans indemnité',
    constraint: 'Mercato | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Transferts',
    gameMode: 'fifa',
    themes: ['fifa', 'moneyball']
  },
  {
    id: 'fifa_golden_boot',
    icon: '🥇',
    title: 'Soulier d’Or Championnat',
    description: 'Votre buteur numéro 1 termine meilleur buteur de la ligue avec 25+ réalisations',
    constraint: '1 saison | EA FC / FIFA',
    points: 3,
    difficulty: 'hard',
    category: 'Attaque',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_trivela_magic',
    icon: '🎯',
    title: 'Golazo Trivela / Enroulé',
    description: 'Inscrire un but splendide de l’extérieur du pied (Trivela) ou enroulé lucarne',
    constraint: '1 match joué | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Match Joué',
    gameMode: 'fifa',
    themes: ['fifa', 'fun']
  },
  {
    id: 'fifa_clean_sheet_derby',
    icon: '🧱',
    title: 'Derby Verrouillé 0 But',
    description: 'Gagner le grand derby contre votre rival juré sans encaisser le moindre but',
    constraint: '1 match | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Défense',
    gameMode: 'fifa',
    themes: ['fifa', 'rivalry', 'defense']
  },
  {
    id: 'fifa_plus_value_50m',
    icon: '💰',
    title: 'Plus-Value +40M€',
    description: 'Vendre un jeune joueur acheté moins de 8M€ pour un montant supérieur à 48M€',
    constraint: '1-3 saisons | EA FC / FIFA',
    points: 3,
    difficulty: 'hard',
    category: 'Finance',
    gameMode: 'fifa',
    themes: ['fifa', 'moneyball']
  },
  {
    id: 'fifa_youth_academy_xi',
    icon: '🌱',
    title: 'Onze 100% Académie',
    description: 'Disputer et gagner un match officiel avec 11 joueurs formés au club sur le terrain',
    constraint: '1 match | EA FC / FIFA',
    points: 4,
    difficulty: 'hard',
    category: 'Formation',
    gameMode: 'fifa',
    themes: ['fifa', 'academy']
  },
  {
    id: 'fifa_board_rating_90',
    icon: '👔',
    title: 'Manager de l’Année (CA > 90)',
    description: 'Terminer la saison avec une note de confiance des dirigeants supérieure à 90',
    constraint: '1 saison | EA FC / FIFA',
    points: 3,
    difficulty: 'hard',
    category: 'Gestion',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_regen_superstar',
    icon: '👑',
    title: 'Crack Regen Signé',
    description: 'Recruter le regen d’un joueur superstar retraité (Messi, CR7, Benzema, Modric...)',
    constraint: '1-4 saisons | EA FC / FIFA',
    points: 3,
    difficulty: 'hard',
    category: 'Transferts',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_sub_winner_85',
    icon: '⏱️',
    title: 'Super-Sub à la 85e+',
    description: 'Faire entrer un remplaçant qui marque le but de la victoire après la 85e minute',
    constraint: '1 match | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Coaching',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_budget_100m',
    icon: '💎',
    title: 'Banquier du Football (100M€)',
    description: 'Disposer de plus de 100M€ dans le budget transfert net sans être dans le rouge',
    constraint: '2-4 saisons | EA FC / FIFA',
    points: 3,
    difficulty: 'hard',
    category: 'Finance',
    gameMode: 'fifa',
    themes: ['fifa', 'moneyball']
  },
  {
    id: 'fifa_invincible_season',
    icon: '🔱',
    title: 'Saison des Invincibles',
    description: 'Boucler une saison complète de championnat avec 0 défaite',
    constraint: '1 saison | EA FC / FIFA',
    points: 5,
    difficulty: 'legendary',
    category: 'Succès',
    gameMode: 'fifa',
    themes: ['fifa', 'defense']
  },
  {
    id: 'fifa_ballon_dor',
    icon: '🏆',
    title: 'Ballon d’Or au Club',
    description: 'Avoir un joueur de votre effectif qui remporte le Ballon d’Or',
    constraint: '2-5 saisons | EA FC / FIFA',
    points: 5,
    difficulty: 'legendary',
    category: 'Trophée',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_coupe_b_team',
    icon: '🛡️',
    title: 'Épopée avec l’Équipe B',
    description: 'Se qualifier en demi-finale de Coupe Nationale en alignant au moins 6 remplaçants',
    constraint: '1 saison | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Gestion',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_blessure_clash',
    icon: '🤕',
    title: 'Victoire sans la Star',
    description: 'Gagner un grand choc après le forfait sur blessure de votre joueur le plus cher',
    constraint: '1 match | EA FC / FIFA',
    points: 2,
    difficulty: 'medium',
    category: 'Mental',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },
  {
    id: 'fifa_clean_sheet_3',
    icon: '🧤',
    title: 'Triplé Clean Sheet',
    description: '3 victoires consécutives sans concéder le moindre but en championnat',
    constraint: '3 matchs | EA FC / FIFA',
    points: 1,
    difficulty: 'easy',
    category: 'Défense',
    gameMode: 'fifa',
    themes: ['fifa', 'defense']
  },
  {
    id: 'fifa_champion_sacre',
    icon: '🥇',
    title: 'Titre de Champion Décroché',
    description: 'Être officiellement sacré champion de ligue avant la dernière journée',
    constraint: '1-3 saisons | EA FC / FIFA',
    points: 4,
    difficulty: 'hard',
    category: 'Succès',
    gameMode: 'fifa',
    themes: ['fifa', 'classic']
  },

  // ─── SPÉCIFIQUE : FOOTBALL MANAGER (FM) (25 DÉFIS) ──────────────────────────
  {
    id: 'fm_fmd_win',
    icon: '🥶',
    title: 'Le Piège du FM’d Déjoué',
    description: 'Gagner un match où l’adversaire a 2 tirs pour 0.2 xG et vous plus de 20 tirs',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'classic', 'fun']
  },
  {
    id: 'fm_passion_talk',
    icon: '🗣️',
    title: 'Causerie Inspirée (100% Vert)',
    description: 'Obtenir une réaction verte enthousiaste ou motivée de tout le vestiaire avant match',
    constraint: '1 causerie | Football Manager',
    points: 1,
    difficulty: 'easy',
    category: 'Vestiaire',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_bottle_throw',
    icon: '💥',
    title: 'Jet de Bouteille Salvateur',
    description: 'Lancer une bouteille d’eau à la pause (Colère) et remonter le score pour gagner',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Mental',
    gameMode: 'fm',
    themes: ['fm', 'fun']
  },
  {
    id: 'fm_xg_domination',
    icon: '📊',
    title: 'Festin d’Expected Goals (xG > 3.0)',
    description: 'Terminer un match officiel avec un total d’Expected Goals (xG) supérieur à 3.0',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_south_america_gem',
    icon: '🌎',
    title: 'Wonderkid Sud-Américain',
    description: 'Recruter une pépite colombienne, argentine ou brésilienne de 18 ans à moins de 2M€',
    constraint: 'Mercato | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Scouting',
    gameMode: 'fm',
    themes: ['fm', 'moneyball', 'academy']
  },
  {
    id: 'fm_gegenpress_fluid',
    icon: '⚙️',
    title: 'Gegenpress Assimilé 100%',
    description: 'Atteindre le statut de familiarité tactique « Fluide » sur votre tactique principale',
    constraint: '1 saison | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_board_override',
    icon: '🤬',
    title: 'Vente Forcée par le Président',
    description: 'Rebondir et gagner le match suivant après la vente de votre star par le Conseil d’Admin',
    constraint: '1 match | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Gestion',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_work_permit',
    icon: '📋',
    title: 'Permis de Travail Arraché',
    description: 'Obtenir l’accord d’un permis de travail en commission d’appel pour un joueur étranger',
    constraint: 'Transfert | Football Manager',
    points: 1,
    difficulty: 'easy',
    category: 'Scouting',
    gameMode: 'fm',
    themes: ['fm', 'realistic']
  },
  {
    id: 'fm_mind_games',
    icon: '🎙️',
    title: 'Guerre Psychologique',
    description: 'Déstabiliser l’entraîneur rival en conférence de presse et l’emporter sur le terrain',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Médias',
    gameMode: 'fm',
    themes: ['fm', 'rivalry']
  },
  {
    id: 'fm_red_card_hero',
    icon: '🟥',
    title: 'Exploit à 10 contre 11',
    description: 'Gagner un match officiel après l’expulsion d’un de vos joueurs dès la 1ère mi-temps',
    constraint: '1 match | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'fun']
  },
  {
    id: 'fm_youth_intake',
    icon: '🌱',
    title: 'Cuvée Générationnelle (5★)',
    description: 'Avoir un rapport de cuvée des jeunes avec au moins un espoir coté 5 étoiles',
    constraint: 'Mois de Mars | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Formation',
    gameMode: 'fm',
    themes: ['fm', 'academy']
  },
  {
    id: 'fm_tiki_taka_70',
    icon: '🔄',
    title: 'Monopole du Ballon (70%+ Poss.)',
    description: 'Terminer une rencontre avec au moins 70% de possession de balle et la victoire',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_injuries_storm',
    icon: '🤕',
    title: 'Hécatombe Déjouée',
    description: 'Gagner un choc de haut de tableau avec au moins 4 titulaires forfaits sur blessure',
    constraint: '1 match | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Gestion',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_end_of_contract',
    icon: '🤝',
    title: 'Braquage Bosman (0€)',
    description: 'Faire signer un titulaire de grand club en fin de contrat dès le 1er janvier pour 0€',
    constraint: 'Mercato hivernal | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Transferts',
    gameMode: 'fm',
    themes: ['fm', 'moneyball']
  },
  {
    id: 'fm_corner_routine',
    icon: '📐',
    title: 'Combinaison Corner Validée',
    description: 'Marquer un but grâce à une routine de corner configurée spécifiquement à l’entraînement',
    constraint: '1 match | Football Manager',
    points: 1,
    difficulty: 'easy',
    category: 'Tactique',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_fergie_time',
    icon: '⏱️',
    title: 'Fergie Time (But 90e+)',
    description: 'Inscrire le but vainqueur dans le temps additionnel de la seconde mi-temps',
    constraint: '1 match | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Mental',
    gameMode: 'fm',
    themes: ['fm', 'rivalry']
  },
  {
    id: 'fm_wage_discipline',
    icon: '💰',
    title: 'Discipline Budgétaire (+15%)',
    description: 'Respecter le budget salarial avec plus de 15% de marge libre tout en étant dans le Top 4',
    constraint: '1 saison | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Finance',
    gameMode: 'fm',
    themes: ['fm', 'moneyball']
  },
  {
    id: 'fm_staff_5_stars',
    icon: '👨‍🏫',
    title: 'Staff Technique 5 Étoiles',
    description: 'Avoir un staff technique classé N°1 de la ligue dans tous les ateliers d’entraînement',
    constraint: '1 saison | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Staff',
    gameMode: 'fm',
    themes: ['fm', 'realistic']
  },
  {
    id: 'fm_giant_killer',
    icon: '🥊',
    title: 'Tombeur de Géant en Coupe',
    description: 'Éliminer une équipe de division supérieure en Coupe Nationale',
    constraint: '1 match | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Coupe',
    gameMode: 'fm',
    themes: ['fm', 'fun']
  },
  {
    id: 'fm_clean_sheets_streak',
    icon: '🛡️',
    title: 'Forteresse Inviolable (4 CS)',
    description: 'Enchaîner 4 matchs de championnat consécutifs sans encaisser de but',
    constraint: '4 matchs | Football Manager',
    points: 2,
    difficulty: 'medium',
    category: 'Défense',
    gameMode: 'fm',
    themes: ['fm', 'defense']
  },
  {
    id: 'fm_promise_kept',
    icon: '🤝',
    title: 'Promesse de Vestiaire Tenue',
    description: 'Remplir avec succès une promesse faite à un joueur cadre (recrutement ou temps de jeu)',
    constraint: '1 saison | Football Manager',
    points: 1,
    difficulty: 'easy',
    category: 'Vestiaire',
    gameMode: 'fm',
    themes: ['fm', 'realistic']
  },
  {
    id: 'fm_road_to_glory',
    icon: '🚀',
    title: 'Montée Historique (Promotion)',
    description: 'Obtenir la promotion en division supérieure au terme d’une saison complète',
    constraint: '1 saison | Football Manager',
    points: 4,
    difficulty: 'hard',
    category: 'Succès',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_triple_crown',
    icon: '🏆',
    title: 'Le Triplé Sacré',
    description: 'Réaliser le triplé magique : Championnat + Coupe Nationale + Trophée Continental',
    constraint: '1 saison | Football Manager',
    points: 5,
    difficulty: 'legendary',
    category: 'Trophée',
    gameMode: 'fm',
    themes: ['fm', 'classic']
  },
  {
    id: 'fm_nxgn_winner',
    icon: '🌟',
    title: 'Pépite NxGn / Golden Boy',
    description: 'Avoir un jeune formé ou recruté qui figure dans le Top 3 du classement NxGn / Golden Boy',
    constraint: '2-4 saisons | Football Manager',
    points: 4,
    difficulty: 'hard',
    category: 'Formation',
    gameMode: 'fm',
    themes: ['fm', 'academy']
  },
  {
    id: 'fm_derby_glory',
    icon: '👑',
    title: 'Roi du Derby (Aller-Retour)',
    description: 'Battre votre rival historique à la fois au match aller et au match retour',
    constraint: '1 saison | Football Manager',
    points: 3,
    difficulty: 'hard',
    category: 'Rivalité',
    gameMode: 'fm',
    themes: ['fm', 'rivalry']
  }
];

const THEMES_CONFIG = {
  fifa: {
    label: '🎮 Carrière Manager EA FC / FIFA',
    description: 'Objectifs CA, plans de dev, pépites 5★, simulation et scénarios de match.'
  },
  fm: {
    label: '📋 Football Manager (FM)',
    description: 'xG, causeries d’avant-match, wonderkids sud-américains, vestiaire et FM’d.'
  },
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
 * @param {object} options { size: 3|4|5, difficulty: string, theme: string, gameMode: string }
 * @returns {object} { name, description, size, challenges }
 */
function generateGrid(options = {}) {
  const size = [3, 4, 5].includes(parseInt(options.size)) ? parseInt(options.size) : 5;
  const targetCount = size * size;
  const difficulty = DIFFICULTY_CONFIG[options.difficulty] ? options.difficulty : 'medium';

  const userTheme = String(options.theme || '').toLowerCase();
  const gameMode = options.gameMode || options.mode || (
    userTheme.includes('fifa') || userTheme.includes('ea fc') || userTheme === 'fifa' ? 'fifa' :
    userTheme.includes('football manager') || userTheme.includes('fm') || userTheme === 'fm' ? 'fm' :
    null
  );

  let themeKey = options.theme;
  if (!THEMES_CONFIG[themeKey]) {
    if (gameMode === 'fifa') themeKey = 'fifa';
    else if (gameMode === 'fm') themeKey = 'fm';
    else themeKey = 'mixed';
  }

  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const themeConfig = THEMES_CONFIG[themeKey] || THEMES_CONFIG.mixed;

  // Filter pool
  let pool = CHALLENGES_DATABASE.filter(c => {
    // Mode prioritaire
    if (gameMode === 'fifa' && c.gameMode !== 'fifa' && !c.themes?.includes('fifa')) return false;
    if (gameMode === 'fm' && c.gameMode !== 'fm' && !c.themes?.includes('fm')) return false;
    // Check difficulty eligibility
    if (!diffConfig.allowedDiffs.includes(c.difficulty)) return false;
    // Check theme eligibility
    if (!['mixed', 'fifa', 'fm'].includes(themeKey) && !c.themes.includes(themeKey)) return false;
    return true;
  });

  // If pool too small for specific difficulty, take all from this gameMode
  if (pool.length < targetCount && (gameMode === 'fifa' || gameMode === 'fm')) {
    pool = CHALLENGES_DATABASE.filter(c => c.gameMode === gameMode || c.themes?.includes(gameMode));
  }

  // Fallback to general pool if needed
  if (pool.length < targetCount) {
    const fallback = CHALLENGES_DATABASE.filter(c => diffConfig.allowedDiffs.includes(c.difficulty));
    pool = [...pool, ...fallback.filter(f => !pool.some(p => p.id === f.id))];
  }

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

  // Dynamic titles tailored to FIFA or FM
  let title = '';
  let desc = '';
  if (gameMode === 'fifa') {
    title = `🎮 Carrière EA FC / FIFA (${size}x${size})`;
    desc = `Grille officielle Carrière Manager EA Sports FC & FIFA • Objectifs CA, pépites 5★, simulation et plans de développement.`;
  } else if (gameMode === 'fm') {
    title = `📋 Carrière Football Manager (${size}x${size})`;
    desc = `Grille officielle Football Manager (FM) • xG, causeries, dynamiques de vestiaire, wonderkids et FM'd.`;
  } else {
    const diffLabels = {
      easy: 'Facile',
      medium: 'Équilibré',
      hard: 'Hardcore',
      legendary: 'Légendaire'
    };
    title = `Bingo ${size}x${size} — ${diffLabels[difficulty]} (${themeConfig.label.split(' ')[1] || 'Carrière'})`;
    desc = `Grille ${size}x${size} (${targetCount} défis) générée par IA • Difficulté : ${diffLabels[difficulty]} • Thème : ${themeConfig.label}`;
  }

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

const FIFA_CAREER_CHALLENGES = CHALLENGES_DATABASE.filter(c => c.gameMode === 'fifa');
const FOOTBALL_MANAGER_CHALLENGES = CHALLENGES_DATABASE.filter(c => c.gameMode === 'fm');

module.exports = {
  CHALLENGES_DATABASE,
  THEMES_CONFIG,
  DIFFICULTY_CONFIG,
  FIFA_CAREER_CHALLENGES,
  FOOTBALL_MANAGER_CHALLENGES,
  generateGrid,
  generateSingleChallenge
};

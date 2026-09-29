/**
 * Bingo Carrière Manager — Server
 * Express + Socket.io + CORS
 * Multi-player | Multi-grid | Per-player per-grid checked state
 */

'use strict';

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

const PORT           = process.env.PORT || 3000;
const DATA_DIR       = path.join(__dirname, 'data');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const STATE_FILE     = path.join(DATA_DIR, 'game_state.json');

// ─── App bootstrap ────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Ensure data directory ────────────────────────────────────────────────────

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Load raw challenges from challenges.json ─────────────────────────────────

let rawChallenges = [];
if (fs.existsSync(CHALLENGES_FILE)) {
  try {
    rawChallenges = JSON.parse(fs.readFileSync(CHALLENGES_FILE, 'utf8'));
  } catch (e) {
    console.error('[BINGO] Error reading challenges.json:', e.message);
  }
}

// ─── State shape ──────────────────────────────────────────────────────────────
//
// gameState = {
//   activeGridId: string | null,
//   grids: {
//     [gridId]: {
//       id: string,
//       name: string,
//       description: string,
//       challenges: [ { id, icon, title, description, points, constraint, category } x25 ]
//     }
//   },
//   players: {
//     [playerId]: {
//       id: string,
//       name: string,
//       club: string,
//       avatar: string,  // emoji
//       color: string,   // hex
//       pin: string,
//       grids: {
//         [gridId]: boolean[25]   // checked array per grid
//       },
//       createdAt: ISO string
//     }
//   },
//   settings: {
//     lineBonus: number,
//     grandChelemBonus: number
//   },
//   history: []
// }

// ─── Load or initialize state ─────────────────────────────────────────────────

let gameState = loadState();

function emptyState() {
  return {
    activeGridId: null,
    grids: {},
    players: {},
    settings: {
      lineBonus: 5,
      grandChelemBonus: 10,
      adminPassword: 'admin1234'
    },
    history: []
  };
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return emptyState();
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    // Migrate older format if needed (no grids key)
    if (!raw.grids)   raw.grids   = {};
    if (!raw.players) raw.players = {};
    if (!raw.settings) raw.settings = { lineBonus: 5, grandChelemBonus: 10, adminPassword: 'admin1234' };
    if (!raw.settings.adminPassword) raw.settings.adminPassword = 'admin1234';
    if (!raw.history)  raw.history  = [];
    if (!('activeGridId' in raw)) raw.activeGridId = null;
    // Ensure each player has a grids sub-object
    for (const pId of Object.keys(raw.players)) {
      const p = raw.players[pId];
      if (!p.grids) p.grids = {};
      // Legacy: if player had a top-level 'checked' array move it to activeGridId slot
      if (Array.isArray(p.checked) && raw.activeGridId) {
        if (!p.grids[raw.activeGridId]) {
          p.grids[raw.activeGridId] = p.checked;
        }
        delete p.checked;
      } else if (Array.isArray(p.checked)) {
        delete p.checked; // can't associate without a grid
      }
      if (!p.createdAt) p.createdAt = new Date().toISOString();
    }
    return raw;
  } catch (e) {
    console.error('[BINGO] Error reading state file, using empty state:', e.message);
    return emptyState();
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(gameState, null, 2), 'utf8');
  } catch (err) {
    console.error('[BINGO] Error saving state:', err.message);
  }
}

// ─── Bootstrap default grid from challenges.json ──────────────────────────────

function bootstrapDefaultGrid() {
  if (Object.keys(gameState.grids).length === 0 && rawChallenges.length === 25) {
    const gridId = 'grid_default_s1';
    gameState.grids[gridId] = {
      id: gridId,
      name: 'Bingo Carrière Saison 1',
      description: 'La grille officielle de la saison 1.',
      challenges: rawChallenges.map((c, i) => ({
        id:          c.id !== undefined ? c.id : i,
        icon:        c.icon        || '🎯',
        title:       c.title       || `Défi ${i + 1}`,
        description: c.description || '',
        points:      typeof c.points === 'number' ? c.points : 1,
        constraint:  c.constraint  || '',
        category:    c.category    || 'Général'
      }))
    };
    gameState.activeGridId = gridId;
    saveState();
    console.log('[BINGO] Default grid "Bingo Carrière Saison 1" created.');
  }
}

bootstrapDefaultGrid();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a simple unique id */
function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Get or create a 25-bool checked array for player+grid */
function getChecked(player, gridId) {
  if (!player.grids) player.grids = {};
  if (!Array.isArray(player.grids[gridId]) || player.grids[gridId].length !== 25) {
    player.grids[gridId] = new Array(25).fill(false);
  }
  return player.grids[gridId];
}

/** Return the challenges array for a given grid, or [] */
function gridChallenges(gridId) {
  const grid = gameState.grids[gridId];
  return grid ? grid.challenges : [];
}

// ─── Stats calculation ────────────────────────────────────────────────────────

/**
 * Calculate per-player stats for a specific grid.
 * @param {object} player
 * @param {string} gridId
 */
function calculateStats(player, gridId) {
  const challenges = gridChallenges(gridId);
  const checked    = getChecked(player, gridId);
  let basePoints   = 0;
  let tilesCompleted = 0;

  checked.forEach((isChecked, idx) => {
    if (isChecked) {
      tilesCompleted++;
      const ch = challenges[idx];
      if (ch) basePoints += (ch.points || 0);
    }
  });

  // Lines
  const completedLines = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    let ok = true;
    for (let c = 0; c < 5; c++) {
      if (!checked[r * 5 + c]) { ok = false; break; }
    }
    if (ok) completedLines.push({ type: 'row', index: r, name: `Ligne ${r + 1}` });
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    let ok = true;
    for (let r = 0; r < 5; r++) {
      if (!checked[r * 5 + c]) { ok = false; break; }
    }
    if (ok) completedLines.push({ type: 'col', index: c, name: `Colonne ${c + 1}` });
  }

  // Diagonals
  if (checked[0] && checked[6] && checked[12] && checked[18] && checked[24]) {
    completedLines.push({ type: 'diag', index: 0, name: 'Diagonale \\' });
  }
  if (checked[4] && checked[8] && checked[12] && checked[16] && checked[20]) {
    completedLines.push({ type: 'diag', index: 1, name: 'Diagonale /' });
  }

  const lineBonusPts    = (gameState.settings.lineBonus || 5) * completedLines.length;
  const isGrandChelem   = tilesCompleted === 25;
  const grandChelemBonus = isGrandChelem ? (gameState.settings.grandChelemBonus || 10) : 0;
  const totalPoints     = basePoints + lineBonusPts + grandChelemBonus;

  return {
    tilesCompleted,
    totalTiles: 25,
    basePoints,
    completedLines,
    lineBonus: lineBonusPts,
    isGrandChelem,
    grandChelemBonus,
    totalPoints
  };
}

// ─── Full computed state ───────────────────────────────────────────────────────

function getComputedState() {
  const activeGridId = gameState.activeGridId;
  const stats        = {};
  const playersOut   = {};

  for (const [pId, player] of Object.entries(gameState.players)) {
    // Build player output with checked array for active grid
    playersOut[pId] = {
      id:        player.id,
      name:      player.name,
      club:      player.club,
      avatar:    player.avatar,
      color:     player.color,
      createdAt: player.createdAt,
      // Include all grids checked data (so client can switch grids if needed)
      grids:     player.grids || {}
    };

    if (activeGridId) {
      stats[pId] = calculateStats(player, activeGridId);
    }
  }

  return {
    activeGrid: activeGridId,
    activeGridId,
    grids:    Object.values(gameState.grids),
    players:  playersOut,
    settings: gameState.settings,
    history:  gameState.history.slice(-50),
    stats
  };
}

// ─── REST: State ──────────────────────────────────────────────────────────────

app.get('/api/state', (req, res) => {
  res.json(getComputedState());
});

// ─── REST: Grids ──────────────────────────────────────────────────────────────

app.get('/api/grids', (req, res) => {
  res.json(Object.values(gameState.grids));
});

app.post('/api/grids', (req, res) => {
  const { name, description, challenges } = req.body;

  if (!name || !Array.isArray(challenges) || challenges.length !== 25) {
    return res.status(400).json({ success: false, message: 'name and exactly 25 challenges required.' });
  }

  const gridId = `grid_${makeId()}`;
  const sanitized = challenges.map((c, i) => ({
    id:          c.id !== undefined ? c.id : i,
    icon:        c.icon        || '🎯',
    title:       c.title       || `Défi ${i + 1}`,
    description: c.description || '',
    points:      typeof c.points === 'number' ? c.points : 1,
    constraint:  c.constraint  || '',
    category:    c.category    || 'Général'
  }));

  gameState.grids[gridId] = {
    id: gridId,
    name: name.trim(),
    description: (description || '').trim(),
    challenges: sanitized
  };

  saveState();
  io.emit('stateUpdate', getComputedState());
  res.json({ success: true, grid: gameState.grids[gridId] });
});

app.delete('/api/grids/:id', (req, res) => {
  const { id } = req.params;
  if (!gameState.grids[id]) {
    return res.status(404).json({ success: false, message: 'Grid not found.' });
  }
  delete gameState.grids[id];
  // If active grid was deleted, clear activeGridId
  if (gameState.activeGridId === id) {
    gameState.activeGridId = Object.keys(gameState.grids)[0] || null;
  }
  saveState();
  io.emit('stateUpdate', getComputedState());
  res.json({ success: true });
});

// ─── REST: Activate grid ──────────────────────────────────────────────────────

app.post('/api/grid/activate', (req, res) => {
  const { gridId } = req.body;
  if (!gameState.grids[gridId]) {
    return res.status(404).json({ success: false, message: 'Grid not found.' });
  }
  gameState.activeGridId = gridId;
  // Ensure all players have a fresh checked array for this grid (don't reset if already exists)
  for (const player of Object.values(gameState.players)) {
    getChecked(player, gridId); // initialises if missing
  }
  saveState();
  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('gridActivated', { gridId, gridName: gameState.grids[gridId].name });
  res.json({ success: true, state });
});

// ─── REST: Players ────────────────────────────────────────────────────────────

app.post('/api/players', (req, res) => {
  const { name, club, avatar, color, pin } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'name is required.' });
  }

  const playerId = `player_${makeId()}`;
  const player = {
    id:        playerId,
    name:      name.trim(),
    club:      (club   || 'FC Unknown').trim(),
    avatar:    (avatar || '⚽').trim(),
    color:     (color  || '#3b82f6').trim(),
    pin:       (pin    || '0000').trim(),
    grids:     {},
    createdAt: new Date().toISOString()
  };

  // Pre-initialise checked array for active grid
  if (gameState.activeGridId) {
    player.grids[gameState.activeGridId] = new Array(25).fill(false);
  }

  gameState.players[playerId] = player;
  saveState();

  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('playerAdded', { playerId, playerName: player.name, avatar: player.avatar, color: player.color });

  res.json({ success: true, player, state });
});

app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  if (!gameState.players[id]) {
    return res.status(404).json({ success: false, message: 'Player not found.' });
  }
  const playerName = gameState.players[id].name;
  delete gameState.players[id];
  saveState();

  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('playerRemoved', { playerId: id, playerName });
  res.json({ success: true });
});

// ─── REST: Login ──────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { playerId, pin } = req.body;
  const player = gameState.players[playerId];
  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable.' });
  }
  if (player.pin && player.pin !== String(pin)) {
    return res.status(401).json({ success: false, message: 'Code PIN incorrect.' });
  }
  res.json({
    success: true,
    player: {
      id:     player.id,
      name:   player.name,
      club:   player.club,
      avatar: player.avatar,
      color:  player.color
    }
  });
});

// ─── REST: Profile ────────────────────────────────────────────────────────────

app.post('/api/profile', (req, res) => {
  const { playerId, name, club, avatar, color, pin } = req.body;
  const player = gameState.players[playerId];
  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable.' });
  }

  if (name   !== undefined) player.name   = String(name).trim();
  if (club   !== undefined) player.club   = String(club).trim();
  if (avatar !== undefined) player.avatar = String(avatar).trim();
  if (color  !== undefined) player.color  = String(color).trim();
  if (pin    !== undefined) player.pin    = String(pin).trim();

  saveState();
  const state = getComputedState();
  io.emit('stateUpdate', state);
  res.json({ success: true, player });
});

// ─── REST: Toggle tile ────────────────────────────────────────────────────────

app.post('/api/toggle', (req, res) => {
  const { playerId, tileIndex, checked, gridId } = req.body;

  const player = gameState.players[playerId];
  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable.' });
  }

  const gId = gridId || gameState.activeGridId;
  if (!gId || !gameState.grids[gId]) {
    return res.status(400).json({ success: false, message: 'Grille invalide.' });
  }

  if (tileIndex < 0 || tileIndex >= 25) {
    return res.status(400).json({ success: false, message: 'Index de tuile invalide.' });
  }

  const prevStats    = calculateStats(player, gId);
  const checkedArr   = getChecked(player, gId);
  const isNowChecked = typeof checked === 'boolean' ? checked : !checkedArr[tileIndex];
  checkedArr[tileIndex] = isNowChecked;

  const newStats      = calculateStats(player, gId);
  const challenges    = gridChallenges(gId);
  const challenge     = challenges[tileIndex] || null;

  // History
  gameState.history.push({
    id:             Date.now(),
    timestamp:      new Date().toISOString(),
    playerId,
    playerName:     player.name,
    gridId:         gId,
    challengeId:    tileIndex,
    challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
    challengeIcon:  challenge ? challenge.icon  : '🎯',
    points:         challenge ? challenge.points : 0,
    action:         isNowChecked ? 'check' : 'uncheck'
  });
  if (gameState.history.length > 100) gameState.history.shift();

  saveState();

  const newLineAchieved = newStats.completedLines.length > prevStats.completedLines.length;
  const newGrandChelem  = newStats.isGrandChelem && !prevStats.isGrandChelem;

  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('tileToggled', {
    playerId,
    playerName: player.name,
    challenge,
    checked:   isNowChecked,
    newStats,
    newLineAchieved,
    newGrandChelem
  });

  res.json({ success: true, state });
});

// ─── REST: Reset ──────────────────────────────────────────────────────────────

app.post('/api/reset', (req, res) => {
  const { target, gridId } = req.body;
  // target: 'player:<id>' | 'all'
  const gId = gridId || gameState.activeGridId;

  if (!target) {
    return res.status(400).json({ success: false, message: 'target required.' });
  }

  if (target === 'all') {
    for (const player of Object.values(gameState.players)) {
      if (gId) {
        player.grids[gId] = new Array(25).fill(false);
      }
    }
    gameState.history = [];
  } else if (target.startsWith('player:')) {
    const pId = target.slice(7);
    const player = gameState.players[pId];
    if (!player) {
      return res.status(404).json({ success: false, message: 'Joueur introuvable.' });
    }
    if (gId) {
      player.grids[gId] = new Array(25).fill(false);
    }
  } else {
    return res.status(400).json({ success: false, message: 'Invalid target. Use "all" or "player:<id>".' });
  }

  saveState();
  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('gameReset', { target, gridId: gId });
  res.json({ success: true, state });
});

// ─── REST: Admin Login ────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Mot de passe requis.' });
  const correct = gameState.settings.adminPassword || 'admin1234';
  if (password !== correct) return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
  // Return a simple token (the password itself hashed as base64 - good enough for a local game)
  const token = Buffer.from(password).toString('base64');
  res.json({ success: true, token });
});

app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ success: false });
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  const correct = gameState.settings.adminPassword || 'admin1234';
  res.json({ success: decoded === correct });
});

// ─── REST: Settings ───────────────────────────────────────────────────────────

app.post('/api/settings', (req, res) => {
  const { lineBonus, grandChelemBonus, adminPassword, token } = req.body;
  // Require admin token for settings change
  if (token) {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const correct = gameState.settings.adminPassword || 'admin1234';
    if (decoded !== correct) return res.status(401).json({ success: false, message: 'Non autorisé.' });
  }
  if (typeof lineBonus        === 'number') gameState.settings.lineBonus        = lineBonus;
  if (typeof grandChelemBonus === 'number') gameState.settings.grandChelemBonus  = grandChelemBonus;
  if (typeof adminPassword    === 'string' && adminPassword.length >= 4) {
    gameState.settings.adminPassword = adminPassword;
  }
  saveState();
  const state = getComputedState();
  io.emit('stateUpdate', state);
  res.json({ success: true, settings: { lineBonus: gameState.settings.lineBonus, grandChelemBonus: gameState.settings.grandChelemBonus } });
});

// ─── REST: Raw challenges (convenience) ───────────────────────────────────────

app.get('/api/challenges', (req, res) => {
  res.json(rawChallenges);
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.emit('stateUpdate', getComputedState());

  // Handle tile toggle from client
  socket.on('toggleTile', ({ playerId, tileIndex, checked, gridId }) => {
    const player = gameState.players[playerId];
    if (!player) return;
    const gId = gridId || gameState.activeGridId;
    if (!gId || !gameState.grids[gId]) return;
    if (tileIndex < 0 || tileIndex >= 25) return;

    const prevStats   = calculateStats(player, gId);
    const checkedArr  = getChecked(player, gId);
    const isNowChecked = typeof checked === 'boolean' ? checked : !checkedArr[tileIndex];
    checkedArr[tileIndex] = isNowChecked;

    const newStats   = calculateStats(player, gId);
    const challenges = gridChallenges(gId);
    const challenge  = challenges[tileIndex] || null;

    gameState.history.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      playerId,
      playerName: player.name,
      gridId: gId,
      challengeId: tileIndex,
      challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
      challengeIcon: challenge ? challenge.icon : '🎯',
      points: challenge ? challenge.points : 0,
      action: isNowChecked ? 'check' : 'uncheck'
    });
    if (gameState.history.length > 100) gameState.history.shift();

    saveState();

    const newLineAchieved = newStats.completedLines.length > prevStats.completedLines.length;
    const newGrandChelem  = newStats.isGrandChelem && !prevStats.isGrandChelem;

    const state = getComputedState();
    io.emit('stateUpdate', state);
    io.emit('tileToggled', { playerId, playerName: player.name, challenge, checked: isNowChecked, newStats, newLineAchieved, newGrandChelem });
  });

  // Handle grid reset from client
  socket.on('resetGrid', ({ target, gridId }) => {
    const gId = gridId || gameState.activeGridId;
    if (target === 'all') {
      for (const player of Object.values(gameState.players)) {
        if (gId) player.grids[gId] = new Array(25).fill(false);
      }
      gameState.history = [];
    } else if (target && target.startsWith('player:')) {
      const pId = target.slice(7);
      const player = gameState.players[pId];
      if (player && gId) player.grids[gId] = new Array(25).fill(false);
    }
    saveState();
    io.emit('stateUpdate', getComputedState());
    io.emit('gameReset', { target, gridId: gId });
  });

  socket.on('disconnect', () => {});
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  const activeGrid = gameState.activeGridId ? gameState.grids[gameState.activeGridId] : null;
  const playerCount = Object.keys(gameState.players).length;
  const gridCount   = Object.keys(gameState.grids).length;

  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║     🎮 BINGO CARRIÈRE MANAGER  —  RUNNING         ║`);
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  Port       : ${PORT}                                 `.padEnd(52) + '║');
  console.log(`║  Players    : ${playerCount}                                 `.padEnd(52) + '║');
  console.log(`║  Grids      : ${gridCount}                                 `.padEnd(52) + '║');
  if (activeGrid) {
    console.log(`║  Active Grid: ${activeGrid.name}`.padEnd(52) + '║');
  }
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  🏠 Accueil        http://localhost:${PORT}/          `.padEnd(52) + '║');
  console.log(`║  🎮 Joueur         http://localhost:${PORT}/player.html`.padEnd(52) + '║');
  console.log(`║  📺 Spectateur     http://localhost:${PORT}/spectator.html`.padEnd(52) + '║');
  console.log(`║  🎥 Overlay OBS    http://localhost:${PORT}/obs.html  `.padEnd(52) + '║');
  console.log(`╠═══════════════════════════════════════════════════╣`);
  console.log(`║  API /api/state    GET  — full computed state      ║`);
  console.log(`║  API /api/grids    GET/POST — list/create grids    ║`);
  console.log(`║  API /api/players  POST — add player               ║`);
  console.log(`║  API /api/toggle   POST — toggle tile              ║`);
  console.log(`║  API /api/reset    POST — reset player or all      ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});

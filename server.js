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
const aiGenerator = require('./data/ai_generator');

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
    rooms: {},
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
    if (!raw.rooms)   raw.rooms   = {};
    if (!raw.settings) raw.settings = { lineBonus: 5, grandChelemBonus: 10, adminPassword: 'admin1234' };
    if (!raw.settings.adminPassword) raw.settings.adminPassword = 'admin1234';
    if (!raw.history)  raw.history  = [];
    if (!('activeGridId' in raw)) raw.activeGridId = null;
    // Ensure each player has a grids sub-object and valid avatar
    for (const pId of Object.keys(raw.players)) {
      const p = raw.players[pId];
      if (!p.grids) p.grids = {};
      p.avatar = sanitizeAvatar(p.avatar);
      // Legacy: if player had a top-level 'checked' array move it to activeGridId slot
      if (Array.isArray(p.checked) && raw.activeGridId) {
        if (!p.grids[raw.activeGridId]) {
          p.grids[raw.activeGridId] = p.checked;
        }
        delete p.checked;
      } else if (Array.isArray(p.checked)) {
        delete p.checked; // can't associate without a grid
      }
      if (!Array.isArray(p.friends)) p.friends = [];
      if (!p.createdAt) p.createdAt = new Date().toISOString();
      if (!p.stats) {
        if (p.name === 'Tonton-riton') {
          p.stats = { wins: 14, grandChelems: 5, bingos: 32, gamesPlayed: 18, careerPoints: 210 };
        } else if (p.name === 'Rival FC') {
          p.stats = { wins: 9, grandChelems: 2, bingos: 21, gamesPlayed: 16, careerPoints: 154 };
        } else if (p.name === 'Alex_Streamer') {
          p.stats = { wins: 6, grandChelems: 1, bingos: 14, gamesPlayed: 11, careerPoints: 112 };
        } else {
          p.stats = { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
        }
      }
    }
    return raw;
  } catch (e) {
    console.error('[BINGO] Error reading state file, using empty state:', e.message);
    return emptyState();
  }
}

function sanitizeAvatar(av) {
  if (!av) return '⚽';
  const str = String(av).trim();
  const lower = str.toLowerCase().replace(/^:|:$/g, '');
  const map = {
    'ball': '⚽', 'soccer': '⚽', 'foot': '⚽',
    'fire': '🔥', 'flame': '🔥',
    'zap': '⚡', 'bolt': '⚡', 'lightning': '⚡',
    'crown': '👑', 'king': '👑',
    'lion': '🦁',
    'rocket': '🚀',
    'wolf': '🐺',
    'target': '🎯',
    'trophy': '🏆', 'cup': '🏆',
    'swords': '⚔️', 'sword': '⚔️',
    'diamond': '💎', 'gem': '💎',
    'star': '🌟',
    'eagle': '🦅',
    'dragon': '🐉',
    'fox': '🦊',
    'shield': '🛡️',
    'controller': '🎮', 'game': '🎮',
    'glove': '🧤',
    'box': '🥊',
    'medal': '🥇'
  };
  return map[lower] || str;
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
  const gridId = 'grid_default_s1';
  if (!gameState.grids[gridId] || !Array.isArray(gameState.grids[gridId].challenges) || gameState.grids[gridId].challenges.length === 0) {
    if (rawChallenges && rawChallenges.length > 0) {
      gameState.grids[gridId] = {
        id: gridId,
        name: 'Bingo Carrière Saison 1',
        size: 5,
        description: 'La grille officielle de la saison 1 (25 défis carrière).',
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
    }
  }
  if (!gameState.activeGridId || !gameState.grids[gameState.activeGridId]) {
    gameState.activeGridId = Object.keys(gameState.grids)[0] || gridId;
  }
  saveState();
  console.log('[BINGO] Default grid verified (active: ' + gameState.activeGridId + ').');
}

bootstrapDefaultGrid();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a simple unique id */
function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Get or create checked array for player+grid based on grid challenge count */
function getChecked(player, gridId) {
  if (!player.grids) player.grids = {};
  const grid = gameState.grids[gridId];
  const total = grid?.challenges?.length || 25;
  if (!Array.isArray(player.grids[gridId]) || player.grids[gridId].length !== total) {
    player.grids[gridId] = new Array(total).fill(false);
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
 * Calculate per-player stats for a specific grid (supports 3x3, 4x4, 5x5, etc.).
 * @param {object} player
 * @param {string} gridId
 */
function calculateStats(player, gridId) {
  const grid       = gameState.grids[gridId];
  const challenges = grid ? grid.challenges : [];
  const checked    = getChecked(player, gridId);
  const size       = grid?.size || Math.round(Math.sqrt(challenges.length)) || 5;
  const totalTiles = challenges.length || (size * size);
  let basePoints   = 0;
  let tilesCompleted = 0;

  checked.forEach((isChecked, idx) => {
    if (isChecked) {
      tilesCompleted++;
      const ch = challenges[idx];
      if (ch) basePoints += (ch.points || 0);
    }
  });

  const completedLines = [];

  // Rows
  for (let r = 0; r < size; r++) {
    let ok = true;
    for (let c = 0; c < size; c++) {
      if (!checked[r * size + c]) { ok = false; break; }
    }
    if (ok) completedLines.push({ type: 'row', index: r, name: `Ligne ${r + 1}` });
  }

  // Columns
  for (let c = 0; c < size; c++) {
    let ok = true;
    for (let r = 0; r < size; r++) {
      if (!checked[r * size + c]) { ok = false; break; }
    }
    if (ok) completedLines.push({ type: 'col', index: c, name: `Colonne ${c + 1}` });
  }

  // Diagonals
  let diag1Ok = true;
  for (let i = 0; i < size; i++) {
    if (!checked[i * size + i]) { diag1Ok = false; break; }
  }
  if (diag1Ok) completedLines.push({ type: 'diag', index: 0, name: 'Diagonale \\' });

  let diag2Ok = true;
  for (let i = 0; i < size; i++) {
    if (!checked[i * size + (size - 1 - i)]) { diag2Ok = false; break; }
  }
  if (diag2Ok) completedLines.push({ type: 'diag', index: 1, name: 'Diagonale /' });

  const lineBonusPts     = (gameState.settings.lineBonus || 5) * completedLines.length;
  const isGrandChelem    = totalTiles > 0 && tilesCompleted === totalTiles;
  const grandChelemBonus = isGrandChelem ? (gameState.settings.grandChelemBonus || 10) : 0;
  const totalPoints      = basePoints + lineBonusPts + grandChelemBonus;

  return {
    tilesCompleted,
    totalTiles,
    size,
    basePoints,
    completedLines,
    lineBonus: lineBonusPts,
    isGrandChelem,
    grandChelemBonus,
    totalPoints
  };
}

/** Generate a simple unique room code (6 alphanumeric chars) */
function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (gameState.rooms && gameState.rooms[code]) return makeRoomCode();
  return code;
}

/** Get existing room or auto-create one so users never get an empty room / 404 */
function getOrCreateRoom(roomCode, hostId = null) {
  if (!roomCode) return null;
  const cleanCode = String(roomCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
  if (!cleanCode) return null;

  if (!gameState.rooms) gameState.rooms = {};
  if (!gameState.rooms[cleanCode]) {
    const defaultGridId = gameState.activeGridId || Object.keys(gameState.grids)[0] || 'grid_default_s1';
    const grid = gameState.grids[defaultGridId] || Object.values(gameState.grids)[0];
    const totalTiles = grid?.challenges?.length || 25;
    const pIds = hostId && gameState.players[hostId] ? [hostId] : [];
    const checked = {};
    if (hostId) checked[hostId] = new Array(totalTiles).fill(false);

    gameState.rooms[cleanCode] = {
      code: cleanCode,
      name: `Partie #${cleanCode}`,
      gridId: defaultGridId,
      hostId: hostId || null,
      isPrivate: true,
      status: 'waiting',
      winCondition: 'first_bingo',
      playerIds: pIds,
      checked,
      winnerId: null,
      winningReason: null,
      createdAt: new Date().toISOString(),
      history: []
    };
    saveState();
    console.log(`[BINGO] Auto-created room #${cleanCode} with grid ${defaultGridId}`);
  }
  return gameState.rooms[cleanCode];
}

/** Compute global leaderboard ranked by wins and achievements */
function getLeaderboard() {
  const players = Object.values(gameState.players);
  const ranked = players.map(p => {
    const s = p.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
    const winRate = s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
    return {
      id:           p.id,
      name:         p.name,
      club:         p.club,
      avatar:       p.avatar,
      color:        p.color,
      stats:        s,
      wins:         s.wins || 0,
      grandChelems: s.grandChelems || 0,
      bingos:       s.bingos || 0,
      gamesPlayed:  s.gamesPlayed || 0,
      careerPoints: s.careerPoints || 0,
      winRate,
      createdAt:    p.createdAt
    };
  }).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.grandChelems !== a.grandChelems) return b.grandChelems - a.grandChelems;
    if (b.bingos !== a.bingos) return b.bingos - a.bingos;
    if (b.careerPoints !== a.careerPoints) return b.careerPoints - a.careerPoints;
    return (b.gamesPlayed || 0) - (a.gamesPlayed || 0);
  });

  return ranked.map((item, idx) => ({ rank: idx + 1, ...item }));
}

/** Calculate per-player stats for a private room */
function calculateRoomStats(room) {
  const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
  const challenges = grid ? grid.challenges : [];
  const size = grid?.size || Math.round(Math.sqrt(challenges.length)) || 5;
  const totalTiles = challenges.length || (size * size);
  const stats = {};

  if (!room.checked) room.checked = {};

  for (const pId of (room.playerIds || [])) {
    const player = gameState.players[pId];
    if (!player) continue;

    if (!Array.isArray(room.checked[pId]) || room.checked[pId].length !== totalTiles) {
      room.checked[pId] = new Array(totalTiles).fill(false);
    }
    const checked = room.checked[pId];

    let basePoints = 0;
    let tilesCompleted = 0;
    checked.forEach((isChecked, idx) => {
      if (isChecked) {
        tilesCompleted++;
        const ch = challenges[idx];
        if (ch) basePoints += (ch.points || 0);
      }
    });

    const completedLines = [];
    for (let r = 0; r < size; r++) {
      let ok = true;
      for (let c = 0; c < size; c++) {
        if (!checked[r * size + c]) { ok = false; break; }
      }
      if (ok) completedLines.push({ type: 'row', index: r, name: `Ligne ${r + 1}` });
    }

    for (let c = 0; c < size; c++) {
      let ok = true;
      for (let r = 0; r < size; r++) {
        if (!checked[r * size + c]) { ok = false; break; }
      }
      if (ok) completedLines.push({ type: 'col', index: c, name: `Colonne ${c + 1}` });
    }

    let diag1 = true;
    for (let i = 0; i < size; i++) {
      if (!checked[i * size + i]) { diag1 = false; break; }
    }
    if (diag1) completedLines.push({ type: 'diag', index: 0, name: 'Diagonale \\' });

    let diag2 = true;
    for (let i = 0; i < size; i++) {
      if (!checked[i * size + (size - 1 - i)]) { diag2 = false; break; }
    }
    if (diag2) completedLines.push({ type: 'diag', index: 1, name: 'Diagonale /' });

    const lineBonus = (gameState.settings.lineBonus || 5) * completedLines.length;
    const isGrandChelem = totalTiles > 0 && tilesCompleted === totalTiles;
    const grandChelemBonus = isGrandChelem ? (gameState.settings.grandChelemBonus || 10) : 0;
    const totalPoints = basePoints + lineBonus + grandChelemBonus;

    stats[pId] = {
      tilesCompleted,
      totalTiles,
      size,
      basePoints,
      completedLines,
      lineBonus,
      isGrandChelem,
      grandChelemBonus,
      totalPoints
    };
  }

  return stats;
}

/** Return the computed state for a private room */
function getComputedRoomState(roomCode) {
  const room = gameState.rooms?.[roomCode];
  if (!room) return null;

  const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
  const challenges = grid ? grid.challenges : [];
  const stats = calculateRoomStats(room);
  const players = {};

  (room.playerIds || []).forEach(pId => {
    const p = gameState.players[pId];
    if (p) {
      players[pId] = {
        id: p.id,
        name: p.name,
        club: p.club,
        avatar: p.avatar,
        color: p.color,
        stats: p.stats || {},
        checked: room.checked?.[pId] || []
      };
    }
  });

  return {
    code: room.code,
    name: room.name,
    isPrivate: true,
    status: room.status,
    hostId: room.hostId,
    winCondition: room.winCondition || 'first_bingo',
    winnerId: room.winnerId,
    winningReason: room.winningReason,
    gridName: grid?.name || 'Grille Bingo',
    challenges,
    grid: {
      id: grid?.id,
      name: grid?.name,
      size: grid?.size || 5,
      challenges
    },
    players,
    stats,
    history: (room.history || []).slice(-30),
    spectatorUrl: `/spectator.html?room=${room.code}`,
    playerUrl: `/player.html?room=${room.code}`,
    obsUrl: `/obs.html?room=${room.code}`,
    createdAt: room.createdAt
  };
}

// ─── Full computed state ───────────────────────────────────────────────────────

function getComputedState() {
  const activeGridId = gameState.activeGridId;
  const stats        = {};
  const playersOut   = {};

  for (const [pId, player] of Object.entries(gameState.players)) {
    playersOut[pId] = {
      id:        player.id,
      name:      player.name,
      club:      player.club,
      avatar:    player.avatar,
      color:     player.color,
      friends:   player.friends || [],
      stats:     player.stats || {},
      createdAt: player.createdAt,
      grids:     player.grids || {}
    };

    if (activeGridId) {
      stats[pId] = calculateStats(player, activeGridId);
    }
  }

  return {
    activeGrid: activeGridId,
    activeGridId,
    grids:       Object.values(gameState.grids),
    players:     playersOut,
    settings:    gameState.settings,
    history:     gameState.history.slice(-50),
    stats,
    leaderboard: getLeaderboard(),
    roomsCount:  Object.keys(gameState.rooms || {}).length
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
  const { name, description, size, challenges } = req.body;

  if (!name || !Array.isArray(challenges)) {
    return res.status(400).json({ success: false, message: 'Le nom et un tableau de défis sont requis.' });
  }

  const validSizes = [3, 4, 5];
  const gridDim = (typeof size === 'number' && validSizes.includes(size))
    ? size
    : Math.round(Math.sqrt(challenges.length)) || 5;

  const expectedCount = gridDim * gridDim;
  if (challenges.length !== expectedCount) {
    return res.status(400).json({
      success: false,
      message: `Pour une grille ${gridDim}x${gridDim}, il faut exactement ${expectedCount} défis (reçu: ${challenges.length}).`
    });
  }

  const gridId = `grid_${makeId()}`;
  const sanitized = challenges.map((c, i) => ({
    id:          c.id !== undefined ? c.id : i,
    icon:        c.icon        || '🎯',
    title:       (c.title      || `Défi ${i + 1}`).trim(),
    description: (c.description || '').trim(),
    points:      typeof c.points === 'number' ? Math.max(1, Math.min(10, c.points)) : 1,
    constraint:  (c.constraint  || '').trim(),
    category:    (c.category    || 'Général').trim()
  }));

  gameState.grids[gridId] = {
    id:          gridId,
    name:        name.trim(),
    size:        gridDim,
    description: (description || '').trim(),
    challenges:  sanitized,
    createdAt:   new Date().toISOString()
  };

  saveState();
  io.emit('stateUpdate', getComputedState());
  res.json({ success: true, grid: gameState.grids[gridId] });
});

// ─── REST: AI Generator ───────────────────────────────────────────────────────

app.post('/api/ai/generate-grid', (req, res) => {
  try {
    const result = aiGenerator.generateGrid(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/ai/reroll-tile', (req, res) => {
  try {
    const tile = aiGenerator.generateSingleChallenge(req.body);
    res.json({ success: true, challenge: tile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ai/config', (req, res) => {
  res.json({
    themes: aiGenerator.THEMES_CONFIG,
    difficulties: aiGenerator.DIFFICULTY_CONFIG
  });
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
    avatar:    sanitizeAvatar(avatar),
    color:     (color  || '#3b82f6').trim(),
    pin:       (pin    || '0000').trim(),
    grids:     {},
    createdAt: new Date().toISOString()
  };

  // Pre-initialise checked array for active grid
  if (gameState.activeGridId) {
    getChecked(player, gameState.activeGridId);
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

// ─── REST: Auth & Registration ───────────────────────────────────────────────

app.post(['/api/auth/register', '/api/register'], (req, res) => {
  const { name, club, avatar, color, pin } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Le pseudo est obligatoire.' });
  }

  const cleanName = String(name).trim();
  const duplicate = Object.values(gameState.players).find(
    p => p.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ success: false, message: `Le pseudo "${cleanName}" est déjà pris. Choisis-en un autre !` });
  }

  const playerId = `player_${makeId()}`;
  const player = {
    id:        playerId,
    name:      cleanName,
    club:      (club || 'FC Simulation').trim(),
    avatar:    sanitizeAvatar(avatar),
    color:     (color || 'orange').trim(),
    pin:       (pin || '0000').trim(),
    friends:   [],
    grids:     {},
    createdAt: new Date().toISOString()
  };

  // Initialise checked array for active grid
  if (gameState.activeGridId) {
    getChecked(player, gameState.activeGridId);
  }

  gameState.players[playerId] = player;
  saveState();

  const state = getComputedState();
  io.emit('stateUpdate', state);
  io.emit('playerAdded', { playerId, playerName: player.name, avatar: player.avatar, color: player.color });

  res.json({ success: true, player, state });
});

// ─── REST: Login ──────────────────────────────────────────────────────────────

app.post(['/api/auth/login', '/api/login'], (req, res) => {
  const { playerId, username, name, pin } = req.body;
  const lookup = (playerId || username || name || '').trim().toLowerCase();

  let player = null;
  if (playerId && gameState.players[playerId]) {
    player = gameState.players[playerId];
  } else if (lookup) {
    player = Object.values(gameState.players).find(
      p => p.id === lookup || p.name.toLowerCase() === lookup
    );
  }

  if (!player) {
    return res.status(404).json({ success: false, message: 'Aucun compte trouvé avec ce pseudo.' });
  }

  if (player.pin && player.pin !== String(pin || '').trim()) {
    return res.status(401).json({ success: false, message: 'Code PIN ou mot de passe incorrect.' });
  }

  res.json({
    success: true,
    player: {
      id:      player.id,
      name:    player.name,
      club:    player.club,
      avatar:  player.avatar,
      color:   player.color,
      friends: player.friends || []
    }
  });
});

// ─── REST: Friends & Community ────────────────────────────────────────────────

app.get('/api/community/players', (req, res) => {
  const state = getComputedState();
  const list = Object.values(state.players).map(p => ({
    id:        p.id,
    name:      p.name,
    club:      p.club,
    avatar:    p.avatar,
    color:     p.color,
    friends:   p.friends || [],
    stats:     state.stats?.[p.id] || null,
    createdAt: p.createdAt
  }));
  res.json({ success: true, players: list, activeGrid: state.activeGrid });
});

app.post('/api/friends/add', (req, res) => {
  const { playerId, friendId } = req.body;
  if (!playerId || !friendId) {
    return res.status(400).json({ success: false, message: 'Identifiants joueur manquants.' });
  }
  if (playerId === friendId) {
    return res.status(400).json({ success: false, message: 'Impossible de s’ajouter soi-même en ami.' });
  }

  const p = gameState.players[playerId];
  const f = gameState.players[friendId];
  if (!p || !f) {
    return res.status(404).json({ success: false, message: 'Joueur ou ami introuvable.' });
  }

  if (!Array.isArray(p.friends)) p.friends = [];
  if (!p.friends.includes(friendId)) {
    p.friends.push(friendId);
  }

  // Also reciprocal friend addition so both see each other
  if (!Array.isArray(f.friends)) f.friends = [];
  if (!f.friends.includes(playerId)) {
    f.friends.push(playerId);
  }

  saveState();
  io.emit('stateUpdate', getComputedState());
  res.json({ success: true, friends: p.friends, friendName: f.name });
});

app.post('/api/friends/remove', (req, res) => {
  const { playerId, friendId } = req.body;
  const p = gameState.players[playerId];
  if (!p) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable.' });
  }

  if (Array.isArray(p.friends)) {
    p.friends = p.friends.filter(id => id !== friendId);
  }

  const f = gameState.players[friendId];
  if (f && Array.isArray(f.friends)) {
    f.friends = f.friends.filter(id => id !== playerId);
  }

  saveState();
  io.emit('stateUpdate', getComputedState());
  res.json({ success: true, friends: p.friends });
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
  if (avatar !== undefined) player.avatar = sanitizeAvatar(avatar);
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

  const challenges    = gridChallenges(gId);
  if (tileIndex < 0 || tileIndex >= challenges.length) {
    return res.status(400).json({ success: false, message: 'Index de tuile invalide.' });
  }

  const prevStats    = calculateStats(player, gId);
  const checkedArr   = getChecked(player, gId);
  const isNowChecked = typeof checked === 'boolean' ? checked : !checkedArr[tileIndex];
  checkedArr[tileIndex] = isNowChecked;

  const newStats      = calculateStats(player, gId);
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

  // Career stats update
  player.stats = player.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
  if (isNowChecked && challenge) {
    player.stats.careerPoints = (player.stats.careerPoints || 0) + (challenge.points || 1);
  } else if (!isNowChecked && challenge) {
    player.stats.careerPoints = Math.max(0, (player.stats.careerPoints || 0) - (challenge.points || 1));
  }
  const newLineAchieved = newStats.completedLines.length > prevStats.completedLines.length;
  if (newLineAchieved) {
    player.stats.bingos = (player.stats.bingos || 0) + (newStats.completedLines.length - prevStats.completedLines.length);
  }
  const newGrandChelem  = newStats.isGrandChelem && !prevStats.isGrandChelem;
  if (newGrandChelem) {
    player.stats.grandChelems = (player.stats.grandChelems || 0) + 1;
    player.stats.wins = (player.stats.wins || 0) + 1;
  }

  saveState();

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
  io.emit('leaderboardUpdate', getLeaderboard());

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

// ─── REST: Leaderboard ────────────────────────────────────────────────────────

app.get('/api/leaderboard', (req, res) => {
  res.json({
    success: true,
    leaderboard: getLeaderboard()
  });
});

// ─── REST: Rooms (Parties Privées) ───────────────────────────────────────────

app.get('/api/rooms', (req, res) => {
  const list = Object.values(gameState.rooms || {}).map(r => ({
    code: r.code,
    name: r.name,
    gridId: r.gridId,
    gridName: gameState.grids[r.gridId]?.name || 'Grille Bingo',
    hostId: r.hostId,
    hostName: gameState.players[r.hostId]?.name || 'Anonyme',
    status: r.status,
    playerCount: (r.playerIds || []).length,
    winCondition: r.winCondition,
    winnerId: r.winnerId,
    winningReason: r.winningReason,
    createdAt: r.createdAt
  }));
  res.json({ success: true, rooms: list });
});

app.post('/api/rooms', (req, res) => {
  const { name, gridId, hostId, winCondition, customCode } = req.body;
  const cleanName = (name || 'Partie Privée').trim();
  const gId = gridId || gameState.activeGridId || Object.keys(gameState.grids)[0];
  if (!gId || !gameState.grids[gId]) {
    return res.status(400).json({ success: false, message: 'Grille introuvable.' });
  }

  let code = customCode ? String(customCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) : '';
  if (!code || code.length < 3 || (gameState.rooms && gameState.rooms[code])) {
    code = makeRoomCode();
  }

  const grid = gameState.grids[gId];
  const totalTiles = grid.challenges?.length || 25;
  const pIds = hostId && gameState.players[hostId] ? [hostId] : [];
  const checked = {};
  if (hostId) {
    checked[hostId] = new Array(totalTiles).fill(false);
    if (gameState.players[hostId]?.stats) {
      gameState.players[hostId].stats.gamesPlayed = (gameState.players[hostId].stats.gamesPlayed || 0) + 1;
    }
  }

  if (!gameState.rooms) gameState.rooms = {};
  gameState.rooms[code] = {
    code,
    name: cleanName,
    gridId: gId,
    hostId: hostId || null,
    isPrivate: true,
    status: 'waiting',
    winCondition: winCondition || 'first_bingo',
    playerIds: pIds,
    checked,
    winnerId: null,
    winningReason: null,
    createdAt: new Date().toISOString(),
    history: []
  };

  saveState();
  const roomState = getComputedRoomState(code);
  res.json({
    success: true,
    code,
    room: roomState,
    spectatorUrl: `/spectator.html?room=${code}`,
    playerUrl: `/player.html?room=${code}`,
    obsUrl: `/obs.html?room=${code}`
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  getOrCreateRoom(code);
  const roomState = getComputedRoomState(code);
  if (!roomState) {
    return res.status(404).json({ success: false, message: `Partie "${code}" introuvable.` });
  }
  res.json({ success: true, room: roomState });
});

app.post('/api/rooms/join', (req, res) => {
  const { code, playerId } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code de partie requis.' });
  const cleanCode = String(code).trim().toUpperCase();
  const room = getOrCreateRoom(cleanCode);

  let activePlayerId = playerId;
  if (!activePlayerId || !gameState.players[activePlayerId]) {
    // Auto-create guest player if player doesn't exist
    const newId = `player_${makeId()}`;
    const pName = 'Joueur ' + Math.floor(100 + Math.random() * 900);
    gameState.players[newId] = {
      id: newId,
      name: pName,
      club: 'FC Direct',
      avatar: '⚽',
      color: 'lime',
      pin: '',
      friends: [],
      grids: {},
      createdAt: new Date().toISOString()
    };
    activePlayerId = newId;
    saveState();
  }

  const player = gameState.players[activePlayerId];
  if (!room.playerIds.includes(activePlayerId)) {
    room.playerIds.push(activePlayerId);
    const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
    const totalTiles = grid?.challenges?.length || 25;
    if (!room.checked) room.checked = {};
    room.checked[activePlayerId] = new Array(totalTiles).fill(false);

    player.stats = player.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
    player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
    saveState();

    const roomState = getComputedRoomState(cleanCode);
    io.to('room_' + cleanCode).emit('roomStateUpdate', roomState);
    io.to('room_' + cleanCode).emit('roomPlayerJoined', {
      playerId: activePlayerId,
      playerName: player.name,
      avatar: player.avatar,
      color: player.color
    });
  }

  res.json({
    success: true,
    code: cleanCode,
    playerId: activePlayerId,
    player,
    room: getComputedRoomState(cleanCode),
    playerUrl: `/player.html?room=${cleanCode}&p=${activePlayerId}`,
    spectatorUrl: `/spectator.html?room=${cleanCode}`,
    obsUrl: `/obs.html?room=${cleanCode}`
  });
});

app.post('/api/rooms/toggle', (req, res) => {
  const { code, playerId, tileIndex, checked } = req.body;
  const cleanCode = String(code || '').trim().toUpperCase();
  const room = gameState.rooms?.[cleanCode];
  if (!room) return res.status(404).json({ success: false, message: 'Partie introuvable.' });

  const player = gameState.players[playerId];
  if (!player) return res.status(404).json({ success: false, message: 'Joueur introuvable.' });

  if (!room.playerIds.includes(playerId)) {
    room.playerIds.push(playerId);
  }

  const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
  const challenges = grid ? grid.challenges : [];
  if (tileIndex < 0 || tileIndex >= challenges.length) {
    return res.status(400).json({ success: false, message: 'Tuile invalide.' });
  }

  if (!room.checked) room.checked = {};
  if (!room.checked[playerId]) room.checked[playerId] = new Array(challenges.length).fill(false);

  const prevStats = calculateRoomStats(room)[playerId] || {};
  const isNowChecked = typeof checked === 'boolean' ? checked : !room.checked[playerId][tileIndex];
  room.checked[playerId][tileIndex] = isNowChecked;

  const newStats = calculateRoomStats(room)[playerId] || {};
  const challenge = challenges[tileIndex];

  // Career stats update
  player.stats = player.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
  if (isNowChecked && challenge) {
    player.stats.careerPoints = (player.stats.careerPoints || 0) + (challenge.points || 1);
  } else if (!isNowChecked && challenge) {
    player.stats.careerPoints = Math.max(0, (player.stats.careerPoints || 0) - (challenge.points || 1));
  }

  const newLineAchieved = newStats.completedLines.length > (prevStats.completedLines?.length || 0);
  if (newLineAchieved) {
    player.stats.bingos = (player.stats.bingos || 0) + (newStats.completedLines.length - (prevStats.completedLines?.length || 0));
  }

  const newGrandChelem = newStats.isGrandChelem && !prevStats.isGrandChelem;
  if (newGrandChelem) {
    player.stats.grandChelems = (player.stats.grandChelems || 0) + 1;
  }

  // Check victory condition
  let winnerDeclared = false;
  if (room.status !== 'finished') {
    if (room.winCondition === 'grand_chelem' && newGrandChelem) {
      winnerDeclared = true;
      room.winnerId = playerId;
      room.winningReason = 'Grand Chelem (Grille 100% complétée !)';
      room.status = 'finished';
      player.stats.wins = (player.stats.wins || 0) + 1;
    } else if ((room.winCondition === 'first_bingo' || !room.winCondition) && newLineAchieved) {
      winnerDeclared = true;
      room.winnerId = playerId;
      room.winningReason = `Premier Bingo complété (${newStats.completedLines[newStats.completedLines.length - 1]?.name || 'Ligne'}) !`;
      room.status = 'finished';
      player.stats.wins = (player.stats.wins || 0) + 1;
    }
  }

  // History
  if (!room.history) room.history = [];
  room.history.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    playerId,
    playerName: player.name,
    challengeId: tileIndex,
    challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
    challengeIcon: challenge ? challenge.icon : '🎯',
    points: challenge ? challenge.points : 0,
    action: isNowChecked ? 'check' : 'uncheck'
  });
  if (room.history.length > 50) room.history.shift();

  saveState();

  const roomState = getComputedRoomState(cleanCode);
  io.to('room_' + cleanCode).emit('roomStateUpdate', roomState);
  io.to('room_' + cleanCode).emit('roomTileToggled', {
    playerId,
    playerName: player.name,
    challenge,
    checked: isNowChecked,
    newStats,
    newLineAchieved,
    newGrandChelem,
    winnerDeclared,
    winner: winnerDeclared ? { id: player.id, name: player.name, avatar: player.avatar, reason: room.winningReason } : null
  });
  io.emit('leaderboardUpdate', getLeaderboard());

  res.json({ success: true, roomState });
});

app.post('/api/rooms/finish', (req, res) => {
  const { code, winnerId, reason } = req.body;
  const cleanCode = String(code || '').trim().toUpperCase();
  const room = gameState.rooms?.[cleanCode];
  if (!room) return res.status(404).json({ success: false, message: 'Partie introuvable.' });

  room.status = 'finished';
  if (winnerId && gameState.players[winnerId]) {
    room.winnerId = winnerId;
    room.winningReason = reason || 'Victoire validée par l’arbitre';
    const winner = gameState.players[winnerId];
    winner.stats = winner.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
    winner.stats.wins = (winner.stats.wins || 0) + 1;
  }

  saveState();
  const roomState = getComputedRoomState(cleanCode);
  io.to('room_' + cleanCode).emit('roomStateUpdate', roomState);
  io.to('room_' + cleanCode).emit('roomWinner', {
    winnerId: room.winnerId,
    reason: room.winningReason,
    winner: room.winnerId ? gameState.players[room.winnerId] : null
  });
  io.emit('leaderboardUpdate', getLeaderboard());

  res.json({ success: true, room: roomState });
});

app.post('/api/rooms/reset', (req, res) => {
  const { code } = req.body;
  const cleanCode = String(code || '').trim().toUpperCase();
  const room = gameState.rooms?.[cleanCode];
  if (!room) return res.status(404).json({ success: false, message: 'Partie introuvable.' });

  const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
  const totalTiles = grid?.challenges?.length || 25;
  room.checked = {};
  room.winnerId = null;
  room.winningReason = null;
  room.status = 'waiting';
  (room.playerIds || []).forEach(pId => {
    room.checked[pId] = new Array(totalTiles).fill(false);
  });
  room.history = [];

  saveState();
  const roomState = getComputedRoomState(cleanCode);
  io.to('room_' + cleanCode).emit('roomStateUpdate', roomState);
  io.to('room_' + cleanCode).emit('roomReset', { code: cleanCode });
  res.json({ success: true, room: roomState });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.emit('stateUpdate', getComputedState());
  socket.emit('leaderboardUpdate', getLeaderboard());

  // Join private room socket channel
  socket.on('joinRoom', ({ roomCode, playerId, isSpectator }) => {
    if (!roomCode) return;
    const cleanCode = String(roomCode).trim().toUpperCase();
    const room = getOrCreateRoom(cleanCode, playerId);
    socket.join('room_' + cleanCode);
    socket.roomCode = cleanCode;
    socket.playerId = playerId;

    const rState = getComputedRoomState(cleanCode);
    socket.emit('roomStateUpdate', rState);
  });

  socket.on('leaveRoom', ({ roomCode }) => {
    if (roomCode) {
      socket.leave('room_' + String(roomCode).trim().toUpperCase());
    }
  });

  // Handle tile toggle in room from socket
  socket.on('roomToggleTile', ({ code, playerId, tileIndex, checked }) => {
    const cleanCode = String(code || socket.roomCode || '').trim().toUpperCase();
    const room = gameState.rooms?.[cleanCode];
    if (!room) return;
    const player = gameState.players[playerId];
    if (!player) return;

    const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
    const challenges = grid ? grid.challenges : [];
    if (tileIndex < 0 || tileIndex >= challenges.length) return;

    if (!room.playerIds.includes(playerId)) room.playerIds.push(playerId);
    if (!room.checked) room.checked = {};
    if (!room.checked[playerId]) room.checked[playerId] = new Array(challenges.length).fill(false);

    const prevStats = calculateRoomStats(room)[playerId] || {};
    const isNowChecked = typeof checked === 'boolean' ? checked : !room.checked[playerId][tileIndex];
    room.checked[playerId][tileIndex] = isNowChecked;

    const newStats = calculateRoomStats(room)[playerId] || {};
    const challenge = challenges[tileIndex];

    player.stats = player.stats || { wins: 0, grandChelems: 0, bingos: 0, gamesPlayed: 0, careerPoints: 0 };
    if (isNowChecked && challenge) player.stats.careerPoints = (player.stats.careerPoints || 0) + (challenge.points || 1);
    else if (!isNowChecked && challenge) player.stats.careerPoints = Math.max(0, (player.stats.careerPoints || 0) - (challenge.points || 1));

    const newLineAchieved = newStats.completedLines.length > (prevStats.completedLines?.length || 0);
    if (newLineAchieved) {
      player.stats.bingos = (player.stats.bingos || 0) + (newStats.completedLines.length - (prevStats.completedLines?.length || 0));
    }
    const newGrandChelem = newStats.isGrandChelem && !prevStats.isGrandChelem;
    if (newGrandChelem) {
      player.stats.grandChelems = (player.stats.grandChelems || 0) + 1;
    }

    let winnerDeclared = false;
    if (room.status !== 'finished') {
      if (room.winCondition === 'grand_chelem' && newGrandChelem) {
        winnerDeclared = true;
        room.winnerId = playerId;
        room.winningReason = 'Grand Chelem (Grille 100% complétée !)';
        room.status = 'finished';
        player.stats.wins = (player.stats.wins || 0) + 1;
      } else if ((room.winCondition === 'first_bingo' || !room.winCondition) && newLineAchieved) {
        winnerDeclared = true;
        room.winnerId = playerId;
        room.winningReason = `Premier Bingo complété (${newStats.completedLines[newStats.completedLines.length - 1]?.name || 'Ligne'}) !`;
        room.status = 'finished';
        player.stats.wins = (player.stats.wins || 0) + 1;
      }
    }

    if (!room.history) room.history = [];
    room.history.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      playerId,
      playerName: player.name,
      challengeId: tileIndex,
      challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
      challengeIcon: challenge ? challenge.icon : '🎯',
      points: challenge ? challenge.points : 0,
      action: isNowChecked ? 'check' : 'uncheck'
    });
    if (room.history.length > 50) room.history.shift();

    saveState();

    const rState = getComputedRoomState(cleanCode);
    io.to('room_' + cleanCode).emit('roomStateUpdate', rState);
    io.to('room_' + cleanCode).emit('roomTileToggled', {
      playerId,
      playerName: player.name,
      challenge,
      checked: isNowChecked,
      newStats,
      newLineAchieved,
      newGrandChelem,
      winnerDeclared,
      winner: winnerDeclared ? { id: player.id, name: player.name, avatar: player.avatar, reason: room.winningReason } : null
    });
    io.emit('leaderboardUpdate', getLeaderboard());
  });

  socket.on('roomReset', ({ code }) => {
    const cleanCode = String(code || socket.roomCode || '').trim().toUpperCase();
    const room = gameState.rooms?.[cleanCode];
    if (!room) return;
    const grid = gameState.grids[room.gridId] || Object.values(gameState.grids)[0];
    const totalTiles = grid?.challenges?.length || 25;
    room.checked = {};
    room.winnerId = null;
    room.winningReason = null;
    room.status = 'waiting';
    (room.playerIds || []).forEach(pId => {
      room.checked[pId] = new Array(totalTiles).fill(false);
    });
    room.history = [];
    saveState();
    io.to('room_' + cleanCode).emit('roomStateUpdate', getComputedRoomState(cleanCode));
    io.to('room_' + cleanCode).emit('roomReset', { code: cleanCode });
  });

  // Handle global tile toggle from client
  socket.on('toggleTile', ({ playerId, tileIndex, checked, gridId }) => {
    const player = gameState.players[playerId];
    if (!player) return;
    const gId = gridId || gameState.activeGridId;
    const challenges = gridChallenges(gId);
    if (tileIndex < 0 || tileIndex >= challenges.length) return;

    const prevStats   = calculateStats(player, gId);
    const checkedArr  = getChecked(player, gId);
    const isNowChecked = typeof checked === 'boolean' ? checked : !checkedArr[tileIndex];
    checkedArr[tileIndex] = isNowChecked;

    const newStats   = calculateStats(player, gId);
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

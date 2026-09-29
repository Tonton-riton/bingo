const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const STATE_FILE = path.join(DATA_DIR, 'game_state.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load default challenges
let challenges = [];
if (fs.existsSync(CHALLENGES_FILE)) {
  try {
    challenges = JSON.parse(fs.readFileSync(CHALLENGES_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading challenges.json', e);
  }
}

// Initial game state template
const initialGameState = {
  players: {
    '1': {
      id: '1',
      name: 'Joueur 1',
      club: 'FC Streamer',
      avatar: '⚽',
      pin: '1111',
      color: '#3b82f6',
      checked: new Array(25).fill(false)
    },
    '2': {
      id: '2',
      name: 'Joueur 2',
      club: 'Rival FC',
      avatar: '🔥',
      pin: '2222',
      color: '#ef4444',
      checked: new Array(25).fill(false)
    }
  },
  settings: {
    lineBonus: 5,
    grandChelemBonus: 10,
    requirePin: false
  },
  history: []
};

// Load or initialize state
let gameState = initialGameState;
if (fs.existsSync(STATE_FILE)) {
  try {
    gameState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    // Ensure 25 tiles array
    for (const pId of ['1', '2']) {
      if (!gameState.players[pId]) {
        gameState.players[pId] = initialGameState.players[pId];
      }
      if (!Array.isArray(gameState.players[pId].checked) || gameState.players[pId].checked.length !== 25) {
        gameState.players[pId].checked = new Array(25).fill(false);
      }
    }
  } catch (e) {
    console.error('Error reading state file, using initial state', e);
    gameState = initialGameState;
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(gameState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

// Calculate scores, completed lines, and status for a player
function calculatePlayerStats(player) {
  const checked = player.checked;
  let basePoints = 0;
  let tilesCompleted = 0;

  checked.forEach((isChecked, idx) => {
    if (isChecked) {
      tilesCompleted++;
      const ch = challenges[idx];
      if (ch) {
        basePoints += ch.points;
      }
    }
  });

  // Calculate lines
  const completedLines = [];

  // Rows (0-4)
  for (let r = 0; r < 5; r++) {
    let rowComplete = true;
    for (let c = 0; c < 5; c++) {
      if (!checked[r * 5 + c]) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) {
      completedLines.push({ type: 'row', index: r, name: `Ligne ${r + 1}` });
    }
  }

  // Columns (0-4)
  for (let c = 0; c < 5; c++) {
    let colComplete = true;
    for (let r = 0; r < 5; r++) {
      if (!checked[r * 5 + c]) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      completedLines.push({ type: 'col', index: c, name: `Colonne ${c + 1}` });
    }
  }

  // Diagonal 1: (0,0), (1,1), (2,2), (3,3), (4,4)
  if (checked[0] && checked[6] && checked[12] && checked[18] && checked[24]) {
    completedLines.push({ type: 'diag', index: 0, name: 'Diagonale \\' });
  }

  // Diagonal 2: (0,4), (1,3), (2,2), (3,1), (4,0)
  if (checked[4] && checked[8] && checked[12] && checked[16] && checked[20]) {
    completedLines.push({ type: 'diag', index: 1, name: 'Diagonale /' });
  }

  const lineBonus = (gameState.settings.lineBonus || 5) * completedLines.length;
  const isGrandChelem = tilesCompleted === 25;
  const grandChelemBonus = isGrandChelem ? (gameState.settings.grandChelemBonus || 10) : 0;
  const totalPoints = basePoints + lineBonus + grandChelemBonus;

  return {
    tilesCompleted,
    totalTiles: 25,
    basePoints,
    completedLines,
    lineBonus,
    isGrandChelem,
    grandChelemBonus,
    totalPoints
  };
}

// Compute full state payload with computed statistics
function getComputedState() {
  const stats = {
    '1': calculatePlayerStats(gameState.players['1']),
    '2': calculatePlayerStats(gameState.players['2'])
  };

  return {
    players: gameState.players,
    settings: gameState.settings,
    history: gameState.history.slice(-30), // last 30 actions
    stats,
    challenges
  };
}

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json(getComputedState());
});

app.get('/api/challenges', (req, res) => {
  res.json(challenges);
});

// Login / Verify PIN
app.post('/api/login', (req, res) => {
  const { playerId, pin } = req.body;
  const player = gameState.players[playerId];
  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable' });
  }

  if (gameState.settings.requirePin && player.pin && player.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Code PIN incorrect' });
  }

  res.json({ success: true, player: { id: player.id, name: player.name, club: player.club, avatar: player.avatar, color: player.color } });
});

// Toggle Tile
app.post('/api/toggle', (req, res) => {
  const { playerId, tileIndex, checked, pin } = req.body;
  const player = gameState.players[playerId];

  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable' });
  }

  if (gameState.settings.requirePin && player.pin && player.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Non autorisé: Code PIN incorrect' });
  }

  if (tileIndex < 0 || tileIndex >= 25) {
    return res.status(400).json({ success: false, message: 'Index de tuile invalide' });
  }

  const prevStats = calculatePlayerStats(player);
  const isNowChecked = typeof checked === 'boolean' ? checked : !player.checked[tileIndex];
  player.checked[tileIndex] = isNowChecked;

  const newStats = calculatePlayerStats(player);
  const challenge = challenges[tileIndex];

  // Log in history
  const historyItem = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    playerId,
    playerName: player.name,
    challengeId: tileIndex,
    challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
    challengeIcon: challenge ? challenge.icon : '🎯',
    points: challenge ? challenge.points : 0,
    action: isNowChecked ? 'check' : 'uncheck'
  };

  gameState.history.push(historyItem);
  if (gameState.history.length > 100) {
    gameState.history.shift();
  }

  saveState();

  const computedState = getComputedState();

  // Check for line bonus event
  const newLineAchieved = newStats.completedLines.length > prevStats.completedLines.length;
  const newGrandChelem = newStats.isGrandChelem && !prevStats.isGrandChelem;

  // Broadcast to all clients
  io.emit('stateUpdate', computedState);

  // Broadcast specific alert event for OBS/Spectator
  io.emit('tileToggled', {
    playerId,
    playerName: player.name,
    challenge,
    checked: isNowChecked,
    newStats,
    newLineAchieved,
    newGrandChelem
  });

  res.json({ success: true, state: computedState });
});

// Update Profile
app.post('/api/profile', (req, res) => {
  const { playerId, name, club, avatar, color, pin, currentPin } = req.body;
  const player = gameState.players[playerId];

  if (!player) {
    return res.status(404).json({ success: false, message: 'Joueur introuvable' });
  }

  if (gameState.settings.requirePin && player.pin && player.pin !== currentPin) {
    return res.status(401).json({ success: false, message: 'Code PIN actuel incorrect' });
  }

  if (name) player.name = name.trim();
  if (club) player.club = club.trim();
  if (avatar) player.avatar = avatar.trim();
  if (color) player.color = color.trim();
  if (pin) player.pin = pin.trim();

  saveState();
  const computedState = getComputedState();
  io.emit('stateUpdate', computedState);

  res.json({ success: true, player });
});

// Reset Grid
app.post('/api/reset', (req, res) => {
  const { playerId, target, pin } = req.body; // target: '1', '2', or 'all'
  const player = gameState.players[playerId];

  if (gameState.settings.requirePin && player && player.pin && player.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Code PIN incorrect' });
  }

  if (target === '1' || target === '2') {
    gameState.players[target].checked = new Array(25).fill(false);
  } else if (target === 'all') {
    gameState.players['1'].checked = new Array(25).fill(false);
    gameState.players['2'].checked = new Array(25).fill(false);
    gameState.history = [];
  }

  saveState();
  const computedState = getComputedState();
  io.emit('stateUpdate', computedState);
  io.emit('gameReset', { target });

  res.json({ success: true, state: computedState });
});

// Toggle Settings (like PIN requirement, bonus points)
app.post('/api/settings', (req, res) => {
  const { requirePin, lineBonus, grandChelemBonus } = req.body;
  if (typeof requirePin === 'boolean') gameState.settings.requirePin = requirePin;
  if (typeof lineBonus === 'number') gameState.settings.lineBonus = lineBonus;
  if (typeof grandChelemBonus === 'number') gameState.settings.grandChelemBonus = grandChelemBonus;

  saveState();
  const computedState = getComputedState();
  io.emit('stateUpdate', computedState);
  res.json({ success: true, settings: gameState.settings });
});

// Socket.io handlers
io.on('connection', (socket) => {
  // Send current state on connect
  socket.emit('stateUpdate', getComputedState());

  socket.on('toggleTile', (data) => {
    const { playerId, tileIndex, checked } = data;
    const player = gameState.players[playerId];
    if (!player || tileIndex < 0 || tileIndex >= 25) return;

    const prevStats = calculatePlayerStats(player);
    const isNowChecked = typeof checked === 'boolean' ? checked : !player.checked[tileIndex];
    player.checked[tileIndex] = isNowChecked;

    const newStats = calculatePlayerStats(player);
    const challenge = challenges[tileIndex];

    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      playerId,
      playerName: player.name,
      challengeId: tileIndex,
      challengeTitle: challenge ? challenge.title : `Défi #${tileIndex + 1}`,
      challengeIcon: challenge ? challenge.icon : '🎯',
      points: challenge ? challenge.points : 0,
      action: isNowChecked ? 'check' : 'uncheck'
    };

    gameState.history.push(historyItem);
    if (gameState.history.length > 100) gameState.history.shift();

    saveState();

    const computedState = getComputedState();
    const newLineAchieved = newStats.completedLines.length > prevStats.completedLines.length;
    const newGrandChelem = newStats.isGrandChelem && !prevStats.isGrandChelem;

    io.emit('stateUpdate', computedState);
    io.emit('tileToggled', {
      playerId,
      playerName: player.name,
      challenge,
      checked: isNowChecked,
      newStats,
      newLineAchieved,
      newGrandChelem
    });
  });

  socket.on('resetGrid', (data) => {
    const { target } = data;
    if (target === '1' || target === '2') {
      gameState.players[target].checked = new Array(25).fill(false);
    } else if (target === 'all') {
      gameState.players['1'].checked = new Array(25).fill(false);
      gameState.players['2'].checked = new Array(25).fill(false);
      gameState.history = [];
    }
    saveState();
    io.emit('stateUpdate', getComputedState());
    io.emit('gameReset', { target });
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎮 BINGO CARRIÈRE MANAGER SERVER IS RUNNING !`);
  console.log(`-----------------------------------------------`);
  console.log(`🏠 Accueil / Sélecteur : http://localhost:${PORT}`);
  console.log(`⚽ Joueur 1 (Streamer) : http://localhost:${PORT}/player.html?p=1`);
  console.log(`🔥 Joueur 2 (Rival)    : http://localhost:${PORT}/player.html?p=2`);
  console.log(`📺 Vue Spectateur Live : http://localhost:${PORT}/spectator.html`);
  console.log(`🎥 Overlay OBS Studio  : http://localhost:${PORT}/obs.html`);
  console.log(`===============================================`);
});

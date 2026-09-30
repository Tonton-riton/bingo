/**
 * BINGO FOOT — Database & Security Layer
 * Support PostgreSQL (Render / Neon / Supabase) avec fallback fichier local
 * Chiffrement sécurisé des mots de passe (crypto.scryptSync)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'game_state.json');

// Vérification DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;
let isPostgres = false;

if (DATABASE_URL) {
  try {
    const isLocalDb = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: isLocalDb ? false : { rejectUnauthorized: false }
    });
    isPostgres = true;
    console.log('[DB] Connexion PostgreSQL initialisée (SSL=' + (!isLocalDb) + ').');
  } catch (err) {
    console.error('[DB] Erreur initialisation pool PostgreSQL, fallback fichier local:', err.message);
  }
} else {
  console.log('[DB] Aucune DATABASE_URL détectée. Fonctionnement en stockage local.');
}

// ─── Sécurité : Hachage des mots de passe ──────────────────────────────────────

function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password).trim(), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return true; // Pas de mot de passe requis
  if (!password) return false;
  if (!storedHash.includes(':')) {
    // Rétrocompatibilité avec ancien mot de passe non hashé
    return String(password).trim() === String(storedHash).trim();
  }
  const [salt, hash] = storedHash.split(':');
  const verify = crypto.scryptSync(String(password).trim(), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(verify, 'hex'), Buffer.from(hash, 'hex'));
}

// ─── Initialisation du schéma PostgreSQL ──────────────────────────────────────

async function initSchema() {
  if (!isPostgres || !pool) return;

  const client = await pool.connect();
  try {
    console.log('[DB] Initialisation des tables PostgreSQL…');

    // Table Joueurs
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        club VARCHAR(100),
        avatar VARCHAR(255),
        color VARCHAR(32) DEFAULT 'lime',
        password_hash VARCHAR(255),
        stats JSONB DEFAULT '{}',
        friends JSONB DEFAULT '[]',
        grids JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table Salles (Salons de match)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        code VARCHAR(32) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        grid_id VARCHAR(64) NOT NULL,
        host_id VARCHAR(64),
        status VARCHAR(32) DEFAULT 'active',
        win_condition VARCHAR(32) DEFAULT 'first_bingo',
        winner_id VARCHAR(64),
        winning_reason TEXT,
        player_ids JSONB DEFAULT '[]',
        checked JSONB DEFAULT '{}',
        history JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table Grilles
    await client.query(`
      CREATE TABLE IF NOT EXISTS grids (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        size INT DEFAULT 5,
        description TEXT,
        badge VARCHAR(64),
        challenges JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table Paramètres globaux
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    console.log('[DB] ✅ Tables PostgreSQL prêtes et sécurisées !');
  } catch (err) {
    console.error('[DB] Erreur création schéma PostgreSQL:', err.message);
  } finally {
    client.release();
  }
}

// ─── Chargement de l'état initial ─────────────────────────────────────────────

async function loadFullState(fallbackState) {
  if (!isPostgres || !pool) {
    return fallbackState;
  }

  const client = await pool.connect();
  try {
    const playersRes = await client.query('SELECT * FROM players');
    const roomsRes = await client.query("SELECT * FROM rooms WHERE status != 'closed'");
    const gridsRes = await client.query('SELECT * FROM grids');
    const settingsRes = await client.query("SELECT value FROM settings WHERE key = 'game_settings'");

    const players = {};
    playersRes.rows.forEach(r => {
      players[r.id] = {
        id: r.id,
        name: r.name,
        club: r.club,
        avatar: r.avatar,
        color: r.color,
        pin: r.password_hash, // mot de passe chiffré
        stats: r.stats || {},
        friends: r.friends || [],
        grids: r.grids || {},
        createdAt: r.created_at
      };
    });

    const rooms = {};
    roomsRes.rows.forEach(r => {
      rooms[r.code] = {
        code: r.code,
        name: r.name,
        gridId: r.grid_id,
        hostId: r.host_id,
        isPrivate: true,
        status: r.status || 'active',
        winCondition: r.win_condition || 'first_bingo',
        winnerId: r.winner_id,
        winningReason: r.winning_reason,
        playerIds: r.player_ids || [],
        checked: r.checked || {},
        history: r.history || [],
        createdAt: r.created_at
      };
    });

    const grids = {};
    gridsRes.rows.forEach(r => {
      grids[r.id] = {
        id: r.id,
        name: r.name,
        size: r.size,
        description: r.description,
        badge: r.badge,
        challenges: r.challenges
      };
    });

    // Fusion avec le fallback si la BDD est encore vide
    return {
      activeGridId: Object.keys(grids)[0] || fallbackState.activeGridId,
      grids: Object.keys(grids).length ? grids : fallbackState.grids,
      players: Object.keys(players).length ? players : fallbackState.players,
      rooms: Object.keys(rooms).length ? rooms : fallbackState.rooms,
      settings: settingsRes.rows[0]?.value || fallbackState.settings,
      history: fallbackState.history || []
    };
  } catch (err) {
    console.error('[DB] Erreur chargement depuis PostgreSQL, utilisation fallback:', err.message);
    return fallbackState;
  } finally {
    client.release();
  }
}

// ─── Sauvegardes synchronisées en BDD ─────────────────────────────────────────

async function savePlayerToDB(player) {
  if (!isPostgres || !pool) return;
  try {
    await pool.query(`
      INSERT INTO players (id, name, club, avatar, color, password_hash, stats, friends, grids, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        club = EXCLUDED.club,
        avatar = EXCLUDED.avatar,
        color = EXCLUDED.color,
        password_hash = EXCLUDED.password_hash,
        stats = EXCLUDED.stats,
        friends = EXCLUDED.friends,
        grids = EXCLUDED.grids,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      player.id,
      player.name,
      player.club || '',
      player.avatar || '⚽',
      player.color || 'lime',
      player.pin || '',
      JSON.stringify(player.stats || {}),
      JSON.stringify(player.friends || []),
      JSON.stringify(player.grids || {})
    ]);
  } catch (err) {
    console.error('[DB] Erreur savePlayerToDB:', err.message);
  }
}

async function saveRoomToDB(room) {
  if (!isPostgres || !pool) return;
  try {
    await pool.query(`
      INSERT INTO rooms (code, name, grid_id, host_id, status, win_condition, winner_id, winning_reason, player_ids, checked, history, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        grid_id = EXCLUDED.grid_id,
        host_id = EXCLUDED.host_id,
        status = EXCLUDED.status,
        win_condition = EXCLUDED.win_condition,
        winner_id = EXCLUDED.winner_id,
        winning_reason = EXCLUDED.winning_reason,
        player_ids = EXCLUDED.player_ids,
        checked = EXCLUDED.checked,
        history = EXCLUDED.history,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      room.code,
      room.name,
      room.gridId,
      room.hostId || null,
      room.status || 'active',
      room.winCondition || 'first_bingo',
      room.winnerId || null,
      room.winningReason || null,
      JSON.stringify(room.playerIds || []),
      JSON.stringify(room.checked || {}),
      JSON.stringify((room.history || []).slice(-50))
    ]);
  } catch (err) {
    console.error('[DB] Erreur saveRoomToDB:', err.message);
  }
}

async function saveGridToDB(grid) {
  if (!isPostgres || !pool) return;
  try {
    await pool.query(`
      INSERT INTO grids (id, name, size, description, badge, challenges)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        size = EXCLUDED.size,
        description = EXCLUDED.description,
        badge = EXCLUDED.badge,
        challenges = EXCLUDED.challenges;
    `, [
      grid.id,
      grid.name,
      grid.size || 5,
      grid.description || '',
      grid.badge || '',
      JSON.stringify(grid.challenges || [])
    ]);
  } catch (err) {
    console.error('[DB] Erreur saveGridToDB:', err.message);
  }
}

async function deleteRoomFromDB(code) {
  if (!isPostgres || !pool) return;
  try {
    await pool.query('UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE code = $2', ['closed', code]);
  } catch (err) {
    console.error('[DB] Erreur deleteRoomFromDB:', err.message);
  }
}

module.exports = {
  get isPostgres() { return isPostgres; },
  initSchema,
  loadFullState,
  savePlayerToDB,
  saveRoomToDB,
  saveGridToDB,
  deleteRoomFromDB,
  hashPassword,
  verifyPassword
};

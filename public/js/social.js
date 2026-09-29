/**
 * BINGO CARRIÈRE - Social & Auth Client Module
 * Système de comptes, connexion, amis et communauté
 */

const SocialHub = (function() {
  const STORAGE_KEY = 'bingo_current_user';
  let stateCache = null;

  function getCurrentUser() {
    try {
      const u = localStorage.getItem(STORAGE_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    renderAuthNav();
  }

  function logout() {
    setCurrentUser(null);
    if (typeof notify === 'function') notify('👋 Vous êtes déconnecté.');
    setTimeout(() => window.location.reload(), 300);
  }

  // Inject common auth & friends modals into document body if not present
  function injectModals() {
    if (document.getElementById('social-modals-injected')) return;

    const div = document.createElement('div');
    div.id = 'social-modals-injected';
    div.innerHTML = `
      <!-- MODAL REGISTER -->
      <div class="modal-overlay" id="modal-social-register">
        <div class="modal-box" style="max-width:480px; border:1px solid #1e293b; border-radius:14px; background:#0e1424;">
          <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div class="modal-title" style="color:#ffffff; font-weight:900; letter-spacing:0.02em;">
              <span style="color:var(--accent);">⚡</span> CRÉER UN COMPTE
            </div>
            <button class="modal-close" onclick="SocialHub.closeModal('modal-social-register')">✕</button>
          </div>
          <form onsubmit="SocialHub.submitRegister(event)" style="margin-top:16px;">
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">PSEUDO JOUEUR / STREAMER *</label>
              <input type="text" class="form-input" id="reg-name" required maxlength="25" placeholder="Ex: Tonton-riton" style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff; font-size:0.95rem; font-weight:700;">
            </div>
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">CLUB / ÉQUIPE CARRIÈRE</label>
              <input type="text" class="form-input" id="reg-club" maxlength="30" placeholder="Ex: Olympique de Marseille, Real Madrid..." style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff;">
            </div>
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">AVATAR (EMOJI OU LIEN IMAGE)</label>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <div id="reg-avatar-preview" style="width:44px; height:44px; border:2px solid var(--accent); border-radius:8px; background:#141d33; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">⚽</div>
                <input type="text" class="form-input" id="reg-avatar" value="⚽" placeholder="Emoji ou URL..." style="flex:1; background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff;">
              </div>
              <div class="emoji-row" id="reg-emoji-row" style="display:flex; gap:6px; flex-wrap:wrap;">
                <span class="emoji-opt selected" data-v="⚽">⚽</span>
                <span class="emoji-opt" data-v="🔥">🔥</span>
                <span class="emoji-opt" data-v="⚡">⚡</span>
                <span class="emoji-opt" data-v="👑">👑</span>
                <span class="emoji-opt" data-v="🦁">🦁</span>
                <span class="emoji-opt" data-v="🎯">🎯</span>
                <span class="emoji-opt" data-v="🚀">🚀</span>
                <span class="emoji-opt" data-v="🏆">🏆</span>
                <span class="emoji-opt" data-v="⚔️">⚔️</span>
                <span class="emoji-opt" data-v="💎">💎</span>
                <span class="emoji-opt" data-v="🌟">🌟</span>
                <span class="emoji-opt" data-v="🎮">🎮</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">CODE PIN / MOT DE PASSE (Optionnel pour sécuriser)</label>
              <input type="password" class="form-input" id="reg-pin" maxlength="12" placeholder="Code secret ou 4 chiffres..." style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff;">
            </div>
            <div id="reg-error" style="display:none; color:#f87171; font-size:0.82rem; margin-bottom:12px; font-weight:700;"></div>
            <div style="display:flex; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-secondary-slate btn-full" onclick="SocialHub.closeModal('modal-social-register')">Annuler</button>
              <button type="submit" class="btn btn-primary btn-full" style="font-weight:900;">🚀 CRÉER MON COMPTE</button>
            </div>
            <div style="text-align:center; margin-top:14px; font-size:0.8rem; color:#94a3b8;">
              Tu as déjà un compte ? <a href="javascript:void(0)" onclick="SocialHub.switchToLogin()" style="color:var(--accent); font-weight:700; text-decoration:none;">Se connecter ici</a>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL LOGIN -->
      <div class="modal-overlay" id="modal-social-login">
        <div class="modal-box" style="max-width:440px; border:1px solid #1e293b; border-radius:14px; background:#0e1424;">
          <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div class="modal-title" style="color:#ffffff; font-weight:900; letter-spacing:0.02em;">
              <span style="color:var(--accent);">🔑</span> CONNEXION JOUEUR
            </div>
            <button class="modal-close" onclick="SocialHub.closeModal('modal-social-login')">✕</button>
          </div>
          <form onsubmit="SocialHub.submitLogin(event)" style="margin-top:16px;">
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">TON PSEUDO *</label>
              <input type="text" class="form-input" id="login-username" required placeholder="Ex: Tonton-riton" style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff; font-size:0.95rem; font-weight:700;">
            </div>
            <div class="form-group">
              <label class="form-label" style="color:#cbd5e1; font-size:0.78rem;">CODE PIN / MOT DE PASSE (si défini)</label>
              <input type="password" class="form-input" id="login-pin" placeholder="••••" style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff;">
            </div>
            <div id="login-auth-error" style="display:none; color:#f87171; font-size:0.82rem; margin-bottom:12px; font-weight:700;"></div>
            <div style="display:flex; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-secondary-slate btn-full" onclick="SocialHub.closeModal('modal-social-login')">Annuler</button>
              <button type="submit" class="btn btn-primary btn-full" style="font-weight:900;">🔓 SE CONNECTER</button>
            </div>
            <div style="text-align:center; margin-top:14px; font-size:0.8rem; color:#94a3b8;">
              Pas encore de compte ? <a href="javascript:void(0)" onclick="SocialHub.switchToRegister()" style="color:var(--accent); font-weight:700; text-decoration:none;">Créer un compte gratuit</a>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL FRIENDS & COMMUNITY HUB -->
      <div class="modal-overlay" id="modal-social-friends">
        <div class="modal-box" style="max-width:680px; border:1px solid #1e293b; border-radius:14px; background:#0e1424;">
          <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div class="modal-title" style="color:#ffffff; font-weight:900;">
              <span style="color:var(--accent);">👥</span> COMMUNAUTÉ & AMIS
            </div>
            <button class="modal-close" onclick="SocialHub.closeModal('modal-social-friends')">✕</button>
          </div>

          <!-- TABS -->
          <div style="display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <button class="btn btn-sm active-tab" id="btn-tab-my-friends" onclick="SocialHub.switchTab('my-friends')" style="border-radius:8px; font-weight:800;">⭐ MES AMIS (<span id="friends-tab-count">0</span>)</button>
            <button class="btn btn-sm" id="btn-tab-find-players" onclick="SocialHub.switchTab('find-players')" style="border-radius:8px; font-weight:800;">🔍 TROUVER DES JOUEURS</button>
          </div>

          <!-- TAB 1: MY FRIENDS -->
          <div id="subtab-my-friends">
            <div id="my-friends-list" style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
              <div class="text-muted text-sm" style="padding:20px; text-align:center;">Chargement de vos amis…</div>
            </div>
          </div>

          <!-- TAB 2: FIND PLAYERS -->
          <div id="subtab-find-players" style="display:none;">
            <div style="margin-bottom:14px;">
              <input type="text" class="form-input" id="search-player-input" oninput="SocialHub.filterPlayers(this.value)" placeholder="Rechercher par pseudo ou par club..." style="background:#090d16; border:1px solid #1e293b; border-radius:8px; color:#fff; font-size:0.9rem;">
            </div>
            <div id="community-players-list" style="max-height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
              <div class="text-muted text-sm" style="padding:20px; text-align:center;">Chargement des joueurs…</div>
            </div>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Setup emoji row selection in register modal
    const emojiOpts = document.querySelectorAll('#reg-emoji-row .emoji-opt');
    emojiOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        emojiOpts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('reg-avatar').value = opt.dataset.v;
        const prev = document.getElementById('reg-avatar-preview');
        if (prev) prev.innerHTML = typeof renderAvatar === 'function' ? renderAvatar(opt.dataset.v) : opt.dataset.v;
      });
    });

    // Close on overlay click
    div.querySelectorAll('.modal-overlay').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target === el) el.classList.remove('open');
      });
    });
  }

  function openModal(id) {
    injectModals();
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function switchToLogin() {
    closeModal('modal-social-register');
    openModal('modal-social-login');
  }

  function switchToRegister() {
    closeModal('modal-social-login');
    openModal('modal-social-register');
  }

  function switchTab(tab) {
    const isFriends = tab === 'my-friends';
    document.getElementById('btn-tab-my-friends').style.background = isFriends ? 'var(--accent)' : 'rgba(255,255,255,0.06)';
    document.getElementById('btn-tab-my-friends').style.color = isFriends ? '#ffffff' : '#9ca3af';
    document.getElementById('btn-tab-find-players').style.background = !isFriends ? 'var(--accent)' : 'rgba(255,255,255,0.06)';
    document.getElementById('btn-tab-find-players').style.color = !isFriends ? '#ffffff' : '#9ca3af';
    document.getElementById('subtab-my-friends').style.display = isFriends ? 'block' : 'none';
    document.getElementById('subtab-find-players').style.display = !isFriends ? 'block' : 'none';
  }

  async function submitRegister(e) {
    e.preventDefault();
    const errEl = document.getElementById('reg-error');
    errEl.style.display = 'none';

    const name = document.getElementById('reg-name').value.trim();
    const club = document.getElementById('reg-club').value.trim();
    const avatar = document.getElementById('reg-avatar').value.trim() || '⚽';
    const pin = document.getElementById('reg-pin').value.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, club, avatar, pin, color: 'orange' })
      });
      const data = await res.json();
      if (!data.success) {
        errEl.textContent = '❌ ' + (data.message || 'Erreur lors de la création');
        errEl.style.display = 'block';
        return;
      }

      setCurrentUser(data.player);
      closeModal('modal-social-register');
      if (typeof notify === 'function') {
        notify(`🎉 Compte "${data.player.name}" créé avec succès !`);
      } else {
        alert(`Compte "${data.player.name}" créé avec succès !`);
      }

      // If on home or player page, redirect to player grid
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        window.location.href = `/player.html?p=${data.player.id}`;
      } else {
        window.location.reload();
      }
    } catch (err) {
      errEl.textContent = '❌ Erreur de connexion au serveur.';
      errEl.style.display = 'block';
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    const errEl = document.getElementById('login-auth-error');
    errEl.style.display = 'none';

    const username = document.getElementById('login-username').value.trim();
    const pin = document.getElementById('login-pin').value.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (!data.success) {
        errEl.textContent = '❌ ' + (data.message || 'Identifiants incorrects');
        errEl.style.display = 'block';
        return;
      }

      setCurrentUser(data.player);
      closeModal('modal-social-login');
      if (typeof notify === 'function') {
        notify(`👋 Bienvenue, ${data.player.name} !`);
      }

      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        window.location.href = `/player.html?p=${data.player.id}`;
      } else {
        window.location.reload();
      }
    } catch (err) {
      errEl.textContent = '❌ Erreur réseau lors de la connexion.';
      errEl.style.display = 'block';
    }
  }

  async function addFriend(friendId) {
    const user = getCurrentUser();
    if (!user) {
      openModal('modal-social-login');
      return;
    }

    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, friendId })
      });
      const data = await res.json();
      if (data.success) {
        user.friends = data.friends;
        setCurrentUser(user);
        if (typeof notify === 'function') notify(`⭐ ${data.friendName || 'Joueur'} ajouté à vos amis !`);
        refreshFriendsList();
      }
    } catch (err) {
      console.error('Erreur addFriend:', err);
    }
  }

  async function removeFriend(friendId) {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, friendId })
      });
      const data = await res.json();
      if (data.success) {
        user.friends = data.friends;
        setCurrentUser(user);
        if (typeof notify === 'function') notify('Ami retiré.');
        refreshFriendsList();
      }
    } catch (err) {
      console.error('Erreur removeFriend:', err);
    }
  }

  async function refreshFriendsList() {
    const user = getCurrentUser();
    const countEl = document.getElementById('friends-tab-count');
    const myFriendsEl = document.getElementById('my-friends-list');
    const commEl = document.getElementById('community-players-list');

    if (!user) {
      if (countEl) countEl.textContent = '0';
      if (myFriendsEl) {
        myFriendsEl.innerHTML = `
          <div class="card" style="padding:20px; text-align:center; border-radius:0px;">
            <div style="font-size:24px; margin-bottom:8px;">🔒</div>
            <div style="font-weight:700; color:#fff; margin-bottom:6px;">Connectez-vous pour avoir une liste d'amis</div>
            <button class="btn btn-primary" onclick="SocialHub.openModal('modal-social-login')" style="margin-top:10px;">Se connecter</button>
          </div>
        `;
      }
      return;
    }

    try {
      const res = await fetch('/api/community/players');
      const data = await res.json();
      if (!data.success) return;

      const players = data.players || [];
      const userObj = players.find(p => p.id === user.id) || user;
      const friendIds = new Set(userObj.friends || []);

      if (countEl) countEl.textContent = friendIds.size;

      // Render My Friends
      const friends = players.filter(p => friendIds.has(p.id));
      if (!friends.length) {
        myFriendsEl.innerHTML = `
          <div class="card" style="padding:24px; text-align:center; border-radius:10px; border:1px solid #1e293b; background:#090d16;">
            <div style="font-size:28px; margin-bottom:8px;">👥</div>
            <div style="font-weight:800; color:#ffffff; font-size:1rem; margin-bottom:4px;">Aucun ami pour le moment</div>
            <div style="font-size:0.82rem; color:#94a3b8; margin-bottom:14px;">Trouvez des adversaires dans la communauté et ajoutez-les pour comparer vos grilles en direct !</div>
            <button class="btn btn-primary btn-sm" onclick="SocialHub.switchTab('find-players')">🔍 Explorer les joueurs</button>
          </div>
        `;
      } else {
        myFriendsEl.innerHTML = friends.map(f => {
          const s = f.stats;
          const av = typeof renderAvatar === 'function' ? renderAvatar(f.avatar) : f.avatar;
          return `
            <div class="friend-card" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:#090d16; border:1px solid #1e293b; border-left:3px solid var(--accent); border-radius:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:40px; height:40px; border:2px solid var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; background:#141d33; flex-shrink:0;">${av}</div>
                <div>
                  <div style="font-weight:800; font-size:0.95rem; color:#ffffff;">${f.name}</div>
                  <div style="font-size:0.75rem; color:#94a3b8;">${f.club} · <strong style="color:var(--accent);">${s?.totalPoints || 0} pts</strong> (${s?.tilesCompleted || 0}/${s?.totalTiles || 25})</div>
                </div>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <a href="/player.html?p=${f.id}" class="btn btn-sm btn-primary" style="font-size:0.75rem; padding:5px 9px;">🎮 Voir grille</a>
                <button class="btn btn-sm btn-danger" onclick="SocialHub.removeFriend('${f.id}')" title="Retirer des amis" style="padding:5px 8px;">✕</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Find Players
      renderCommunityPlayersList(players, friendIds, user.id);

    } catch (err) {
      console.error('Erreur refreshFriendsList:', err);
    }
  }

  function renderCommunityPlayersList(players, friendIds, currentUserId, filterText = '') {
    const commEl = document.getElementById('community-players-list');
    if (!commEl) return;

    const filtered = players.filter(p => {
      if (p.id === currentUserId) return false;
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.club && p.club.toLowerCase().includes(q));
    });

    if (!filtered.length) {
      commEl.innerHTML = '<div class="text-muted text-sm" style="padding:20px; text-align:center;">Aucun joueur trouvé.</div>';
      return;
    }

    commEl.innerHTML = filtered.map(p => {
      const isFriend = friendIds.has(p.id);
      const av = typeof renderAvatar === 'function' ? renderAvatar(p.avatar) : p.avatar;
      const s = p.stats;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; background:#090d16; border:1px solid #1e293b; border-radius:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border:1px solid #2a374f; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; background:#141d33; flex-shrink:0;">${av}</div>
            <div>
              <div style="font-weight:800; font-size:0.9rem; color:#ffffff;">${p.name}</div>
              <div style="font-size:0.72rem; color:#94a3b8;">${p.club} · ${s?.totalPoints || 0} pts</div>
            </div>
          </div>
          <div>
            ${isFriend
              ? `<span style="font-size:0.75rem; color:#34d399; font-weight:700; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:6px; padding:4px 8px;">✓ Ami</span>`
              : `<button class="btn btn-sm" onclick="SocialHub.addFriend('${p.id}')" style="font-size:0.75rem; border-color:var(--accent); color:var(--accent);">+ Ajouter</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  function filterPlayers(query) {
    fetch('/api/community/players').then(r => r.json()).then(data => {
      if (!data.success) return;
      const user = getCurrentUser();
      const friendIds = new Set(user?.friends || []);
      renderCommunityPlayersList(data.players || [], friendIds, user?.id, query);
    });
  }

  function renderAuthNav() {
    const slot = document.getElementById('auth-nav-slot');
    if (!slot) return;

    const user = getCurrentUser();
    if (!user) {
      slot.innerHTML = `
        <button class="btn btn-sm btn-primary" onclick="SocialHub.openModal('modal-social-register')" style="font-weight:900;">
          ✨ CRÉER UN COMPTE
        </button>
        <button class="btn btn-sm" onclick="SocialHub.openModal('modal-social-login')">
          🔑 CONNEXION
        </button>
      `;
    } else {
      const av = typeof renderAvatar === 'function' ? renderAvatar(user.avatar) : (user.avatar || '⚽');
      const friendCount = user.friends ? user.friends.length : 0;
      slot.innerHTML = `
        <div style="display:flex; align-items:center; gap:6px;">
          <a href="/player.html?p=${user.id}" class="btn btn-sm" style="display:flex; align-items:center; gap:8px; border-color:var(--accent); background:rgba(255,85,0,0.12);">
            <div style="width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:14px;">${av}</div>
            <span style="font-weight:800; color:#fff;">${user.name}</span>
          </a>
          <button class="btn btn-sm" onclick="SocialHub.openFriendsModal()" title="Mes Amis & Communauté" style="border-color:rgba(255,255,255,0.2);">
            👥 <span class="badge-mini" style="background:var(--accent); color:#fff; font-size:0.65rem; padding:1px 5px; font-weight:900; margin-left:2px;">${friendCount}</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="SocialHub.logout()" title="Déconnexion" style="padding:5px 8px;">
            🚪
          </button>
        </div>
      `;
    }
  }

  function openFriendsModal() {
    openModal('modal-social-friends');
    refreshFriendsList();
  }

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    renderAuthNav();
  });

  return {
    getCurrentUser,
    setCurrentUser,
    logout,
    openModal,
    closeModal,
    switchToLogin,
    switchToRegister,
    switchTab,
    submitRegister,
    submitLogin,
    addFriend,
    removeFriend,
    openFriendsModal,
    refreshFriendsList,
    filterPlayers,
    renderAuthNav
  };
})();

// Export globally
window.SocialHub = SocialHub;

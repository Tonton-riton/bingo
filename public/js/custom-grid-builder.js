/**
 * BINGO FOOT — Custom Grid Builder (Créateur de Bingo Personnalisé)
 * Permet de concevoir manuellement ses propres grilles (3x3, 4x4, 5x5)
 * avec éditeur tuile par tuile, import rapide par copier-coller de liste,
 * sélection d'emojis, points personnalisés et sauvegarde persistante en base de données.
 */

(function () {
  const EMOJI_PALETTE = [
    '⚽', '🎮', '📋', '🎯', '🧤', '🟥', '🟨', '💥', '💰', '🏆',
    '👑', '🦁', '🚀', '🌱', '📊', '🗣️', '👔', '⚔️', '🔥', '⚡',
    '🥶', '👶', '🤕', '⏱️', '🎙️', '🤝', '📐', '💎', '🥊', '🏟️'
  ];

  function detectEmojiForText(text) {
    if (!text) return '🎯';
    const trimmed = text.trim();
    // Si la ligne commence déjà par un emoji
    const emojiMatch = trimmed.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
    if (emojiMatch) return emojiMatch[0];

    const lower = trimmed.toLowerCase();
    if (lower.includes('but') || lower.includes('golazo') || lower.includes('lucarne') || lower.includes('frappe')) return '⚽';
    if (lower.includes('rouge') || lower.includes('expuls')) return '🟥';
    if (lower.includes('jaune') || lower.includes('avertiss')) return '🟨';
    if (lower.includes('gardien') || lower.includes('arrêt') || lower.includes('arret') || lower.includes('clean sheet') || lower.includes('parade')) return '🧤';
    if (lower.includes('péno') || lower.includes('penalty') || lower.includes('tir au but')) return '🎯';
    if (lower.includes('poteau') || lower.includes('barre') || lower.includes('transversale') || lower.includes('fracas')) return '💥';
    if (lower.includes('transfert') || lower.includes('argent') || lower.includes('budget') || lower.includes('mercato') || lower.includes('m€') || lower.includes('vendre') || lower.includes('vente')) return '💰';
    if (lower.includes('pépite') || lower.includes('wonderkid') || lower.includes('jeune') || lower.includes('académie') || lower.includes('academie') || lower.includes('centre de form')) return '🌱';
    if (lower.includes('tactique') || lower.includes('dispositif') || lower.includes('compo') || lower.includes('consigne')) return '📋';
    if (lower.includes('xg') || lower.includes('possession') || lower.includes('stat')) return '📊';
    if (lower.includes('fifa') || lower.includes('ea fc') || lower.includes('manette') || lower.includes('console')) return '🎮';
    if (lower.includes('causerie') || lower.includes('bouteille') || lower.includes('vestiaire') || lower.includes('colère')) return '🗣️';
    if (lower.includes('président') || lower.includes('dirigeant') || lower.includes('conseil d\'admin') || lower.includes('manager')) return '👔';
    if (lower.includes('bless') || lower.includes('forfait') || lower.includes('infirmerie')) return '🤕';
    if (lower.includes('derby') || lower.includes('rival') || lower.includes('clasico')) return '⚔️';
    if (lower.includes('trophée') || lower.includes('titre') || lower.includes('coupe') || lower.includes('champion') || lower.includes('triplé')) return '🏆';
    if (lower.includes('90e') || lower.includes('temps add') || lower.includes('minute') || lower.includes('fergie time')) return '⏱️';
    if (lower.includes('remontada') || lower.includes('scénario') || lower.includes('folie')) return '⚡';
    return '🎯';
  }

  function cleanTitle(raw) {
    if (!raw) return '';
    // Retirer les puces ou numéros de début (ex: "1. ", "1 - ", "- ", "* ")
    let t = raw.replace(/^\s*(\d+[\.\-\)]\s*|[\-\*\•]\s*)/, '').trim();
    // Retirer un emoji initial si déjà présent
    t = t.replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u, '').trim();
    return t;
  }

  const CustomGridBuilder = {
    size: 5,
    name: '',
    description: '',
    challenges: [],
    containerId: null,
    previewContainerId: null,
    roomCode: null,
    onSuccessCallback: null,
    availablePresets: [],

    init(options = {}) {
      this.containerId = options.containerId || 'custom-grid-builder-root';
      this.previewContainerId = options.previewContainerId || 'custom-grid-builder-preview';
      this.roomCode = options.roomCode || null;
      this.onSuccessCallback = options.onSuccess || null;
      this.size = options.defaultSize || 5;
      this.name = options.defaultName || 'Mon Bingo Personnalisé';
      this.description = options.defaultDesc || 'Grille sur-mesure créée pour notre match';

      this.initDefaultChallenges(this.size);
      this.loadPresetsCatalog();
      this.render();
    },

    setRoomCode(code) {
      this.roomCode = code;
    },

    async loadPresetsCatalog() {
      try {
        const res = await fetch('/api/grids');
        const data = await res.json();
        if (Array.isArray(data)) {
          this.availablePresets = data;
          this.renderPresetSelector();
        }
      } catch (e) {
        console.warn('Impossible de charger les modèles existants:', e);
      }
    },

    initDefaultChallenges(size) {
      const count = size * size;
      this.challenges = [];
      for (let i = 0; i < count; i++) {
        this.challenges.push({
          id: i,
          icon: EMOJI_PALETTE[i % EMOJI_PALETTE.length],
          title: `Défi ${i + 1}`,
          description: '',
          points: 1,
          constraint: '',
          category: 'Général'
        });
      }
    },

    setSize(newSize) {
      newSize = parseInt(newSize, 10);
      if (![3, 4, 5].includes(newSize)) return;
      if (newSize === this.size) return;

      const oldCount = this.challenges.length;
      const newCount = newSize * newSize;
      const newChallenges = [];

      for (let i = 0; i < newCount; i++) {
        if (i < oldCount && this.challenges[i]) {
          newChallenges.push({ ...this.challenges[i], id: i });
        } else {
          newChallenges.push({
            id: i,
            icon: EMOJI_PALETTE[i % EMOJI_PALETTE.length],
            title: `Défi ${i + 1}`,
            description: '',
            points: 1,
            constraint: '',
            category: 'Général'
          });
        }
      }

      this.size = newSize;
      this.challenges = newChallenges;
      this.render();
    },

    loadFromPresetId(gridId) {
      const preset = this.availablePresets.find(g => g.id === gridId);
      if (!preset || !Array.isArray(preset.challenges)) return;

      this.name = `${preset.name} (Perso)`;
      this.description = preset.description || '';
      const pSize = preset.size || Math.round(Math.sqrt(preset.challenges.length)) || 5;
      this.size = [3, 4, 5].includes(pSize) ? pSize : 5;
      const total = this.size * this.size;

      this.challenges = [];
      for (let i = 0; i < total; i++) {
        const source = preset.challenges[i] || {};
        this.challenges.push({
          id: i,
          icon: source.icon || EMOJI_PALETTE[i % EMOJI_PALETTE.length],
          title: source.title || `Défi ${i + 1}`,
          description: source.description || '',
          points: source.points || 1,
          constraint: source.constraint || '',
          category: source.category || 'Général'
        });
      }

      this.render();
    },

    clearAll() {
      const count = this.size * this.size;
      this.challenges = [];
      for (let i = 0; i < count; i++) {
        this.challenges.push({
          id: i,
          icon: '🎯',
          title: '',
          description: '',
          points: 1,
          constraint: '',
          category: 'Général'
        });
      }
      this.render();
    },

    applyBulkText(text) {
      if (!text || !text.trim()) return;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      const total = this.size * this.size;
      for (let i = 0; i < total; i++) {
        if (i < lines.length) {
          const raw = lines[i];
          const emoji = detectEmojiForText(raw);
          const title = cleanTitle(raw) || `Défi ${i + 1}`;
          this.challenges[i] = {
            id: i,
            icon: emoji,
            title: title,
            description: this.challenges[i]?.description || '',
            points: this.challenges[i]?.points || 1,
            constraint: this.challenges[i]?.constraint || '',
            category: this.challenges[i]?.category || 'Général'
          };
        }
      }

      this.render();
    },

    updateChallenge(index, field, value) {
      if (!this.challenges[index]) return;
      if (field === 'points') {
        value = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
      }
      this.challenges[index][field] = value;
      this.updateTilePreview(index);
    },

    openEmojiPicker(index) {
      const current = this.challenges[index]?.icon || '🎯';
      const promptRes = prompt(`Choisissez un emoji pour la case #${index + 1} :\n(Ex: ⚽, 🎮, 🧤, 🟥, 💰, 🏆...)`, current);
      if (promptRes && promptRes.trim()) {
        const chosen = promptRes.trim();
        this.updateChallenge(index, 'icon', chosen);
        this.renderTileRow(index);
      }
    },

    renderPresetSelector() {
      const selectEl = document.getElementById('cgb-preset-select');
      if (!selectEl) return;
      selectEl.innerHTML = '<option value="">🪄 Choisir un modèle comme base…</option>' +
        this.availablePresets.map(p => `<option value="${p.id}">${p.name} (${p.size || 5}x${p.size || 5})</option>`).join('');
    },

    render() {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const totalTiles = this.size * this.size;

      container.innerHTML = `
        <div class="cgb-wrapper" style="color:#ffffff;">

          <!-- EN-TÊTE DU CRÉATEUR -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid #1e2c3d;border-radius:14px;padding:18px 20px;margin-bottom:20px;">
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.8rem;color:#cbd5e1;font-weight:700;">Nom de votre Bingo *</label>
                <input type="text" class="form-input" id="cgb-name" value="${this.escapeHtml(this.name)}" maxlength="60" placeholder="Ex: Mon Défi Carrière FC Metz, Soirée Foot..." style="font-weight:800;font-size:0.95rem;">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.8rem;color:#cbd5e1;font-weight:700;">Description (Optionnelle)</label>
                <input type="text" class="form-input" id="cgb-desc" value="${this.escapeHtml(this.description)}" maxlength="120" placeholder="Ex: Objectifs et défis pour notre partie en direct" style="font-size:0.88rem;">
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:1px solid #1a2533;padding-top:14px;">
              <!-- SÉLECTEUR DE FORMAT -->
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:0.75rem;font-weight:800;color:#94a3b8;text-transform:uppercase;">Format :</span>
                <div style="display:inline-flex;background:#0e1622;border:1px solid #24354a;border-radius:8px;padding:2px;">
                  <button type="button" class="btn btn-sm ${this.size === 3 ? 'btn-lime' : 'btn-secondary-dark'}" onclick="CustomGridBuilder.setSize(3)" style="padding:4px 12px;font-size:0.78rem;font-weight:800;border-radius:6px;">3x3 (9)</button>
                  <button type="button" class="btn btn-sm ${this.size === 4 ? 'btn-lime' : 'btn-secondary-dark'}" onclick="CustomGridBuilder.setSize(4)" style="padding:4px 12px;font-size:0.78rem;font-weight:800;border-radius:6px;">4x4 (16)</button>
                  <button type="button" class="btn btn-sm ${this.size === 5 ? 'btn-lime' : 'btn-secondary-dark'}" onclick="CustomGridBuilder.setSize(5)" style="padding:4px 12px;font-size:0.78rem;font-weight:800;border-radius:6px;">5x5 (25)</button>
                </div>
              </div>

              <!-- OUTILS RAPIDES -->
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <select id="cgb-preset-select" class="form-input" onchange="if(this.value) CustomGridBuilder.loadFromPresetId(this.value)" style="font-size:0.78rem;padding:6px 10px;height:auto;max-width:240px;border-color:#2a3a50;">
                  <option value="">🪄 Choisir un modèle comme base…</option>
                </select>
                <button type="button" class="btn btn-sm btn-secondary-slate" onclick="CustomGridBuilder.toggleBulkDrawer()" style="font-size:0.78rem;font-weight:800;">
                  📋 Coller une liste
                </button>
                <button type="button" class="btn btn-sm btn-secondary-slate" onclick="CustomGridBuilder.clearAll()" style="font-size:0.78rem;color:#f87171;">
                  🗑️ Vider
                </button>
              </div>
            </div>
          </div>

          <!-- TIROIR D'IMPORTATION RAPIDE (COLLER UNE LISTE) -->
          <div id="cgb-bulk-drawer" style="display:none;background:#0d141f;border:1px solid #23344a;border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:0.85rem;font-weight:900;color:var(--lime);">📋 IMPORTATION RAPIDE DE DÉFIS (1 LIGNE = 1 CASE)</span>
              <button type="button" class="btn btn-sm" onclick="CustomGridBuilder.toggleBulkDrawer()" style="padding:2px 8px;font-size:0.75rem;background:#1a2330;color:#94a3b8;">✕ Fermer</button>
            </div>
            <p style="font-size:0.75rem;color:#94a3b8;margin-bottom:10px;line-height:1.4;">
              Collez vos défis ci-dessous (jusqu'à ${totalTiles} lignes). Les emojis et titres seront automatiquement analysés et assignés aux cases :
            </p>
            <textarea id="cgb-bulk-text" rows="6" class="form-input" placeholder="Exemple :&#10;But sur coup franc direct&#10;Carton rouge direct&#10;Poteau ou transversale&#10;Arrêt sur penalty&#10;Pépite vendue +40M€..." style="font-size:0.85rem;font-family:inherit;resize:vertical;"></textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn btn-sm btn-lime" onclick="CustomGridBuilder.handleApplyBulkText()" style="font-weight:900;">
                ⚡ Remplir automatiquement les ${totalTiles} cases
              </button>
            </div>
          </div>

          <!-- DISPOSITION EN 2 COLONNES : ÉDITEUR DÉTAILLÉ + MINI APERÇU LIVE -->
          <div class="cgb-editor-layout" style="display:grid;grid-template-columns:1.35fr 0.95fr;gap:20px;">

            <!-- COLONNE 1 : LISTE DES TUILES ÉDITABLES -->
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="font-size:0.85rem;font-weight:900;color:#ffffff;letter-spacing:0.04em;text-transform:uppercase;">
                  LES ${totalTiles} CASES DE VOTRE BINGO
                </div>
                <span style="font-size:0.72rem;color:#94a3b8;">Cliquez sur un emoji pour le changer</span>
              </div>

              <div id="cgb-tiles-list" style="display:flex;flex-direction:column;gap:10px;max-height:560px;overflow-y:auto;padding-right:6px;">
                ${this.renderTilesRowsHTML()}
              </div>
            </div>

            <!-- COLONNE 2 : APERÇU LIVE DE LA GRILLE -->
            <div style="background:#090d15;border:1px solid #1a2534;border-radius:16px;padding:18px;position:sticky;top:20px;align-self:start;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div>
                  <div style="font-size:0.68rem;font-weight:900;color:var(--lime);letter-spacing:0.08em;text-transform:uppercase;">APERÇU TEMPS RÉEL</div>
                  <div id="cgb-preview-title" style="font-family:var(--font-display);font-size:1.25rem;color:#ffffff;margin-top:2px;">${this.escapeHtml(this.name || 'Bingo Personnalisé')}</div>
                </div>
                <span class="live-dot" style="font-size:0.7rem;"><span class="pulse"></span> ${totalTiles} CASES</span>
              </div>

              <div id="cgb-mini-grid" style="display:grid;grid-template-columns:repeat(${this.size}, minmax(0, 1fr));gap:6px;margin-bottom:16px;">
                ${this.renderMiniGridHTML()}
              </div>

              <!-- BOUTON D'ENREGISTREMENT -->
              <div style="border-top:1px solid #1a2534;padding-top:16px;">
                <div id="cgb-error-msg" style="display:none;color:#ef4444;font-size:0.8rem;font-weight:800;background:rgba(239,68,68,0.12);padding:10px 12px;border-radius:8px;border:1px solid rgba(239,68,68,0.3);margin-bottom:12px;"></div>
                <button type="button" id="cgb-btn-save" class="btn btn-lime btn-full" onclick="CustomGridBuilder.save()" style="padding:14px;font-size:0.95rem;font-weight:900;letter-spacing:0.04em;box-shadow:0 0 25px var(--lime-glow);">
                  💾 ENREGISTRER CE BINGO
                </button>
              </div>
            </div>

          </div>

        </div>
      `;

      // Brancher la synchronisation du titre et de la description
      const nameInput = document.getElementById('cgb-name');
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          this.name = e.target.value;
          const previewTitle = document.getElementById('cgb-preview-title');
          if (previewTitle) previewTitle.textContent = this.name || 'Bingo Personnalisé';
        });
      }

      const descInput = document.getElementById('cgb-desc');
      if (descInput) {
        descInput.addEventListener('input', (e) => {
          this.description = e.target.value;
        });
      }

      this.renderPresetSelector();
    },

    renderTilesRowsHTML() {
      return this.challenges.map((c, i) => `
        <div class="cgb-tile-card" id="cgb-card-${i}" style="background:#0e1520;border:1px solid #1f2c3d;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:border-color 0.15s ease;">
          <div style="font-size:0.75rem;font-weight:900;color:#64748b;min-width:24px;text-align:center;">#${i + 1}</div>

          <!-- BOUTON SÉLECTEUR EMOJI -->
          <button type="button" class="btn-icon" onclick="CustomGridBuilder.openEmojiPicker(${i})" title="Changer l'emoji" style="font-size:1.35rem;padding:4px 8px;background:#151f2e;border:1px solid #293a50;border-radius:8px;cursor:pointer;">
            <span id="cgb-icon-val-${i}">${c.icon || '🎯'}</span>
          </button>

          <!-- TITRE DU DÉFI -->
          <div style="flex:1;">
            <input type="text" class="form-input" id="cgb-title-${i}" value="${this.escapeHtml(c.title)}" placeholder="Titre du défi (obligatoire)" oninput="CustomGridBuilder.updateChallenge(${i}, 'title', this.value)" style="font-size:0.85rem;font-weight:700;padding:6px 10px;height:auto;border-color:#223145;">
          </div>

          <!-- DESCRIPTION (OPTIONNELLE) -->
          <div style="flex:0.9;">
            <input type="text" class="form-input" id="cgb-desc-${i}" value="${this.escapeHtml(c.description)}" placeholder="Description / condition" oninput="CustomGridBuilder.updateChallenge(${i}, 'description', this.value)" style="font-size:0.78rem;padding:6px 10px;height:auto;border-color:#1c2738;color:#cbd5e1;">
          </div>

          <!-- SÉLECTEUR POINTS -->
          <div style="width:72px;">
            <select class="form-input" id="cgb-pts-${i}" onchange="CustomGridBuilder.updateChallenge(${i}, 'points', this.value)" style="font-size:0.78rem;font-weight:800;padding:6px 6px;height:auto;border-color:#223145;color:var(--lime);">
              <option value="1" ${c.points === 1 ? 'selected' : ''}>+1 pt</option>
              <option value="2" ${c.points === 2 ? 'selected' : ''}>+2 pts</option>
              <option value="3" ${c.points === 3 ? 'selected' : ''}>+3 pts</option>
              <option value="4" ${c.points === 4 ? 'selected' : ''}>+4 pts</option>
              <option value="5" ${c.points === 5 ? 'selected' : ''}>+5 pts</option>
            </select>
          </div>
        </div>
      `).join('');
    },

    renderTileRow(index) {
      const c = this.challenges[index];
      if (!c) return;
      const iconEl = document.getElementById(`cgb-icon-val-${index}`);
      if (iconEl) iconEl.textContent = c.icon || '🎯';
      this.updateTilePreview(index);
    },

    renderMiniGridHTML() {
      return this.challenges.map((c, i) => `
        <div id="cgb-mini-cell-${i}" class="tile read-only" style="min-height:56px;padding:4px 6px;font-size:0.62rem;background:#0d141e;border:1px solid #1a2534;border-radius:6px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span id="cgb-mini-icon-${i}" style="font-size:0.85rem;">${c.icon || '🎯'}</span>
            <span id="cgb-mini-pts-${i}" style="font-size:0.58rem;font-weight:900;color:var(--lime);">+${c.points || 1}</span>
          </div>
          <div id="cgb-mini-title-${i}" style="font-weight:700;font-size:0.62rem;line-height:1.15;color:#ffffff;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
            ${this.escapeHtml(c.title || `Défi ${i + 1}`)}
          </div>
        </div>
      `).join('');
    },

    updateTilePreview(index) {
      const c = this.challenges[index];
      if (!c) return;
      const iconEl = document.getElementById(`cgb-mini-icon-${index}`);
      if (iconEl) iconEl.textContent = c.icon || '🎯';
      const ptsEl = document.getElementById(`cgb-mini-pts-${index}`);
      if (ptsEl) ptsEl.textContent = `+${c.points || 1}`;
      const titleEl = document.getElementById(`cgb-mini-title-${index}`);
      if (titleEl) titleEl.textContent = c.title || `Défi ${index + 1}`;
    },

    toggleBulkDrawer() {
      const drawer = document.getElementById('cgb-bulk-drawer');
      if (!drawer) return;
      const isOpen = drawer.style.display !== 'none';
      drawer.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        const textarea = document.getElementById('cgb-bulk-text');
        if (textarea) textarea.focus();
      }
    },

    handleApplyBulkText() {
      const textarea = document.getElementById('cgb-bulk-text');
      if (!textarea) return;
      this.applyBulkText(textarea.value);
      this.toggleBulkDrawer();
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    async save() {
      const errorMsg = document.getElementById('cgb-error-msg');
      const saveBtn = document.getElementById('cgb-btn-save');

      const nameInput = document.getElementById('cgb-name');
      const name = (nameInput?.value || this.name || '').trim();

      if (!name) {
        if (errorMsg) {
          errorMsg.textContent = 'Veuillez saisir un nom pour votre grille.';
          errorMsg.style.display = 'block';
        }
        nameInput?.focus();
        return;
      }

      // Valider les défis
      const totalTiles = this.size * this.size;
      const sanitized = [];

      for (let i = 0; i < totalTiles; i++) {
        const c = this.challenges[i] || {};
        const title = (c.title || '').trim() || `Défi ${i + 1}`;
        sanitized.push({
          id: i,
          icon: c.icon || '🎯',
          title: title,
          description: (c.description || '').trim(),
          points: c.points || 1,
          constraint: (c.constraint || '').trim(),
          category: (c.category || 'Général').trim()
        });
      }

      if (errorMsg) errorMsg.style.display = 'none';
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Sauvegarde en cours…';
      }

      try {
        const payload = {
          name,
          description: (this.description || '').trim(),
          size: this.size,
          challenges: sanitized,
          roomCode: this.roomCode || null
        };

        const res = await fetch('/api/grids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success && data.grid) {
          if (typeof this.onSuccessCallback === 'function') {
            this.onSuccessCallback(data.grid);
          }
        } else {
          throw new Error(data.message || 'Erreur lors de la création de la grille.');
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = '❌ ' + (err.message || 'Erreur réseau');
          errorMsg.style.display = 'block';
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 ENREGISTRER CE BINGO';
        }
      }
    }
  };

  window.CustomGridBuilder = CustomGridBuilder;
})();

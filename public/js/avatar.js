/**
 * Avatar & Emote Helper for Bingo Carrière Manager
 * Handles emoji aliases, custom images, URLs, and cross-platform emoji rendering.
 */

const EMOJI_ALIASES = {
  'ball': '⚽', 'soccer': '⚽', 'foot': '⚽', 'football': '⚽',
  'fire': '🔥', 'flame': '🔥',
  'zap': '⚡', 'bolt': '⚡', 'lightning': '⚡', 'eclair': '⚡',
  'crown': '👑', 'king': '👑', 'couronne': '👑',
  'lion': '🦁',
  'rocket': '🚀', 'fusee': '🚀',
  'wolf': '🐺', 'loup': '🐺',
  'target': '🎯', 'cible': '🎯',
  'trophy': '🏆', 'cup': '🏆', 'trophee': '🏆',
  'swords': '⚔️', 'sword': '⚔️', 'epee': '⚔️',
  'diamond': '💎', 'gem': '💎', 'diamant': '💎',
  'star': '🌟', 'etoile': '🌟',
  'eagle': '🦅', 'aigle': '🦅',
  'dragon': '🐉',
  'fox': '🦊', 'renard': '🦊',
  'shield': '🛡️', 'bouclier': '🛡️',
  'controller': '🎮', 'game': '🎮', 'manette': '🎮',
  'glove': '🧤', 'gant': '🧤',
  'box': '🥊', 'boxe': '🥊',
  'medal': '🥇', 'medaille': '🥇',
  'money': '💰', 'argent': '💰',
  'shirt': '👕', 'maillot': '👕',
  'whistle': '📯', 'sifflet': '📯'
};

/**
 * Returns HTML or string representing the avatar.
 * Supports:
 * - Aliases ('ball' -> ⚽, 'fire' -> 🔥)
 * - Direct emojis (⚽, 🔥, 👑, etc.)
 * - Image URLs (http://, https://, data:image, /images/...)
 */
function renderAvatar(av) {
  if (!av) return '⚽';
  const str = String(av).trim();
  const lower = str.toLowerCase().replace(/^:|:$/g, '');

  if (EMOJI_ALIASES[lower]) {
    return EMOJI_ALIASES[lower];
  }

  // If it's an image URL
  if (/^(https?:\/\/|data:image\/|\/)/i.test(str)) {
    return `<img src="${str}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.parentElement.textContent='⚽';" />`;
  }

  return str;
}

/**
 * Clean string avatar to canonical emoji or valid string
 */
function sanitizeAvatarString(av) {
  if (!av) return '⚽';
  const str = String(av).trim();
  const lower = str.toLowerCase().replace(/^:|:$/g, '');
  return EMOJI_ALIASES[lower] || str;
}

/**
 * Wire an interactive emoji picker with live preview and text input
 */
function setupEmojiPicker(rowId, inputId, previewId) {
  const row = document.getElementById(rowId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (!row || !input) return;

  function update(val) {
    input.value = val;
    if (preview) preview.innerHTML = renderAvatar(val);
    row.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.v === val);
    });
  }

  // Click on emoji buttons
  row.addEventListener('click', (e) => {
    const opt = e.target.closest('.emoji-opt');
    if (!opt) return;
    update(opt.dataset.v || opt.textContent.trim());
  });

  // Typing or pasting in the input
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (preview) preview.innerHTML = renderAvatar(val || '⚽');
    row.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.v === val);
    });
  });

  // Init preview
  if (preview && input.value) {
    preview.innerHTML = renderAvatar(input.value);
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.renderAvatar = renderAvatar;
  window.sanitizeAvatarString = sanitizeAvatarString;
  window.setupEmojiPicker = setupEmojiPicker;
  window.EMOJI_ALIASES = EMOJI_ALIASES;
}

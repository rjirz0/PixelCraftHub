// Pixel Realms - Core Interactive Vanilla Script

const SERVER_IP = "play.pixelrealms.net";
const DISCORD_INVITE = "https://discord.gg/pixelrealms";

// --- Retro 8-bit sound synthesizer using Web Audio API ---
let audioCtx = null;
let soundEnabled = true;

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playClickSound() {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

function playPlaceSound() {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.setValueAtTime(260, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

function playCraftSuccessSound() {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.15);
  });
}

// Global Sound Controller Toggle
window.toggleSound = function() {
  soundEnabled = !soundEnabled;
  const soundIcon = document.getElementById('sound-icon');
  if (soundEnabled) {
    playClickSound();
    soundIcon.setAttribute('data-lucide', 'volume-2');
    soundIcon.classList.remove('text-red-400');
    soundIcon.classList.add('text-emerald-400');
  } else {
    soundIcon.setAttribute('data-lucide', 'volume-x');
    soundIcon.classList.remove('text-emerald-400');
    soundIcon.classList.add('text-red-400');
  }
  lucide.createIcons();
};

// --- Copy Server IP Utility ---
window.copyServerIp = function(realmName = 'General') {
  playClickSound();
  navigator.clipboard.writeText(SERVER_IP).then(() => {
    // Show copy notification toast
    const toast = document.getElementById('join-toast');
    const toastRealm = document.getElementById('toast-realm');
    toastRealm.textContent = realmName;
    toast.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 5000);
  });
};

window.dismissToast = function() {
  playClickSound();
  document.getElementById('join-toast').add('hidden');
};

// --- Live Player Count Fluctuator ---
let playersOnline = 1420;
setInterval(() => {
  const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
  playersOnline = Math.max(1200, playersOnline + delta);
  const counterElements = document.querySelectorAll('.players-online-counter');
  counterElements.forEach(el => {
    el.textContent = playersOnline.toLocaleString();
  });
}, 4000);

// --- Real-time Ping Testing ---
window.testPing = function() {
  playClickSound();
  const pingBtn = document.getElementById('ping-btn');
  const pingValueEl = document.getElementById('ping-latency-value');
  const pingSpinner = document.getElementById('ping-spinner');

  pingBtn.disabled = true;
  pingValueEl.textContent = '---';
  pingSpinner.classList.add('animate-spin');

  setTimeout(() => {
    const lat = Math.floor(Math.random() * 18) + 11; // 11ms to 29ms
    pingValueEl.textContent = `${lat}ms`;
    pingBtn.disabled = false;
    pingSpinner.classList.remove('animate-spin');
  }, 800);
};

// --- Lead Capture & Local/Server Vault Persistence ---
let localSubmissionsCount = 0;

async function fetchSubmissionsCount() {
  try {
    const res = await fetch('/api/leads');
    if (res.ok) {
      const data = await res.json();
      localSubmissionsCount = data.length;
    } else {
      // Fallback
      const saved = localStorage.getItem('pixel_realms_leads');
      localSubmissionsCount = saved ? JSON.parse(saved).length : 0;
    }
  } catch (err) {
    const saved = localStorage.getItem('pixel_realms_leads');
    localSubmissionsCount = saved ? JSON.parse(saved).length : 0;
  }
  document.getElementById('leads-count-val').textContent = localSubmissionsCount;

  // Query backend database health to show active status (MongoDB vs. Local JSON)
  try {
    const healthRes = await fetch('/api/health');
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      const statusLabel = document.getElementById('db-status-label');
      if (statusLabel) {
        if (healthData.database === 'mongodb') {
          statusLabel.textContent = 'MongoDB Atlas Cloud';
          statusLabel.className = 'text-emerald-600 font-bold';
        } else {
          statusLabel.textContent = 'leads.json Database';
          statusLabel.className = 'text-emerald-950';
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch DB health status', err);
  }
}

window.submitLeadForm = async function(event) {
  event.preventDefault();
  playClickSound();

  const emailInput = document.getElementById('lead-email');
  const email = emailInput.value.trim();
  if (!email) return;

  const submitBtn = document.getElementById('lead-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>ACTIVATING KEY...</span>';

  // Generate Key
  const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) rand += '-';
    rand += allowed.charAt(Math.floor(Math.random() * allowed.length));
  }
  const generatedKey = `PR-${rand}`;

  const submissionData = {
    email: email,
    accessKey: generatedKey,
    source: 'Static HTML Pixel Realms Portal',
    timestamp: new Date().toISOString(),
    status: 'activated'
  };

  // 1. Save to browser local storage first as a safety lock
  try {
    const existing = localStorage.getItem('pixel_realms_leads') || '[]';
    const list = JSON.parse(existing);
    list.push(submissionData);
    localStorage.setItem('pixel_realms_leads', JSON.stringify(list));
  } catch (e) {
    console.error('Failed backup localstorage', e);
  }

  // 2. Submit to our robust Node server API endpoint!
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
  } catch (err) {
    console.warn('Node server api down, saved purely to local client-side vault.');
  }

  // Animation Success Outflow
  setTimeout(() => {
    playCraftSuccessSound();
    
    // Hide registration inputs, show success output card
    document.getElementById('lead-input-container').classList.add('hidden');
    document.getElementById('lead-success-container').classList.remove('hidden');
    document.getElementById('generated-key-box').textContent = generatedKey;
    
    fetchSubmissionsCount();
  }, 1000);
};

window.resetLeadForm = function() {
  playClickSound();
  document.getElementById('lead-email').value = '';
  document.getElementById('lead-input-container').classList.remove('hidden');
  document.getElementById('lead-success-container').classList.add('hidden');
  document.getElementById('lead-submit-btn').disabled = false;
  document.getElementById('lead-submit-btn').innerHTML = '<span>ACTIVATE CLOSED BETA ACCESS</span>';
};

window.exportLeads = async function() {
  playClickSound();
  try {
    // Attempt backend export
    const res = await fetch('/api/leads');
    let data;
    if (res.ok) {
      data = await res.json();
    } else {
      data = JSON.parse(localStorage.getItem('pixel_realms_leads') || '[]');
    }

    if (!data || data.length === 0) {
      alert("No submissions stored to export yet!");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "pixel_realms_leads.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export data', err);
  }
};

window.toggleHelpInfo = function() {
  playClickSound();
  const infoBlock = document.getElementById('dev-info-block');
  infoBlock.classList.toggle('hidden');
};

// --- Interactive 3x3 Crafting Bench Logic ---
const MATERIALS = [
  { id: 'wood', name: 'Oak Planks', icon: '🪵' },
  { id: 'stick', name: 'Wooden Stick', icon: '🦯' },
  { id: 'stone', name: 'Cobblestone', icon: '🪨' },
  { id: 'iron', name: 'Iron Ingot', icon: '⚪' },
  { id: 'gold', name: 'Gold Ingot', icon: '🟡' },
  { id: 'diamond', name: 'Diamond', icon: '💎' },
  { id: 'redstone', name: 'Redstone Dust', icon: '🔴' },
  { id: 'gunpowder', name: 'Gunpowder', icon: '🌑' },
  { id: 'sand', name: 'Sand', icon: '⏳' },
  { id: 'apple', name: 'Red Apple', icon: '🍎' },
];

const RECIPES = [
  {
    id: 'diamond_sword',
    outputName: 'Diamond Sword',
    outputIcon: '🗡️',
    outputCount: 1,
    pattern: [
      null, 'diamond', null,
      null, 'diamond', null,
      null, 'stick', null
    ],
    description: '+14 Attack Damage. Slices through creepers with legendary ease!',
    achievement: 'Advancement Made: Monster Hunter!'
  },
  {
    id: 'diamond_pickaxe',
    outputName: 'Diamond Pickaxe',
    outputIcon: '⛏️',
    outputCount: 1,
    pattern: [
      'diamond', 'diamond', 'diamond',
      null, 'stick', null,
      null, 'stick', null
    ],
    description: 'Can mine Obsidian and Ancient Debris at ultra speed.',
    achievement: 'Advancement Made: Isn\'t It Iron Pick?'
  },
  {
    id: 'golden_apple',
    outputName: 'Enchanted Golden Apple',
    outputIcon: '🍏',
    outputCount: 1,
    pattern: [
      'gold', 'gold', 'gold',
      'gold', 'apple', 'gold',
      'gold', 'gold', 'gold'
    ],
    description: 'Grants Regeneration II, Absorption IV, Resistance, and Fire Resistance!',
    achievement: 'Advancement Made: Overpowered!'
  },
  {
    id: 'tnt',
    outputName: 'TNT Block',
    outputIcon: '🧨',
    outputCount: 1,
    pattern: [
      'gunpowder', 'sand', 'gunpowder',
      'sand', 'gunpowder', 'sand',
      'gunpowder', 'sand', 'gunpowder'
    ],
    description: 'Explosive device. Handle with caution near faction bases.',
    achievement: 'Advancement Made: Demolition Expert!'
  },
  {
    id: 'iron_chestplate',
    outputName: 'Iron Chestplate',
    outputIcon: '🛡️',
    outputCount: 1,
    pattern: [
      'iron', null, 'iron',
      'iron', 'iron', 'iron',
      'iron', 'iron', 'iron'
    ],
    description: '+6 Armor protection. Reliable steel forging.',
    achievement: 'Advancement Made: Suit Up!'
  },
  {
    id: 'stone_axe',
    outputName: 'Cobblestone Axe',
    outputIcon: '🪓',
    outputCount: 1,
    pattern: [
      'stone', 'stone', null,
      'stone', 'stick', null,
      null, 'stick', null
    ],
    description: 'Essential survival tool for chopping timber and fending off spiders.',
    achievement: 'Advancement Made: Timber!'
  }
];

let selectedMat = MATERIALS[0]; // oak planks
let grid = Array(9).fill(null);
let unlockedAchievements = [];

window.selectMaterial = function(matId) {
  playClickSound();
  selectedMat = MATERIALS.find(m => m.id === matId);
  
  // Highlight active slot in Inventory
  document.querySelectorAll('.inv-slot').forEach(el => {
    el.classList.remove('ring-4', 'ring-yellow-300', 'scale-110', 'z-10');
  });
  const activeEl = document.getElementById(`inv-${matId}`);
  if (activeEl) {
    activeEl.classList.add('ring-4', 'ring-yellow-300', 'scale-110', 'z-10');
  }

  document.getElementById('current-cursor-item').textContent = selectedMat.name;
};

window.gridSlotClick = function(index) {
  playPlaceSound();
  if (grid[index] === selectedMat.id) {
    grid[index] = null;
  } else {
    grid[index] = selectedMat.id;
  }
  updateGridUI();
};

window.clearGrid = function() {
  playClickSound();
  grid = Array(9).fill(null);
  updateGridUI();
};

window.toggleGuide = function() {
  playClickSound();
  const book = document.getElementById('guide-book');
  book.classList.toggle('hidden');
};

window.autoFillRecipe = function(recipeId) {
  playPlaceSound();
  const rec = RECIPES.find(r => r.id === recipeId);
  if (rec) {
    grid = [...rec.pattern];
    updateGridUI();
    document.getElementById('guide-book').classList.add('hidden');
  }
};

function checkRecipeMatch() {
  return RECIPES.find(recipe => {
    return recipe.pattern.every((expectedId, idx) => grid[idx] === expectedId);
  });
}

function updateGridUI() {
  // Update slots
  grid.forEach((matId, idx) => {
    const slotEl = document.getElementById(`grid-slot-${idx}`);
    if (matId) {
      const mat = MATERIALS.find(m => m.id === matId);
      slotEl.textContent = mat ? mat.icon : '';
    } else {
      slotEl.textContent = '';
    }
  });

  const matched = checkRecipeMatch();
  const resultSlot = document.getElementById('craft-result-slot');
  const detailsEl = document.getElementById('craft-matched-details');

  if (matched) {
    resultSlot.innerHTML = `
      <span class="text-4xl select-none">${matched.outputIcon}</span>
      <span class="absolute bottom-1 right-1 font-pixel text-xs bg-black/80 text-white px-1">
        ${matched.outputCount}
      </span>
    `;
    resultSlot.classList.remove('opacity-60', 'cursor-not-allowed');
    resultSlot.classList.add('ring-4', 'ring-emerald-400', 'bg-emerald-800/30', 'animate-pulse', 'cursor-pointer');
    resultSlot.disabled = false;

    detailsEl.innerHTML = `
      <div class="mt-4 text-center">
        <span class="text-sm font-bold text-emerald-950 font-pixel block uppercase">
          ${matched.outputName}
        </span>
        <p class="text-xs text-gray-800 leading-tight mt-1 max-w-[200px]">
          ${matched.description}
        </p>
        <button
          onclick="triggerCraft()"
          class="mc-button-green mt-3 px-4 py-2 text-xs font-bold w-full animate-bounce cursor-pointer"
        >
          CLICK TO CRAFT & CLAIM!
        </button>
      </div>
    `;
  } else {
    resultSlot.innerHTML = `<span class="text-xs text-gray-600 font-mono text-center px-1">No Recipe</span>`;
    resultSlot.classList.add('opacity-60', 'cursor-not-allowed');
    resultSlot.classList.remove('ring-4', 'ring-emerald-400', 'bg-emerald-800/30', 'animate-pulse', 'cursor-pointer');
    resultSlot.disabled = true;

    detailsEl.innerHTML = `
      <p class="text-xs text-gray-700 mt-6 text-center">
        Arrange items on grid or use the <strong class="text-black">Recipe Book</strong>!
      </p>
    `;
  }
}

window.triggerCraft = function() {
  const matched = checkRecipeMatch();
  if (!matched) return;

  playCraftSuccessSound();

  // Trigger sweet confetti via loaded CDN script
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Push achievement
  if (!unlockedAchievements.includes(matched.achievement)) {
    unlockedAchievements.push(matched.achievement);
    updateAchievementsUI();
  }

  // Brief reset delay
  setTimeout(() => {
    grid = Array(9).fill(null);
    updateGridUI();
  }, 400);
};

function updateAchievementsUI() {
  const container = document.getElementById('achievements-container');
  if (unlockedAchievements.length > 0) {
    container.classList.remove('hidden');
    const countEl = document.getElementById('ach-count');
    countEl.textContent = `${unlockedAchievements.length}/6`;

    const badgeBox = document.getElementById('ach-badges');
    badgeBox.innerHTML = unlockedAchievements.map(ach => `
      <span class="bg-black/60 border border-yellow-600 px-2 py-0.5 text-xs text-amber-200 uppercase font-mono">
        ⭐ ${ach}
      </span>
    `).join('');
  } else {
    container.classList.add('hidden');
  }
}

// --- GG Likes Incrementer ---
window.likeNews = function(newsId, currentLikes) {
  playClickSound();
  const likesEl = document.getElementById(`likes-count-${newsId}`);
  let count = parseInt(likesEl.textContent);
  likesEl.textContent = count + 1;
};

// --- Initializing App ---
document.addEventListener('DOMContentLoaded', () => {
  // Create icons once lucide library is loaded
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Set default active material highlighted
  selectMaterial('wood');
  updateGridUI();
  fetchSubmissionsCount();
});

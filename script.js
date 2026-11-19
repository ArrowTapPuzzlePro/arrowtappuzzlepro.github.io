/* ==========================================================================
   ArrowTapPuzzle Pro - Interactive Scripts & Mini-Game Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemePicker();
  initNavbar();
  initMiniGame();
  initLightbox();
  initFaq();
});

/* --------------------------------------------------------------------------
   1. Theme Selector (Neon, Night, Classic)
   -------------------------------------------------------------------------- */
function initThemePicker() {
  const themeBtns = document.querySelectorAll('.theme-btn');
  const savedTheme = localStorage.getItem('arrowtap_theme') || 'neon';
  
  applyTheme(savedTheme);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-theme-set');
      applyTheme(selected);
      localStorage.setItem('arrowtap_theme', selected);
    });
  });

  function applyTheme(theme) {
    if (theme === 'neon') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    themeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-theme-set') === theme);
    });
  }
}

/* --------------------------------------------------------------------------
   2. Navbar Scroll & Mobile Navigation
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.textContent = '☰';
      });
    });
  }
}

/* --------------------------------------------------------------------------
   3. Web Audio Sound Synthesizer (Zero-dependency ASMR tactile audio)
   -------------------------------------------------------------------------- */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Satisfying Whoosh / Pop when arrow escapes
  playWhoosh() {
    this.ensureContext();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency slide upwards for a clean "swish"
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Dull thud / shake when arrow is blocked
  playBlocked() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Victory fanfare on board completion
  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }
}

/* --------------------------------------------------------------------------
   4. Playable Arrow Puzzle Mini-Game Engine
   -------------------------------------------------------------------------- */
function initMiniGame() {
  const boardEl = document.getElementById('interactive-board');
  const levelSelect = document.getElementById('level-select');
  const resetBtn = document.getElementById('reset-board-btn');
  const hintBtn = document.getElementById('demo-hint-btn');
  const winOverlay = document.getElementById('board-win-overlay');
  const nextLvlBtn = document.getElementById('next-level-btn');
  const statusText = document.getElementById('board-status-text');

  if (!boardEl) return;

  const sfx = new SoundEffects();

  // Levels Configuration (4x4 Grid): 'U'=Up, 'R'=Right, 'D'=Down, 'L'=Left, null=Empty
  const LEVELS = [
    // Level 1: Gentle Starter
    {
      name: "Level 1: Warmup",
      grid: [
        ['U', 'U', 'U', 'R'],
        ['L', 'R', 'D', 'R'],
        ['L', 'U', 'L', 'D'],
        ['D', 'D', 'L', 'D']
      ]
    },
    // Level 2: Strategic Blockade
    {
      name: "Level 2: Cross Grid",
      grid: [
        ['L', 'U', 'R', 'R'],
        ['D', 'R', 'U', 'D'],
        ['U', 'L', 'D', 'R'],
        ['L', 'D', 'U', 'D']
      ]
    },
    // Level 3: Intricate Knot
    {
      name: "Level 3: Master Knot",
      grid: [
        ['R', 'D', 'L', 'U'],
        ['U', 'R', 'D', 'L'],
        ['D', 'L', 'U', 'R'],
        ['L', 'U', 'R', 'D']
      ]
    }
  ];

  let currentLevelIdx = 0;
  let gridState = [];
  const rows = 4;
  const cols = 4;

  const arrowIcons = {
    'U': '↑',
    'R': '→',
    'D': '↓',
    'L': '←'
  };

  const arrowColors = {
    'U': '#06b6d4', // Cyan
    'R': '#10b981', // Emerald
    'D': '#f59e0b', // Amber
    'L': '#8b5cf6'  // Purple
  };

  function loadLevel(idx) {
    currentLevelIdx = idx % LEVELS.length;
    if (levelSelect) levelSelect.value = currentLevelIdx;
    
    // Deep clone the level matrix
    gridState = LEVELS[currentLevelIdx].grid.map(row => [...row]);
    winOverlay.classList.remove('active');
    updateStatus("Tap arrows pointing toward the outside to clear them!");
    renderBoard();
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dir = gridState[r][c];
        const tile = document.createElement('div');
        tile.className = 'arrow-tile';
        tile.dataset.row = r;
        tile.dataset.col = c;

        if (dir) {
          tile.innerHTML = arrowIcons[dir];
          tile.style.color = arrowColors[dir];
          tile.setAttribute('title', `Arrow pointing ${getDirectionName(dir)}`);
          tile.setAttribute('role', 'button');
          tile.setAttribute('tabindex', '0');

          tile.addEventListener('click', () => handleArrowClick(r, c, tile));
          tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleArrowClick(r, c, tile);
            }
          });
        } else {
          tile.classList.add('tile-empty');
        }

        boardEl.appendChild(tile);
      }
    }
  }

  function getDirectionName(d) {
    if (d === 'U') return 'Up';
    if (d === 'D') return 'Down';
    if (d === 'L') return 'Left';
    if (d === 'R') return 'Right';
    return '';
  }

  function isPathClear(r, c, dir) {
    if (dir === 'U') {
      for (let i = r - 1; i >= 0; i--) {
        if (gridState[i][c] !== null) return false;
      }
      return true;
    }
    if (dir === 'D') {
      for (let i = r + 1; i < rows; i++) {
        if (gridState[i][c] !== null) return false;
      }
      return true;
    }
    if (dir === 'L') {
      for (let j = c - 1; j >= 0; j--) {
        if (gridState[r][j] !== null) return false;
      }
      return true;
    }
    if (dir === 'R') {
      for (let j = c + 1; j < cols; j++) {
        if (gridState[r][j] !== null) return false;
      }
      return true;
    }
    return false;
  }

  function handleArrowClick(r, c, tileEl) {
    const dir = gridState[r][c];
    if (!dir) return;

    if (isPathClear(r, c, dir)) {
      // Arrow is unblocked! Fly away!
      sfx.playWhoosh();
      const flyClass = `fly-${getDirectionName(dir).toLowerCase()}`;
      tileEl.classList.add(flyClass);

      // Remove from logical grid immediately
      gridState[r][c] = null;

      // Update remaining count
      const remaining = countRemaining();
      if (remaining > 0) {
        updateStatus(`Nice move! ${remaining} arrow${remaining > 1 ? 's' : ''} remaining.`);
      }

      // Check win condition after animation
      setTimeout(() => {
        tileEl.classList.remove(flyClass);
        tileEl.classList.add('tile-empty');
        tileEl.innerHTML = '';
        tileEl.style.pointerEvents = 'none';

        if (checkWin()) {
          onWin();
        }
      }, 260);

    } else {
      // Arrow is blocked! Shake it!
      sfx.playBlocked();
      tileEl.classList.remove('tile-blocked');
      void tileEl.offsetWidth; // Force CSS reflow
      tileEl.classList.add('tile-blocked');
      updateStatus("Blocked! Another arrow is in this direction. Clear it first!");
    }
  }

  function countRemaining() {
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (gridState[r][c] !== null) count++;
      }
    }
    return count;
  }

  function checkWin() {
    return countRemaining() === 0;
  }

  function onWin() {
    sfx.playVictory();
    updateStatus("🎉 Board Cleared! Masterful thinking!");
    winOverlay.classList.add('active');
    triggerConfetti();
  }

  function updateStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  // Hint finder: highlights the first unblocked arrow
  function provideHint() {
    sfx.ensureContext();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dir = gridState[r][c];
        if (dir && isPathClear(r, c, dir)) {
          const tile = boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (tile) {
            tile.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            tile.style.transform = 'scale(1.22)';
            tile.style.boxShadow = '0 0 25px #10b981';
            updateStatus(`💡 Hint: The ${getDirectionName(dir)} arrow at [${r+1}, ${c+1}] has a clear exit!`);
            
            setTimeout(() => {
              tile.style.transform = '';
              tile.style.boxShadow = '';
            }, 1200);
            return;
          }
        }
      }
    }
    updateStatus("No direct hint available. Keep looking for open exits!");
  }

  // Event Listeners
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      loadLevel(parseInt(e.target.value, 10));
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      loadLevel(currentLevelIdx);
    });
  }

  if (hintBtn) {
    hintBtn.addEventListener('click', provideHint);
  }

  if (nextLvlBtn) {
    nextLvlBtn.addEventListener('click', () => {
      loadLevel((currentLevelIdx + 1) % LEVELS.length);
    });
  }

  // Initial load
  loadLevel(0);
}

/* --------------------------------------------------------------------------
   5. Confetti Burst Animation (Canvas-free lightweight particles)
   -------------------------------------------------------------------------- */
function triggerConfetti() {
  const container = document.body;
  const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.width = `${Math.random() * 8 + 6}px`;
    p.style.height = `${Math.random() * 12 + 8}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * 200}px`;
    p.style.top = `${window.innerHeight / 2 + (Math.random() - 0.5) * 100}px`;
    p.style.zIndex = '9999';
    p.style.borderRadius = '2px';
    p.style.pointerEvents = 'none';
    p.style.opacity = '1';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(p);

    const vx = (Math.random() - 0.5) * 600;
    const vy = (Math.random() - 0.7) * 700;
    const rot = (Math.random() - 0.5) * 720;

    p.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${vx}px, ${vy + 500}px) rotate(${rot}deg)`, opacity: 0 }
    ], {
      duration: 1400 + Math.random() * 600,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }).onfinish = () => p.remove();
  }
}

/* --------------------------------------------------------------------------
   6. Screenshot Lightbox Modal
   -------------------------------------------------------------------------- */
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const screenshots = document.querySelectorAll('.screenshot-item img');

  if (!modal || !modalImg) return;

  screenshots.forEach(img => {
    img.parentElement.addEventListener('click', () => {
      modalImg.src = img.src;
      modal.classList.add('active');
    });
  });

  const closeModal = () => modal.classList.remove('active');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   7. FAQ Accordion Interaction
   -------------------------------------------------------------------------- */
function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all others
      faqItems.forEach(other => {
        other.classList.remove('active');
        const otherAns = other.querySelector('.faq-answer');
        if (otherAns) otherAns.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
      }
    });
  });
}

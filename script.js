const CONFIG = {
  MAX_TILT: 32,
  SPILL_THRESHOLD: 18,
  SPILL_RATE: 0.14,
  START_DRIFT_SPEED: 0.55,
  DRIFT_RAMP: 1.03,
  DRIFT_FLIP_MIN_MS: 2600,
  DRIFT_FLIP_MAX_MS: 5200,
  TAP_FORCE: 4,
  TICK_MS: 100,
  TOTAL_TIME_S: 30,
  CAN_CAPACITY_L: 5,
  PARTIAL_CREDIT_FACTOR: 0.5,
};

const screens = {
  title: document.getElementById('titleScreen'),
  game: document.getElementById('gameScreen'),
  result: document.getElementById('resultScreen'),
};

const elements = {
  startButton: document.getElementById('startButton'),
  primaryResultButton: document.getElementById('primaryResultButton'),
  secondaryResultButton: document.getElementById('secondaryResultButton'),
  confettiLayer: document.getElementById('confettiLayer'),
  distanceFill: document.getElementById('distanceFill'),
  distanceReadout: document.getElementById('distanceReadout'),
  waterFill: document.getElementById('waterFill'),
  waterReadout: document.getElementById('waterReadout'),
  timerReadout: document.getElementById('timerReadout'),
  resetButton: document.getElementById('resetButton'),
  canSprite: document.getElementById('canSprite'),
  balanceState: document.getElementById('balanceState'),
  tapHint: document.getElementById('tapHint'),
  resultEyebrow: document.getElementById('resultEyebrow'),
  resultHeading: document.getElementById('resultHeading'),
  resultLiters: document.getElementById('resultLiters'),
  resultFact: document.getElementById('resultFact'),
};

const resultFacts = [
  'The average water walk in rural communities can be several kilometers.',
  'Millions of people spend hours each day collecting water for their families.',
  'Safe water changes everything from health and education to daily routines.',
  'A reliable water source can save time and help communities grow.',
];

const DEBUG_PREVIEW = false;

const game = {
  phase: 'title',
  tilt: 0,
  water: 100,
  distance: 0,
  timeLeft: CONFIG.TOTAL_TIME_S,
  driftDirection: 1,
  driftSpeed: CONFIG.START_DRIFT_SPEED,
  nextFlipAt: 0,
  intervalId: null,
  litersDelivered: 0,
};

function setScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });

  elements.resetButton.classList.toggle('visible', name === 'game');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function updateCanVisuals() {
  const tilt = clamp(game.tilt, -CONFIG.MAX_TILT, CONFIG.MAX_TILT);
  elements.canSprite.style.transform = `translateX(-50%) rotate(${tilt}deg)`;

  if (Math.abs(tilt) <= 8) {
    elements.balanceState.textContent = 'Steady';
  } else if (tilt < 0) {
    elements.balanceState.textContent = 'Leaning left';
  } else {
    elements.balanceState.textContent = 'Leaning right';
  }
}

function updateHud() {
  const distancePercent = clamp((game.distance / 100) * 100, 0, 100);
  const remainingDistance = 2.0 * (1 - game.distance / 100);

  elements.distanceFill.style.width = `${distancePercent}%`;
  elements.distanceFill.parentElement.lastElementChild.style.left = `${distancePercent}%`;
  elements.distanceReadout.textContent = `${remainingDistance.toFixed(1)} km`;

  const waterPercent = clamp(Math.round(game.water), 0, 100);
  elements.waterFill.style.width = `${waterPercent}%`;
  elements.waterReadout.textContent = `${waterPercent}%`;

  elements.timerReadout.textContent = `${game.timeLeft.toFixed(1)}s`;
}

function launchConfetti() {
  elements.confettiLayer.innerHTML = '';
  const colors = ['#2d9ef7', '#f5e7c9', '#d5895d', '#b15e3d', '#fff9ee'];

  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 220}px`);
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    elements.confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    elements.confettiLayer.innerHTML = '';
  }, 2000);
}

function endGame(win) {
  if (game.phase !== 'playing') {
    return;
  }

  game.phase = 'result';
  clearInterval(game.intervalId);

  if (win) {
    launchConfetti();
    game.litersDelivered = (game.water / 100) * CONFIG.CAN_CAPACITY_L;
    elements.resultEyebrow.textContent = 'Walk complete';
    elements.resultHeading.textContent = 'You made it';
    elements.primaryResultButton.textContent = 'Walk again';
    elements.secondaryResultButton.textContent = 'Share result';
    elements.secondaryResultButton.dataset.mode = 'share';
  } else {
    game.litersDelivered = (game.distance / 100) * CONFIG.CAN_CAPACITY_L * CONFIG.PARTIAL_CREDIT_FACTOR;
    elements.resultEyebrow.textContent = 'Run summary';
    elements.resultHeading.textContent = 'The can ran dry';
    elements.primaryResultButton.textContent = 'Try again';
    elements.secondaryResultButton.textContent = 'Learn more';
    elements.secondaryResultButton.dataset.mode = 'learn';
  }

  elements.resultLiters.textContent = `${game.litersDelivered.toFixed(1)}L`;
  elements.resultFact.textContent = resultFacts[Math.floor(Math.random() * resultFacts.length)];
  setScreen('result');
}

function tickGame() {
  if (game.phase !== 'playing') {
    return;
  }

  const now = Date.now();
  game.tilt += game.driftSpeed * game.driftDirection;
  game.tilt = clamp(game.tilt, -CONFIG.MAX_TILT, CONFIG.MAX_TILT);

  // The can should start losing water as soon as it drifts away from balance,
  // so the player has to keep correcting it instead of watching it stay steady.
  const tiltAmount = Math.abs(game.tilt);
  if (tiltAmount > 6) {
    let spillLoss = (tiltAmount - 6) * 0.26;

    if (tiltAmount > CONFIG.SPILL_THRESHOLD) {
      spillLoss += (tiltAmount - CONFIG.SPILL_THRESHOLD) * CONFIG.SPILL_RATE;
    }

    game.water -= spillLoss;
    game.water = clamp(game.water, 0, 100);
  }

  game.distance += 0.45;
  game.timeLeft -= CONFIG.TICK_MS / 1000;

  if (now >= game.nextFlipAt) {
    game.driftDirection *= -1;
    game.driftSpeed *= CONFIG.DRIFT_RAMP;
    game.nextFlipAt = now + randomBetween(CONFIG.DRIFT_FLIP_MIN_MS, CONFIG.DRIFT_FLIP_MAX_MS);
  }

  updateCanVisuals();
  updateHud();

  if (game.distance >= 100 && game.water > 0) {
    endGame(true);
    return;
  }

  if (game.water <= 0 || game.timeLeft <= 0) {
    endGame(false);
  }
}

function resetGame() {
  game.phase = 'playing';
  game.tilt = 0;
  game.water = 100;
  game.distance = 0;
  game.timeLeft = CONFIG.TOTAL_TIME_S;
  game.driftDirection = Math.random() < 0.5 ? -1 : 1;
  game.driftSpeed = CONFIG.START_DRIFT_SPEED;
  game.nextFlipAt = Date.now() + randomBetween(CONFIG.DRIFT_FLIP_MIN_MS, CONFIG.DRIFT_FLIP_MAX_MS);
  game.litersDelivered = 0;

  elements.tapHint.textContent = 'Tap to balance';
  updateCanVisuals();
  updateHud();
  setScreen('game');

  clearInterval(game.intervalId);
  game.intervalId = setInterval(tickGame, CONFIG.TICK_MS);
}

function handleTap(event) {
  if (game.phase !== 'playing') {
    return;
  }

  const rect = screens.game.getBoundingClientRect();
  const tapX = event.clientX - rect.left;

  if (tapX < rect.width / 2) {
    game.tilt -= CONFIG.TAP_FORCE;
  } else {
    game.tilt += CONFIG.TAP_FORCE;
  }

  game.tilt = clamp(game.tilt, -CONFIG.MAX_TILT, CONFIG.MAX_TILT);
  updateCanVisuals();
}

function handleKey(event) {
  const key = event.key.toLowerCase();

  if (key === 'arrowleft' || key === 'a') {
    game.tilt -= CONFIG.TAP_FORCE;
  }

  if (key === 'arrowright' || key === 'd') {
    game.tilt += CONFIG.TAP_FORCE;
  }

  game.tilt = clamp(game.tilt, -CONFIG.MAX_TILT, CONFIG.MAX_TILT);
  updateCanVisuals();
}

function handleShare() {
  const message = `I kept ${game.litersDelivered.toFixed(1)}L moving forward in Jerry Can Relay!`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).catch(() => {});
  }

  alert(message);
}

function handleSecondaryAction() {
  const mode = elements.secondaryResultButton.dataset.mode;

  if (mode === 'learn') {
    window.open('https://www.charitywater.org', '_blank', 'noopener');
    return;
  }

  handleShare();
}

function setup() {
  elements.startButton.addEventListener('click', resetGame);
  elements.resetButton.addEventListener('click', resetGame);
  elements.primaryResultButton.addEventListener('click', resetGame);
  elements.secondaryResultButton.addEventListener('click', handleSecondaryAction);
  screens.game.addEventListener('pointerdown', handleTap);
  document.addEventListener('keydown', handleKey);

  elements.resultEyebrow.textContent = 'Walk complete';
  elements.resultHeading.textContent = 'You made it';
  elements.primaryResultButton.textContent = 'Walk again';
  elements.secondaryResultButton.textContent = 'Share result';
  elements.secondaryResultButton.dataset.mode = 'share';

  setScreen('title');
  updateCanVisuals();
  updateHud();
}

setup();

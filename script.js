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

const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    maxTilt: 32,
    spillThreshold: 18,
    spillRate: 0.14,
    startDriftSpeed: 0.55,
    driftRamp: 1.03,
    driftFlipMinMs: 2600,
    driftFlipMaxMs: 5200,
    tapForce: 4,
    totalTimeS: 30,
    steadyRange: 8,
    driftLeanMultiplier: 1,
  },
  normal: {
    label: 'Normal',
    maxTilt: 38,
    spillThreshold: 16,
    spillRate: 0.18,
    startDriftSpeed: 0.68,
    driftRamp: 1.04,
    driftFlipMinMs: 2200,
    driftFlipMaxMs: 4600,
    tapForce: 4,
    totalTimeS: 30,
    steadyRange: 7,
    driftLeanMultiplier: 1.2,
  },
  hard: {
    label: 'Hard',
    maxTilt: 44,
    spillThreshold: 14,
    spillRate: 0.22,
    startDriftSpeed: 0.8,
    driftRamp: 1.06,
    driftFlipMinMs: 2000,
    driftFlipMaxMs: 4200,
    tapForce: 3.5,
    totalTimeS: 45,
    steadyRange: 6,
    driftLeanMultiplier: 1.5,
  },
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
  homeButton: document.getElementById('homeButton'),
  resetButton: document.getElementById('resetButton'),
  canSprite: document.getElementById('canSprite'),
  canLabel: document.querySelector('.can-label'),
  well: document.getElementById('well'),
  difficultyButtons: document.querySelectorAll('.difficulty-button'),
  balanceState: document.getElementById('balanceState'),
  tapHint: document.getElementById('tapHint'),
  milestoneMessage: document.getElementById('milestoneMessage'),
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

const milestoneMessages = [
  { type: 'distance', threshold: 25, text: 'Quarter of the way there!' },
  { type: 'distance', threshold: 50, text: 'Halfway there!' },
  { type: 'distance', threshold: 75, text: 'Almost at the well!' },
  { type: 'time', threshold: 10, text: '10 seconds in — stay steady!' },
  { type: 'time', threshold: 20, text: '20 seconds in — keep going!' },
];

const DEBUG_PREVIEW = false;
const startSound = new Audio('freesound_community-game-start-6104.mp3');
const lossSound = new Audio('alphix-game-over-417465.mp3');
const buttonSound = new Audio('freesound_gamestudio-button-394464.mp3');
const winSound = new Audio('puyopuyomegafan1234-winner-game-sound-404167.mp3');

const game = {
  phase: 'title',
  mode: 'easy',
  tilt: 0,
  water: 100,
  distance: 0,
  timeLeft: CONFIG.TOTAL_TIME_S,
  driftDirection: 1,
  driftSpeed: CONFIG.START_DRIFT_SPEED,
  nextFlipAt: 0,
  intervalId: null,
  milestoneTimer: null,
  milestonesTriggered: [],
  litersDelivered: 0,
};

function getDifficultySettings() {
  return DIFFICULTY_SETTINGS[game.mode] || DIFFICULTY_SETTINGS.easy;
}

function setScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });

  const controlsVisible = name === 'game';
  document.querySelector('.game-controls').classList.toggle('visible', controlsVisible);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function updateCanVisuals() {
  const settings = getDifficultySettings();
  const tilt = clamp(game.tilt, -settings.maxTilt, settings.maxTilt);
  elements.canSprite.style.transform = `translateX(-50%) rotate(${tilt}deg)`;

  if (Math.abs(tilt) <= settings.steadyRange) {
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
  elements.canLabel.textContent = `${waterPercent}%`;

  const wellProgress = clamp(game.distance / 100, 0, 1);
  const wellScale = 0.7 + (wellProgress * 0.45);
  const wellOpacity = 0.45 + (wellProgress * 0.55);

  elements.well.style.transform = `translateX(-50%) scale(${wellScale})`;
  elements.well.style.opacity = wellOpacity.toFixed(2);

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

function showMilestoneMessage(text) {
  elements.milestoneMessage.textContent = text;
  elements.milestoneMessage.classList.add('visible');

  clearTimeout(game.milestoneTimer);
  game.milestoneTimer = setTimeout(() => {
    elements.milestoneMessage.classList.remove('visible');
  }, 1800);
}

function checkMilestones() {
  const settings = getDifficultySettings();
  const elapsedTime = settings.totalTimeS - game.timeLeft;

  milestoneMessages.forEach((milestone) => {
    const reached = milestone.type === 'distance'
      ? game.distance >= milestone.threshold
      : elapsedTime >= milestone.threshold;

    if (reached && !game.milestonesTriggered.includes(milestone.text)) {
      game.milestonesTriggered.push(milestone.text);
      showMilestoneMessage(milestone.text);
    }
  });
}

function endGame(win) {
  if (game.phase !== 'playing') {
    return;
  }

  game.phase = 'result';
  clearInterval(game.intervalId);

  if (win) {
    winSound.currentTime = 0;
    winSound.play().catch(() => {});

    launchConfetti();
    game.litersDelivered = (game.water / 100) * CONFIG.CAN_CAPACITY_L;
    elements.resultEyebrow.textContent = 'Walk complete';
    elements.resultHeading.textContent = 'You made it';
    elements.primaryResultButton.textContent = 'Walk again';
    elements.secondaryResultButton.textContent = 'Share result';
    elements.secondaryResultButton.dataset.mode = 'share';
  } else {
    lossSound.currentTime = 0;
    lossSound.play().catch(() => {});

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

  const settings = getDifficultySettings();
  const now = Date.now();
  game.tilt += game.driftSpeed * game.driftDirection * settings.driftLeanMultiplier;
  game.tilt = clamp(game.tilt, -settings.maxTilt, settings.maxTilt);

  // The can should start losing water as soon as it drifts away from balance,
  // so the player has to keep correcting it instead of watching it stay steady.
  const tiltAmount = Math.abs(game.tilt);
  if (tiltAmount > settings.steadyRange) {
    let spillLoss = (tiltAmount - settings.steadyRange) * 0.26;

    if (tiltAmount > settings.spillThreshold) {
      spillLoss += (tiltAmount - settings.spillThreshold) * settings.spillRate;
    }

    game.water -= spillLoss;
    game.water = clamp(game.water, 0, 100);
  }

  game.distance += 0.45;
  game.timeLeft -= CONFIG.TICK_MS / 1000;

  if (now >= game.nextFlipAt) {
    game.driftDirection *= -1;
    game.driftSpeed *= settings.driftRamp;
    game.nextFlipAt = now + randomBetween(settings.driftFlipMinMs, settings.driftFlipMaxMs);
  }

  updateCanVisuals();
  updateHud();
  checkMilestones();

  if (game.distance >= 100 && game.water > 0) {
    endGame(true);
    return;
  }

  if (game.water <= 0 || game.timeLeft <= 0) {
    endGame(false);
  }
}

function resetGame() {
  const settings = getDifficultySettings();

  startSound.currentTime = 0;
  startSound.play().catch(() => {});

  game.phase = 'playing';
  game.tilt = 0;
  game.water = 100;
  game.distance = 0;
  game.timeLeft = settings.totalTimeS;
  game.driftDirection = Math.random() < 0.5 ? -1 : 1;
  game.driftSpeed = settings.startDriftSpeed;
  game.nextFlipAt = Date.now() + randomBetween(settings.driftFlipMinMs, settings.driftFlipMaxMs);
  game.milestonesTriggered = [];
  game.litersDelivered = 0;

  elements.tapHint.textContent = 'Tap to balance';
  elements.milestoneMessage.classList.remove('visible');
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

  const settings = getDifficultySettings();
  const rect = screens.game.getBoundingClientRect();
  const tapX = event.clientX - rect.left;

  if (tapX < rect.width / 2) {
    game.tilt -= settings.tapForce;
  } else {
    game.tilt += settings.tapForce;
  }

  game.tilt = clamp(game.tilt, -settings.maxTilt, settings.maxTilt);
  updateCanVisuals();
}

function handleKey(event) {
  const settings = getDifficultySettings();
  const key = event.key.toLowerCase();

  if (key === 'arrowleft' || key === 'a') {
    game.tilt -= settings.tapForce;
  }

  if (key === 'arrowright' || key === 'd') {
    game.tilt += settings.tapForce;
  }

  game.tilt = clamp(game.tilt, -settings.maxTilt, settings.maxTilt);
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

function setDifficulty(mode) {
  game.mode = mode;

  elements.difficultyButtons.forEach((button) => {
    const isActive = button.dataset.difficulty === mode;
    button.classList.toggle('active', isActive);
  });

  if (game.phase === 'title') {
    updateCanVisuals();
    updateHud();
  }
}

function goHome() {
  clearInterval(game.intervalId);
  game.phase = 'title';
  game.tilt = 0;
  game.water = 100;
  game.distance = 0;
  game.timeLeft = getDifficultySettings().totalTimeS;
  game.driftDirection = 1;
  game.driftSpeed = getDifficultySettings().startDriftSpeed;
  game.nextFlipAt = 0;
  game.milestonesTriggered = [];

  elements.milestoneMessage.classList.remove('visible');
  updateCanVisuals();
  updateHud();
  setScreen('title');
}

function playButtonSound() {
  buttonSound.currentTime = 0;
  buttonSound.play().catch(() => {});
}

function setup() {
  elements.startButton.addEventListener('click', () => {
    playButtonSound();
    resetGame();
  });
  elements.homeButton.addEventListener('click', () => {
    playButtonSound();
    goHome();
  });
  elements.resetButton.addEventListener('click', () => {
    playButtonSound();
    resetGame();
  });
  elements.primaryResultButton.addEventListener('click', () => {
    playButtonSound();
    resetGame();
  });
  elements.secondaryResultButton.addEventListener('click', () => {
    playButtonSound();
    handleSecondaryAction();
  });
  elements.difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      playButtonSound();
      setDifficulty(button.dataset.difficulty);
    });
  });
  screens.game.addEventListener('pointerdown', handleTap);
  document.addEventListener('keydown', handleKey);

  elements.resultEyebrow.textContent = 'Walk complete';
  elements.resultHeading.textContent = 'You made it';
  elements.primaryResultButton.textContent = 'Walk again';
  elements.secondaryResultButton.textContent = 'Share result';
  elements.secondaryResultButton.dataset.mode = 'share';

  setDifficulty('easy');
  setScreen('title');
  updateCanVisuals();
  updateHud();
}

setup();

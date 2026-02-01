"use strict";

// Конфигурация поля
const ROWS = 20;
const COLS = 10;

// Интервалы скорости (мс)
const NORMAL_DROP_INTERVAL = 800;
const FAST_DROP_INTERVAL = 120;
const LOOP_STEP = 50; // шаг основного цикла в мс
// Скорость увеличивается каждые N поставленных фигур (больше — реже ускорение)
const FIGURES_PER_LEVEL = 12;

// Очки за линии: база за линию, множитель по количеству (1=100, 2=400, 3=900, 4=1600)
const BASE_LINE_SCORE = 100;

const HIGH_SCORE_KEY = "tetrisHighScore";
const LEADERBOARD_KEY = "tetrisLeaderboard";
const LEADERBOARD_MAX = 10;
const HARD_DROP_BONUS_MULT = 5;
const HARD_DROP_MIN_ROWS_FOR_BONUS = 5;

// Определение фигур (матрицы 4x4)
const TETROMINOES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0]
    ]
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  T: [
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  S: [
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  Z: [
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  J: [
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ],
  L: [
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ]
  ]
};

// Режим ввода: 'computer' | 'phone'
let inputMode = "phone";

// Состояние игры
let board = [];
let currentPiece = null;
let currentRow = 0;
let currentCol = 0;
let currentRotation = 0;
let score = 0;
let dropIntervalId = null;
let isFastDrop = false;
let isGameOver = false;
let currentDropInterval = NORMAL_DROP_INTERVAL;
let dropElapsed = 0;
let isClearingLines = false;
let currentColor = "#22c55e";
let piecesPlaced = 0;
let nextQueue = [];
let holdPiece = null;
let holdColor = "#22c55e";
let holdUsed = false;
let isPaused = false;
let isHardDropping = false;

// DOM-элементы
let landingScreen;
let gameScreen;
let gameBoardElement;
let scoreElement;
let finalScoreElement;
let startButton;
let restartButton;
let gameOverOverlay;
let btnLeft;
let btnRight;
let btnRotateRight;
let btnPause;
let btnPauseGamefield;
let btnDrop;
let btnHold;
let btnDown;
let gameBoardWrapper;
let nextPreviewElement;
let holdPreviewElement;
let landingHighScoreElement;
let gameOverHighScoreElement;
let leaderboardListElement;
let gameOverLeaderboardElement;
let pauseOverlay;
let pauseResumeBtn;
let modeComputerBtn;
let modePhoneBtn;
let gameBoardPieceLayer;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initGameBoardGrid();
  initNextPreviewGrid();
  initHoldPreviewGrid();
  updateLandingHighScore();
  renderLeaderboard();
  attachEventListeners();
  initTwinkleStars();
  window.matchMedia("(min-width: 480px)").addEventListener("change", () => {
    if (gameScreen && !gameScreen.classList.contains("screen--hidden")) {
      renderHold();
      renderNextPreview();
    }
  });
});

function cacheDom() {
  landingScreen = document.getElementById("landing-screen");
  gameScreen = document.getElementById("game-screen");
  gameBoardElement = document.getElementById("game-board");
  scoreElement = document.getElementById("score-main") || document.getElementById("score");
  finalScoreElement = document.getElementById("final-score");
  startButton = document.getElementById("start-button");
  restartButton = document.getElementById("restart-button");
  gameOverOverlay = document.getElementById("game-over-overlay");
  btnLeft = document.getElementById("btn-left");
  btnRight = document.getElementById("btn-right");
  btnRotateRight = document.getElementById("btn-rotate-right");
  btnPause = document.getElementById("btn-pause-main") || document.getElementById("btn-pause");
  btnPauseGamefield = document.getElementById("btn-pause-gamefield");
  btnDrop = document.getElementById("btn-drop");
  btnHold = document.getElementById("btn-hold");
  btnDown = document.getElementById("btn-down");
  gameBoardWrapper = document.getElementById("game-board-wrapper");
  nextPreviewElement = document.getElementById("next-preview");
  holdPreviewElement = document.getElementById("hold-preview");
  landingHighScoreElement = document.getElementById("landing-high-score");
  gameOverHighScoreElement = document.getElementById("game-over-high-score");
  leaderboardListElement = document.getElementById("leaderboard-list");
  gameOverLeaderboardElement = document.getElementById("game-over-leaderboard");
  pauseOverlay = document.getElementById("pause-overlay");
  pauseResumeBtn = document.getElementById("pause-resume-btn");
  modeComputerBtn = document.getElementById("mode-computer");
  modePhoneBtn = document.getElementById("mode-phone");
}

function getHighScore() {
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0;
}

function setHighScore(value) {
  const current = getHighScore();
  if (value > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  }
}

function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, LEADERBOARD_MAX) : [];
  } catch (_) {
    return [];
  }
}

function addToLeaderboard(score) {
  const list = getLeaderboard();
  list.push({ score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const unique = list.filter((e) => {
    if (seen.has(e.score)) return false;
    seen.add(e.score);
    return true;
  });
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(unique.slice(0, LEADERBOARD_MAX)));
}

function renderLeaderboard() {
  const list = getLeaderboard();
  const renderInto = (el, maxItems, compact) => {
    if (!el) return;
    el.innerHTML = "";
    list.slice(0, maxItems).forEach((entry, i) => {
      const li = document.createElement("li");
      li.className = compact ? "leaderboard-item leaderboard-item--compact" : "leaderboard-item";
      li.textContent = `${i + 1}. ${entry.score}`;
      el.appendChild(li);
    });
  };
  renderInto(leaderboardListElement, LEADERBOARD_MAX, false);
  renderInto(gameOverLeaderboardElement, 5, true);
}

function updateLandingHighScore() {
  if (landingHighScoreElement) {
    landingHighScoreElement.textContent = `Рекорд: ${getHighScore()}`;
  }
}

// Создание HTML-сетки клеток и слоя текущей фигуры поверх
function initGameBoardGrid() {
  if (!gameBoardElement) return;
  gameBoardElement.innerHTML = "";
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    gameBoardElement.appendChild(cell);
  }
  const layer = document.createElement("div");
  layer.className = "board-piece-layer";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "piece-layer-cell";
    layer.appendChild(cell);
  }
  gameBoardElement.appendChild(layer);
  gameBoardPieceLayer = layer;
}

let lastBoardCellPx = 0;

function updateBoardCellSizeVar() {
  if (!gameBoardElement || !gameBoardElement.offsetParent) return;
  const w = gameBoardElement.offsetWidth;
  if (w <= 0) return;
  const cellPx = w / COLS;
  if (Math.abs(cellPx - lastBoardCellPx) < 0.5) return;
  lastBoardCellPx = cellPx;
  document.documentElement.style.setProperty("--board-cell-px", cellPx + "px");
}

const PIECE_COLORS = ["#22c55e", "#22d3ee", "#a855f7", "#f97316", "#eab308", "#38bdf8", "#f43f5e"];

function createRandomPiece() {
  const keys = Object.keys(TETROMINOES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const color = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  return {
    piece: { type: randomKey, shapes: TETROMINOES[randomKey] },
    color
  };
}

function fillNextQueue() {
  while (nextQueue.length < 3) {
    nextQueue.push(createRandomPiece());
  }
}

const PREVIEW_CELLS = 12; // макс. 4×3 или 3×4; для 3×3 используем 9 клеток

/** По форме фигуры возвращает класс сетки: 3×3 (нет палки), 4×3 (палка лежачая), 3×4 (палка стоячая) */
function getPreviewGridSize(shape) {
  for (let r = 0; r < 4; r++) {
    if (shape[r][0] + shape[r][1] + shape[r][2] + shape[r][3] === 4) return "4x3";
  }
  for (let c = 0; c < 4; c++) {
    if (shape[0][c] + shape[1][c] + shape[2][c] + shape[3][c] === 4) return "3x4";
  }
  return "3x3";
}

function getPreviewDims(gridSize) {
  if (gridSize === "4x3") return { rows: 3, cols: 4 };
  if (gridSize === "3x4") return { rows: 4, cols: 3 };
  return { rows: 3, cols: 3 };
}

function isPreviewGridWide() {
  return window.matchMedia("(min-width: 480px)").matches;
}

function initNextPreviewGrid() {
  if (!nextPreviewElement) return;
  nextPreviewElement.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const item = document.createElement("div");
    item.className = "next-preview-item";
    for (let j = 0; j < PREVIEW_CELLS; j++) {
      const cell = document.createElement("div");
      cell.className = "preview-cell";
      item.appendChild(cell);
    }
    nextPreviewElement.appendChild(item);
  }
}

function initHoldPreviewGrid() {
  if (!holdPreviewElement) return;
  holdPreviewElement.innerHTML = "";
  for (let i = 0; i < PREVIEW_CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "preview-cell";
    holdPreviewElement.appendChild(cell);
  }
}

/** Мелькающие звёздочки: появиться → мелькать пару раз → затухнуть → новое место. Размер от величины пустоты. */
function initTwinkleStars() {
  const rnd = (min, max) => min + Math.random() * (max - min);
  const STAR_CHAR = "★";

  const createStar = (layer, zones) => {
    const z = zones[Math.floor(Math.random() * zones.length)];
    const left = rnd(z.leftMin, z.leftMax);
    const top = rnd(z.topMin, z.topMax);
    const sizePx = Math.round(8 * z.sizeScale + rnd(0, 4));
    const duration = rnd(4, 6);

    const el = document.createElement("span");
    el.className = "twinkle-star";
    el.setAttribute("aria-hidden", "true");
    el.textContent = STAR_CHAR;
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    el.style.fontSize = `${sizePx}px`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${rnd(0, 2)}s`;
    el.dataset.layerId = layer.id;
    el.dataset.zones = JSON.stringify(zones);

    const restart = () => {
      const zones = JSON.parse(el.dataset.zones || "[]");
      const z = zones[Math.floor(Math.random() * zones.length)];
      el.style.left = `${rnd(z.leftMin, z.leftMax)}%`;
      el.style.top = `${rnd(z.topMin, z.topMax)}%`;
      el.style.fontSize = `${Math.round(8 * z.sizeScale + rnd(0, 4))}px`;
      el.style.animationDuration = `${rnd(4, 6)}s`;
      el.style.animationDelay = "0s";
      el.style.animation = "none";
      el.offsetHeight;
      el.style.animation = "";
    };

    el.addEventListener("animationend", restart);
    layer.appendChild(el);
  };

  const configs = [
    {
      layerId: "twinkle-gamefield",
      zones: [
        { leftMin: 0, leftMax: 12, topMin: 0, topMax: 10, sizeScale: 1.3 },
        { leftMin: 88, leftMax: 100, topMin: 0, topMax: 10, sizeScale: 1.3 },
        { leftMin: 0, leftMax: 12, topMin: 90, topMax: 100, sizeScale: 1.3 },
        { leftMin: 88, leftMax: 100, topMin: 90, topMax: 100, sizeScale: 1.3 },
        { leftMin: 0, leftMax: 6, topMin: 12, topMax: 88, sizeScale: 0.9 },
        { leftMin: 94, leftMax: 100, topMin: 12, topMax: 88, sizeScale: 0.9 }
      ],
      count: 18
    },
    {
      layerId: "twinkle-sidebar",
      zones: [
        { leftMin: 8, leftMax: 92, topMin: 0, topMax: 20, sizeScale: 1.1 },
        { leftMin: 8, leftMax: 92, topMin: 75, topMax: 100, sizeScale: 1.1 },
        { leftMin: 0, leftMax: 10, topMin: 22, topMax: 72, sizeScale: 0.75 },
        { leftMin: 90, leftMax: 100, topMin: 22, topMax: 72, sizeScale: 0.75 }
      ],
      count: 15
    },
    {
      layerId: "twinkle-menu",
      zones: [
        { leftMin: 2, leftMax: 98, topMin: 0, topMax: 15, sizeScale: 0.7 },
        { leftMin: 2, leftMax: 98, topMin: 85, topMax: 100, sizeScale: 0.7 },
        { leftMin: 0, leftMax: 8, topMin: 18, topMax: 82, sizeScale: 0.65 },
        { leftMin: 92, leftMax: 100, topMin: 18, topMax: 82, sizeScale: 0.65 }
      ],
      count: 5
    }
  ];

  configs.forEach(({ layerId, zones, count }) => {
    const layer = document.getElementById(layerId);
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      createStar(layer, zones);
    }
  });
}

function renderNextPreview() {
  if (!nextPreviewElement) return;
  const items = nextPreviewElement.querySelectorAll(".next-preview-item");
  for (let i = 0; i < 3; i++) {
    const entry = nextQueue[i];
    const item = items[i];
    if (!item) continue;
    const cells = item.children;
    if (!entry) {
      item.className = "next-preview-item preview-grid-3x3";
      for (let j = 0; j < PREVIEW_CELLS; j++) {
        if (cells[j]) {
          cells[j].classList.remove("preview-cell--filled");
          cells[j].style.removeProperty("--cell-color");
        }
      }
      continue;
    }
    const shape = entry.piece.shapes[0];
    const color = entry.color;
    const gridSize = getPreviewGridSize(shape);
    const dims = getPreviewDims(gridSize);
    item.className = "next-preview-item preview-grid-" + gridSize;
    const totalCells = dims.rows * dims.cols;
    for (let j = 0; j < totalCells && j < cells.length; j++) {
      const r = Math.floor(j / dims.cols);
      const c = j % dims.cols;
      const cell = cells[j];
      if (shape[r] && shape[r][c]) {
        cell.classList.add("preview-cell--filled");
        cell.style.setProperty("--cell-color", color);
      } else {
        cell.classList.remove("preview-cell--filled");
        cell.style.removeProperty("--cell-color");
      }
    }
    for (let j = totalCells; j < PREVIEW_CELLS; j++) {
      if (cells[j]) {
        cells[j].classList.remove("preview-cell--filled");
        cells[j].style.removeProperty("--cell-color");
      }
    }
  }
}

function renderHold() {
  if (!holdPreviewElement) return;
  const cells = holdPreviewElement.children;
  if (!holdPiece) {
    holdPreviewElement.className = "hold-preview hold-preview--main preview-grid-3x3";
    for (let i = 0; i < PREVIEW_CELLS; i++) {
      if (cells[i]) {
        cells[i].classList.remove("preview-cell--filled");
        cells[i].style.removeProperty("--cell-color");
      }
    }
    return;
  }
  const shape = holdPiece.shapes[0];
  const gridSize = getPreviewGridSize(shape);
  const dims = getPreviewDims(gridSize);
  holdPreviewElement.className = "hold-preview hold-preview--main preview-grid-" + gridSize;
  const totalCells = dims.rows * dims.cols;
  for (let i = 0; i < totalCells && i < cells.length; i++) {
    const r = Math.floor(i / dims.cols);
    const c = i % dims.cols;
    const cell = cells[i];
    if (shape[r] && shape[r][c]) {
      cell.classList.add("preview-cell--filled");
      cell.style.setProperty("--cell-color", holdColor);
    } else {
      cell.classList.remove("preview-cell--filled");
      cell.style.removeProperty("--cell-color");
    }
  }
  for (let i = totalCells; i < PREVIEW_CELLS; i++) {
    if (cells[i]) {
      cells[i].classList.remove("preview-cell--filled");
      cells[i].style.removeProperty("--cell-color");
    }
  }
}

function attachEventListeners() {
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);

  if (modeComputerBtn) {
    modeComputerBtn.addEventListener("click", () => {
      inputMode = "computer";
      modeComputerBtn.classList.add("btn-mode--active");
      if (modePhoneBtn) modePhoneBtn.classList.remove("btn-mode--active");
    });
  }
  if (modePhoneBtn) {
    modePhoneBtn.addEventListener("click", () => {
      inputMode = "phone";
      modePhoneBtn.classList.add("btn-mode--active");
      if (modeComputerBtn) modeComputerBtn.classList.remove("btn-mode--active");
    });
  }

  if (btnLeft) btnLeft.addEventListener("click", () => handleMove(-1, 0));
  if (btnRight) btnRight.addEventListener("click", () => handleMove(1, 0));
  if (btnDown) btnDown.addEventListener("click", () => handleMove(0, 1));
  if (btnRotateRight) btnRotateRight.addEventListener("click", handleRotateRight);
  if (btnPause) btnPause.addEventListener("click", () => { if (!isGameOver && currentPiece) togglePause(); });
  if (btnPauseGamefield) btnPauseGamefield.addEventListener("click", () => { if (!isGameOver && currentPiece) togglePause(); });
  if (btnDrop) btnDrop.addEventListener("click", () => { if (!isGameOver && currentPiece) handleHardDrop(); });
  if (btnHold) btnHold.addEventListener("click", () => { if (!isGameOver && currentPiece) handleHold(); });
  if (pauseResumeBtn) pauseResumeBtn.addEventListener("click", () => { if (isPaused) togglePause(); });

  const frameMenu = document.querySelector(".frame-menu");
  if (frameMenu) {
    frameMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      if (isGameOver) return;
      if (action === "left") handleMove(-1, 0);
      else if (action === "right") handleMove(1, 0);
      else if (action === "down") handleMove(0, 1);
      else if (action === "rotate") handleRotateRight();
      else if (action === "hold") { if (currentPiece) handleHold(); }
      else if (action === "drop") { if (currentPiece) handleHardDrop(); }
    });
  }

  if (gameBoardElement) {
    gameBoardElement.addEventListener("mousedown", handleBoardMouseDown);
    gameBoardElement.addEventListener("touchstart", handleBoardTouchStart, { passive: false });
  }
  document.addEventListener("mouseup", handleBoardMouseUp);
  document.addEventListener("touchend", handleBoardTouchEnd);
  document.addEventListener("touchcancel", handleBoardTouchEnd);

  document.addEventListener("keydown", handleKeyDown);
}

function handleBoardMouseDown(event) {
  if (event.target.closest(".controls")) return;
  event.preventDefault();
  if (isGameOver || !currentPiece || isPaused || isHardDropping) return;
  setSpeedFast(true);
}

function handleBoardMouseUp() {
  if (!currentPiece) return;
  setSpeedFast(false);
}

function handleBoardTouchStart(event) {
  if (event.target.closest(".controls")) return;
  event.preventDefault();
  if (isGameOver || !currentPiece || isPaused || isHardDropping) return;
  setSpeedFast(true);
}

function handleBoardTouchEnd() {
  if (!currentPiece) return;
  setSpeedFast(false);
}

function handleKeyDown(event) {
  const key = event.code;
  if (key === "Enter") {
    if (landingScreen && !landingScreen.classList.contains("screen--hidden")) {
      event.preventDefault();
      startGame();
      return;
    }
    if (gameOverOverlay && !gameOverOverlay.classList.contains("screen--hidden")) {
      event.preventDefault();
      restartGame();
      return;
    }
    if (isPaused && pauseOverlay && !pauseOverlay.classList.contains("screen--hidden")) {
      event.preventDefault();
      togglePause();
      return;
    }
    return;
  }
  if (key === "KeyP") {
    if (!isGameOver && currentPiece) {
      event.preventDefault();
      togglePause();
    }
    return;
  }
  if (key === "Space") {
    event.preventDefault();
    if (isPaused || isGameOver || isHardDropping) return;
    if (currentPiece) handleHardDrop();
    return;
  }
  if (key === "ControlLeft" || key === "ControlRight") {
    event.preventDefault();
    if (!isGameOver && currentPiece) handleHold();
    return;
  }
  if (isPaused || isGameOver || !currentPiece || isHardDropping) return;
  if (key === "ArrowLeft") {
    event.preventDefault();
    handleMove(-1, 0);
  } else if (key === "ArrowRight") {
    event.preventDefault();
    handleMove(1, 0);
  } else if (key === "ArrowDown") {
    event.preventDefault();
    handleMove(0, 1);
  } else if (key === "ArrowUp") {
    event.preventDefault();
    handleRotateRight();
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    clearIntervalSafe();
    if (pauseOverlay) pauseOverlay.classList.remove("screen--hidden");
  } else {
    if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");
    startDropLoop(currentDropInterval);
  }
}

const HARD_DROP_ROW_DELAY_MS = 26;

function handleHardDrop() {
  if (!currentPiece || isGameOver || isClearingLines || isHardDropping) return;
  const startRow = currentRow;
  let targetRow = currentRow;
  while (canPlace(getCurrentShape(), targetRow + 1, currentCol)) {
    targetRow += 1;
  }
  if (targetRow === startRow) {
    lockPieceAndProceed();
    return;
  }
  isHardDropping = true;
  let row = startRow;
  function step() {
    if (row < targetRow) {
      row += 1;
      currentRow = row;
      render();
      setTimeout(step, HARD_DROP_ROW_DELAY_MS);
    } else {
      const rowsDropped = targetRow - startRow;
      const bonus = rowsDropped > HARD_DROP_MIN_ROWS_FOR_BONUS
        ? HARD_DROP_BONUS_MULT * (rowsDropped - HARD_DROP_MIN_ROWS_FOR_BONUS)
        : 0;
      if (bonus > 0) {
        score += bonus;
        updateScoreDisplay();
        showPointsPopup(bonus);
      }
      isHardDropping = false;
      lockPieceAndProceed();
    }
  }
  step();
}

// Запуск игры
function startGame() {
  landingScreen.classList.add("screen--hidden");
  gameScreen.classList.remove("screen--hidden");
  gameScreen.classList.remove("input-mode-computer", "input-mode-phone");
  gameScreen.classList.add(inputMode === "computer" ? "input-mode-computer" : "input-mode-phone");
  if (gameOverOverlay) gameOverOverlay.classList.add("screen--hidden");
  if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");

  const mainFrame = document.getElementById("main-frame");
  if (mainFrame) mainFrame.focus();

  initGameState();
  spawnPiece();
  startDropLoop(NORMAL_DROP_INTERVAL);
  if (gameBoardWrapper) {
    requestAnimationFrame(() => {
      gameBoardWrapper.classList.add("game-board-wrapper--visible");
      updateBoardCellSizeVar();
      let rafId = null;
      const ro = new ResizeObserver(() => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateBoardCellSizeVar();
        });
      });
      if (gameBoardElement) ro.observe(gameBoardElement);
    });
  }
}

function restartGame() {
  gameOverOverlay.classList.add("screen--hidden");
  if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");
  initGameState();
  spawnPiece();
  startDropLoop(NORMAL_DROP_INTERVAL);
}

function initGameState() {
  board = createEmptyBoard();
  currentPiece = null;
  currentRow = 0;
  currentCol = 0;
  currentRotation = 0;
  score = 0;
  isFastDrop = false;
  isGameOver = false;
  isClearingLines = false;
  isPaused = false;
  isHardDropping = false;
  currentDropInterval = NORMAL_DROP_INTERVAL;
  dropElapsed = 0;
  piecesPlaced = 0;
  nextQueue = [];
  fillNextQueue();
  const initialHold = createRandomPiece();
  holdPiece = initialHold.piece;
  holdColor = initialHold.color;
  holdUsed = false;
  updateScoreDisplay();
  clearIntervalSafe();
  if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");
  render();
  renderNextPreview();
  renderHold();
}

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function spawnPiece() {
  dropElapsed = 0;
  holdUsed = false;
  if (nextQueue.length === 0) fillNextQueue();
  const entry = nextQueue.shift();
  fillNextQueue();
  currentPiece = entry.piece;
  currentColor = entry.color;
  currentRotation = 0;
  const shape = currentPiece.shapes[currentRotation];
  currentRow = 0;
  currentCol = Math.floor((COLS - 4) / 2);

  if (!canPlace(shape, currentRow, currentCol)) {
    handleGameOver();
  } else {
    renderNextPreview();
    renderHold();
  }
}

function getCurrentShape() {
  return currentPiece.shapes[currentRotation];
}

function canPlace(shape, row, col) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const newR = row + r;
      const newC = col + c;
      if (newR < 0 || newR >= ROWS || newC < 0 || newC >= COLS) {
        return false;
      }
      if (board[newR][newC]) {
        return false;
      }
    }
  }
  return true;
}

function handleMove(dx, dy) {
  if (!currentPiece || isGameOver || isClearingLines || isPaused || isHardDropping) return;
  if (canMove(dx, dy)) {
    currentCol += dx;
    currentRow += dy;
    render();
  } else if (dy === 1) {
    // если двигались вниз и не удалось — зафиксировать фигуру
    lockPieceAndProceed();
  }
}

function canMove(dx, dy) {
  const shape = getCurrentShape();
  return canPlace(shape, currentRow + dy, currentCol + dx);
}

function handleHold() {
  if (!currentPiece || isGameOver || isPaused || isHardDropping || isClearingLines || holdUsed) return;
  holdUsed = true;
  const shape = getCurrentShape();
  const swapPiece = currentPiece;
  const swapColor = currentColor;
  currentPiece = holdPiece;
  currentColor = holdColor;
  holdPiece = swapPiece;
  holdColor = swapColor;
  if (!currentPiece) {
    if (nextQueue.length === 0) fillNextQueue();
    const entry = nextQueue.shift();
    fillNextQueue();
    currentPiece = entry.piece;
    currentColor = entry.color;
  }
  currentRotation = 0;
  currentRow = 0;
  currentCol = Math.floor((COLS - 4) / 2);
  if (!canPlace(currentPiece.shapes[0], currentRow, currentCol)) {
    handleGameOver();
    return;
  }
  render();
  renderHold();
  renderNextPreview();
}

function handleRotateRight() {
  if (!currentPiece || isGameOver || isPaused || isHardDropping) return;
  const nextRotation = (currentRotation + 1) % currentPiece.shapes.length;
  const nextShape = currentPiece.shapes[nextRotation];
  if (canPlace(nextShape, currentRow, currentCol)) {
    currentRotation = nextRotation;
    render();
  }
}

function startDropLoop(interval) {
  clearIntervalSafe();
  currentDropInterval = interval;
  dropElapsed = 0;
  dropIntervalId = setInterval(() => {
    if (isGameOver || !currentPiece || isPaused || isHardDropping) return;
    if (isClearingLines) return;
    dropElapsed += LOOP_STEP;
    if (dropElapsed >= currentDropInterval) {
      dropElapsed = 0;
      tick();
    }
  }, LOOP_STEP);
}

function clearIntervalSafe() {
  if (dropIntervalId !== null) {
    clearInterval(dropIntervalId);
    dropIntervalId = null;
  }
}

function tick() {
  if (!currentPiece || isGameOver) return;
  if (canMove(0, 1)) {
    currentRow += 1;
    render();
  } else {
    lockPieceAndProceed();
  }
}

function lockPiece() {
  const shape = getCurrentShape();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const br = currentRow + r;
      const bc = currentCol + c;
      if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS) {
        board[br][bc] = currentColor;
      }
    }
  }
}

function lockPieceAndProceed() {
  if (!currentPiece) return;
  lockPiece();
  piecesPlaced += 1;
  currentPiece = null;
  applyProgressSpeed();
  clearLines(() => {
    if (!isGameOver) {
      spawnPiece();
    }
  });
}

function applyProgressSpeed() {
  const maxInterval = NORMAL_DROP_INTERVAL;
  const minInterval = 260;
  const step = 45; // на сколько мс быстрее за каждый "уровень"
  const level = Math.floor(piecesPlaced / FIGURES_PER_LEVEL);
  const decrease = Math.min(level * step, maxInterval - minInterval);
  const baseInterval = maxInterval - decrease;
  currentDropInterval = isFastDrop ? FAST_DROP_INTERVAL : baseInterval;
}

function clearLines(onCleared) {
  const fullRows = [];
  for (let r = 0; r < ROWS; r++) {
    const isFull = board[r].every((cell) => cell !== 0);
    if (isFull) {
      fullRows.push(r);
    }
  }

  if (fullRows.length === 0) {
    if (onCleared) onCleared();
    return;
  }

  isClearingLines = true;
  animateLineClear(fullRows, () => {
    const linesCleared = fullRows.length;
    const fullRowsSet = new Set(fullRows);
    board = board.filter((_, rowIndex) => !fullRowsSet.has(rowIndex));
    for (let i = 0; i < fullRows.length; i++) {
      board.unshift(new Array(COLS).fill(0));
    }

    if (linesCleared > 0) {
      score += linesCleared * BASE_LINE_SCORE * linesCleared;
      updateScoreDisplay();
      showPointsPopup(linesCleared === 1 ? "+100" : `+${linesCleared * BASE_LINE_SCORE} x ${linesCleared}`);
      triggerLineClearEffects(linesCleared);
    }

    isClearingLines = false;
    render();
    if (onCleared) onCleared();
  });
}

function triggerLineClearEffects(linesCleared) {
  if (!gameBoardElement) return;
  const className = linesCleared >= 2 ? "board--glow" : "board--pulse";
  gameBoardElement.classList.add(className);
  setTimeout(() => gameBoardElement.classList.remove(className), 500);
  if (linesCleared >= 3) {
    spawnSparks();
  }
}

function spawnSparks() {
  const wrapper = gameBoardElement && gameBoardElement.parentElement;
  if (!wrapper) return;
  const sparkCount = 16;
  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement("div");
    spark.className = "spark";
    const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 35 + Math.random() * 45;
    spark.style.setProperty("--spark-dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--spark-dy", `${Math.sin(angle) * dist}px`);
    wrapper.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
  }
}

function showPointsPopup(text) {
  const wrapper = gameBoardElement?.parentElement;
  if (!wrapper) return;
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = String(text).startsWith("+") ? text : "+" + text;
  wrapper.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

function animateLineClear(rows, done) {
  const cells = gameBoardElement.children;
  rows.forEach((r) => {
    for (let c = 0; c < COLS; c++) {
      const index = r * COLS + c;
      const cell = cells[index];
      cell.classList.add("cell--clearing");
    }
  });

  setTimeout(() => {
    rows.forEach((r) => {
      for (let c = 0; c < COLS; c++) {
        const index = r * COLS + c;
        const cell = cells[index];
        cell.classList.remove("cell--clearing");
      }
    });
    done();
  }, 200);
}

function updateScoreDisplay() {
  if (scoreElement) scoreElement.textContent = `Очки: ${score}`;
}

function getShadowRow() {
  if (!currentPiece) return currentRow;
  const shape = getCurrentShape();
  let row = currentRow;
  while (canPlace(shape, row + 1, currentCol)) {
    row += 1;
  }
  return row;
}

function render() {
  const cells = gameBoardElement.children;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const index = r * COLS + c;
      const cell = cells[index];
      cell.classList.remove("cell--filled", "cell--shadow", "cell--current");
      cell.style.removeProperty("--cell-color");
      const value = board[r][c];
      if (value) {
        cell.classList.add("cell--filled");
        cell.style.setProperty("--cell-color", value);
      }
    }
  }

  if (gameBoardPieceLayer) {
    const pieceCells = gameBoardPieceLayer.children;
    for (let i = 0; i < pieceCells.length; i++) {
      pieceCells[i].classList.remove("piece-layer-cell--filled");
      pieceCells[i].style.removeProperty("--cell-color");
    }
  }
  if (!currentPiece) return;

  const shape = getCurrentShape();
  const shadowRow = getShadowRow();

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const br = shadowRow + r;
      const bc = currentCol + c;
      if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS && !board[br][bc]) {
        const index = br * COLS + bc;
        cells[index].classList.add("cell--shadow");
        cells[index].style.setProperty("--cell-color", currentColor);
      }
    }
  }

  if (gameBoardPieceLayer) {
    const pieceCells = gameBoardPieceLayer.children;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const br = currentRow + r;
        const bc = currentCol + c;
        if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS) {
          const index = br * COLS + bc;
          const cell = pieceCells[index];
          cell.classList.add("piece-layer-cell--filled");
          cell.style.setProperty("--cell-color", currentColor);
        }
      }
    }
  }
}

function setSpeedFast(enable) {
  if (isGameOver) return;
  if (enable && !isFastDrop) {
    isFastDrop = true;
    currentDropInterval = FAST_DROP_INTERVAL;
  } else if (!enable && isFastDrop) {
    isFastDrop = false;
    applyProgressSpeed();
  }
}

function handleGameOver() {
  isGameOver = true;
  clearIntervalSafe();
  setHighScore(score);
  addToLeaderboard(score);
  if (finalScoreElement) finalScoreElement.textContent = `Ваши очки: ${score}`;
  if (gameOverHighScoreElement) gameOverHighScoreElement.textContent = `Рекорд: ${getHighScore()}`;
  renderLeaderboard();
  gameOverOverlay.classList.remove("screen--hidden");
}


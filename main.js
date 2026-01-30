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
let nextPiece = null;
let nextColor = "#22c55e";
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
let btnRotateLeft;
let btnRotateRight;
let btnPause;
let btnDrop;
let gameBoardWrapper;
let nextPreviewElement;
let landingHighScoreElement;
let gameOverHighScoreElement;
let leaderboardListElement;
let gameOverLeaderboardElement;
let pauseOverlay;
let pauseResumeBtn;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initGameBoardGrid();
  initNextPreviewGrid();
  updateLandingHighScore();
  renderLeaderboard();
  attachEventListeners();
});

function cacheDom() {
  landingScreen = document.getElementById("landing-screen");
  gameScreen = document.getElementById("game-screen");
  gameBoardElement = document.getElementById("game-board");
  scoreElement = document.getElementById("score");
  finalScoreElement = document.getElementById("final-score");
  startButton = document.getElementById("start-button");
  restartButton = document.getElementById("restart-button");
  gameOverOverlay = document.getElementById("game-over-overlay");
  btnLeft = document.getElementById("btn-left");
  btnRight = document.getElementById("btn-right");
  btnRotateLeft = document.getElementById("btn-rotate-left");
  btnRotateRight = document.getElementById("btn-rotate-right");
  btnPause = document.getElementById("btn-pause");
  btnDrop = document.getElementById("btn-drop");
  gameBoardWrapper = document.getElementById("game-board-wrapper");
  nextPreviewElement = document.getElementById("next-preview");
  landingHighScoreElement = document.getElementById("landing-high-score");
  gameOverHighScoreElement = document.getElementById("game-over-high-score");
  leaderboardListElement = document.getElementById("leaderboard-list");
  gameOverLeaderboardElement = document.getElementById("game-over-leaderboard");
  pauseOverlay = document.getElementById("pause-overlay");
  pauseResumeBtn = document.getElementById("pause-resume-btn");
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
  list.sort((a, b) => (b.score - a.score));
  const seen = new Set();
  const deduped = list.filter((e) => {
    if (seen.has(e.score)) return false;
    seen.add(e.score);
    return true;
  });
  const trimmed = deduped.slice(0, LEADERBOARD_MAX);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
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

// Создание HTML-сетки клеток
function initGameBoardGrid() {
  if (!gameBoardElement) return;
  gameBoardElement.innerHTML = "";
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    gameBoardElement.appendChild(cell);
  }
}

const PIECE_COLORS = ["#22c55e", "#22d3ee", "#a855f7", "#f97316", "#eab308", "#38bdf8", "#f43f5e"];

function generateNextPiece() {
  const keys = Object.keys(TETROMINOES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  nextColor = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  nextPiece = {
    type: randomKey,
    shapes: TETROMINOES[randomKey]
  };
}

function initNextPreviewGrid() {
  if (!nextPreviewElement) return;
  nextPreviewElement.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "next-preview-cell";
    nextPreviewElement.appendChild(cell);
  }
}

function renderNextPreview() {
  if (!nextPreviewElement || !nextPiece) return;
  const shape = nextPiece.shapes[0];
  const cells = nextPreviewElement.children;
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(i / 4);
    const c = i % 4;
    const cell = cells[i];
    if (shape[r][c]) {
      cell.classList.add("next-preview-cell--filled");
      cell.style.setProperty("--cell-color", nextColor);
    } else {
      cell.classList.remove("next-preview-cell--filled");
      cell.style.removeProperty("--cell-color");
    }
  }
}

function attachEventListeners() {
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);

  btnLeft.addEventListener("click", () => handleMove(-1, 0));
  btnRight.addEventListener("click", () => handleMove(1, 0));
  if (btnRotateLeft) btnRotateLeft.addEventListener("click", handleRotateLeft);
  if (btnRotateRight) btnRotateRight.addEventListener("click", handleRotateRight);
  if (btnPause) btnPause.addEventListener("click", () => { if (!isGameOver && currentPiece) togglePause(); });
  if (btnDrop) btnDrop.addEventListener("click", () => { if (!isGameOver && currentPiece) handleHardDrop(); });
  if (pauseResumeBtn) pauseResumeBtn.addEventListener("click", () => { if (isPaused) togglePause(); });

  // Ускорение падения при клике/удержании по полю (мышь и касание)
  gameBoardElement.addEventListener("mousedown", handleBoardMouseDown);
  document.addEventListener("mouseup", handleBoardMouseUp);
  gameBoardElement.addEventListener("touchstart", handleBoardTouchStart, { passive: false });
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
  if (isPaused || isGameOver || !currentPiece || isHardDropping) return;
  if (key === "ArrowLeft") {
    event.preventDefault();
    handleMove(-1, 0);
  } else if (key === "ArrowRight") {
    event.preventDefault();
    handleMove(1, 0);
  } else if (key === "ArrowDown") {
    event.preventDefault();
    handleRotateLeft();
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
        showDropBonusPopup(bonus);
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
  if (gameOverOverlay) gameOverOverlay.classList.add("screen--hidden");
  if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");

  initGameState();
  spawnPiece();
  startDropLoop(NORMAL_DROP_INTERVAL);
  if (gameBoardWrapper) {
    requestAnimationFrame(() => {
      gameBoardWrapper.classList.add("game-board-wrapper--visible");
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
  nextPiece = null;
  nextColor = PIECE_COLORS[0];
  generateNextPiece();
  updateScoreDisplay();
  clearIntervalSafe();
  if (pauseOverlay) pauseOverlay.classList.add("screen--hidden");
  render();
  renderNextPreview();
}

function createEmptyBoard() {
  const arr = [];
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(0);
    arr.push(row);
  }
  return arr;
}

function spawnPiece() {
  dropElapsed = 0;
  if (nextPiece) {
    currentPiece = nextPiece;
    currentColor = nextColor;
  } else {
    generateNextPiece();
    currentPiece = nextPiece;
    currentColor = nextColor;
  }
  generateNextPiece();
  currentRotation = 0;
  const shape = currentPiece.shapes[currentRotation];
  currentRow = 0;
  currentCol = Math.floor((COLS - 4) / 2);

  if (!canPlace(shape, currentRow, currentCol)) {
    handleGameOver();
  } else {
    renderNextPreview();
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

function handleRotateLeft() {
  if (!currentPiece || isGameOver || isPaused || isHardDropping) return;
  const len = currentPiece.shapes.length;
  const nextRotation = (currentRotation - 1 + len) % len;
  const nextShape = currentPiece.shapes[nextRotation];
  if (canPlace(nextShape, currentRow, currentCol)) {
    currentRotation = nextRotation;
    render();
  }
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
      const points = linesCleared * BASE_LINE_SCORE * linesCleared;
      score += points;
      updateScoreDisplay();
      if (linesCleared >= 1) {
        showScorePopup(linesCleared);
        triggerLineClearEffects(linesCleared);
      }
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

function showScorePopup(linesCleared) {
  const wrapper = gameBoardElement && gameBoardElement.parentElement;
  if (!wrapper) return;
  const text = linesCleared === 1 ? "+100" : "+" + (linesCleared * BASE_LINE_SCORE) + " x " + linesCleared;
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = text;
  wrapper.appendChild(popup);
  setTimeout(() => {
    popup.remove();
  }, 1000);
}

function showDropBonusPopup(points) {
  const wrapper = gameBoardElement && gameBoardElement.parentElement;
  if (!wrapper) return;
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = "+" + points;
  wrapper.appendChild(popup);
  setTimeout(() => {
    popup.remove();
  }, 1000);
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
  scoreElement.textContent = `Очки: ${score}`;
}

function render() {
  const cells = gameBoardElement.children;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const index = r * COLS + c;
      const cell = cells[index];
      const value = board[r][c];
      if (value) {
        cell.classList.add("cell--filled");
        cell.style.setProperty("--cell-color", value);
      } else {
        cell.classList.remove("cell--filled");
        cell.style.removeProperty("--cell-color");
      }
    }
  }

  if (!currentPiece) return;

  const shape = getCurrentShape();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const br = currentRow + r;
      const bc = currentCol + c;
      if (br >= 0 && br < ROWS && bc >= 0 && bc < COLS) {
        const index = br * COLS + bc;
        const cell = cells[index];
        cell.classList.add("cell--filled");
        cell.style.setProperty("--cell-color", currentColor);
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


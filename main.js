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
let btnRotate;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initGameBoardGrid();
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
  btnRotate = document.getElementById("btn-rotate");
}

// Создание HTML-сетki клеток
function initGameBoardGrid() {
  if (!gameBoardElement) return;
  gameBoardElement.innerHTML = "";
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    gameBoardElement.appendChild(cell);
  }
}

function attachEventListeners() {
  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);

  btnLeft.addEventListener("click", () => handleMove(-1, 0));
  btnRight.addEventListener("click", () => handleMove(1, 0));
  btnRotate.addEventListener("click", handleRotate);

  // Ускорение падения при клике/удержании по полю (но не по кнопкам)
  gameBoardElement.addEventListener("mousedown", handleBoardMouseDown);
  document.addEventListener("mouseup", handleBoardMouseUp);

  document.addEventListener("keydown", handleKeyDown);
}

function handleBoardMouseDown(event) {
  // Игнорируем если игра не идёт
  if (isGameOver || !currentPiece) return;
  // Уточняем, что клик именно по полю
  if (event.target.closest(".controls")) return;
  setSpeedFast(true);
}

function handleBoardMouseUp() {
  if (!currentPiece) return;
  setSpeedFast(false);
}

function handleKeyDown(event) {
  if (isGameOver || !currentPiece) return;

  const key = event.code;
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
    handleRotate();
  }
}

// Запуск игры
function startGame() {
  // Переключение экранов
  landingScreen.classList.add("screen--hidden");
  gameScreen.classList.remove("screen--hidden");

  // На всякий случай прячем оверлей окончания игры
  if (gameOverOverlay) {
    gameOverOverlay.classList.add("screen--hidden");
  }

  initGameState();
  spawnPiece();
  startDropLoop(NORMAL_DROP_INTERVAL);
}

function restartGame() {
  gameOverOverlay.classList.add("screen--hidden");
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
  currentDropInterval = NORMAL_DROP_INTERVAL;
  dropElapsed = 0;
  piecesPlaced = 0;
  updateScoreDisplay();
  clearIntervalSafe();
  render();
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
  dropElapsed = 0; // следующая фигура падает по таймеру сразу, без задержки "от предыдущей"
  const keys = Object.keys(TETROMINOES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const colors = ["#22c55e", "#22d3ee", "#a855f7", "#f97316", "#eab308", "#38bdf8", "#f43f5e"];
  currentColor = colors[Math.floor(Math.random() * colors.length)];
  currentPiece = {
    type: randomKey,
    shapes: TETROMINOES[randomKey]
  };
  currentRotation = 0;
  const shape = currentPiece.shapes[currentRotation];

  currentRow = 0;
  currentCol = Math.floor((COLS - 4) / 2);

  if (!canPlace(shape, currentRow, currentCol)) {
    handleGameOver();
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
  if (!currentPiece || isGameOver || isClearingLines) return;
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

function handleRotate() {
  if (!currentPiece || isGameOver) return;
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
    if (isGameOver || !currentPiece) return;
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
      }
      if (linesCleared >= 2) {
        triggerLineClearEffects(linesCleared);
      }
    }

    isClearingLines = false;
    render();
    if (onCleared) onCleared();
  });
}

function triggerLineClearEffects(linesCleared) {
  if (linesCleared < 2) return;
  if (gameBoardElement) {
    gameBoardElement.classList.add("board--glow");
    setTimeout(() => gameBoardElement.classList.remove("board--glow"), 900);
  }
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
    currentDropInterval = NORMAL_DROP_INTERVAL;
  }
}

function handleGameOver() {
  isGameOver = true;
  clearIntervalSafe();
  if (finalScoreElement) {
    finalScoreElement.textContent = `Ваши очки: ${score}`;
  }
  gameOverOverlay.classList.remove("screen--hidden");
}


// --- Configuración (Firebase y EmailJS eliminados) ---

// --- Efectos de Sonido ---
const moveSound = new Audio('audio/move.wav');
const rotateSound = new Audio('audio/rotate.wav');
const clearSound = new Audio('audio/clear.wav');
const dropSound = new Audio('audio/drop.wav');
const gameOverSound = new Audio('audio/gameover.wav');
const backgroundMusic = new Audio('audio/music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// --- Elementos del DOM ---
// Elementos de login/perfil eliminados
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const linesDisplay = document.getElementById('linesDisplay');
// playCounterDisplay y leaderboardList eliminados

const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const finalLinesDisplay = document.getElementById('finalLines');
const playAgainBtn = document.getElementById('restartButton');
const lobbyBtn = document.getElementById('lobbyBtn');
const muteBtn = document.getElementById('muteBtn');

// Botones de compartir eliminados
// Botones Global/Regional eliminados
// Elementos de control facial y overlay de mensajes eliminados

// --- Variables del Juego ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_COLS = 4;
const NEXT_ROWS = 4;
const NEXT_PIECE_BLOCK_SIZE = nextPieceCanvas.width / NEXT_COLS;

let board = createMatrix(COLS, ROWS);
let nextPieceBoard = createMatrix(NEXT_COLS, NEXT_ROWS);
let piece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameInterval = null; // Para el bucle principal (no se usa directamente para la caída)
let dropInterval = null; // Para la caída automática de la pieza
let isMuted = false;
let gameState = 'INITIAL'; // Posibles estados: 'INITIAL', 'PLAYING', 'GAME_OVER'

// Variables de control facial eliminadas

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const COLORS = [
    '#00FFFF', // I - Cyan
    '#FFFF00', // O - Yellow
    '#AA00FF', // T - Purple
    '#FFA500', // L - Orange
    '#0000FF', // J - Blue
    '#00FF00', // S - Green
    '#FF0000'  // Z - Red
];

// --- Lógica de Autenticación (Eliminada) ---
// auth.onAuthStateChanged, fetchUserRegion, signInWithGoogle, signOut eliminadas

// --- Funciones de Flujo del Juego ---
function showLobby() {
    gameOverScreen.classList.add('hidden');
    gameState = 'INITIAL';
    startButton.style.display = 'block'; // Mostrar el botón de inicio
    startButton.disabled = false;
    // No hay perfil de usuario, ni mensajes de calibración
}

function startGame() {
    // No hay verificación de login
    if (!isMuted && backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.error("Audio autoplay was blocked by browser.", e));
    }
    runGame(); // Inicia el juego directamente
}

function runGame() {
    if (gameInterval) clearInterval(gameInterval);
    if (dropInterval) clearInterval(dropInterval);

    gameOverScreen.classList.add('hidden');

    board = createMatrix(COLS, ROWS);
    nextPieceBoard = createMatrix(NEXT_COLS, NEXT_ROWS);
    score = 0;
    level = 1;
    lines = 0;
    updateScore();

    nextPiece = createPiece();
    newPiece();

    dropInterval = setInterval(dropPiece, 1000 - (level * 50));
    gameState = 'PLAYING';

    // updatePlayCount eliminada
    draw();
}

function initiateGameOverSequence() {
    if (gameInterval) clearInterval(gameInterval);
    if (dropInterval) clearInterval(dropInterval);
    gameInterval = null;
    dropInterval = null;

    gameOverSound.play();

    canvas.classList.add('game-over');
    setTimeout(() => {
        canvas.classList.remove('game-over');
        // processEndOfGame eliminada
        finalScoreDisplay.textContent = score;
        finalLinesDisplay.textContent = lines;
        gameOverScreen.classList.remove('hidden');
        gameState = 'GAME_OVER';
    }, 600);
}

// stopCameraAndFaceMesh eliminada

// --- Lógica del Juego ---
function createMatrix(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(0));
}

function createPiece() {
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIdx];
    const color = COLORS[shapeIdx];

    return {
        shape,
        color,
        pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }
    };
}

function newPiece() {
    piece = nextPiece || createPiece();
    nextPiece = createPiece();
    drawNextPiece();

    // Check if game over
    if (collision()) {
        initiateGameOverSequence();
    }
}

function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextPieceCtx.fillStyle = nextPiece.color;
                nextPieceCtx.fillRect(
                    x * NEXT_PIECE_BLOCK_SIZE,
                    y * NEXT_PIECE_BLOCK_SIZE,
                    NEXT_PIECE_BLOCK_SIZE,
                    NEXT_PIECE_BLOCK_SIZE
                );
                nextPieceCtx.strokeStyle = '#000';
                nextPieceCtx.lineWidth = 1;
                nextPieceCtx.strokeRect(
                    x * NEXT_PIECE_BLOCK_SIZE,
                    y * NEXT_PIECE_BLOCK_SIZE,
                    NEXT_PIECE_BLOCK_SIZE,
                    NEXT_PIECE_BLOCK_SIZE
                );
            }
        });
    });
}

function draw() {
    // Clear game canvas
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    drawMatrix(board, { x: 0, y: 0 });

    // Draw current piece
    if (piece) {
        drawMatrix(piece.shape, piece.pos, piece.color);
    }
}

function drawMatrix(matrix, offset, color = null) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = color || value;
                ctx.fillRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );

                // Add border
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        });
    });
}

function collision() {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const boardX = x + piece.pos.x;
                const boardY = y + piece.pos.y;

                if (boardY >= ROWS || boardX < 0 || boardX >= COLS) {
                    return true;
                }
                if (boardY >= 0 && board[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + piece.pos.y][x + piece.pos.x] = piece.color;
            }
        });
    });
}

function rotate() {
    if (!piece) return;

    const originalShape = piece.shape;
    const originalPos = { ...piece.pos };

    // Transpose matrix
    piece.shape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i])
    );

    // Reverse each row to get a 90-degree rotation
    piece.shape.forEach(row => row.reverse());

    // If rotation causes collision, try wall kicks
    if (collision()) {
        piece.pos.x -= 1;
        if (collision()) {
            piece.pos.x += 2;
            if (collision()) {
                piece.shape = originalShape;
                piece.pos = originalPos;
                return;
            }
        }
    }

    rotateSound.play();
}

function dropPiece() {
    piece.pos.y++;
    if (collision()) {
        piece.pos.y--;
        merge();
        clearLines();
        newPiece();
        dropSound.play();
    }
    draw();
}

function movePiece(dir) {
    piece.pos.x += dir;
    if (collision()) {
        piece.pos.x -= dir;
        return false;
    }
    moveSound.play();
    return true;
}

function hardDrop() {
    while (!collision()) {
        piece.pos.y++;
    }
    piece.pos.y--;
    merge();
    clearLines();
    newPiece();
    dropSound.play();
    draw();
}

function clearLines() {
    let linesCleared = 0;

    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }

    if (linesCleared > 0) {
        updateScore(linesCleared);
        clearSound.play();
    }
}

function updateScore(linesCleared = 0) {
    const points = [0, 40, 100, 300, 1200][linesCleared] * level;
    score += points;
    lines += linesCleared;

    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        clearInterval(dropInterval);
        dropInterval = setInterval(dropPiece, 1000 - (level * 50));
    }

    scoreDisplay.textContent = `${score}`;
    levelDisplay.textContent = `${level}`;
    linesDisplay.textContent = `${lines}`;
}

// --- Controles (Teclado y Táctiles) ---
document.addEventListener('keydown', e => {
    if (gameState !== 'PLAYING') return;

    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            dropPiece();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ': // Barra espaciadora para hard drop
            hardDrop();
            break;
    }
    draw();
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchEndX, touchEndY);
}, { passive: false });

function handleSwipe(endX, endY) {
    if (gameState !== 'PLAYING') return;

    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;
    const threshold = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            movePiece(diffX > 0 ? 1 : -1);
            draw();
        }
    } else {
        if (Math.abs(diffY) > threshold) {
            if (diffY > 0) {
                hardDrop();
            } else {
                rotate();
                draw();
            }
        }
    }
}

// --- Control Facial (Eliminado) ---
// onFaceResults, setupCameraAndFaceMesh, processVideoFrame eliminadas

// --- Lógica Central de Fin de Partida (Simplificada) ---
// processEndOfGame, funciones de Firebase, EmailJS, y compartir eliminadas

// --- Lógica de Audio y Compartir ---
function toggleMute() {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;
    moveSound.muted = isMuted;
    rotateSound.muted = isMuted;
    clearSound.muted = isMuted;
    dropSound.muted = isMuted;
    gameOverSound.muted = isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    localStorage.setItem('gameMuted', isMuted.toString());
}

// shareToTwitter, shareToWhatsApp eliminadas

// --- INICIALIZACIÓN ---
async function initialLoad() {
    // No hay más necesidad de ajustar dinámicamente el tamaño del gameArea
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    nextPieceCanvas.width = NEXT_COLS * NEXT_PIECE_BLOCK_SIZE;
    nextPieceCanvas.height = NEXT_ROWS * NEXT_PIECE_BLOCK_SIZE;

    const savedMuteState = localStorage.getItem('gameMuted');
    if (savedMuteState === 'true') {
        isMuted = true;
        backgroundMusic.muted = true;
        muteBtn.textContent = '🔇';
    }

    // No hay carga de leaderboard o contador de jugadas
    startButton.style.display = 'block'; // Asegurar que el botón de inicio sea visible
}


// Event Listeners
startButton.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);
lobbyBtn.addEventListener('click', showLobby);
muteBtn.addEventListener('click', toggleMute);
// Event listeners de login, logout, share y leaderboard eliminados

document.addEventListener('DOMContentLoaded', initialLoad);

window.addEventListener('resize', () => {
    // No hay más necesidad de ajustar dinámicamente el tamaño del gameArea
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    nextPieceCanvas.width = NEXT_COLS * NEXT_PIECE_BLOCK_SIZE;
    nextPieceCanvas.height = NEXT_ROWS * NEXT_PIECE_BLOCK_SIZE;
    draw();
    drawNextPiece();
});
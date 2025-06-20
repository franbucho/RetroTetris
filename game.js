// --- Configuración ---
// !!! ADVERTENCIA DE SEGURIDAD: NO EXPONGAS CLAVES DE API EN UN REPOSITORIO PÚBLICO !!!
// Estas claves son sensibles y deben manejarse de forma segura (ej. variables de entorno en el servidor).
// He mantenido tus claves tal cual las proporcionaste para que el código funcione,
// pero DEBES cambiarlas por variables de entorno si despliegas esto.
const firebaseConfig = {
    apiKey: "AIzaSyBpAWJ6ZVO5oLfyLpC8cZNdiTk6lt1-HFo",
    authDomain: "profile-minigame.firebaseapp.com",
    projectId: "profile-minigame",
    storageBucket: "profile-minigame.appspot.com",
    messagingSenderId: "735696613558",
    appId: "1:735696613558:web:2e00a498dbd0a94552f617",
    measurementId: "G-44R9BSN7CQ"
}; [cite: 4, 5]
firebase.initializeApp(firebaseConfig); [cite: 5]
const db = firebase.firestore(); [cite: 5]
const auth = firebase.auth(); [cite: 5]

// !!! ADVERTENCIA DE SEGURIDAD: NO EXPONGAS IDS DE EMAILJS EN UN REPOSITORIO PÚBLICO !!!
const EMAILJS_USER_ID = 'PMOEIYlzOvdOcA2l5'; [cite: 6]
const EMAILJS_SERVICE_ID = 'service_lk8e0nv'; [cite: 6]
const EMAILJS_TEMPLATE_ID = 'template_xjhieh3'; [cite: 7]
emailjs.init(EMAILJS_USER_ID); [cite: 7]

// --- Efectos de Sonido ---
const moveSound = new Audio('audio/move.wav'); [cite: 7]
const rotateSound = new Audio('audio/rotate.wav'); [cite: 7]
const clearSound = new Audio('audio/clear.wav'); [cite: 8]
const dropSound = new Audio('audio/drop.wav'); [cite: 8]
const gameOverSound = new Audio('audio/gameover.wav'); [cite: 8]
const backgroundMusic = new Audio('audio/music.mp3'); [cite: 8]
backgroundMusic.loop = true; [cite: 9]
backgroundMusic.volume = 0.3; [cite: 9]

// --- Elementos del DOM ---
const loginScreen = document.getElementById('loginScreen'); [cite: 9]
const userProfile = document.getElementById('userProfile'); [cite: 9]
const loginBtn = document.getElementById('loginBtn'); [cite: 10]
const logoutBtn = document.getElementById('logoutBtn'); [cite: 10]
const userAvatar = document.getElementById('userAvatar'); [cite: 10]
const userName = document.getElementById('userName'); [cite: 10]

const startButton = document.getElementById('startButton'); // Renombrado de startBtn a startButton para coincidir con tu HTML 
const canvas = document.getElementById('gameCanvas'); [cite: 11]
const ctx = canvas.getContext('2d'); [cite: 11]
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay'); [cite: 11]
const levelDisplay = document.getElementById('levelDisplay'); [cite: 11]
const linesDisplay = document.getElementById('linesDisplay'); [cite: 11]
const playCounterDisplay = document.getElementById('playCounterDisplay'); [cite: 12]
const leaderboardList = document.getElementById('leaderboardList'); [cite: 12]

const gameOverScreen = document.getElementById('gameOverScreen'); [cite: 12]
const finalScoreDisplay = document.getElementById('finalScore'); [cite: 12]
const finalLinesDisplay = document.getElementById('finalLinesDisplay'); // Asegúrate que el ID sea 'finalLines' en tu HTML 
const playAgainBtn = document.getElementById('restartButton'); // Coincide con tu HTML 
const lobbyBtn = document.getElementById('lobbyBtn'); [cite: 13]
const muteBtn = document.getElementById('muteBtn'); [cite: 13]

const twitterShareBtn = document.getElementById('twitterShareBtn'); [cite: 13]
const whatsappShareBtn = document.getElementById('whatsappShareBtn'); [cite: 13]

const globalBtn = document.getElementById('globalBtn'); [cite: 14]
const regionalBtn = document.getElementById('regionalBtn'); [cite: 14]

// --- Elementos para control facial ---
const videoElement = document.getElementById('inputVideo'); [cite: 14]
const messageOverlay = document.getElementById('messageOverlay'); [cite: 15]
const messageText = document.getElementById('messageText'); [cite: 15]

// --- Variables del Juego ---
const COLS = 10; [cite: 16]
const ROWS = 20; [cite: 16]
const BLOCK_SIZE = 30; // Tamaño de cada bloque en píxeles 
const NEXT_COLS = 4; [cite: 17]
const NEXT_ROWS = 4; [cite: 17]
const NEXT_PIECE_BLOCK_SIZE = nextPieceCanvas.width / NEXT_COLS; // Calcular tamaño del bloque para el nextPieceCanvas

let board = createMatrix(COLS, ROWS); [cite: 17]
let nextPieceBoard = createMatrix(NEXT_COLS, NEXT_ROWS); [cite: 17]
let piece = null; [cite: 18]
let nextPiece = null; [cite: 18]
let score = 0; [cite: 18]
let level = 1; [cite: 18]
let lines = 0; [cite: 18]
let gameInterval = null; // Para el bucle principal del juego (no usado directamente en tu código, pero buena práctica) 
let dropInterval = null; // Para la caída automática de la pieza 
let isMuted = false; [cite: 19]
let currentUserRegion = null; [cite: 19]
let gameState = 'INITIAL'; // Posibles estados: 'INITIAL', 'STARTING_CAMERA', 'CALIBRATING', 'POST_CALIBRATION_DELAY', 'PLAYING', 'GAME_OVER' 
let elapsedTimeInSeconds = 0; [cite: 20]

// Variables para control facial
let faceMesh = null; // Instancia de FaceMesh
let calibratedNose = null; // Posición de la nariz al calibrar
let isCalibrated = false;
const NOSE_SENSITIVITY = 0.03; // Umbral de movimiento de la nariz (ajusta según sea necesario)

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

// --- Lógica de Autenticación ---
auth.onAuthStateChanged(async (user) => { [cite: 22]
    // Determina si el juego está en un estado activo que no debería ser interrumpido
    const isGameActiveState = (gameState === 'PLAYING' || gameState === 'CALIBRATING' || gameState === 'STARTING_CAMERA' || gameState === 'POST_CALIBRATION_DELAY'); [cite: 22]

    if (user) { [cite: 22]
        loginScreen.style.display = 'none'; [cite: 22]
        userProfile.style.display = 'flex'; [cite: 22]
        userName.textContent = user.displayName; [cite: 22]
        userAvatar.src = user.photoURL; [cite: 22]

        await fetchUserRegion(user.uid); // Fetch user region after login 

        if (!isGameActiveState) { // Only show message overlay if game is not active 
            messageOverlay.style.display = 'flex'; [cite: 23]
            startButton.style.display = 'block'; [cite: 23]
            startButton.disabled = false; [cite: 23]
            messageText.textContent = 'Face Control (Press START GAME)'; [cite: 23]
            renderLeaderboard(globalBtn.classList.contains('active') ? 'global' : currentUserRegion || 'global'); // Refresh leaderboard
        }
    } else { [cite: 23]
        userProfile.style.display = 'none'; [cite: 24]
        loginScreen.style.display = 'flex'; [cite: 24]

        messageOverlay.style.display = 'flex'; [cite: 24]
        startButton.style.display = 'none'; [cite: 24]
        startButton.disabled = true; [cite: 24]
        messageText.textContent = 'Sign in to play!'; [cite: 24]

        regionalBtn.disabled = true; [cite: 25]
        currentUserRegion = null; [cite: 25]
        stopCameraAndFaceMesh(); // Ensure camera is off if logged out 
        gameState = 'INITIAL'; [cite: 25]
        renderLeaderboard('global'); // Show global leaderboard if logged out
    }
});

async function fetchUserRegion(uid) { [cite: 26]
    try { [cite: 26]
        const playerDoc = await db.collection('leaderboards').doc('global').collection('scores').doc(uid).get(); [cite: 26]
        if (playerDoc.exists && playerDoc.data().countryCode) { [cite: 27]
            currentUserRegion = playerDoc.data().countryCode.toLowerCase(); [cite: 27]
            localStorage.setItem('userRegion', currentUserRegion); [cite: 28]
            regionalBtn.disabled = false; [cite: 28]
        } else { [cite: 28]
            regionalBtn.disabled = true; [cite: 28]
        }
    } catch (error) { [cite: 29]
        console.error("Error al buscar la región del usuario:", error); [cite: 29]
        regionalBtn.disabled = true; [cite: 30]
    }
}

function signInWithGoogle() { [cite: 30]
    const provider = new firebase.auth.GoogleAuthProvider(); [cite: 30]
    auth.signInWithPopup(provider).catch(error => { [cite: 31]
        console.error("Error during sign-in:", error); [cite: 31]
        alert("Error during sign-in: " + error.message);
    });
}

function signOut() { [cite: 32]
    auth.signOut(); [cite: 32]
}

// --- Funciones de Flujo del Juego ---
function showLobby() { [cite: 32]
    gameOverScreen.classList.add('hidden'); // Ocultar gameOverScreen
    stopCameraAndFaceMesh(); [cite: 33]
    gameState = 'INITIAL'; [cite: 33]
    messageOverlay.style.display = 'flex'; [cite: 33]
    startButton.style.display = 'block'; [cite: 33]
    startButton.disabled = false; [cite: 33]
    messageText.textContent = 'Face Control (Press START GAME)'; [cite: 33]

    if (auth.currentUser) { [cite: 34]
        logoutBtn.disabled = false; [cite: 34]
    }

    renderLeaderboard(globalBtn.classList.contains('active') ? 'global' : currentUserRegion || 'global'); [cite: 35]
}

function startGame() { [cite: 36]
    if (!auth.currentUser) { [cite: 36]
        alert("You must be signed in to play."); [cite: 36]
        return; [cite: 37]
    }

    logoutBtn.disabled = true; // Deshabilitar logout durante el juego 

    if (!isMuted && backgroundMusic.paused) { [cite: 38]
        backgroundMusic.play().catch(e => console.error("Audio autoplay was blocked by browser.", e)); [cite: 38]
    }

    setupCameraAndFaceMesh(); [cite: 39]
}

function runGame() { [cite: 39]
    if (gameInterval) clearInterval(gameInterval); [cite: 39]
    if (dropInterval) clearInterval(dropInterval); [cite: 40]

    gameOverScreen.classList.remove('visible'); [cite: 40]
    messageOverlay.style.display = 'none'; [cite: 40]
    videoElement.style.display = 'block'; // Mostrar la vista de la cámara

    elapsedTimeInSeconds = 0; [cite: 40]
    board = createMatrix(COLS, ROWS); [cite: 40]
    nextPieceBoard = createMatrix(NEXT_COLS, NEXT_ROWS); // Reiniciar nextPieceBoard 
    score = 0; [cite: 41]
    level = 1; [cite: 41]
    lines = 0; [cite: 41]
    updateScore(); // Actualizar displays del score 
    updateElapsedTime(); // Iniciar contador de tiempo

    nextPiece = createPiece(); // Generar la primera "nextPiece" 
    newPiece(); // Generar la primera "currentPiece" 

    dropInterval = setInterval(dropPiece, 1000 - (level * 50)); [cite: 42]
    gameState = 'PLAYING'; [cite: 42]

    updatePlayCount(); [cite: 42]
    draw(); // Dibujar el estado inicial del juego 
}

function initiateGameOverSequence() { [cite: 43]
    if (gameInterval) clearInterval(gameInterval); // Detener cualquier intervalo de juego si lo hubiera
    if (dropInterval) clearInterval(dropInterval); [cite: 43]
    gameInterval = null; // Resetear la variable 
    dropInterval = null;

    gameOverSound.play(); [cite: 43]

    stopCameraAndFaceMesh(); // Detener la cámara al finalizar el juego 

    canvas.classList.add('game-over'); // Efecto visual 
    setTimeout(() => { [cite: 44]
        canvas.classList.remove('game-over'); [cite: 44]
        logoutBtn.disabled = false; [cite: 44]
        processEndOfGame(); [cite: 44]
        finalScoreDisplay.textContent = score; [cite: 44]
        finalLinesDisplay.textContent = lines; [cite: 44]
        gameOverScreen.classList.remove('hidden'); // Mostrar pantalla de Game Over
        gameState = 'GAME_OVER'; [cite: 45]
    }, 600);
}

function stopCameraAndFaceMesh() { [cite: 45]
    if (videoElement.srcObject) { [cite: 45]
        videoElement.srcObject.getTracks().forEach(track => track.stop()); [cite: 45]
        videoElement.srcObject = null; [cite: 46]
    }
    if (faceMesh) {
        faceMesh.close();
        faceMesh = null; // Asegúrate de limpiar la instancia
    }
    videoElement.style.display = 'none'; [cite: 46]
}

// --- Lógica del Juego ---
function createMatrix(width, height) { [cite: 47]
    return Array.from({ length: height }, () => Array(width).fill(0)); [cite: 48]
}

function createPiece() { [cite: 48]
    const shapeIdx = Math.floor(Math.random() * SHAPES.length); [cite: 48]
    const shape = SHAPES[shapeIdx]; [cite: 48]
    const color = COLORS[shapeIdx]; [cite: 49]

    return { [cite: 49]
        shape, [cite: 49]
        color, [cite: 49]
        pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 } [cite: 49]
    };
}

function newPiece() { [cite: 50]
    piece = nextPiece || createPiece(); // Si no hay nextPiece (primera vez), crea una 
    nextPiece = createPiece(); [cite: 50]
    drawNextPiece(); [cite: 50]

    // Check if game over
    if (collision()) { [cite: 51]
        initiateGameOverSequence(); [cite: 52]
    }
}

function drawNextPiece() { [cite: 52]
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height); // Limpiar el canvas

    nextPiece.shape.forEach((row, y) => { [cite: 53]
        row.forEach((value, x) => { [cite: 53]
            if (value) { [cite: 53]
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

function draw() { [cite: 54]
    // Clear game canvas
    ctx.fillStyle = '#2c2c2c'; [cite: 54]
    ctx.fillRect(0, 0, canvas.width, canvas.height); [cite: 55]

    // Draw board
    drawMatrix(board, { x: 0, y: 0 }); [cite: 55]

    // Draw current piece
    if (piece) { // Asegúrate de que piece exista antes de intentar dibujarla
        drawMatrix(piece.shape, piece.pos, piece.color); [cite: 56]
    }
}

function drawMatrix(matrix, offset, color = null) { [cite: 57]
    matrix.forEach((row, y) => { [cite: 57]
        row.forEach((value, x) => { [cite: 57]
            if (value) { [cite: 58]
                ctx.fillStyle = color || value; [cite: 58]
                ctx.fillRect(
                    (x + offset.x) * BLOCK_SIZE, [cite: 58]
                    (y + offset.y) * BLOCK_SIZE, [cite: 58]
                    BLOCK_SIZE, [cite: 58]
                    BLOCK_SIZE [cite: 58]
                );

                // Add border
                ctx.strokeStyle = '#000'; [cite: 59]
                ctx.lineWidth = 1; [cite: 59]
                ctx.strokeRect(
                    (x + offset.x) * BLOCK_SIZE, [cite: 60]
                    (y + offset.y) * BLOCK_SIZE, [cite: 60]
                    BLOCK_SIZE, [cite: 60]
                    BLOCK_SIZE [cite: 60]
                );
            }
        });
    });
}

function collision() { [cite: 61]
    // Verifica si la pieza actual choca con el tablero o los límites
    for (let y = 0; y < piece.shape.length; y++) { [cite: 61]
        for (let x = 0; x < piece.shape[y].length; x++) { [cite: 61]
            if (piece.shape[y][x] !== 0) { // Si es un bloque de la pieza
                const boardX = x + piece.pos.x;
                const boardY = y + piece.pos.y;

                // Si choca con el suelo o las paredes
                if (boardY >= ROWS || boardX < 0 || boardX >= COLS) {
                    return true;
                }
                // Si choca con un bloque ya existente en el tablero
                if (boardY >= 0 && board[boardY][boardX] !== 0) { [cite: 62]
                    return true; [cite: 63]
                }
            }
        }
    }
    return false; [cite: 64]
}

function merge() { [cite: 64]
    piece.shape.forEach((row, y) => { [cite: 64]
        row.forEach((value, x) => { [cite: 64]
            if (value) { [cite: 65]
                board[y + piece.pos.y][x + piece.pos.x] = piece.color; [cite: 65]
            }
        });
    });
}

function rotate() { [cite: 65]
    if (!piece) return; [cite: 65]

    const originalShape = piece.shape; [cite: 65]
    const originalPos = { ...piece.pos }; [cite: 65]

    // Transpose matrix
    piece.shape = piece.shape[0].map((_, i) => [cite: 66]
        piece.shape.map(row => row[i]) [cite: 66]
    );

    // Reverse each row to get a 90-degree rotation
    piece.shape.forEach(row => row.reverse()); [cite: 67]

    // If rotation causes collision, try wall kicks
    if (collision()) { [cite: 68]
        // Try moving left
        piece.pos.x -= 1; [cite: 69]
        if (collision()) { [cite: 69]
            // Try moving right
            piece.pos.x += 2; [cite: 70]
            if (collision()) { [cite: 70]
                // Revert rotation if both wall kicks fail
                piece.shape = originalShape; [cite: 70]
                piece.pos = originalPos; [cite: 71]
                return; // No rotation occurred
            }
        }
    }

    rotateSound.play(); [cite: 72]
}

function dropPiece() { [cite: 72]
    piece.pos.y++; [cite: 73]
    if (collision()) { [cite: 73]
        piece.pos.y--; [cite: 73]
        merge(); [cite: 73]
        clearLines(); [cite: 73]
        newPiece(); [cite: 73]
        dropSound.play(); [cite: 73]
    }
    draw(); [cite: 73]
}

function movePiece(dir) { [cite: 74]
    piece.pos.x += dir; [cite: 74]
    if (collision()) { [cite: 74]
        piece.pos.x -= dir; [cite: 74]
        return false; [cite: 74]
    }
    moveSound.play(); [cite: 74]
    return true; [cite: 75]
}

function hardDrop() { [cite: 75]
    while (!collision()) { [cite: 75]
        piece.pos.y++; [cite: 76]
    }
    piece.pos.y--; [cite: 76]
    merge(); [cite: 76]
    clearLines(); [cite: 76]
    newPiece(); [cite: 76]
    dropSound.play(); [cite: 76]
    draw(); [cite: 76]
}

function clearLines() { [cite: 77]
    let linesCleared = 0; [cite: 77]

    outer: for (let y = ROWS - 1; y >= 0; y--) { [cite: 77]
        for (let x = 0; x < COLS; x++) { [cite: 77]
            if (!board[y][x]) { [cite: 77]
                continue outer; [cite: 78]
            }
        }

        // Si llegamos aquí, la línea está completa
        const row = board.splice(y, 1)[0].fill(0); [cite: 79]
        board.unshift(row); [cite: 79]
        y++; // Vuelve a verificar la misma fila (ahora la que se movió hacia abajo) 
        linesCleared++; [cite: 80]
    }

    if (linesCleared > 0) { [cite: 80]
        updateScore(linesCleared); [cite: 81]
        clearSound.play(); [cite: 81]
    }
}

function updateScore(linesCleared = 0) { [cite: 81]
    // Scoring system based on original Tetris
    const points = [0, 40, 100, 300, 1200][linesCleared] * level; [cite: 82]
    score += points; [cite: 82]
    lines += linesCleared; [cite: 82]

    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1; [cite: 83]
    if (newLevel > level) { [cite: 83]
        level = newLevel; [cite: 84]
        clearInterval(dropInterval); [cite: 84]
        dropInterval = setInterval(dropPiece, 1000 - (level * 50)); // Aumenta la velocidad de caída 
    }

    scoreDisplay.textContent = `${score}`; [cite: 85]
    levelDisplay.textContent = `${level}`; [cite: 85]
    linesDisplay.textContent = `${lines}`; [cite: 85]
}

function updateElapsedTime() {
    // Reinicia y empieza a contar el tiempo en segundos
    if (gameInterval) clearInterval(gameInterval); // Limpia cualquier intervalo anterior
    gameInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            elapsedTimeInSeconds++;
        }
    }, 1000);
}


// --- Controles (Teclado y Táctiles) ---
document.addEventListener('keydown', e => { [cite: 85]
    if (gameState !== 'PLAYING') return; [cite: 85]

    switch (e.key) { [cite: 86]
        case 'ArrowLeft': [cite: 86]
            movePiece(-1); [cite: 86]
            break; [cite: 86]
        case 'ArrowRight': [cite: 86]
            movePiece(1); [cite: 86]
            break; [cite: 86]
        case 'ArrowDown': [cite: 86]
            dropPiece(); [cite: 86]
            break; [cite: 86]
        case 'ArrowUp': [cite: 86]
            rotate(); [cite: 86]
            break; [cite: 86]
        case ' ': // Barra espaciadora para hard drop 
            hardDrop(); [cite: 87]
            break; [cite: 87]
    }
    draw(); [cite: 87]
});

// Variables para touch
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => { [cite: 88]
    e.preventDefault(); // Prevenir el scroll 
    touchStartX = e.changedTouches[0].screenX; [cite: 88]
    touchStartY = e.changedTouches[0].screenY; [cite: 88]
}, { passive: false });

canvas.addEventListener('touchend', (e) => { [cite: 89]
    e.preventDefault(); // Prevenir el scroll 
    const touchEndX = e.changedTouches[0].screenX; [cite: 89]
    const touchEndY = e.changedTouches[0].screenY; [cite: 89]
    handleSwipe(touchEndX, touchEndY); [cite: 90]
}, { passive: false });

function handleSwipe(endX, endY) { [cite: 90]
    if (gameState !== 'PLAYING') return; [cite: 90]

    const diffX = endX - touchStartX; [cite: 91]
    const diffY = endY - touchStartY; [cite: 91]
    const threshold = 30; // Sensibilidad del swipe 

    if (Math.abs(diffX) > Math.abs(diffY)) { // Movimiento horizontal 
        if (Math.abs(diffX) > threshold) { [cite: 92]
            movePiece(diffX > 0 ? 1 : -1); // Derecha o Izquierda 
            draw(); [cite: 93]
        }
    } else { // Movimiento vertical 
        if (Math.abs(diffY) > threshold) { [cite: 93]
            if (diffY > 0) { [cite: 94]
                hardDrop(); // Abajo (hard drop) 
            } else { [cite: 94]
                rotate(); [cite: 94]
                draw(); [cite: 95]
            }
        }
    }
}

// --- Control Facial (MediaPipe FaceMesh) ---
async function processVideoFrame() {
    // Envía el frame de video a FaceMesh para su procesamiento
    if (faceMesh && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        await faceMesh.send({ image: videoElement });
    }
    // Si el juego está activo o en calibración, sigue procesando frames
    if (gameState === 'PLAYING' || gameState === 'CALIBRATING' || gameState === 'POST_CALIBRATION_DELAY') {
        requestAnimationFrame(processVideoFrame);
    }
}

function onFaceResults(results) { [cite: 95]
    // Si no hay landmarks o no estamos en un estado de juego/calibración relevante, salir
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0 || [cite: 96]
        (gameState !== 'PLAYING' && gameState !== 'CALIBRATING' && gameState !== 'POST_CALIBRATION_DELAY')) {
        return; [cite: 96]
    }

    const landmarks = results.multiFaceLandmarks[0]; [cite: 96]
    const noseTip = landmarks[4]; // Índice 4 es la punta de la nariz en MediaPipe FaceMesh 

    if (!noseTip) return; [cite: 96]

    const noseX = noseTip.x; [cite: 97]
    const noseY = noseTip.y; [cite: 97]

    if (gameState === 'CALIBRATING' && !isCalibrated) { [cite: 97]
        calibratedNose = { x: noseX, y: noseY }; [cite: 98]
        isCalibrated = true; [cite: 98]
        gameState = 'POST_CALIBRATION_DELAY'; [cite: 98]
        messageText.textContent = 'Calibrated! Get Ready...'; [cite: 98]
        messageOverlay.style.display = 'flex'; [cite: 98]

        setTimeout(() => { [cite: 99]
            // Asegúrate de que el estado no ha cambiado (ej. por logout) antes de iniciar el juego
            if (gameState === 'POST_CALIBRATION_DELAY') { [cite: 99]
                gameState = 'PLAYING'; [cite: 99]
                messageOverlay.style.display = 'none'; [cite: 99]
                runGame(); [cite: 99]
            }
        }, 1500); // Pequeña pausa antes de empezar 
    } else if (gameState === 'PLAYING' && isCalibrated) { [cite: 100]
        const diffX = noseX - calibratedNose.x; [cite: 101]
        const diffY = noseY - calibratedNose.y; [cite: 101]

        // Limitar la frecuencia de movimientos para evitar movimientos erráticos
        // Puedes ajustar este delay o implementar un sistema de "cooldown"
        if (Date.now() - lastGestureTime < 200) { // 200ms de cooldown entre gestos
             return;
        }

        let moved = false;
        if (Math.abs(diffX) > Math.abs(diffY)) { [cite: 101]
            if (diffX > NOSE_SENSITIVITY) { [cite: 101]
                if(movePiece(1)) moved = true; // Derecha 
            } else if (diffX < -NOSE_SENSITIVITY) { [cite: 101]
                if(movePiece(-1)) moved = true; // Izquierda 
            }
        } else { [cite: 102]
            if (diffY < -NOSE_SENSITIVITY) { [cite: 102]
                rotate(); moved = true; // Mirar hacia arriba (rotar) 
            } else if (diffY > NOSE_SENSITIVITY) { [cite: 102]
                hardDrop(); moved = true; // Mirar hacia abajo (hard drop) 
            }
        }
        if (moved) {
            lastGestureTime = Date.now(); // Actualizar el tiempo del último gesto
            draw(); [cite: 102]
        }
    }
}

let lastGestureTime = 0; // Para controlar el cooldown de los gestos

async function setupCameraAndFaceMesh() { [cite: 103]
    gameState = 'STARTING_CAMERA'; [cite: 103]
    messageText.textContent = 'Starting camera...'; [cite: 103]
    startButton.style.display = 'none'; [cite: 103]
    messageOverlay.style.display = 'flex'; [cite: 103]

    stopCameraAndFaceMesh(); // Asegurarse de que la cámara anterior esté apagada 

    try { [cite: 103]
        const stream = await navigator.mediaDevices.getUserMedia({ [cite: 103]
            video: { [cite: 103]
                width: { ideal: 320 }, [cite: 104]
                height: { ideal: 240 }, [cite: 104]
                facingMode: 'user' // Usa la cámara frontal 
            }
        });
        videoElement.srcObject = stream; [cite: 104]
        videoElement.style.display = 'block'; // Mostrar el video de la cámara 

        await videoElement.play(); [cite: 105]

        // Inicializar FaceMesh si no está ya inicializado
        if (!faceMesh) {
            if (!window.FaceMesh) { [cite: 105]
                messageText.textContent = 'Error: FaceMesh library not loaded. Check CDN link.'; [cite: 106]
                console.error('FaceMesh library not loaded. Ensure the CDN script is correct in index.html'); [cite: 106]
                gameState = 'INITIAL'; [cite: 106]
                startButton.style.display = 'block'; [cite: 106]
                return; [cite: 107]
            }

            faceMesh = new FaceMesh({ [cite: 107]
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` [cite: 107]
            });

            faceMesh.setOptions({ [cite: 108]
                maxNumFaces: 1, [cite: 108]
                refineLandmarks: true, [cite: 108]
                minDetectionConfidence: 0.7, // Ajusta la confianza de detección
                minTrackingConfidence: 0.7 [cite: 108]
            });
            faceMesh.onResults(onFaceResults); [cite: 109]
        }

        processVideoFrame(); // Inicia el procesamiento continuo de frames 
        gameState = 'CALIBRATING'; [cite: 109]
        isCalibrated = false; [cite: 110]
        messageText.textContent = 'Look straight at the camera to calibrate.'; [cite: 110]

    } catch (err) { [cite: 110]
        console.error("Fallo al acceder a la cámara o configurar FaceMesh:", err); [cite: 111]
        messageText.textContent = 'Error: Camera access denied or not available. Allow permission & refresh.'; [cite: 111]
        startButton.style.display = 'block'; [cite: 111]
        messageOverlay.style.display = 'flex'; [cite: 112]
        gameState = 'INITIAL'; [cite: 112]
        videoElement.style.display = 'none'; // Ocultar el video de la cámara si hay error 
    }
}

// --- Lógica Central de Fin de Partida ---
async function processEndOfGame() { [cite: 112]
    const user = auth.currentUser; [cite: 113]
    if (!user) return; // No procesar si no hay usuario logueado 

    const { displayName: name, uid, photoURL, email } = user; [cite: 113]
    const currentScore = score; [cite: 114]
    const currentLines = lines; [cite: 114]
    const time = elapsedTimeInSeconds; [cite: 114]
    let locationData; [cite: 114]

    try { [cite: 115]
        const response = await fetch('https://ipapi.co/json/'); [cite: 115]
        locationData = response.ok ? await response.json() : { country_name: 'N/A', country_code: 'N/A', ip: 'N/A' }; [cite: 116]
    } catch (error) { [cite: 117]
        console.warn('Fallo en la búsqueda de IP.', error); [cite: 117]
        locationData = { country_name: 'N/A', country_code: 'N/A', ip: 'N/A' }; [cite: 118]
    }

    const country = locationData.country_name; [cite: 118]
    const countryCode = locationData.country_code; [cite: 119]

    if (countryCode && countryCode !== 'N/A') { [cite: 119]
        currentUserRegion = countryCode.toLowerCase(); [cite: 120]
        localStorage.setItem('userRegion', currentUserRegion); [cite: 120]
        regionalBtn.disabled = false; [cite: 120]
    } else {
        regionalBtn.disabled = true; // Deshabilitar si no se pudo obtener la región
    }


    // Fetch leaderboards before adding score to compare
    const boardBeforeGlobal = await getLeaderboard('global'); [cite: 120]
    let boardBeforeRegional = [];
    if (currentUserRegion) {
        boardBeforeRegional = await getLeaderboard(currentUserRegion);
    }

    const seenCountriesDoc = await db.collection('gameStats').doc('seenCountries').get(); [cite: 121]
    const seenCountries = seenCountriesDoc.exists ? seenCountriesDoc.data().list : []; [cite: 121]

    await addScoreToLeaderboard(uid, name, photoURL, currentScore, currentLines, country, countryCode, time, email); [cite: 122]

    // Fetch updated leaderboards
    const updatedBoardGlobal = await getLeaderboard('global'); [cite: 122]
    let updatedBoardRegional = [];
    if (currentUserRegion) {
        updatedBoardRegional = await getLeaderboard(currentUserRegion);
    }

    // Render the currently active leaderboard
    const regionToDisplay = regionalBtn.classList.contains('active') && currentUserRegion ? currentUserRegion : 'global'; [cite: 122]
    renderLeaderboard(await getLeaderboard(regionToDisplay)); // Renderiza el leaderboard después de actualizar 

    // Send smart notification only for global leaderboard changes for simplicity or refine logic
    sendSmartNotification(name, currentScore, country, boardBeforeGlobal, updatedBoardGlobal, seenCountries, locationData); [cite: 123]
}

// --- Funciones de Firebase ---
async function updatePlayCount(isInitialLoad = false) { [cite: 123]
    const counterRef = db.collection('gameStats').doc('playCounter'); [cite: 124]
    try { [cite: 124]
        if (!isInitialLoad) { [cite: 124]
            await counterRef.update({ count: firebase.firestore.FieldValue.increment(1) }); [cite: 124]
        }
        const doc = await counterRef.get(); [cite: 125]
        const count = doc.exists ? doc.data().count : 0; [cite: 126]
        playCounterDisplay.textContent = `Plays: ${count.toLocaleString('en-US')}`; [cite: 126]
    } catch (error) { [cite: 126]
        if (error.code === 'not-found') { [cite: 127]
            const startCount = isInitialLoad ? 0 : 1; [cite: 127]
            await counterRef.set({ count: startCount }); [cite: 127]
            playCounterDisplay.textContent = `Plays: ${startCount}`; [cite: 127]
        } else { [cite: 128]
            console.error("Error with play counter:", error); [cite: 128]
            playCounterDisplay.textContent = 'Plays: N/A'; [cite: 129]
        }
    }
}

async function getLeaderboard(region = 'global') { [cite: 129]
    const leaderboardRef = db.collection('leaderboards').doc(region).collection('scores').orderBy('score', 'desc').orderBy('lines', 'desc').limit(100); [cite: 129]
    const snapshot = await leaderboardRef.get(); [cite: 130]
    const board = []; [cite: 130]
    snapshot.forEach(doc => { [cite: 130]
        board.push({ id: doc.id, ...doc.data() }); [cite: 131]
    });
    return board; [cite: 131]
}

async function addScoreToLeaderboard(uid, name, photoURL, newScore, lines, country, countryCode, time, email) { [cite: 131]
    const playerData = { name, photoURL, score: newScore, lines, country, countryCode, time, email }; [cite: 132]

    const updateLogic = async (ref) => { [cite: 132]
        const doc = await ref.get(); [cite: 133]
        // Update only if new score is higher, or if scores are equal, if lines are higher
        if (!doc.exists || newScore > doc.data().score || (newScore === doc.data().score && lines > doc.data().lines)) { [cite: 133]
            await ref.set(playerData); [cite: 134]
        }
    };

    const globalPlayerRef = db.collection('leaderboards').doc('global').collection('scores').doc(uid); [cite: 134]
    await updateLogic(globalPlayerRef); [cite: 135]

    if (countryCode && countryCode !== 'N/A') { [cite: 135]
        const regionalPlayerRef = db.collection('leaderboards').doc(countryCode.toLowerCase()).collection('scores').doc(uid); [cite: 135]
        await updateLogic(regionalPlayerRef); [cite: 136]
    }
}

function formatTime(seconds) { [cite: 136]
    const minutes = Math.floor(seconds / 60); [cite: 137]
    const remainingSeconds = seconds % 60; [cite: 137]
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`; [cite: 137]
}

function renderLeaderboard(board) { [cite: 137]
    leaderboardList.innerHTML = ''; [cite: 138]
    if (!board || board.length === 0) { [cite: 138]
        leaderboardList.innerHTML = '<li>No scores yet.</li>'; [cite: 138]
        return; [cite: 139]
    }

    board.forEach((entry, index) => { [cite: 139]
        const li = document.createElement('li'); [cite: 139]

        const rankSpan = document.createElement('span'); [cite: 140]
        rankSpan.className = 'leaderboard-rank'; [cite: 140]
        rankSpan.textContent = `${index + 1}.`; [cite: 140]

        const entryDiv = document.createElement('div'); [cite: 140]
        entryDiv.className = 'leaderboard-entry'; [cite: 140]

        const playerImg = document.createElement('img'); [cite: 140]
        playerImg.className = 'leaderboard-avatar'; [cite: 140]
        playerImg.src = entry.photoURL || 'https://i.imgur.com/sC5gU4e.png'; [cite: 140] // Placeholder if no photo
        entryDiv.appendChild(playerImg); [cite: 140]

        const detailsDiv = document.createElement('div'); [cite: 140]
        detailsDiv.className = 'leaderboard-details'; [cite: 140]

        const playerDiv = document.createElement('div'); [cite: 141]
        playerDiv.className = 'leaderboard-player'; [cite: 141]

        const nameSpan = document.createElement('span'); [cite: 141]
        nameSpan.className = 'leaderboard-player-name'; [cite: 141]
        nameSpan.textContent = entry.name || 'Anonymous'; [cite: 141]
        playerDiv.appendChild(nameSpan); [cite: 141]

        if (entry.countryCode && entry.countryCode !== 'N/A' && entry.countryCode.length === 2) { [cite: 142]
            const flagImg = document.createElement('img'); [cite: 143]
            flagImg.className = 'leaderboard-flag'; [cite: 143]
            flagImg.src = `https://flagcdn.com/w20/${entry.countryCode.toLowerCase()}.png`; [cite: 143]
            flagImg.alt = entry.country; [cite: 143]
            flagImg.title = entry.country; [cite: 143]
            playerDiv.appendChild(flagImg); [cite: 144]
        }

        detailsDiv.appendChild(playerDiv); [cite: 144]

        const statsSpan = document.createElement('span'); [cite: 145]
        statsSpan.className = 'leaderboard-stats'; [cite: 145]
        const timeDisplayValue = entry.time !== undefined ? ` in ${formatTime(entry.time)}` : ''; [cite: 145]
        statsSpan.textContent = `Score: ${entry.score || 0} (${entry.lines || 0} lines)${timeDisplayValue}`; [cite: 146]
        detailsDiv.appendChild(statsSpan); [cite: 146]

        entryDiv.appendChild(detailsDiv); [cite: 146]
        li.appendChild(rankSpan); [cite: 146]
        li.appendChild(entryDiv); [cite: 146]
        leaderboardList.appendChild(li); [cite: 147]
    });
}


// --- ENVÍO DE CORREO (EmailJS) ---
async function sendSmartNotification(name, currentScore, country, boardBefore, boardAfter, seenCountries, locationData) { [cite: 147]
    if (currentScore === 0) { console.log("Score is 0, no notification sent."); return; } [cite: 148]

    let shouldSendEmail = false; [cite: 148]
    let emailReason = ""; [cite: 148]

    // Check for new country
    if (country && country !== 'N/A' && !seenCountries.includes(country)) { [cite: 149]
        shouldSendEmail = true; [cite: 150]
        emailReason = `New Country: ${country}!`; [cite: 150]
        try { [cite: 150]
            const seenCountriesRef = db.collection('gameStats').doc('seenCountries'); [cite: 150]
            await seenCountriesRef.update({ list: firebase.firestore.FieldValue.arrayUnion(country) }); [cite: 151]
        } catch (error) { [cite: 151]
            if (error.code === 'not-found') { [cite: 151]
                await db.collection('gameStats').doc('seenCountries').set({ list: [country] }); [cite: 152]
            } else { [cite: 152]
                console.error("Error updating seenCountries:", error); [cite: 152]
            }
        }
    }

    // Check if player entered Top 5 (global)
    const oldIndex = boardBefore.findIndex(p => p.id === auth.currentUser.uid); [cite: 153]
    const newIndex = boardAfter.findIndex(p => p.id === auth.currentUser.uid); [cite: 154]
    const enteredTop5 = newIndex !== -1 && newIndex < 5 && (oldIndex === -1 || oldIndex >= 5); [cite: 154]

    if (enteredTop5 && !shouldSendEmail) { // Only add this reason if not already sending for a new country 
        shouldSendEmail = true; [cite: 155]
        emailReason = `Entered Top 5 at #${newIndex + 1}!`; [cite: 156]
    }

    if (!shouldSendEmail) { [cite: 156]
        console.log("Condiciones para la notificación no cumplidas."); [cite: 157]
        return; [cite: 157]
    }

    const params = { [cite: 157]
        player_name: `${name} (${emailReason})`, [cite: 158]
        player_score: currentScore, [cite: 158]
        player_ip: locationData.ip || "Unknown", [cite: 158]
        player_country: country [cite: 158]
    };

    console.log('Enviando notificación inteligente con estos parámetros:', params); [cite: 159]
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params) [cite: 159]
        .then(() => console.log("Notificación inteligente enviada con éxito!")) [cite: 159]
        .catch(err => console.error("Fallo de envío de EmailJS:", err)); [cite: 160]
}

// --- Lógica de Audio y Compartir ---
function toggleMute() { [cite: 160]
    isMuted = !isMuted; [cite: 160]
    backgroundMusic.muted = isMuted; [cite: 161]
    moveSound.muted = isMuted; [cite: 161]
    rotateSound.muted = isMuted; [cite: 161]
    clearSound.muted = isMuted; [cite: 161]
    dropSound.muted = isMuted; [cite: 161]
    gameOverSound.muted = isMuted; [cite: 161]
    muteBtn.textContent = isMuted ? '🔇' : '🔊'; [cite: 162]
    localStorage.setItem('gameMuted', isMuted.toString()); [cite: 162]
}

function shareToTwitter() { [cite: 162]
    const finalScore = finalScoreDisplay.textContent; [cite: 163]
    const finalLines = finalLinesDisplay.textContent; [cite: 163]
    const gameUrl = "https://www.tetrisretro.com/"; // Reemplaza con la URL real de tu juego 
    const text = `I scored ${finalScore} points (${finalLines} lines) in Retro Tetris! Can you beat my score? 🧊 #RetroTetris #BuildingInPublic`; [cite: 164]
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(text)}`; [cite: 164]
    window.open(twitterUrl, '_blank'); [cite: 165]
}

function shareToWhatsApp() { [cite: 165]
    const finalScore = finalScoreDisplay.textContent; [cite: 165]
    const finalLines = finalLinesDisplay.textContent; [cite: 166]
    const gameUrl = "https://www.tetrisretro.com/"; // Reemplaza con la URL real de tu juego 
    const text = `I scored ${finalScore} points (${finalLines} lines) in Retro Tetris! Can you beat my score? 🧊\n\nPlay here: ${gameUrl}`; [cite: 166]
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`; [cite: 167]
    window.open(whatsappUrl, '_blank'); [cite: 167]
}

// --- INICIALIZACIÓN ---
async function initialLoad() { [cite: 167]
    const gameArea = document.getElementById('game-area'); [cite: 168]
    // Ajustar el tamaño del canvas principal para el juego
    canvas.width = COLS * BLOCK_SIZE; [cite: 169]
    canvas.height = ROWS * BLOCK_SIZE; [cite: 169]

    // Asegurar que el nextPieceCanvas tenga el tamaño correcto
    nextPieceCanvas.width = NEXT_COLS * NEXT_PIECE_BLOCK_SIZE;
    nextPieceCanvas.height = NEXT_ROWS * NEXT_PIECE_BLOCK_SIZE;

    const savedMuteState = localStorage.getItem('gameMuted'); [cite: 169]
    if (savedMuteState === 'true') { [cite: 170]
        isMuted = true; [cite: 170]
        backgroundMusic.muted = true; [cite: 170]
        muteBtn.textContent = '🔇'; [cite: 170]
    }

    try { [cite: 171]
        const board = await getLeaderboard(); [cite: 171]
        renderLeaderboard(board); [cite: 171]
    } catch (e) { [cite: 171]
        console.error("No se pudo cargar el leaderboard. Asegúrate de que las reglas de seguridad e índices de Firestore estén configurados.", e); [cite: 172]
        leaderboardList.innerHTML = '<li>Error: No se pudo cargar el leaderboard. Revisa la consola (F12) para más detalles.</li>'; [cite: 172]
    }

    updatePlayCount(true); // Cargar el contador de jugadas al inicio 

    // Mostrar el overlay y el botón de inicio si no hay usuario logueado o si no está en un estado de juego activo
    if (!auth.currentUser) {
        loginScreen.style.display = 'flex';
        messageOverlay.style.display = 'flex';
        startButton.style.display = 'none';
        messageText.textContent = 'Sign in to play!';
    } else {
        userProfile.style.display = 'flex';
        messageOverlay.style.display = 'flex';
        startButton.style.display = 'block';
        messageText.textContent = 'Face Control (Press START GAME)';
    }

    // Render the correct leaderboard initially based on active class or cached region
    const initialRegion = localStorage.getItem('userRegion');
    if (initialRegion) {
        regionalBtn.disabled = false;
        // Optionally, make regional default if a region is found
        // regionalBtn.classList.add('active');
        // globalBtn.classList.remove('active');
        // renderLeaderboard(await getLeaderboard(initialRegion));
    }
     renderLeaderboard(await getLeaderboard('global')); // Always start with global leaderboard
}


// Event Listeners
loginBtn.addEventListener('click', signInWithGoogle); [cite: 173]
logoutBtn.addEventListener('click', signOut); [cite: 173]
startButton.addEventListener('click', startGame); [cite: 173]
playAgainBtn.addEventListener('click', startGame); [cite: 174]
lobbyBtn.addEventListener('click', showLobby); [cite: 174]
muteBtn.addEventListener('click', toggleMute); [cite: 174]
twitterShareBtn.addEventListener('click', shareToTwitter); [cite: 174]
whatsappShareBtn.addEventListener('click', shareToWhatsApp); [cite: 174]

globalBtn.addEventListener('click', async () => { [cite: 174]
    regionalBtn.classList.remove('active'); [cite: 175]
    globalBtn.classList.add('active'); [cite: 175]
    renderLeaderboard(await getLeaderboard('global')); [cite: 175]
});

regionalBtn.addEventListener('click', async () => { [cite: 175]
    if (regionalBtn.disabled) { [cite: 175]
        alert("You need to play a game first for your region to be detected and saved."); [cite: 175]
        return; [cite: 175]
    }
    const region = currentUserRegion || localStorage.getItem('userRegion'); [cite: 175]
    if (region) { [cite: 175]
        globalBtn.classList.remove('active'); [cite: 175]
        regionalBtn.classList.add('active'); [cite: 175]
        renderLeaderboard(await getLeaderboard(region)); [cite: 176]
    } else { [cite: 176]
        alert("Your region is not yet configured. Play a game first to enable the regional leaderboard."); [cite: 176]
    }
});

document.addEventListener('DOMContentLoaded', initialLoad); [cite: 177]

window.addEventListener('resize', () => { [cite: 177]
    const gameArea = document.getElementById('game-area'); [cite: 177]
    // const size = Math.min(gameArea.clientWidth, gameArea.clientHeight * 2); // Esta línea original de tu código causaba un cálculo de tamaño que no es ideal para Tetris 
    canvas.width = COLS * BLOCK_SIZE; [cite: 178]
    canvas.height = ROWS * BLOCK_SIZE; [cite: 178]
    nextPieceCanvas.width = NEXT_COLS * NEXT_PIECE_BLOCK_SIZE;
    nextPieceCanvas.height = NEXT_ROWS * NEXT_PIECE_BLOCK_SIZE;
    draw(); [cite: 178]
    drawNextPiece();
});
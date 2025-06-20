// --- Configuración ---
// MAKE SURE TO REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBpAWJ6ZVO5oLfyLpC8cZNdiTk6lt1-HFo",
    authDomain: "profile-minigame.firebaseapp.com",
    projectId: "profile-minigame",
    storageBucket: "profile-minigame.appspot.com",
    messagingSenderId: "735696613558",
    appId: "1:735696613558:web:2e00a498dbd0a94552f617",
    measurementId: "G-44R9BSN7CQ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// MAKE SURE TO REPLACE WITH YOUR ACTUAL EMAILJS CONFIG
const EMAILJS_USER_ID = 'PMOEIYlzOvdOcA2l5';
const EMAILJS_SERVICE_ID = 'service_lk8e0nv';
const EMAILJS_TEMPLATE_ID = 'template_xjhieh3';
emailjs.init(EMAILJS_USER_ID);

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
const loginScreen = document.getElementById('loginScreen');
const userProfile = document.getElementById('userProfile');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');

const startBtn = document.getElementById('startBtn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const linesDisplay = document.getElementById('linesDisplay');
const playCounterDisplay = document.getElementById('playCounterDisplay');
const leaderboardList = document.getElementById('leaderboardList');

const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const finalLinesDisplay = document.getElementById('finalLinesDisplay');
const playAgainBtn = document.getElementById('playAgainBtn');
const lobbyBtn = document.getElementById('lobbyBtn');
const muteBtn = document.getElementById('muteBtn');

const twitterShareBtn = document.getElementById('twitterShareBtn');
const whatsappShareBtn = document.getElementById('whatsappShareBtn');

const globalBtn = document.getElementById('globalBtn');
const regionalBtn = document.getElementById('regionalBtn');

// --- Elementos para control facial ---
const videoElement = document.getElementById('inputVideo');
const messageOverlay = document.getElementById('messageOverlay');
const messageText = document.getElementById('messageText');
const startButton = document.getElementById('startButton');

// --- Variables del Juego ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_COLS = 4;
const NEXT_ROWS = 4;

let board = createMatrix(COLS, ROWS);
let nextPieceBoard = createMatrix(NEXT_COLS, NEXT_ROWS);
let piece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameInterval = null;
let dropInterval = null;
let isMuted = false;
let currentUserRegion = null;
let gameState = 'INITIAL';
let elapsedTimeInSeconds = 0;

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
auth.onAuthStateChanged(async (user) => {
    const isGameActiveState = (gameState === 'PLAYING' || gameState === 'CALIBRATING' || gameState === 'STARTING_CAMERA' || gameState === 'POST_CALIBRATION_DELAY');

    if (user) {
        loginScreen.style.display = 'none';
        userProfile.style.display = 'flex';
        userName.textContent = user.displayName;
        userAvatar.src = user.photoURL;
        
        await fetchUserRegion(user.uid);

        if (!isGameActiveState) {
            messageOverlay.style.display = 'flex';
            startButton.style.display = 'block';
            startButton.disabled = false;
            messageText.textContent = 'Face Control';
        }
    } else {
        userProfile.style.display = 'none';
        loginScreen.style.display = 'flex';
        
        messageOverlay.style.display = 'flex';
        startButton.style.display = 'none';
        startButton.disabled = true;
        messageText.textContent = 'Sign in to play!';
        
        regionalBtn.disabled = true;
        currentUserRegion = null;
        stopCameraAndFaceMesh();
        gameState = 'INITIAL';
    }
});

async function fetchUserRegion(uid) {
    try {
        const playerDoc = await db.collection('leaderboards').doc('global').collection('scores').doc(uid).get();
        if (playerDoc.exists && playerDoc.data().countryCode) {
            currentUserRegion = playerDoc.data().countryCode.toLowerCase();
            localStorage.setItem('userRegion', currentUserRegion);
            regionalBtn.disabled = false;
        } else {
            regionalBtn.disabled = true;
        }
    } catch (error) {
        console.error("Error al buscar la región del usuario:", error);
        regionalBtn.disabled = true;
    }
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Error during sign-in:", error);
    });
}

function signOut() {
    auth.signOut();
}

// --- Funciones de Flujo del Juego ---
function showLobby() {
    gameOverScreen.classList.remove('visible');
    stopCameraAndFaceMesh();
    gameState = 'INITIAL';
    messageOverlay.style.display = 'flex';
    startButton.style.display = 'block';
    startButton.disabled = false;
    messageText.textContent = 'Face Control';
    
    if (auth.currentUser) {
        logoutBtn.disabled = false;
    }
    
    renderLeaderboard(globalBtn.classList.contains('active') ? 'global' : currentUserRegion);
}

function startGame() {
    if (!auth.currentUser) {
        alert("You must be signed in to play.");
        return;
    }
    
    logoutBtn.disabled = true;

    if (!isMuted && backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.error("Audio autoplay was blocked by browser.", e));
    }
    
    setupCameraAndFaceMesh();
}

function runGame() {
    if (gameInterval) clearInterval(gameInterval);
    if (dropInterval) clearInterval(dropInterval);
    
    gameOverScreen.classList.remove('visible');
    messageOverlay.style.display = 'none';
    
    elapsedTimeInSeconds = 0;
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
    
    updatePlayCount();
    draw();
}

function initiateGameOverSequence() {
    if (!gameInterval) return;
    gameOverSound.play();
    clearInterval(gameInterval);
    clearInterval(dropInterval);
    gameInterval = null;
    
    stopCameraAndFaceMesh();
    
    canvas.classList.add('game-over');
    setTimeout(() => {
        canvas.classList.remove('game-over');
        logoutBtn.disabled = false;
        processEndOfGame();
        finalScoreDisplay.textContent = score;
        finalLinesDisplay.textContent = lines;
        gameOverScreen.classList.add('visible');
        gameState = 'GAME_OVER';
    }, 600);
}

function stopCameraAndFaceMesh() {
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
    videoElement.style.display = 'none';
}

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
        pos: {x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0}
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
    // Clear the next piece board
    nextPieceBoard.forEach(row => row.fill(0));
    
    // Draw the next piece
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextPieceBoard[y][x] = nextPiece.color;
            }
        });
    });
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    drawMatrix(board, {x: 0, y: 0});
    
    // Draw current piece
    drawMatrix(piece.shape, piece.pos, piece.color);
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
            if (piece.shape[y][x] &&
                (board[y + piece.pos.y] === undefined ||
                 board[y + piece.pos.y][x + piece.pos.x] === undefined ||
                 board[y + piece.pos.y][x + piece.pos.x])) {
                return true;
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
    const originalPos = {...piece.pos};
    
    // Transpose matrix
    piece.shape = piece.shape[0].map((_, i) => 
        piece.shape.map(row => row[i])
    );
    
    // Reverse each row to get a 90-degree rotation
    piece.shape.forEach(row => row.reverse());
    
    // If rotation causes collision, try wall kicks
    if (collision()) {
        // Try moving left
        piece.pos.x -= 1;
        if (collision()) {
            // Try moving right
            piece.pos.x += 2;
            if (collision()) {
                // Revert rotation
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
        
        // Remove the line
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++; // Check the same row again
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        updateScore(linesCleared);
        clearSound.play();
    }
}

function updateScore(linesCleared = 0) {
    // Scoring system based on original Tetris
    const points = [0, 40, 100, 300, 1200][linesCleared] * level;
    score += points;
    lines += linesCleared;
    
    // Level up every 10 lines
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        clearInterval(dropInterval);
        dropInterval = setInterval(dropPiece, 1000 - (level * 50));
    }
    
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    linesDisplay.textContent = `Lines: ${lines}`;
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
        case ' ':
            hardDrop();
            break;
    }
    draw();
});

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

// --- Control Facial (MediaPipe FaceMesh) ---
function onFaceResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const noseTip = landmarks[4];

    if (!noseTip) return;

    const noseX = noseTip.x;
    const noseY = noseTip.y;

    if (gameState === 'CALIBRATING' && !isCalibrated) {
        calibratedNose = { x: noseX, y: noseY };
        isCalibrated = true;
        gameState = 'POST_CALIBRATION_DELAY';
        messageText.textContent = 'Calibrated! Get Ready...';
        messageOverlay.style.display = 'flex';

        setTimeout(() => {
            if (gameState === 'POST_CALIBRATION_DELAY') {
                gameState = 'PLAYING';
                messageOverlay.style.display = 'none';
                runGame();
            }
        }, 1500);
    } else if (gameState === 'PLAYING' && isCalibrated) {
        const diffX = noseX - calibratedNose.x;
        const diffY = noseY - calibratedNose.y;

        if (Math.abs(diffX) > Math.abs(diffY) {
            if (diffX > NOSE_SENSITIVITY) {
                movePiece(1);
            } else if (diffX < -NOSE_SENSITIVITY) {
                movePiece(-1);
            }
        } else {
            if (diffY < -NOSE_SENSITIVITY) {
                rotate();
            } else if (diffY > NOSE_SENSITIVITY) {
                hardDrop();
            }
        }
        draw();
    }
}

async function setupCameraAndFaceMesh() {
    gameState = 'STARTING_CAMERA';
    messageText.textContent = 'Starting camera...';
    startButton.style.display = 'none';
    messageOverlay.style.display = 'flex';
    
    stopCameraAndFaceMesh();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 320 },
                height: { ideal: 240 },
                facingMode: 'user'
            }
        });
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';

        await videoElement.play();

        if (!window.FaceMesh) {
            messageText.textContent = 'Error: FaceMesh library not loaded. Check CDN link.';
            console.error('FaceMesh library not loaded.');
            gameState = 'INITIAL';
            startButton.style.display = 'block';
            return;
        }

        if (!faceMesh) {
            faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            faceMesh.onResults(onFaceResults);
        }

        processVideoFrame();
        gameState = 'CALIBRATING';
        isCalibrated = false;
        messageText.textContent = 'Look straight at the camera to calibrate.';

    } catch (err) {
        console.error("Fallo al acceder a la cámara o configurar FaceMesh:", err);
        messageText.textContent = 'Error: Camera access denied or not available. Allow permission & refresh.';
        startButton.style.display = 'block';
        messageOverlay.style.display = 'flex';
        gameState = 'INITIAL';
        videoElement.style.display = 'none';
    }
}

// --- Lógica Central de Fin de Partida ---
async function processEndOfGame() {
    const user = auth.currentUser;
    if (!user) return;

    const { displayName: name, uid, photoURL, email } = user;
    const currentScore = score;
    const currentLines = lines;
    const time = elapsedTimeInSeconds;
    let locationData;

    try {
        const response = await fetch('https://ipapi.co/json/');
        locationData = response.ok ? await response.json() : { country_name: 'N/A', country_code: 'N/A', ip: 'N/A' };
    } catch (error) {
        console.warn('Fallo en la búsqueda de IP.', error);
        locationData = { country_name: 'N/A', country_code: 'N/A', ip: 'N/A' };
    }

    const country = locationData.country_name;
    const countryCode = locationData.country_code;

    if (countryCode && countryCode !== 'N/A') {
        currentUserRegion = countryCode.toLowerCase();
        localStorage.setItem('userRegion', currentUserRegion);
        regionalBtn.disabled = false;
    }

    const boardBeforeUpdate = await getLeaderboard();
    const seenCountriesDoc = await db.collection('gameStats').doc('seenCountries').get();
    const seenCountries = seenCountriesDoc.exists ? seenCountriesDoc.data().list : [];

    await addScoreToLeaderboard(uid, name, photoURL, currentScore, currentLines, country, countryCode, time, email);

    const regionToDisplay = regionalBtn.classList.contains('active') && currentUserRegion ? currentUserRegion : 'global';
    const updatedBoard = await getLeaderboard(regionToDisplay);
    renderLeaderboard(updatedBoard);

    sendSmartNotification(name, currentScore, country, boardBeforeUpdate, updatedBoard, seenCountries, locationData);
}

// --- Funciones de Firebase ---
async function updatePlayCount(isInitialLoad = false) {
    const counterRef = db.collection('gameStats').doc('playCounter');
    try {
        if (!isInitialLoad) {
            await counterRef.update({ count: firebase.firestore.FieldValue.increment(1) });
        }
        const doc = await counterRef.get();
        const count = doc.exists ? doc.data().count : 0;
        playCounterDisplay.textContent = `Plays: ${count.toLocaleString('en-US')}`;
    } catch (error) {
        if (error.code === 'not-found') {
            const startCount = isInitialLoad ? 0 : 1;
            await counterRef.set({ count: startCount });
            playCounterDisplay.textContent = `Plays: ${startCount}`;
        } else {
            console.error("Error with play counter:", error);
            playCounterDisplay.textContent = 'Plays: N/A';
        }
    }
}

async function getLeaderboard(region = 'global') {
    const leaderboardRef = db.collection('leaderboards').doc(region).collection('scores').orderBy('score', 'desc').orderBy('lines', 'desc').limit(100);
    const snapshot = await leaderboardRef.get();
    const board = [];
    snapshot.forEach(doc => {
        board.push({ id: doc.id, ...doc.data() });
    });
    return board;
}

async function addScoreToLeaderboard(uid, name, photoURL, newScore, lines, country, countryCode, time, email) {
    const playerData = { name, photoURL, score: newScore, lines, country, countryCode, time, email };

    const updateLogic = async (ref) => {
        const doc = await ref.get();
        if (!doc.exists || newScore > doc.data().score || (newScore === doc.data().score && lines > doc.data().lines)) {
            await ref.set(playerData);
        }
    };

    const globalPlayerRef = db.collection('leaderboards').doc('global').collection('scores').doc(uid);
    await updateLogic(globalPlayerRef);

    if (countryCode && countryCode !== 'N/A') {
        const regionalPlayerRef = db.collection('leaderboards').doc(countryCode.toLowerCase()).collection('scores').doc(uid);
        await updateLogic(regionalPlayerRef);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function renderLeaderboard(board) {
    leaderboardList.innerHTML = '';
    if (!board || board.length === 0) {
        leaderboardList.innerHTML = '<li>No scores yet.</li>';
        return;
    }

    board.forEach((entry, index) => {
        const li = document.createElement('li');
        
        const rankSpan = document.createElement('span');
        rankSpan.className = 'leaderboard-rank';
        rankSpan.textContent = `${index + 1}.`;
        
        const entryDiv = document.createElement('div');
        entryDiv.className = 'leaderboard-entry';

        const playerImg = document.createElement('img');
        playerImg.className = 'leaderboard-avatar';
        playerImg.src = entry.photoURL || 'https://i.imgur.com/sC5gU4e.png';
        entryDiv.appendChild(playerImg);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'leaderboard-details';

        const playerDiv = document.createElement('div');
        playerDiv.className = 'leaderboard-player';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'leaderboard-player-name';
        nameSpan.textContent = entry.name || 'Anonymous';
        playerDiv.appendChild(nameSpan);

        if (entry.countryCode && entry.countryCode !== 'N/A' && entry.countryCode.length === 2) {
            const flagImg = document.createElement('img');
            flagImg.className = 'leaderboard-flag';
            flagImg.src = `https://flagcdn.com/w20/${entry.countryCode.toLowerCase()}.png`;
            flagImg.alt = entry.country;
            flagImg.title = entry.country;
            playerDiv.appendChild(flagImg);
        }
        
        detailsDiv.appendChild(playerDiv);

        const statsSpan = document.createElement('span');
        statsSpan.className = 'leaderboard-stats';
        const timeDisplayValue = entry.time !== undefined ? ` in ${formatTime(entry.time)}` : '';
        statsSpan.textContent = `Score: ${entry.score || 0} (${entry.lines || 0} lines)${timeDisplayValue}`;
        detailsDiv.appendChild(statsSpan);

        entryDiv.appendChild(detailsDiv);
        li.appendChild(rankSpan);
        li.appendChild(entryDiv);
        leaderboardList.appendChild(li);
    });
}

// --- ENVÍO DE CORREO (EmailJS) ---
async function sendSmartNotification(name, currentScore, country, boardBefore, boardAfter, seenCountries, locationData) {
    if (currentScore === 0) { console.log("Score is 0, no notification sent."); return; }

    let shouldSendEmail = false;
    let emailReason = "";

    if (country && country !== 'N/A' && !seenCountries.includes(country)) {
        shouldSendEmail = true;
        emailReason = `New Country: ${country}!`;
        try {
            const seenCountriesRef = db.collection('gameStats').doc('seenCountries');
            await seenCountriesRef.update({ list: firebase.firestore.FieldValue.arrayUnion(country) });
        } catch (error) {
            if (error.code === 'not-found') {
                await db.collection('gameStats').doc('seenCountries').set({ list: [country] });
            } else {
                console.error("Error updating seenCountries:", error);
            }
        }
    }

    const oldIndex = boardBefore.findIndex(p => p.id === auth.currentUser.uid);
    const newIndex = boardAfter.findIndex(p => p.id === auth.currentUser.uid);
    const enteredTop5 = newIndex !== -1 && newIndex < 5 && (oldIndex === -1 || oldIndex >= 5);

    if (enteredTop5 && !shouldSendEmail) {
        shouldSendEmail = true;
        emailReason = `Entered Top 5 at #${newIndex + 1}!`;
    }

    if (!shouldSendEmail) {
        console.log("Condiciones para la notificación no cumplidas.");
        return;
    }

    const params = {
        player_name: `${name} (${emailReason})`,
        player_score: currentScore,
        player_ip: locationData.ip || "Unknown",
        player_country: country
    };

    console.log('Enviando notificación inteligente con estos parámetros:', params);
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
        .then(() => console.log("Notificación inteligente enviada con éxito!"))
        .catch(err => console.error("Fallo de envío de EmailJS:", err));
}

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

function shareToTwitter() {
    const finalScore = finalScoreDisplay.textContent;
    const finalLines = finalLinesDisplay.textContent;
    const gameUrl = "https://www.tetrisretro.com/";
    const text = `I scored ${finalScore} points (${finalLines} lines) in Retro Tetris! Can you beat my score? 🧊 #RetroTetris #BuildingInPublic`;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
}

function shareToWhatsApp() {
    const finalScore = finalScoreDisplay.textContent;
    const finalLines = finalLinesDisplay.textContent;
    const gameUrl = "https://www.tetrisretro.com/";
    const text = `I scored ${finalScore} points (${finalLines} lines) in Retro Tetris! Can you beat my score? 🧊\n\nPlay here: ${gameUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// --- INICIALIZACIÓN ---
async function initialLoad() {
    const gameArea = document.getElementById('game-area');
    const size = Math.min(gameArea.clientWidth, gameArea.clientHeight * 2); // Tetris is taller than wide
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    const savedMuteState = localStorage.getItem('gameMuted');
    if (savedMuteState === 'true') {
        isMuted = true;
        backgroundMusic.muted = true;
        muteBtn.textContent = '🔇';
    }

    try {
        const board = await getLeaderboard();
        renderLeaderboard(board);
    } catch(e) {
        console.error("No se pudo cargar el leaderboard. Asegúrate de que las reglas de seguridad e índices de Firestore estén configurados.", e);
        leaderboardList.innerHTML = '<li>Error: No se pudo cargar el leaderboard. Revisa la consola (F12) para más detalles.</li>';
    }
    
    updatePlayCount(true);
}

// Event Listeners
loginBtn.addEventListener('click', signInWithGoogle);
logoutBtn.addEventListener('click', signOut);
startButton.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);
lobbyBtn.addEventListener('click', showLobby);
muteBtn.addEventListener('click', toggleMute);
twitterShareBtn.addEventListener('click', shareToTwitter);
whatsappShareBtn.addEventListener('click', shareToWhatsApp);

globalBtn.addEventListener('click', async () => {
    regionalBtn.classList.remove('active');
    globalBtn.classList.add('active');
    renderLeaderboard(await getLeaderboard('global'));
});

regionalBtn.addEventListener('click', async () => {
    if (regionalBtn.disabled) { 
        alert("Necesitas jugar una partida primero para que tu región sea detectada y guardada."); 
        return; 
    }
    const region = currentUserRegion || localStorage.getItem('userRegion');
    if (region) {
        globalBtn.classList.remove('active');
        regionalBtn.classList.add('active');
        renderLeaderboard(await getLeaderboard(region));
    } else {
        alert("Tu región aún no está configurada. Juega una partida primero para habilitar el leaderboard regional.");
    }
});

document.addEventListener('DOMContentLoaded', initialLoad);

window.addEventListener('resize', () => {
    const gameArea = document.getElementById('game-area');
    const size = Math.min(gameArea.clientWidth, gameArea.clientHeight * 2);
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    draw();
});
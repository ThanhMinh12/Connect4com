require('dotenv').config();
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const shareSession = require('express-socket.io-session');
const db = require('./config/db');
const app = express();
const server = http.createServer(app);
const { v4: uuidv4 } = require("uuid");

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

app.use(express.json());
app.use(sessionMiddleware);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use(shareSession(sessionMiddleware, {
  autoSave: true
}));

// Game logic
const rooms = {};
const games = {};
const matchmakingQueue = [];
const socketToUser = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.session.userId;
  socketToUser[socket.id] = userId;
  console.log(`User ${userId || 'anonymous'} connected with socket ID: ${socket.id}`);

  socket.on("createRoom", () => {
    const roomId = uuidv4();
    socket.emit("roomCreated", roomId);
  });
  
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { sockets: [], red: null, yellow: null };
    }
    if (!rooms[roomId].sockets.includes(socket.id)) {
      rooms[roomId].sockets.push(socket.id);
      if (!rooms[roomId].red) {
        rooms[roomId].red = userId;
      } else if (!rooms[roomId].yellow && rooms[roomId].red !== userId) {
        rooms[roomId].yellow = userId;
      }
    }
    let playerRole = null;
    if (rooms[roomId].red === userId) playerRole = 'red';
    else if (rooms[roomId].yellow === userId) playerRole = 'yellow';
    socket.emit("playerRole", playerRole);

    if (!games[roomId]) {
      games[roomId] = {
        board: Array.from({ length: 6 }, () => Array(7).fill(null)),
        currentPlayer: 'red',
        winner: null
      };
    }
    socket.emit("gameState", games[roomId]);
    io.to(roomId).emit("roomUpdate", rooms[roomId].sockets);
  });

    socket.on("move", ({ roomId, col }) => {
    const game = games[roomId];
    const room = rooms[roomId];
    if (!game || game.winner) return;
    let playerColor = null;
    if (room.red === userId) playerColor = 'red';
    else if (room.yellow === userId) playerColor = 'yellow';
    if (!playerColor || game.currentPlayer !== playerColor) return;

    let row = -1;
    for (let r = game.board.length - 1; r >= 0; r--) {
      if (!game.board[r][col]) {
        row = r;
        break;
      }
    }
    if (row === -1) return;

    game.board[row][col] = playerColor;
    game.winner = checkWinner(game.board);
    game.currentPlayer = playerColor === 'red' ? 'yellow' : 'red';

    io.to(roomId).emit("gameState", game);

    if (game.winner) {
      const winnerId = game.winner === 'red' ? room.red : room.yellow;
      const loserId = game.winner === 'red' ? room.yellow : room.red;
      handleGameOver(roomId, winnerId, loserId);
    }
  });


  socket.on("restart", (roomId) => {
    if (!rooms[roomId]) return;

    const isPlayer = rooms[roomId].red === socket.id || rooms[roomId].yellow === socket.id;
    if (!isPlayer) return;

    games[roomId] = {
      board: Array.from({ length: 6 }, () => Array(7).fill(null)),
      currentPlayer: 'red',
      winner: null
    };
    io.to(roomId).emit("gameState", games[roomId]);
  });

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
    for (const [roomId, roomData] of Object.entries(rooms)) {
      const { sockets, red, yellow } = roomData;
      const index = sockets.indexOf(socket.id);

      if (index !== -1) {
        sockets.splice(index, 1);
        if (red === userId) rooms[roomId].red = null;
        if (yellow === userId) rooms[roomId].yellow = null;

        io.to(roomId).emit("roomUpdate", sockets);
        console.log(`User ${userId} left room ${roomId}`);
        if (sockets.length === 0) {
          delete rooms[roomId];
          delete games[roomId];
          console.log(`Room ${roomId} removed`);
        }
      }
    }
  });

  socket.on("playOnline", () => {
    const userId = socket.handshake.session.userId;
    if (!userId) return;
    if (matchmakingQueue.length > 0) {
      const opponentSocket = matchmakingQueue.shift();
      const roomId = `room-${Date.now()}`;
      socket.join(roomId);
      opponentSocket.join(roomId);
      io.to(roomId).emit("matchFound", { roomId });
      rooms[roomId] = [socket.id, opponentSocket.id];
    } 
    else {
      matchmakingQueue.push(socket);
    }
  });

  socket.on("gameOver", async ({ roomId, winnerId, loserId }) => {
    console.log(`[Server] Received gameOver event: ${winnerId} beat ${loserId}`);
    const [winnerElo, loserElo] = await getEloFromDB(winnerId, loserId);
    const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

    await updateEloInDB(winnerId, newWinnerElo);
    await updateEloInDB(loserId, newLoserElo);

    // Insert into match history
    await db.query(`INSERT INTO matches (player1_id, player2_id, winner_id)
                    VALUES ($1, $2, $3)`, [winnerId, loserId, winnerId]);

    io.to(roomId).emit("eloUpdate", {
      winnerId, newWinnerElo,
      loserId, newLoserElo
    });
  });
});

async function handleGameOver(roomId, winnerId, loserId) {
  console.log(`[Server] Game over: ${winnerId} beat ${loserId}`);

  const [winnerElo, loserElo] = await getEloFromDB(winnerId, loserId);
  const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

  await updateEloInDB(winnerId, newWinnerElo);
  await updateEloInDB(loserId, newLoserElo);

  await db.query(`INSERT INTO matches (player1_id, player2_id, winner_id)
                  VALUES ($1, $2, $3)`, [winnerId, loserId, winnerId]);

  io.to(roomId).emit("eloUpdate", {
    winnerId, newWinnerElo,
    loserId, newLoserElo
  });
}

function checkWinner(board) {
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 }
  ];
  const rows = board.length;
  const cols = board[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const player = board[r][c];
      if (!player) continue;
      for (const { x, y } of directions) {
        let count = 1;
        for (let step = 1; step < 4; step++) {
          const nr = r + step * y;
          const nc = c + step * x;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || board[nr][nc] !== player) {
            break;
          }
          count++;
        }
        if (count === 4) return player;
      }
    }
  }
  return null;
}

function calculateElo(winnerElo, loserElo, k = 69) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLose = 1 - expectedWin;
  const newWinnerElo = Math.round(winnerElo + k * (1 - expectedWin));
  const newLoserElo = Math.round(loserElo + k * (0 - expectedLose));
  return { newWinnerElo, newLoserElo };
}

async function getEloFromDB(winnerId, loserId) {
  const res = await db.query(
    "SELECT id, elo FROM users WHERE id = $1 OR id = $2",
    [winnerId, loserId]
  );
  const elos = {};
  for (const row of res.rows) {
    elos[row.id] = row.elo;
  }
  return [elos[winnerId], elos[loserId]];
}

async function updateEloInDB(userId, newElo) {
  await db.query(
    "update users set elo = $1 where id = $2",
    [newElo, userId]
  );
}

// Routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => res.send('Backend is running 😊'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

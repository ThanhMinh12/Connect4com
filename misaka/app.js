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
app.set("trust proxy", 1);
const server = http.createServer(app);
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pgSession = require("connect-pg-simple")(session);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: true
}));

const sessionMiddleware = session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
  }),
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(express.json());
app.use(sessionMiddleware);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Share session data between Express and Socket.IO
io.use(shareSession(sessionMiddleware, {
  autoSave: true
}));

const rooms = {};  // Stores rooms: {{sockets1, red1, yellow1}, {sockets2, red2, yellow2}, ...}
const games = {};  // Stores games: {{board1, currentPlayer1, winner1}, {board2, currentPlayer2, winner2}, ...}
const matchmakingQueue = [];  // Queue of waiting sockets
const socketToUser = {};  // Map <socketId, userId>

io.on("connection", (socket) => {
  const userId = socket.handshake.session.userId;
  if (!userId) {
    socket.emit("needLogin");
    return;
  }
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
    // Determine the role
    let playerRole = null;
    if (rooms[roomId].red === userId) playerRole = 'red';
    else if (rooms[roomId].yellow === userId) playerRole = 'yellow';
    socket.emit("playerRole", playerRole);

    // Initialize the state
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
    if (!game || game.winner) {
      return;
    }
    let playerColor = null;
    if (room.red === userId) {
      playerColor = 'red';
    }
    else if (room.yellow === userId) {
      playerColor = 'yellow';
    }
    if (!playerColor || game.currentPlayer !== playerColor) {
      return;
    }

    // Find lowest empty cell in the column
    let row = -1;
    for (let r = game.board.length - 1; r >= 0; r--) {
      if (!game.board[r][col]) {
        row = r;
        break;
      }
    }
    if (row === -1) {
      return;
    }


    // Update board
    game.board[row][col] = playerColor;
    game.winner = checkWinner(game.board);

    // Switch turn
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

    const isPlayer = rooms[roomId].red === userId || rooms[roomId].yellow === userId;
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
    const queueIndex = matchmakingQueue.indexOf(socket);
    if (queueIndex !== -1) {
      console.log(`Removing disconnected user from matchmaking queue`);
      matchmakingQueue.splice(queueIndex, 1);
    }
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

  socket.on("playOnline", (userId) => {
    console.log(`[MATCHMAKING] User ${userId} wants to play online`);
    console.log(`[MATCHMAKING] Queue length before: ${matchmakingQueue.length}`);
    if (!userId) {
      console.log("[MATCHMAKING] No userId provided, ignoring request");
      return;
    }
    const alreadyInQueue = matchmakingQueue.some(s => socketToUser[s.id] === userId);
      if (alreadyInQueue) {
      console.log(`[MATCHMAKING] User ${userId} already in queue, ignoring duplicate request`);
      return;
    }
    if (matchmakingQueue.length > 0) {
      const opponentSocket = matchmakingQueue.shift();
      const opponentId = socketToUser[opponentSocket.id];
      console.log(`[MATCHMAKING] Found opponent ${opponentId}, creating room`);
      const roomId = uuidv4();
      if (!io.sockets.sockets.has(socket.id) || !io.sockets.sockets.has(opponentSocket.id)) {
        console.log(`[MATCHMAKING] One player disconnected during matching, aborting`);
        if (io.sockets.sockets.has(socket.id)) matchmakingQueue.push(socket);
        if (io.sockets.sockets.has(opponentSocket.id)) matchmakingQueue.push(opponentSocket);
        return;
      }
      socket.join(roomId);
      opponentSocket.join(roomId);
      console.log(`[MATCHMAKING] Emitting matchFound for room ${roomId}`);
      rooms[roomId] = { sockets: [], red: null, yellow: null };
      rooms[roomId].sockets.push(socket.id, opponentSocket.id);
      rooms[roomId].red = userId;
      rooms[roomId].yellow = socketToUser[opponentSocket.id];
      games[roomId] = {
        board: Array.from({ length: 6 }, () => Array(7).fill(null)),
        currentPlayer: 'red',
        winner: null
      };
      io.to(roomId).emit("gameState", games[roomId]);
      socket.emit("matchFound", roomId);
      opponentSocket.emit("matchFound", roomId);
    } else {
      console.log(`[MATCHMAKING] No opponent available, adding to queue. Queue length: 1`);
      matchmakingQueue.push(socket);
    }
  });

  socket.on("gameOver", async ({ roomId, winnerId, loserId }) => {
    console.log(`[Server] Received gameOver event: ${winnerId} beat ${loserId}`);
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
  });
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId] && rooms[roomId].sockets) {
      const otherSocketId = rooms[roomId].sockets.find(id => id !== socket.id);
      if (otherSocketId) {
        io.to(otherSocketId).emit("opponentLeft");
      }
    }
    if (rooms[roomId]) {
      rooms[roomId].sockets = rooms[roomId].sockets.filter(id => id !== socket.id);
      if (rooms[roomId].red === userId) {
        rooms[roomId].red = null;
      }
      if (rooms[roomId].yellow === userId) {
        rooms[roomId].yellow = null;
      }

      if (rooms[roomId].sockets.length === 0) {
        delete rooms[roomId];
        delete games[roomId];
      }
    }
  });
  socket.on("leaveQueue", () => {
    const index = matchmakingQueue.indexOf(socket);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`[MATCHMAKING] User ${userId} left the queue`);
    }
  })
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

app.use('/auth', authRoutes);

app.get('/', (req, res) => res.send('Backend is running 😊'));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const EMPTY = null;
const MAX_DEPTH = {
  easy: 2,
  medium: 4,
  hard: 6,
};
const SCORE_PATTERNS = {
  4: 100000,
  3: 100,
  2: 10,
  1: 1
};

function makeBotMove(board, botColor, difficulty = 'hard') {
  const depth = MAX_DEPTH[difficulty];
  const playerColor = botColor === 'red' ? 'yellow' : 'red';
  const validMoves = getValidMoves(board);
  
  if (validMoves.length === 1) {
    return validMoves[0];
  }
  
  let bestScore = -Infinity;
  let bestMove = validMoves[0];
  let alpha = -Infinity;
  let beta = Infinity;
  
  for (const move of validMoves) {
    const newBoard = makeMove(board, move, botColor);
    
    const score = minimax(newBoard, depth - 1, alpha, beta, false, botColor, playerColor);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    
    alpha = Math.max(alpha, bestScore);
  }
  
  return bestMove;
}
function minimax(board, depth, alpha, beta, isMaximizing, botColor, playerColor) {
  const winner = checkWinner(board);
  if (winner === botColor) return 10000;
  if (winner === playerColor) return -10000;
  if (isBoardFull(board) || depth === 0) {
    return evaluateBoard(board, botColor);
  }
  
  const validMoves = getValidMoves(board);
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, move, botColor);
      const score = minimax(newBoard, depth - 1, alpha, beta, false, botColor, playerColor);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, move, playerColor);
      const score = minimax(newBoard, depth - 1, alpha, beta, true, botColor, playerColor);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, minScore);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}


function evaluateBoard(board, botColor) {
  const playerColor = botColor === 'red' ? 'yellow' : 'red';
  
  let score = 0;
  
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c <= board[0].length - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], 
        botColor, playerColor
      );
    }
  }
  
  for (let c = 0; c < board[0].length; c++) {
    for (let r = 0; r <= board.length - 4; r++) {
      score += evaluateWindow(
        [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], 
        botColor, playerColor
      );
    }
  }
  
  for (let r = 0; r <= board.length - 4; r++) {
    for (let c = 0; c <= board[0].length - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], 
        botColor, playerColor
      );
    }
  }
  
  for (let r = 3; r < board.length; r++) {
    for (let c = 0; c <= board[0].length - 4; c++) {
      score += evaluateWindow(
        [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], 
        botColor, playerColor
      );
    }
  }
  
  const centerCol = Math.floor(board[0].length / 2);
  for (let r = 0; r < board.length; r++) {
    if (board[r][centerCol] === botColor) {
      score += 3;
    } else if (board[r][centerCol] === playerColor) {
      score -= 3;
    }
  }
  
  return score;
}


function evaluateWindow(window, botColor, playerColor) {
  let score = 0;
  
  const botPieces = window.filter(cell => cell === botColor).length;
  const playerPieces = window.filter(cell => cell === playerColor).length;
  const empty = window.filter(cell => cell === EMPTY).length;
  
  if (botPieces === 4) {
    score += SCORE_PATTERNS[4];
  } else if (botPieces === 3 && empty === 1) {
    score += SCORE_PATTERNS[3];
  } else if (botPieces === 2 && empty === 2) {
    score += SCORE_PATTERNS[2];
  }
  
  if (playerPieces === 4) {
    score -= SCORE_PATTERNS[4];
  } else if (playerPieces === 3 && empty === 1) {
    score -= SCORE_PATTERNS[3] * 1.5;
  } else if (playerPieces === 2 && empty === 2) {
    score -= SCORE_PATTERNS[2];
  }
  return score;
}

function getValidMoves(board) {
  const validMoves = [];
  const cols = board[0].length;
  for (let c = 0; c < cols; c++) {
    if (board[0][c] === EMPTY) {
      validMoves.push(c);
    }
  }
  return validMoves;
}

function makeMove(board, col, color) {
  const newBoard = board.map(row => [...row]);
  for (let r = newBoard.length - 1; r >= 0; r--) {
    if (newBoard[r][col] === EMPTY) {
      newBoard[r][col] = color;
      break;
    }
  }
  return newBoard;
}

function isBoardFull(board) {
  return board[0].every(cell => cell !== EMPTY);
}

function checkWinner(board) {
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
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

module.exports = {
  makeBotMove
};
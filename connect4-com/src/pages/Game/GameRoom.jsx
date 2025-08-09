import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext'
import { useParams, useLocation, useNavigate } from 'react-router-dom';

/*
 * GameRoom component handles the game room logic.
  * Allows players to join a room, make moves, and displays the game state.
  * Listens for socket events to update the game state in real-time.
  */

function GameRoom() {
  // Socket and routing
  const socket = useSocket();
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  // Room state
  const [inputRoomId, setInputRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(urlRoomId || "");

  // Game state
  const [playerRole, setPlayerRole] = useState(null);
  const [winner, setWinner] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [board, setBoard] = useState(Array.from({ length: 6 }, () => Array(7).fill(null)));

  // Joins if contains roomId from matchmaking
  useEffect(() => {
    if (urlRoomId && socket && !joined) {
      socket.emit("joinRoom", urlRoomId);
      setActiveRoomId(urlRoomId);
      setJoined(true);
    }
  }, [urlRoomId, socket, joined]);

  // Add socket event listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("roomCreated", (newRoomId) => {
      setActiveRoomId(newRoomId);
      socket.emit("joinRoom", newRoomId);
      setJoined(true);
    });
    
    socket.on("playerRole", setPlayerRole);
    socket.on("gameState", (gameState) => {
      setBoard(gameState.board);
      setCurrentPlayer(gameState.currentPlayer);
      setWinner(gameState.winner);
    });
    socket.on("opponentLeft", () => {
      alert("Opponent has gone.");
    })

    return () => {
      socket.off("roomCreated");
      socket.off("playerRole");
      socket.off("gameState");
      socket.off("opponentLeft");
      socket.off("matchFound");
    };
  }, [socket]);

  // Use activeRoomId consistently in your component
  const handleCellClick = (col) => {
    if (!playerRole || winner || currentPlayer !== playerRole) return;
    socket.emit("move", { roomId: activeRoomId, col, player: playerRole });
  };
  const joinRoom = () => {
    if (!inputRoomId) return;
    socket.emit("joinRoom", inputRoomId);
    setActiveRoomId(inputRoomId);
    setJoined(true);
  };

  const quitRoom = () => {
    if (socket && activeRoomId) {
      socket.emit("leaveRoom", activeRoomId);
      setJoined(false);
      setActiveRoomId("");
      setPlayerRole(null);
      setWinner(null);
      setCurrentPlayer(null);
      setBoard(Array.from({ length: 6 }, () => Array(7).fill(null)));
      navigate("/");
    }
  };


  return (
    <div className="text-white p-4">
      <h1 className="text-2xl mb-4"> Join Game Room</h1>
      {winner && (
        <div className="mb-4 text-xl font-bold" style={{ background: 'white', color: 'red' }}>
          {winner === "red" && "Red wins!"}
          {winner === "yellow" && "Yellow wins!"}
          <button
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => socket.emit("restart", activeRoomId)}
          >
            Play Again
          </button>
        </div>
      )}
      {!joined ? (
        <div>
          <div className="mb-2">
            <button
              className="px-3 py-1 bg-green-600 rounded"
              onClick={() => socket.emit("createRoom")}
            >
              Create Room
            </button>
          </div>
          <div className="flex items-center space-x-2">
              <input
              className="text-black px-2 py-1"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
            />
            <button className="px-3 py-1 bg-blue-600 rounded" onClick={joinRoom}>
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-lg">
            <strong className="bg-black/30 px-2 py-1 rounded">You joined Room ID:</strong>
            <code className="bg-black/30 px-2 py-1 rounded">{activeRoomId}</code>
            <button
              className="ml-4 px-3 py-1 bg-red-600 rounded"
              onClick={quitRoom}
            >
              Quit Room
            </button>
          </div>
          <div className="mb-2">
            {winner
              ? null
              : currentPlayer === playerRole
                ? "Your turn"
                : "Opponent's turn"}
          </div>
          <div className="grid grid-rows-6 grid-cols-7 gap-1">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(colIndex)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-gray-700 hover:bg-gray-600
                    ${winner || currentPlayer !== playerRole ? "pointer-events-none opacity-60" : ""}`}
                >
                  {cell === "red" && <div className="w-8 h-8 bg-red-500 rounded-full" />}
                  {cell === "yellow" && <div className="w-8 h-8 bg-yellow-400 rounded-full" />}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GameRoom;
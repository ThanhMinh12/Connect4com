import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext'

function GameRoom() {
  const socket = useSocket()
  const [board, setBoard] = useState(Array.from({ length: 6 }, () => Array(7).fill(null)));
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on("playerRole", setPlayerRole);
    socket.on("gameState", (game) => {
      setBoard(game.board);
      setCurrentPlayer(game.currentPlayer);
      setWinner(game.winner);
      console.log("Received game state:", game);
    });
    socket.on("roomCreated", (roomId) => {
      setRoomId(roomId);
      setJoined(true);
      socket.emit("joinRoom", roomId);
    });
    return () => {
      socket.off("playerRole");
      socket.off("gameState");
      socket.off("roomCreated");
    };
  }, []);

  const joinRoom = () => {
    if (roomId) {
      socket.emit("joinRoom", roomId);
      setJoined(true);
    }
  };

  const handleCellClick = (col) => {
    if (!playerRole || winner || currentPlayer !== playerRole) return;
    socket.emit("move", { roomId, col, player: playerRole });
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
            onClick={() => socket.emit("restart", roomId)}
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
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button className="px-3 py-1 bg-blue-600 rounded" onClick={() => {
              socket.emit("joinRoom", roomId);
              setJoined(true);
            }}>
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-lg">
            <strong className="bg-black/30 px-2 py-1 rounded">You joined Room ID:</strong> <code className="bg-black/30 px-2 py-1 rounded">{roomId}</code>
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
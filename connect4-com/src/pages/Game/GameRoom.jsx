import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext'
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Connect4Sample from "./../../assets/Connect4Sample.svg";

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

  const copyRoomId = () => {
    navigator.clipboard.writeText(activeRoomId);
    alert("Room ID copied to clipboard!");
  };


  return (
    <div className="min-h-screen bg-[#2f3136] font-Nunito">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header with logo */}
        <div className="text-center mb-8 pt-4">
          <img 
            src={Connect4Sample} 
            alt="Connect4" 
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white">
            {!joined ? "Join or Create a Game" : winner ? "Game Over!" : "Connect Four"}
          </h1>
          {joined && !winner && (
            <p className="mt-2 text-xl font-medium text-gray-300">
              {currentPlayer === playerRole ? 
                <span className="text-green-400">Your turn</span> : 
                <span className="text-yellow-400">Opponent's turn</span>
              }
            </p>
          )}
        </div>
      
        {/* Winner announcement */}
        {winner && (
          <div className="mb-8 p-6 rounded-lg bg-black bg-opacity-20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {winner === playerRole ? "You Win! 🎉" : "Opponent Wins!"}
                </h2>
                <p className="text-gray-200">
                  {winner === "red" ? "Red" : "Yellow"} has connected four!
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  className="px-5 py-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 shadow-md"
                  onClick={() => socket.emit("restart", activeRoomId)}
                >
                  Play Again
                </button>
                <button
                  className="px-5 py-3 bg-[#537178] hover:bg-[#638188] text-white rounded-md transition-colors duration-200 shadow-md"
                  onClick={quitRoom}
                >
                  Exit Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room joining interface */}
        {!joined ? (
          <div className="bg-black bg-opacity-20 rounded-lg p-6 shadow-lg">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Room */}
              <div className="bg-black bg-opacity-20 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Create a New Room</h2>
                <p className="text-gray-300 mb-6">Start a new game and invite a friend to join</p>
                <button
                  className="w-full py-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 shadow-md"
                  onClick={() => socket.emit("createRoom")}
                >
                  Create Room
                </button>
              </div>
              
              {/* Join Room */}
              <div className="bg-black bg-opacity-20 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Join Existing Room</h2>
                <div className="flex flex-col space-y-4">
                  <input
                    className="px-4 py-3 bg-[#2f3136] text-white rounded-md border border-gray-700 focus:border-[#60a7b1] focus:outline-none"
                    placeholder="Enter Room ID"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                  />
                  <button 
                    className="py-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 shadow-md"
                    onClick={joinRoom}
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black bg-opacity-20 rounded-lg p-6 shadow-lg">
            {/* Room info bar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-black bg-opacity-30 p-4 rounded-lg">
              <div className="mb-3 md:mb-0">
                <span className="text-gray-400 mr-2">Room ID:</span>
                <code className="bg-[#2f3136] px-3 py-1 rounded text-[#60a7b1] font-mono">{activeRoomId}</code>
                <button
                  onClick={copyRoomId}
                  className="ml-2 text-[#60a7b1] hover:text-[#70b7b9]"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${playerRole === 'red' ? 'bg-red-500' : 'bg-yellow-400'} mr-2`}></div>
                  <span className="text-white">You: {playerRole === 'red' ? 'Red' : 'Yellow'}</span>
                </div>
                <button
                  className="px-4 py-2 bg-[#537178] hover:bg-[#638188] text-white rounded-md transition-colors duration-200"
                  onClick={quitRoom}
                >
                  Quit Game
                </button>
              </div>
            </div>

            {/* Game board */}
            <div className="relative mx-auto w-fit bg-[#60a7b1] bg-opacity-80 p-4 rounded-lg shadow-lg">
              {/* Board top */}
              <div className="h-4 bg-[#537178] w-full rounded-t-lg mb-2"></div>
              
              {/* Board grid */}
              <div className="grid grid-rows-6 grid-cols-7 gap-1 bg-[#537178] p-2 rounded-md">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(colIndex)}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer bg-[#2f3136] hover:bg-gray-800 transition-colors relative
                        ${(winner || currentPlayer !== playerRole) ? "pointer-events-none" : ""}
                        ${!cell && currentPlayer === playerRole ? "hover:after:content-[''] hover:after:absolute hover:after:top-0 hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:bg-white hover:after:bg-opacity-10 hover:after:rounded-full" : ""}`}
                    >
                      {cell && (
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-inner
                          ${cell === "red" ? "bg-gradient-to-br from-red-400 to-red-600" : "bg-gradient-to-br from-yellow-300 to-yellow-500"}`}>
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full opacity-30
                              ${cell === "red" ? "bg-red-300" : "bg-yellow-200"}`}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameRoom;
import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext'
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSound } from '../../contexts/SoundContext';
import Connect4Sample from "./../../assets/Connect4Sample.svg";

/*
 * GameRoom component handles the game room logic.
  * Allows players to join a room, make moves, and displays the game state.
  * Listens for socket events to update the game state in real-time.
  */

function GameRoom() {

  const [playWithBot, setPlayWithBot] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState('hard');

  const { playSound } = useSound();
  // Socket and routing
  const { socket } = useSocket();
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

    socket.on("playerJoined", () => {
      playSound("click");
      alert(`Opponent joined the room!`);
    });
    
    socket.on("playerRole", setPlayerRole);
    socket.on("gameState", (gameState) => {
      setBoard(gameState.board);
      setCurrentPlayer(gameState.currentPlayer);
      setWinner(gameState.winner);
      if (gameState.winner) {
        if (gameState.winner === playerRole) {
          playSound("win");
        }
        else {
          playSound("lose");
        }
      }
    });
    socket.on("opponentLeft", () => {
      alert("Opponent has gone.");
    });
    socket.on("playWithBot", (difficulty) => {
      setPlayWithBot(true);
      setBotDifficulty(difficulty);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("playerRole");
      socket.off("gameState");
      socket.off("opponentLeft");
      socket.off("matchFound");
      socket.off("playerJoined");
      socket.off("playWithBot");
    };
  }, [socket, playSound, playerRole, currentPlayer, winner]);

  const handleCellClick = (col) => {
    if (!playerRole || winner || currentPlayer !== playerRole) return;
    playSound("click");
    socket.emit("move", { roomId: activeRoomId, col, player: playerRole });
  };
  const joinRoom = () => {
    if (!inputRoomId) return;
    playSound('click');
    socket.emit("joinRoom", inputRoomId);
    setActiveRoomId(inputRoomId);
    setJoined(true);
  };

  const quitRoom = () => {
    playSound('click');
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
      {/* Add bot info near the top of your GameRoom */}
      {playWithBot && (
        <div className="py-1 px-3 bg-blue-600 text-white text-center text-sm">
          Playing against Bot ({botDifficulty} difficulty)
        </div>
      )}
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
                  <span className="text-white">
                    You: {playerRole === 'red' ? 'Red' : 'Yellow'}
                    {socket?.userId?.startsWith('anon_') && <span className="text-sm ml-1">(Guest)</span>}
                  </span>
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
            <div className="relative mx-auto w-full max-w-[350px] sm:max-w-[420px] md:max-w-[500px] bg-[#60a7b1] bg-opacity-80 p-2 sm:p-4 rounded-lg shadow-lg">
              {/* Board top */}
              <div className="h-2 sm:h-4 bg-[#537178] w-full rounded-t-lg mb-1 sm:mb-2"></div>
  
              {/* Board grid */}
              <div className="grid grid-rows-6 grid-cols-7 gap-[2px] sm:gap-1 bg-[#537178] p-1 sm:p-2 rounded-md">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(colIndex)}
                      className={`aspect-square w-full rounded-full flex items-center justify-center cursor-pointer bg-[#2f3136] hover:bg-gray-800 transition-colors relative
                      ${(winner || currentPlayer !== playerRole) ? "pointer-events-none" : ""}
                      ${!cell && currentPlayer === playerRole ? "hover:after:content-[''] hover:after:absolute hover:after:top-0 hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:bg-white hover:after:bg-opacity-10 hover:after:rounded-full" : ""}`}
                    >
                      {cell && (
                        <div className={`w-[80%] h-[80%] rounded-full shadow-inner
                          ${cell === "red" ? "bg-gradient-to-br from-red-400 to-red-600" : "bg-gradient-to-br from-yellow-300 to-yellow-500"}`}>
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className={`w-1/2 h-1/2 rounded-full opacity-30
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
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Connect4Sample from "./../../assets/Connect4Sample.svg";

/*
 * Handles matchmaking for play online.
 * Directly emits playOnline event to the server to add the player to the queue.
 * Listens for matchFound to navigate to the game room.
 */

function WaitRoom() {
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting');
  const hasJoinedQueue = useRef(false);

  useEffect(() => {
    if (!socket || !user) {
      setStatus('error');
      return;
    }

    if (!hasJoinedQueue.current) {
      setStatus("waiting");
      socket.emit("playOnline", user.id);
      hasJoinedQueue.current = true;
    }

    const handleMatchFound = (roomId) => {
      console.log(`[WaitRoom] Match found! Room: ${roomId}`);
      setStatus('matched');
      // Remove event listener before navigating to prevent duplicate events
      socket.off('matchFound', handleMatchFound);
      navigate(`/room/${roomId}`);
    };

    socket.on('matchFound', handleMatchFound);
    return () => {
      console.log('[WaitRoom] Cleaning up event listeners');
      socket.off('matchFound', handleMatchFound);
    };
  }, [socket, user, navigate]);

  const cancelMatchmaking = () => {
    if (socket) {
      socket.emit('leaveQueue');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#2f3136] font-Nunito">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center pt-20 px-4">
        <img 
          src={Connect4Sample} 
          alt="Connect4" 
          className="w-48 mb-8 animate-pulse"
          style={{animationDuration: '3s'}}
        />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            {status === 'connecting' && "Connecting..."}
            {status === 'waiting' && "Finding an Opponent"}
            {status === 'matched' && "Match Found!"}
            {status === 'error' && "Connection Error"}
          </h1>
          
          <p className="text-lg text-gray-300 mb-2">
            {status === 'connecting' && "Setting up your connection..."}
            {status === 'waiting' && `Searching for a worthy challenger...`}
            {status === 'matched' && "Preparing your game..."}
            {status === 'error' && "Please make sure you're logged in"}
          </p>
          {status === 'waiting' && (
            <div className="flex justify-center space-x-3 my-8">
              {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                <div 
                  key={col}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 animate-bounce"
                  style={{
                    animationDelay: `${col * 0.1}s`,
                    animationDuration: '0.8s'
                  }}
                />
              ))}
            </div>
          )}
          {status === 'matched' && (
            <div className="mt-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
          {status === 'waiting' && (
            <button
              onClick={cancelMatchmaking}
              className="mt-8 px-6 py-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md font-medium transition-colors duration-200"
            >
              Cancel Search
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="mt-8 px-6 py-3 bg-[#537178] hover:bg-[#638188] text-white rounded-md font-medium transition-colors duration-200"
            >
              Back to Login
            </button>
          )}
        </div>
        {status === 'waiting' && (
          <div className="bg-black bg-opacity-20 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-3">While you wait...</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Connect four of your pieces vertically, horizontally, or diagonally 👀</li>
              <li>• Block your opponent from connecting four 😤</li>
              <li>• Plan your moves at least 2-3 steps ahead 🧠</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitRoom;
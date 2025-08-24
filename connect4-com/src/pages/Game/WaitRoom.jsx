import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSound } from '../../contexts/SoundContext';
import Connect4Sample from "./../../assets/Connect4Sample.svg";

function WaitRoom() {
  const { playSound } = useSound();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting');
  const hasJoinedQueue = useRef(false);
  const [queueStatus, setQueueStatus] = useState("waiting");
  const [waitTime, setWaitTime] = useState(0);
  const [showBotOption, setShowBotOption] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  useEffect(() => {
    let interval;
    if (status === 'waiting') {
      interval = setInterval(() => {
        setWaitTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 1 && !showBotOption) {
            setShowBotOption(true);
            playSound('click');
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, showBotOption, playSound]);

  useEffect(() => {
    hasJoinedQueue.current = false;
    
    if (!socket) {
      return;
    }

    const handleConnect = () => {
      if (!hasJoinedQueue.current) {
        console.log(`Attempting to join queue as ${user ? `user ${user.id}` : 'anonymous'}`);
        socket.emit("playOnline");
        hasJoinedQueue.current = true;
      }
    };
    
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("queueJoined", () => {
      console.log("[WaitRoom] Successfully joined the queue!");
      setQueueStatus('inQueue');
      setStatus("waiting");
    });

    const handleMatchFound = (roomId) => {
      console.log(`[WaitRoom] Match found! Room: ${roomId}`);
      playSound('click');
      setStatus('matched');
      socket.off('matchFound', handleMatchFound);
      navigate(`/room/${roomId}`);
    };

    socket.on('matchFound', handleMatchFound);
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('queueJoined');
      socket.off('matchFound', handleMatchFound);
      
      if (hasJoinedQueue.current) {
        socket.emit('leaveQueue');
      }
    };
  }, [socket, navigate, playSound]);

  const cancelMatchmaking = () => {
    if (socket) {
      playSound('click');
      socket.emit('leaveQueue');
      navigate('/');
    }
  };
  
  const playWithBot = () => {
    if (socket) {
      playSound('click');
      // Leave the player queue first
      if (hasJoinedQueue.current) {
        socket.emit('leaveQueue');
      }
      
      // Request a game with a bot
      socket.emit('playWithBot', botDifficulty);
      setStatus('connecting-bot');
    }
  };

  return (
    <div className="min-h-screen bg-[#2f3136] font-Nunito">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col items-center justify-center">
          <div className="w-64 h-64 mb-8">
            <img src={Connect4Sample} alt="Connect4" className="w-full h-full object-contain" />
          </div>
          
          <div className="w-full max-w-md bg-black bg-opacity-30 rounded-lg p-6 shadow-lg text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Finding Opponent</h1>
            
            <div className="flex justify-center my-4">
              <div className="loader"></div>
            </div>
            
            {waitTime > 0 && (
              <p className="text-gray-300 mb-4">
                Waiting for <span className="text-[#60a7b1] font-medium">{waitTime}</span> seconds...
              </p>
            )}
            
            {showBotOption && (
              <div className="mt-6 mb-4 p-4 bg-[#3a3d42] rounded-lg">
                <p className="text-yellow-300 mb-3">Matchmaking is taking longer than usual</p>
                <p className="text-gray-300 mb-4">Would you like to play against a bot instead?</p>
                
                <div className="mb-4">
                  <label className="text-white block mb-2">Bot Difficulty:</label>
                  <div className="flex justify-center space-x-2">
                    {['easy', 'medium', 'hard'].map(difficulty => (
                      <button
                        key={difficulty}
                        onClick={() => setBotDifficulty(difficulty)}
                        className={`px-4 py-2 rounded capitalize ${
                          botDifficulty === difficulty 
                            ? 'bg-[#60a7b1] text-white' 
                            : 'bg-[#46494f] text-gray-300 hover:bg-[#54575f]'
                        }`}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={playWithBot}
                  className="w-full p-3 bg-[#60a7b1] hover:bg-[#70b7b9] text-white rounded-md transition-colors duration-200 font-medium"
                >
                  Play Against Bot
                </button>
              </div>
            )}
            
            <button
              onClick={cancelMatchmaking}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 4px solid #60a7b1;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default WaitRoom;
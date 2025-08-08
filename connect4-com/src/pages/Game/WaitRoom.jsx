import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">
        {status === 'connecting' && "Connecting..."}
        {status === 'waiting' && "Waiting for an opponent..."}
        {status === 'matched' && "Match found! Joining game..."}
        {status === 'error' && "Error connecting to matchmaking"}
      </h2>
      
      {status === 'waiting' && (
        <div className="mt-4 flex items-center">
          <div className="animate-pulse h-2 w-2 rounded-full bg-blue-400 mr-1"></div>
          <div className="animate-pulse h-2 w-2 rounded-full bg-blue-400 mr-1" style={{animationDelay: "0.2s"}}></div>
          <div className="animate-pulse h-2 w-2 rounded-full bg-blue-400" style={{animationDelay: "0.4s"}}></div>
        </div>
      )}
    </div>
  );
}

export default WaitRoom;
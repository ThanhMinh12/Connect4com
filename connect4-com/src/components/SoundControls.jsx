import { useState } from 'react';
import { useSound } from '../contexts/SoundContext';

function SoundControls() {
  const { muted, toggleMute, volume, setVolume } = useSound();
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setExpanded(prev => !prev)}
        className="bg-[#537178] p-3 rounded-full shadow-lg hover:bg-[#638188] transition-colors"
      >
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      
      {expanded && (
        <div className="absolute bottom-16 right-0 bg-[#2f3136] p-4 rounded-lg shadow-lg w-56">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">Sound</span>
            <button 
              onClick={toggleMute}
              className="text-white hover:text-[#70b7b9]"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-[#60a7b1]"
          />
        </div>
      )}
    </div>
  );
}

export default SoundControls;
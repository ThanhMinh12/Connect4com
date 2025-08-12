import React, { createContext, useState, useContext, useEffect } from 'react';
import { Howl } from 'howler';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const sounds = {
    win: new Howl({ src: ['/sounds/win.wav'], volume: volume }),
    lose: new Howl({ src: ['/sounds/lose.wav'], volume: volume }),
    click: new Howl({ src: ['/sounds/click.wav'], volume: volume }),
  };
  useEffect(() => {
    Object.values(sounds).forEach(sound => {
      sound.volume(muted ? 0 : volume);
    });
  }, [volume, muted]);
  const playSound = (soundName) => {
    if (!muted && sounds[soundName]) {
      sounds[soundName].play();
    }
  };
  const toggleMute = () => setMuted(prev => !prev);
  return (
    <SoundContext.Provider value={{ 
      playSound, 
      toggleMute, 
      muted, 
      volume, 
      setVolume 
    }}>
      {children}
    </SoundContext.Provider>
  );
};
export const useSound = () => useContext(SoundContext);
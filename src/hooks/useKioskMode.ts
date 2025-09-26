import { useEffect, useCallback, useState } from 'react';
import { useSystemSettings } from './useSystemSettings';

export const useKioskMode = () => {
  const { settings } = useSystemSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [kioskActivated, setKioskActivated] = useState(false);

  // Check if fullscreen is supported
  useEffect(() => {
    const supported = !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
    setFullscreenSupported(supported);
  }, []);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Detect if kiosk mode is needed and requires user interaction
  useEffect(() => {
    if ((settings?.enableAutoFullscreen || settings?.enableAutoSound) && !kioskActivated) {
      setNeedsUserInteraction(true);
    }
  }, [settings?.enableAutoFullscreen, settings?.enableAutoSound, kioskActivated]);

  const requestFullscreen = useCallback(async () => {
    if (!fullscreenSupported) return false;

    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
      return false;
    }
  }, [fullscreenSupported]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      return true;
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await requestFullscreen();
    }
  }, [isFullscreen, exitFullscreen, requestFullscreen]);

  const unlockAudioContext = useCallback(async () => {
    try {
      // Create a temporary audio context to unlock autoplay
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (AudioContext) {
        const audioContext = new AudioContext();
        
        // Check if audio context is already running
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Play a silent sound to unlock audio
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        
        setAudioUnlocked(true);
        
        // Clean up
        setTimeout(() => {
          audioContext.close();
        }, 1000);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to unlock audio context:', error);
      return false;
    }
  }, []);

  const activateKioskMode = useCallback(async () => {
    const results = { fullscreen: false, audio: false };
    
    try {
      // Attempt fullscreen if enabled
      if (settings?.enableAutoFullscreen && fullscreenSupported && !isFullscreen) {
        results.fullscreen = await requestFullscreen();
      }
      
      // Attempt audio unlock if enabled
      if (settings?.enableAutoSound && !audioUnlocked) {
        results.audio = await unlockAudioContext();
      }
      
      setKioskActivated(true);
      setNeedsUserInteraction(false);
      
      return results;
    } catch (error) {
      console.error('Failed to activate kiosk mode:', error);
      return results;
    }
  }, [settings?.enableAutoFullscreen, settings?.enableAutoSound, fullscreenSupported, isFullscreen, audioUnlocked, requestFullscreen, unlockAudioContext]);

  return {
    isFullscreen,
    fullscreenSupported,
    audioUnlocked,
    needsUserInteraction,
    kioskActivated,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
    unlockAudioContext,
    activateKioskMode,
  };
};
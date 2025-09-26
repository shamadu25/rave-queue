/**
 * Browser compatibility utilities for kiosk deployments
 */

export interface KioskConfig {
  autoFullscreen: boolean;
  autoSound: boolean;
  hideUI: boolean;
  preventNavigation: boolean;
}

export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isChrome: userAgent.includes('chrome') && !userAgent.includes('edg'),
    isEdge: userAgent.includes('edg'),
    isFirefox: userAgent.includes('firefox'),
    isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
    isKioskMode: (window.navigator as any).standalone || window.matchMedia('(display-mode: fullscreen)').matches,
  };
};

export const getKioskLaunchFlags = () => {
  const browserInfo = getBrowserInfo();
  
  const flags = {
    chrome: [
      '--kiosk',
      '--start-fullscreen',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=TranslateUI',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-web-security',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--disable-ipc-flooding-protection',
    ],
    edge: [
      '--kiosk',
      '--start-fullscreen',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=msEdgeFeatures',
      '--disable-extensions',
    ],
    firefox: [
      '--kiosk',
      '--private-window',
    ],
  };

  if (browserInfo.isChrome) return flags.chrome;
  if (browserInfo.isEdge) return flags.edge;
  if (browserInfo.isFirefox) return flags.firefox;
  
  return [];
};

export const setupKioskEnvironment = (config: KioskConfig) => {
  const browserInfo = getBrowserInfo();
  
  // Disable right-click context menu
  if (config.hideUI) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable F11, F12, and other function keys
  if (config.preventNavigation) {
    document.addEventListener('keydown', (e) => {
      // Disable F keys except F5 (refresh)
      if (e.key.startsWith('F') && e.key !== 'F5') {
        e.preventDefault();
      }
      
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
      
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
    });
  }
  
  // Auto-unlock audio for supported browsers
  if (config.autoSound && (browserInfo.isChrome || browserInfo.isEdge)) {
    // Chrome/Edge specific audio unlock
    const unlockAudio = () => {
      try {
        const audio = new Audio();
        audio.volume = 0;
        audio.play().catch(() => {
          // Ignore autoplay policy errors
        });
      } catch (error) {
        console.warn('Audio unlock failed:', error);
      }
    };
    
    // Try to unlock immediately and on first interaction
    unlockAudio();
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  }
  
  return browserInfo;
};

export const generateKioskShortcut = (url: string) => {
  const browserInfo = getBrowserInfo();
  const flags = getKioskLaunchFlags();
  
  if (browserInfo.isChrome) {
    return `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" ${flags.join(' ')} "${url}"`;
  }
  
  if (browserInfo.isEdge) {
    return `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" ${flags.join(' ')} "${url}"`;
  }
  
  if (browserInfo.isFirefox) {
    return `"C:\\Program Files\\Mozilla Firefox\\firefox.exe" ${flags.join(' ')} "${url}"`;
  }
  
  return `Start your browser with: ${flags.join(' ')} "${url}"`;
};

export const detectKioskCapabilities = () => {
  return {
    fullscreenAPI: !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    ),
    audioAutoplay: !window.AudioContext || (window.AudioContext && (window as any).webkitAudioContext),
    webSpeech: 'speechSynthesis' in window,
    localStorage: !!window.localStorage,
    webSockets: !!window.WebSocket,
  };
};
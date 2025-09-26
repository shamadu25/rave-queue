import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { useKioskMode } from '@/hooks/useKioskMode';
import { 
  Volume2, 
  VolumeX, 
  Clock,
  Hospital,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Users,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface ReceptionDisplayProps {
  enableAudio?: boolean;
}

// Offline cache management
const CACHE_KEY = 'receptionDisplay_cache';

interface CachedData {
  entries: any[];
  settings: any;
  timestamp: number;
}

const ReceptionDisplay = ({ enableAudio = true }: ReceptionDisplayProps) => {
  const { entries, loading, error } = useQueueMonitor();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { announceWithChime, isEnabled, playChime } = useTextToSpeech();
  const { 
    isFullscreen, 
    audioUnlocked, 
    needsUserInteraction,
    kioskActivated,
    toggleFullscreen: kioskToggleFullscreen, 
    unlockAudioContext,
    activateKioskMode
  } = useKioskMode();
  
  const [currentServing, setCurrentServing] = useState<any>(null);
  const [nextInLine, setNextInLine] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [headerAnimation, setHeaderAnimation] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const maxReconnectAttempts = 10;

  // Dynamic document title and favicon updates
  useEffect(() => {
    const hospitalName = settings?.clinic_name || 'Reception Queue';
    document.title = `${hospitalName} - Reception Display`;
    
    if (settings?.clinic_logo) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.clinic_logo;
      }
    }
  }, [settings?.clinic_name, settings?.clinic_logo]);

  // Show fullscreen success toast when entering fullscreen
  useEffect(() => {
    if (isFullscreen && settings?.enableAutoFullscreen) {
      toast.success('Reception Display - Kiosk Mode Activated');
    }
  }, [isFullscreen, settings?.enableAutoFullscreen]);

  // Enhanced kiosk mode audio initialization
  useEffect(() => {
    if (enableAudio && kioskActivated && audioUnlocked && !audioInitialized) {
      setAudioInitialized(true);
      setUserInteracted(true);
      
      // Pre-warm the audio system with very quiet test
      if (settings?.enable_announcement_chime) {
        setTimeout(() => playChime(0.05).catch(() => {}), 500);
      }
      
      toast.success('🔊 Reception Audio System Ready');
    } else if (enableAudio && !needsUserInteraction && !audioInitialized) {
      setupManualAudioUnlock();
    }
  }, [enableAudio, audioInitialized, kioskActivated, audioUnlocked, needsUserInteraction, settings?.enable_announcement_chime, playChime]);

  const setupManualAudioUnlock = useCallback(() => {
    const initAudio = () => {
      setAudioInitialized(true);
      setUserInteracted(true);
    };
    
    const events = ['click', 'touchstart', 'keydown'];
    const handler = () => {
      initAudio();
      events.forEach(event => document.removeEventListener(event, handler));
    };
    
    events.forEach(event => document.addEventListener(event, handler, { once: true }));
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handler));
    };
  }, []);

  // Cache management
  const saveToCache = useCallback((entries: any[], settings: any) => {
    const cacheData: CachedData = { entries, settings, timestamp: Date.now() };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save reception cache:', error);
    }
  }, []);

  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load reception cache:', error);
    }
    return null;
  }, []);

  // Connection monitoring and auto-reconnect logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineMode(false);
      setReconnectAttempts(0);
      setIsReconnecting(false);
      toast.success('Reception Display - Connection Restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      const cached = loadFromCache();
      if (cached) {
        setCachedData(cached);
        toast.warning('Reception Display - Offline Mode');
      } else {
        toast.error('Reception Display - No Cached Data');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadFromCache]);

  // Cache current data when online
  useEffect(() => {
    if (isOnline && entries && settings && !loading && !settingsLoading) {
      saveToCache(entries, settings);
    }
  }, [entries, settings, loading, settingsLoading, isOnline, saveToCache]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Initialize user interaction
  useEffect(() => {
    const handleUserInteraction = () => setUserInteracted(true);
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Process Reception-only queue entries
  useEffect(() => {
    const currentEntries = offlineMode && cachedData ? cachedData.entries : entries;
    
    if (!currentEntries || currentEntries.length === 0) {
      setCurrentServing(null);
      setNextInLine([]);
      return;
    }

    // Filter entries for Reception department only
    const receptionEntries = currentEntries.filter(entry => entry.department === 'Reception');

    // Find currently serving token
    const serving = receptionEntries.filter(entry => 
      entry.status === 'Called' || entry.status === 'Served'
    );

    // Find next tokens in line (waiting)
    const waiting = receptionEntries.filter(entry => 
      entry.status === 'Waiting'
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const nowServing = serving.length > 0 ? serving[serving.length - 1] : null;
    
    if (nowServing) {
      setCurrentServing(nowServing);
      
      // Trigger immediate announcement for new tokens
      if (!offlineMode &&
          audioEnabled && 
          settings?.enable_voice_announcements &&
          nowServing.token !== lastAnnouncedToken &&
          nowServing.status === 'Called' &&
          (userInteracted || audioInitialized)) {
        
        const template = settings?.reception_announcement_template || 
          settings?.announcement_template ||
          'Token {number}, please proceed to Reception Desk.';
        
        // Immediate announcement without delay
        Promise.resolve().then(() => {
          announceWithChime(
            nowServing.token,
            'Reception',
            'Reception Desk',
            template
          );
        });
        
        setLastAnnouncedToken(nowServing.token);
        toast.success(`🔊 Now calling: ${nowServing.token}`, {
          duration: 4000,
          className: 'text-lg font-bold',
        });
      }
    } else {
      setCurrentServing(null);
    }

    setNextInLine(waiting.slice(0, 5));
  }, [entries, cachedData, offlineMode, audioEnabled, lastAnnouncedToken, userInteracted, settings]);

  const toggleFullscreen = async () => {
    try {
      await kioskToggleFullscreen();
      toast.info(`Fullscreen: ${!isFullscreen ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
      toast.error('Fullscreen toggle failed');
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toast.info(`Reception Audio: ${!audioEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const currentSettings = offlineMode && cachedData ? cachedData.settings : settings;
  const hospitalName = currentSettings?.clinic_name || 'Hospital Reception';
  const hospitalLogo = currentSettings?.clinic_logo_url || currentSettings?.clinic_logo;
  const headerText = currentSettings?.display_header_text || `Welcome to ${hospitalName}`;
  const headerColor = currentSettings?.display_header_color || '#1E293B';
  const headerFontSize = currentSettings?.display_header_font_size || 24;
  const backgroundColor = currentSettings?.display_background_start && currentSettings?.display_background_end 
    ? `linear-gradient(135deg, ${currentSettings.display_background_start}, ${currentSettings.display_background_end})`
    : 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.3))';
  const subText = currentSettings?.reception_subtext || 'Please proceed to Reception for registration and verification';
  const tickerText = currentSettings?.ticker_text || 'For emergency assistance, please dial 911 or inform reception staff immediately.';
  const footerNote = currentSettings?.footer_note || 'Thank you for visiting our hospital';

  const handleKioskActivation = async () => {
    const results = await activateKioskMode();
    
    if (results.fullscreen && results.audio) {
      toast.success('🚀 Kiosk Mode Fully Activated - Fullscreen & Audio Ready!');
    } else if (results.fullscreen) {
      toast.success('📺 Fullscreen Activated');
      if (currentSettings?.enableAutoSound) {
        toast.warning('⚠️ Audio needs manual activation - Click audio button');
      }
    } else if (results.audio) {
      toast.success('🔊 Audio Unlocked');
      if (currentSettings?.enableAutoFullscreen) {
        toast.warning('⚠️ Fullscreen needs manual activation - Press F11 or click fullscreen button');
      }
    } else {
      toast.error('❌ Kiosk activation failed - Browser restrictions');
    }
  };

  return (
    <>
      {/* Kiosk Mode Activation Overlay */}
      {needsUserInteraction && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg z-[9999] flex items-center justify-center">
          <div className="text-center text-white max-w-2xl mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Hospital className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {hospitalName}
            </h2>
            
            <h3 className="text-2xl font-bold mb-6">
              Kiosk Mode Activation Required
            </h3>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
              <p className="text-lg mb-4">
                To enable automatic features for the reception display:
              </p>
              
              <div className="space-y-3 text-left">
                {currentSettings?.enableAutoFullscreen && (
                  <div className="flex items-center gap-3">
                    <Maximize2 className="w-5 h-5 text-blue-400" />
                    <span>Auto-Fullscreen Display</span>
                  </div>
                )}
                {currentSettings?.enableAutoSound && (
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-green-400" />
                    <span>Auto-Sound Announcements</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleKioskActivation}
              className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              🚀 Activate Kiosk Mode
            </Button>
            
            <p className="text-sm text-white/70 mt-6">
              This action is required due to browser security policies
            </p>
          </div>
        </div>
      )}

      <div 
        className="h-screen w-full flex flex-col relative overflow-hidden"
        style={{
          background: backgroundColor,
          height: '100vh'
        }}
      >
        {/* Animated Particle Background - Contained properly */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/8 rounded-full animate-pulse opacity-50"></div>
          <div className="absolute top-[50%] right-[5%] w-48 h-48 bg-white/6 rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
          <div className="absolute bottom-[10%] left-[30%] w-56 h-56 bg-white/4 rounded-full animate-pulse opacity-30" style={{ animationDelay: '6s' }}></div>
          
          {/* Smaller floating elements - properly contained */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/15 rounded-full animate-float opacity-40"
              style={{
                left: `${15 + (Math.random() * 70)}%`,
                top: `${15 + (Math.random() * 70)}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Connection Status Banner */}
        {(offlineMode || isReconnecting) && (
          <div className="bg-yellow-500/95 backdrop-blur-sm text-white px-6 py-3 text-center font-medium z-50">
            <div className="flex items-center justify-center gap-2">
              {isReconnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reconnecting Reception Display... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Reception Display - Offline Mode
                </>
              )}
            </div>
          </div>
        )}

        {/* Premium Top Header */}
        <div className="flex-shrink-0 relative z-10 px-2 sm:px-4 py-2 sm:py-4">
          <div className="relative group">
            {/* Premium glass morphism background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-2xl"></div>
            
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            {/* Inner premium container */}
            <div className="relative bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
                {/* Hospital Logo & Name */}
                <div className="flex items-center gap-3 sm:gap-6">
                  {hospitalLogo && (
                    <div className="relative group/logo">
                      {/* Logo glow effect */}
                      <div className="absolute inset-0 w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-lg opacity-60 group-hover/logo:opacity-80 transition-opacity duration-300"></div>
                      
                      <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border border-white/50 flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                        <img 
                          src={hospitalLogo} 
                          alt="Hospital Logo" 
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <h1 
                      className="font-black tracking-tight leading-none text-shadow-lg animate-fade-in"
                      style={{ 
                        color: headerColor,
                        fontSize: `${Math.max(headerFontSize * 0.8, 16)}px`,
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {hospitalName}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                      <p 
                        className="font-semibold tracking-wide opacity-90"
                        style={{ 
                          color: headerColor,
                          fontSize: `${Math.max(headerFontSize * 0.45, 11)}px`
                        }}
                      >
                        Reception Queue Display
                      </p>
                    </div>
                  </div>
                </div>

                {/* Premium Time & Date Display */}
                <div className="text-right space-y-1">
                  <div className="relative">
                    {/* Time glow effect */}
                    <div 
                      className="absolute inset-0 blur-sm opacity-30"
                      style={{ color: headerColor }}
                    >
                      {formatTime(currentTime)}
                    </div>
                    
                    <div 
                      className="relative text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none"
                      style={{ 
                        color: headerColor,
                        textShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {formatTime(currentTime)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2">
                    <div 
                      className="text-xs sm:text-sm font-medium tracking-wide opacity-80"
                      style={{ color: headerColor }}
                    >
                      {formatDate(currentTime)}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-current opacity-40 animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Premium Vertical Layout - Main Content */}
        <div className="flex-1 flex flex-col relative z-10 gap-2 p-1 sm:p-2 md:p-3 lg:p-4 overflow-hidden min-h-0">
          
          {/* NOW SERVING Section - Primary */}
          <div className="flex-[4] flex items-center justify-center min-h-0">
            <Card className="w-full h-full bg-gradient-to-br from-white/98 via-white/95 to-slate-50/90 backdrop-blur-lg shadow-2xl border-0 overflow-hidden animate-slide-in ring-2 ring-primary/20">
              <CardContent className="p-2 sm:p-4 md:p-6 lg:p-8 h-full flex flex-col justify-center overflow-hidden">
              {currentServing ? (
                <div className="text-center space-y-2 sm:space-y-4 md:space-y-6 lg:space-y-8">
                  <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-4 md:mb-6">
                    <div className="relative">
                      <CheckCircle2 
                        className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-emerald-500 animate-pulse drop-shadow-lg" 
                      />
                      <div className="absolute inset-0 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-emerald-500/20 rounded-full animate-ping"></div>
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-emerald-700 drop-shadow-md">
                      NOW SERVING
                    </h2>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-white/90 via-emerald-50/90 to-white/90 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 border-4 border-emerald-400/30 shadow-2xl transform group-hover:scale-102 transition-all duration-300">
                      <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-emerald-600 drop-shadow-lg tracking-wider">
                        {currentServing.token}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-emerald-600 animate-bounce" />
                    <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-700">
                      Please proceed to Reception Desk
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="flex items-center justify-center gap-4">
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-slate-400 animate-pulse" />
                    <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-600">
                      NO QUEUE ACTIVE
                    </h2>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-100/90 to-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-12 border-2 border-slate-300/50 shadow-xl">
                    <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-500 mb-4">
                      ---
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-semibold text-slate-600">
                      Please wait for the next token to be called
                    </p>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </div>

          {/* NEXT IN LINE Section - Secondary */}
          <div className="flex-[2] min-h-0 overflow-hidden">
            <Card className="w-full h-full bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95 backdrop-blur-lg shadow-xl border-0 overflow-hidden ring-1 ring-blue-500/20">
              <CardContent className="p-2 sm:p-4 md:p-6 h-full">
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                    <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-blue-700">
                      NEXT IN LINE
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    {nextInLine.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 md:gap-3 h-full">
                        {nextInLine.slice(0, 5).map((entry, index) => (
                          <div 
                            key={entry.id} 
                            className="bg-gradient-to-br from-white/90 to-blue-100/90 rounded-xl p-1 sm:p-2 md:p-3 border border-blue-300/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center min-h-0"
                          >
                            <div className="text-xs sm:text-sm md:text-base font-semibold text-blue-600 mb-1">
                              #{index + 1}
                            </div>
                            <div className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-blue-800 leading-tight text-center">
                              {entry.token}
                            </div>
                            <StatusBadge 
                              status={entry.status} 
                              className="text-[8px] sm:text-xs mt-1 px-1 py-0 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Clock className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-blue-400 mx-auto animate-pulse" />
                          <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-blue-600">
                            No tokens in queue
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Control Buttons - Compact floating */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2 z-20">
          <Button
            size="sm"
            variant={audioEnabled ? "default" : "secondary"}
            onClick={toggleAudio}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white/90 hover:bg-white text-slate-800 shadow-lg border border-white/50 backdrop-blur-sm"
          >
            {audioEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />}
          </Button>
          
          <Button
            size="sm"
            variant={isFullscreen ? "default" : "secondary"}
            onClick={toggleFullscreen}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white/90 hover:bg-white text-slate-800 shadow-lg border border-white/50 backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
          </Button>
          
          <Button
            size="sm"
            variant={isOnline ? "default" : "destructive"}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white/90 hover:bg-white text-slate-800 shadow-lg border border-white/50 backdrop-blur-sm"
            disabled
          >
            {isOnline ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />}
          </Button>
        </div>

        {/* Custom Sliding Footer */}
        <div className="relative bg-gradient-to-r from-green-600/90 via-blue-500/90 to-green-600/90 backdrop-blur-sm py-1 sm:py-2 overflow-hidden border-t border-white/20 z-10 flex-shrink-0">
          <div 
            className="animate-marquee whitespace-nowrap flex items-center will-change-transform"
            style={{ animationDuration: '20s' }}
          >
            <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold px-4 sm:px-6 md:px-8 text-shadow-lg tracking-wide">
              🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing {hospitalName} • Excellence in Health & Medical Care
            </span>
            <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold px-4 sm:px-6 md:px-8 text-shadow-lg tracking-wide">
              🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing {hospitalName} • Excellence in Health & Medical Care
            </span>
            <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold px-4 sm:px-6 md:px-8 text-shadow-lg tracking-wide">
              🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing {hospitalName} • Excellence in Health & Medical Care
            </span>
          </div>
        </div>

        {/* Secondary Footer with hospital info */}
        <div className="bg-black/60 backdrop-blur-sm py-1 text-center z-10 flex-shrink-0">
          <p className="text-white/80 text-[10px] sm:text-xs md:text-sm font-medium">
            {footerNote || `${hospitalName} - Excellence in Health & Medical Solutions`}
          </p>
        </div>
      </div>
    </>
  );
};

export default ReceptionDisplay;
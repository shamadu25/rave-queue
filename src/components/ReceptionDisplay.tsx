import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
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
  
  const [currentServing, setCurrentServing] = useState<any>(null);
  const [nextInLine, setNextInLine] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Auto-fullscreen functionality with immediate activation
  useEffect(() => {
    const autoFullscreen = settings?.enable_display_screen !== false;
    if (autoFullscreen && !isFullscreen && document.documentElement.requestFullscreen) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          toast.success('Reception Display - Fullscreen Mode Activated');
        } catch (error) {
          console.log('Fullscreen not supported:', error);
        }
      };
      // Reduced delay for faster activation
      const timer = setTimeout(enterFullscreen, 800);
      return () => clearTimeout(timer);
    }
  }, [settings?.enable_display_screen, isFullscreen]);

  // Initialize audio context immediately for faster response
  useEffect(() => {
    if (enableAudio && !audioInitialized) {
      const initAudio = () => {
        setAudioInitialized(true);
        setUserInteracted(true);
        // Pre-warm the audio system
        if (settings?.enable_announcement_chime) {
          playChime(0.1).catch(() => {}); // Very quiet test chime
        }
      };
      
      // Listen for any user interaction to enable audio
      const events = ['click', 'touchstart', 'keydown'];
      const handler = () => {
        initAudio();
        events.forEach(event => document.removeEventListener(event, handler));
      };
      
      events.forEach(event => document.addEventListener(event, handler, { once: true }));
      
      return () => {
        events.forEach(event => document.removeEventListener(event, handler));
      };
    }
  }, [enableAudio, audioInitialized, settings?.enable_announcement_chime, playChime]);

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
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
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
  const hospitalLogo = currentSettings?.clinic_logo || currentSettings?.clinic_logo_url;
  const headerText = currentSettings?.display_header_text || currentSettings?.header_text || `Welcome to ${hospitalName}`;
  const subText = currentSettings?.reception_subtext || currentSettings?.subtext || 'Please proceed to Reception for registration and verification';
  const tickerText = currentSettings?.ticker_text || currentSettings?.announcement_text || 'For emergency assistance, please dial 911 or inform reception staff immediately.';
  const footerNote = currentSettings?.footer_note || 'Thank you for visiting our hospital';

  return (
    <div 
      className="min-h-screen w-full flex flex-col relative overflow-x-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/30"
      style={{
        background: currentSettings?.display_background_start && currentSettings?.display_background_end 
          ? `linear-gradient(135deg, ${currentSettings.display_background_start}, ${currentSettings.display_background_end})`
          : undefined,
        minHeight: '100vh',
        height: 'auto'
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

      {/* Premium Vertical Layout - Main Content */}
      <div className="flex-1 flex flex-col relative z-10 gap-4 p-2 sm:p-4 md:p-6 lg:p-8">
        
        {/* NOW SERVING Section - Primary & Prominent */}
        <div className="flex-[2.5] flex items-center justify-center">
          <Card className="w-full h-full bg-gradient-to-br from-white/98 via-white/95 to-slate-50/90 backdrop-blur-lg shadow-2xl border-0 overflow-hidden animate-slide-in ring-2 ring-primary/20">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-16 h-full flex flex-col justify-center">
            {currentServing ? (
              <div className="text-center space-y-8 lg:space-y-12">
                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="relative">
                    <CheckCircle2 
                      className="w-24 h-24 lg:w-32 lg:h-32 text-emerald-500 animate-pulse drop-shadow-lg" 
                      strokeWidth={2.5}
                    />
                    <div className="absolute inset-0 w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-emerald-400/20 animate-ping"></div>
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 bg-clip-text text-transparent animate-glow-pulse tracking-tight">
                    NOW SERVING
                  </h2>
                </div>
                
                <div 
                  className="font-black tracking-wider animate-token-glow text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] leading-none drop-shadow-2xl"
                  style={{ 
                    fontSize: currentSettings?.display_token_font_size ? `${currentSettings.display_token_font_size * 1.5}px` : undefined,
                    color: currentSettings?.display_token_color || '#1e293b',
                    textShadow: '0 8px 32px rgba(30, 41, 59, 0.3), 0 0 60px rgba(16, 185, 129, 0.2)',
                    filter: 'drop-shadow(0 8px 32px rgba(30, 41, 59, 0.15))'
                  }}
                >
                  {currentServing.token}
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                  <span className="font-bold text-slate-700 text-center tracking-wide">Please proceed to</span>
                  <ArrowRight className="h-12 w-12 lg:h-16 lg:w-16 text-primary animate-pulse drop-shadow-lg" />
                  <div className="bg-gradient-to-r from-primary via-blue-600 to-primary text-white px-6 py-4 lg:px-10 lg:py-6 rounded-2xl font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl shadow-2xl ring-4 ring-white/30 backdrop-blur-sm">
                    IOM Reception Desk
                  </div>
                </div>
                
                <p 
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-600 mt-8 font-semibold text-center leading-relaxed"
                  style={{ 
                    color: currentSettings?.subtext_color || '#475569',
                    fontSize: currentSettings?.display_department_font_size ? `${currentSettings.display_department_font_size * 1.2}px` : undefined
                  }}
                >
                  {subText || 'Professional Immigration & Medical Services'}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 mt-12">
                  <StatusBadge 
                    status={currentServing.status} 
                    priority={currentServing.priority}
                    className="text-xl lg:text-2xl px-8 py-4 lg:px-12 lg:py-6 shadow-lg"
                  />
                  {currentServing.intended_department && (
                    <Badge variant="outline" className="text-lg lg:text-xl px-6 py-3 lg:px-8 lg:py-4 border-2 border-primary/30 bg-primary/5">
                      Service: {currentServing.intended_department}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 lg:py-24 space-y-8 lg:space-y-12">
                <div className="relative">
                  <Clock className="h-32 w-32 lg:h-40 lg:w-40 text-slate-400 mx-auto animate-pulse" />
                  <div className="absolute inset-0 h-32 w-32 lg:h-40 lg:w-40 mx-auto rounded-full bg-slate-300/20 animate-ping"></div>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-500 tracking-tight">
                  No Current Queue
                </h2>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-400 font-medium">
                  Waiting for next patient...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NEXT IN LINE Section - Secondary & Compact */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full h-full bg-gradient-to-br from-slate-50/95 via-white/90 to-slate-100/85 backdrop-blur-md shadow-xl border-0 overflow-hidden ring-1 ring-slate-200/50">
          <CardContent className="p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center">
            <div className="text-center space-y-4 lg:space-y-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Users className="w-12 h-12 lg:w-16 lg:h-16 text-blue-600 drop-shadow-sm" />
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-blue-600 tracking-tight">NEXT IN LINE</h3>
              </div>
              
              {nextInLine.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 max-w-6xl mx-auto">
                  {nextInLine.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className="bg-gradient-to-br from-blue-50/90 via-white/95 to-blue-100/80 p-4 lg:p-6 rounded-xl shadow-lg animate-fade-in-up border border-blue-200/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center space-y-2 lg:space-y-3 min-w-[80px] lg:min-w-[100px]">
                        <div className="text-2xl lg:text-3xl font-black text-blue-700 tracking-wide drop-shadow-sm">
                          {entry.token}
                        </div>
                        {entry.intended_department && (
                          <Badge variant="secondary" className="text-xs lg:text-sm bg-blue-100 text-blue-700">
                            {entry.intended_department}
                          </Badge>
                        )}
                        <div className="text-sm lg:text-base text-blue-600 font-semibold">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 lg:py-16">
                  <Users className="h-16 w-16 lg:h-20 lg:w-20 text-slate-400 mx-auto mb-6 animate-pulse" />
                  <p className="text-xl lg:text-2xl text-slate-500 text-center font-medium">No patients in queue</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Custom Sliding Footer */}
    <div className="relative bg-gradient-to-r from-green-600/90 via-blue-500/90 to-green-600/90 backdrop-blur-sm py-3 sm:py-4 md:py-5 overflow-hidden border-t border-white/20 z-10">
      <div 
        className="animate-marquee whitespace-nowrap flex items-center will-change-transform"
        style={{ animationDuration: '20s' }}
      >
        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold px-8 sm:px-10 md:px-12 text-shadow-lg tracking-wide">
          🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing IOM SERVICES • Excellence in Immigration & Medical Care
        </span>
        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold px-8 sm:px-10 md:px-12 text-shadow-lg tracking-wide">
          🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing IOM SERVICES • Excellence in Immigration & Medical Care
        </span>
        <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold px-8 sm:px-10 md:px-12 text-shadow-lg tracking-wide">
          🏢 PLEASE WAIT TO BE CALLED • Thanks for choosing IOM SERVICES • Excellence in Immigration & Medical Care
        </span>
      </div>
    </div>

    {/* Secondary Footer with hospital info */}
    <div className="bg-black/60 backdrop-blur-sm py-2 text-center z-10">
      <p className="text-white/80 text-xs sm:text-sm md:text-base font-medium">
        {footerNote || "IOM SERVICES - Excellence in Immigration & Medical Solutions"}
      </p>
    </div>
  </div>
);
};

export default ReceptionDisplay;
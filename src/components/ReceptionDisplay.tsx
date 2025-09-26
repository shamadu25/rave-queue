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
      className="min-h-screen w-full flex flex-col relative overflow-hidden fullscreen-container bg-gradient-to-br from-primary/20 via-background to-secondary/30"
      style={{
        background: currentSettings?.display_background_start && currentSettings?.display_background_end 
          ? `linear-gradient(135deg, ${currentSettings.display_background_start}, ${currentSettings.display_background_end})`
          : undefined
      }}
    >
      {/* Animated Particle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-48 -translate-y-48 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-white/8 rounded-full translate-x-32 animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-white/6 rounded-full translate-y-40 animate-pulse" style={{ animationDelay: '6s' }}></div>
        
        {/* Additional floating elements */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
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

      {/* Custom Sliding Header */}
      <div className="relative bg-gradient-to-r from-blue-600/80 via-green-500/80 to-blue-600/80 backdrop-blur-md border-b border-white/20 shadow-2xl overflow-hidden py-6">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="animate-marquee whitespace-nowrap flex items-center"
            style={{ 
              animationDuration: '25s',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)'
            }}
          >
            <span className="text-white/90 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black px-12 text-shadow-lg tracking-wider">
              WELCOME TO IOM SERVICES - PROFESSIONAL IMMIGRATION & MEDICAL SOLUTIONS
            </span>
            <span className="text-white/90 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black px-12 text-shadow-lg tracking-wider">
              WELCOME TO IOM SERVICES - PROFESSIONAL IMMIGRATION & MEDICAL SOLUTIONS
            </span>
            <span className="text-white/90 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black px-12 text-shadow-lg tracking-wider">
              WELCOME TO IOM SERVICES - PROFESSIONAL IMMIGRATION & MEDICAL SOLUTIONS
            </span>
          </div>
        </div>
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Hospital Branding */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-2xl animate-glow-pulse">
                {hospitalLogo ? (
                  <img 
                    src={hospitalLogo} 
                    alt={hospitalName}
                    className="w-16 h-16 object-contain rounded-full"
                  />
                ) : (
                  <Hospital className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h1 
                  className="font-black text-white text-shadow-lg animate-fade-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                  style={{ 
                    fontSize: currentSettings?.display_header_font_size ? `${currentSettings.display_header_font_size}px` : undefined,
                    color: currentSettings?.display_header_color || '#FFFFFF',
                    textShadow: '0 0 30px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3)',
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))'
                  }}
                >
                  {hospitalName}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-full bg-gray-600/80 flex items-center justify-center text-2xl shadow-lg">
                    🏥
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-300 animate-slide-in">
                      Reception Queue
                    </h2>
                    <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium">Registration & Patient Check-In</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status and Controls */}
            <div className="flex items-center gap-6">
              <div className="text-right text-white">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 animate-fade-in-up">{formatTime(currentTime)}</div>
                <div className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90">{formatDate(currentTime)}</div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white bg-white/20 hover:bg-white/30 transition-all duration-300 shadow-lg"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className={`${audioEnabled ? 'text-white bg-green-500/30 shadow-green-500/20' : 'text-white/60 bg-white/10'} hover:bg-white/30 transition-all duration-300 shadow-lg`}
                >
                  {audioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
                
                <div className="flex items-center gap-2 text-white/90 bg-white/15 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                  {isOnline ? <Wifi className="h-5 w-5 text-green-300" /> : <WifiOff className="h-5 w-5 text-red-300" />}
                  <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          
          {/* NOW SERVING Section */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full h-full bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden animate-slide-in">
              <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 h-full flex flex-col justify-center">
              {currentServing ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-6 mb-8">
                    <CheckCircle2 
                      className="w-20 h-20 text-green-500 animate-pulse" 
                      strokeWidth={2}
                    />
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent animate-glow-pulse">
                      NOW SERVING
                    </h2>
                  </div>
                  
                  <div 
                    className="font-black tracking-wider animate-token-glow text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                    style={{ 
                      fontSize: currentSettings?.display_token_font_size ? `${currentSettings.display_token_font_size}px` : undefined,
                      color: currentSettings?.display_token_color || '#6B7280',
                      textShadow: currentSettings?.display_token_glow ? '0 0 40px #6B728040' : 'none',
                      filter: 'drop-shadow(0 4px 20px rgba(107, 114, 128, 0.3))'
                    }}
                  >
                    {currentServing.token}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-lg sm:text-2xl md:text-3xl">
                    <span className="font-medium text-muted-foreground text-center">Please proceed to</span>
                    <ArrowRight className="h-8 w-8 sm:h-12 sm:w-12 text-gray-600 animate-pulse" />
                    <div className="bg-gray-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg font-bold text-xl sm:text-2xl md:text-3xl shadow-lg">
                      Reception Desk
                    </div>
                  </div>
                  
                  <p 
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mt-6 font-medium text-center"
                    style={{ 
                      color: currentSettings?.subtext_color || '#6B7280',
                      fontSize: currentSettings?.display_department_font_size ? `${currentSettings.display_department_font_size}px` : undefined
                    }}
                  >
                    {subText}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mt-8">
                    <StatusBadge 
                      status={currentServing.status} 
                      priority={currentServing.priority}
                      className="text-lg sm:text-xl md:text-2xl px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4"
                    />
                    {currentServing.intended_department && (
                      <Badge variant="outline" className="text-base sm:text-lg md:text-xl px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3">
                        Service: {currentServing.intended_department}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 sm:py-16 md:py-20 space-y-4 sm:space-y-6 md:space-y-8">
                  <Clock className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground mx-auto animate-pulse" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground">
                    No Current Queue
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">
                    Waiting for next patient...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEXT IN LINE Section */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full h-full bg-white/90 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center">
              <div className="text-center space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-blue-600" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 text-center">NEXT IN LINE</h3>
                </div>
                
                {nextInLine.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {nextInLine.map((entry, index) => (
                      <div 
                        key={entry.id}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 md:p-6 rounded-lg shadow-lg animate-fade-in-up border-2 border-blue-200"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="text-center space-y-2 sm:space-y-3">
                          <div className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600">
                            {entry.token}
                          </div>
                          {entry.intended_department && (
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                              {entry.intended_department}
                            </Badge>
                          )}
                          <div className="text-xs sm:text-sm text-blue-500 font-medium">
                            Position {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 sm:py-12">
                    <Users className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                    <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground text-center">No patients waiting</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Sliding Footer */}
      <div className="relative bg-gradient-to-r from-green-600/90 via-blue-500/90 to-green-600/90 backdrop-blur-sm py-3 sm:py-4 md:py-5 overflow-hidden border-t border-white/20">
        <div 
          className="animate-marquee whitespace-nowrap flex items-center"
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
      <div className="bg-black/60 backdrop-blur-sm py-2 text-center">
        <p className="text-white/80 text-xs sm:text-sm md:text-base font-medium">
          {footerNote || "IOM SERVICES - Excellence in Immigration & Medical Solutions"}
        </p>
      </div>
    </div>
  );
};

export default ReceptionDisplay;
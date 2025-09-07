import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  ArrowRight,
  Building2,
  Hospital,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface QueueDisplayPageProps {
  department?: string;
  showUpcoming?: boolean;
  enableAudio?: boolean;
}

// Offline cache management
const CACHE_KEY = 'queueDisplay_cache';
const SETTINGS_CACHE_KEY = 'queueDisplay_settings_cache';

interface CachedData {
  entries: any[];
  settings: any;
  timestamp: number;
}

const QueueDisplayPage = ({ 
  department, 
  showUpcoming = true, 
  enableAudio = true 
}: QueueDisplayPageProps) => {
  const { entries, loading, error } = useQueueMonitor();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { announceWithChime, isEnabled } = useTextToSpeech();
  
  const [currentlyServing, setCurrentlyServing] = useState<any>(null);
  const [upcomingTokens, setUpcomingTokens] = useState<any[]>([]);
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
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 10;
  
  // Dynamic document title and favicon updates
  useEffect(() => {
    const hospitalName = settings?.clinic_name || 'Queue Display';
    document.title = `${hospitalName} - Live Queue Display`;
    
    // Update favicon if logo exists
    if (settings?.clinic_logo) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.clinic_logo;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = settings.clinic_logo;
        document.head.appendChild(newFavicon);
      }
    }
  }, [settings?.clinic_name, settings?.clinic_logo]);

  // Cache management
  const saveToCache = useCallback((entries: any[], settings: any) => {
    const cacheData: CachedData = {
      entries,
      settings,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }, []);

  const loadFromCache = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache is valid for 10 minutes
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
    return null;
  }, []);

  // Auto-fullscreen functionality
  useEffect(() => {
    const autoFullscreen = settings?.enable_display_screen !== false;
    if (autoFullscreen && !isFullscreen && document.documentElement.requestFullscreen) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch (error) {
          console.log('Fullscreen not supported or denied:', error);
        }
      };
      
      // Delay to allow user interaction
      const timer = setTimeout(enterFullscreen, 2000);
      return () => clearTimeout(timer);
    }
  }, [settings?.enable_display_screen, isFullscreen]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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

  // Connection monitoring and auto-reconnect
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineMode(false);
      setReconnectAttempts(0);
      setIsReconnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      const cached = loadFromCache();
      if (cached) {
        setCachedData(cached);
        toast.warning('Offline mode - Displaying cached data');
      } else {
        toast.error('No cached data available');
      }
      startReconnectAttempts();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [loadFromCache]);

  const startReconnectAttempts = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setIsReconnecting(false);
      toast.error('Max reconnection attempts reached');
      return;
    }

    setIsReconnecting(true);
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      
      // Attempt to reconnect by checking online status
      if (navigator.onLine) {
        setIsOnline(true);
        setOfflineMode(false);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        toast.success('Reconnected successfully');
      } else {
        startReconnectAttempts();
      }
    }, delay);
  }, [reconnectAttempts, maxReconnectAttempts]);

  // Cache current data when online
  useEffect(() => {
    if (isOnline && entries && settings && !loading && !settingsLoading) {
      saveToCache(entries, settings);
    }
  }, [entries, settings, loading, settingsLoading, isOnline, saveToCache]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Initialize user interaction and audio
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Real-time settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      // Force re-render with new settings
      console.log('Settings updated in queue display:', event.detail);
    };

    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
  }, []);

  // Process queue entries and handle announcements
  useEffect(() => {
    const currentEntries = offlineMode && cachedData ? cachedData.entries : entries;
    
    if (!currentEntries || currentEntries.length === 0) {
      setCurrentlyServing(null);
      setUpcomingTokens([]);
      return;
    }

    // Filter by department if specified
    const filteredEntries = department 
      ? currentEntries.filter(entry => entry.department === department)
      : currentEntries;

    // Find currently serving tokens
    const serving = filteredEntries.filter(entry => 
      entry.status === 'Called' || entry.status === 'Served'
    );

    // Find waiting tokens
    const waiting = filteredEntries.filter(entry => 
      entry.status === 'Waiting'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const currentServing = serving.length > 0 ? serving[serving.length - 1] : null;
    
    if (currentServing) {
      setCurrentlyServing(currentServing);
      
      // Trigger announcement for new tokens (only when online)
      if (!offlineMode && 
          audioEnabled && 
          settings?.enable_voice_announcements &&
          currentServing.token !== lastAnnouncedToken &&
          currentServing.status === 'Called' &&
          userInteracted) {
        
        const template = settings?.announcement_template || 
          'Token {number}, please proceed to {department} at {hospitalName}';
        
        announceWithChime(
          currentServing.token,
          currentServing.department,
          getCounterForDepartment(currentServing.department),
          template
        );
        
        setLastAnnouncedToken(currentServing.token);
      }
    } else {
      setCurrentlyServing(null);
    }

    setUpcomingTokens(waiting.slice(0, 5));
  }, [entries, cachedData, offlineMode, department, audioEnabled, lastAnnouncedToken, userInteracted, settings]);

  const getCounterForDepartment = (dept: string): string => {
    switch (dept) {
      case 'Consultation': return 'Counter 1';
      case 'Lab': return 'Counter 2';
      case 'Pharmacy': return 'Counter 3';
      case 'X-ray': return 'Counter 4';
      case 'Scan': return 'Counter 5';
      case 'Billing': return 'Counter 6';
      default: return 'Reception';
    }
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

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const currentSettings = offlineMode && cachedData ? cachedData.settings : settings;
  const hospitalName = currentSettings?.clinic_name || 'Your Hospital Name';
  const hospitalLogo = currentSettings?.clinic_logo;
  const headerText = currentSettings?.display_header_text || `Welcome to ${hospitalName}`;
  const tickerText = currentSettings?.ticker_text || 'Welcome to our hospital. For emergency assistance, dial 911.';

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${currentSettings?.display_background_start || '#3B82F6'}, ${currentSettings?.display_background_end || '#1D4ED8'})`
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-48 -translate-y-48 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-32 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-white/5 rounded-full translate-y-40 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Connection Status Banner */}
      {(offlineMode || isReconnecting) && (
        <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-6 py-3 text-center font-medium">
          <div className="flex items-center justify-center gap-2">
            {isReconnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Reconnecting... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Offline Mode - Displaying Last Updates
              </>
            )}
          </div>
        </div>
      )}

      {/* Sliding Glowing Header */}
      <div className="relative bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse"></div>
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Hospital Branding */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
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
                  className="font-bold text-white text-shadow-lg animate-fade-in"
                  style={{ 
                    fontSize: `${currentSettings?.display_header_font_size || 36}px`,
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                    textShadow: '0 0 30px rgba(255,255,255,0.3)'
                  }}
                >
                  {headerText}
                </h1>
                <p className="text-white/90 text-xl font-medium mt-1">
                  Live Queue Management System
                </p>
              </div>
            </div>
            
            {/* Status and Controls */}
            <div className="flex items-center gap-6">
              <div className="text-right text-white">
                <div className="text-3xl font-bold mb-1">{formatTime(currentTime)}</div>
                <div className="text-lg opacity-90">{formatDate(currentTime)}</div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white bg-white/20 hover:bg-white/30 transition-all duration-300"
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className={`${audioEnabled ? 'text-white bg-white/20' : 'text-white/60 bg-white/10'} hover:bg-white/30 transition-all duration-300`}
                >
                  {audioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
                
                <div className="flex items-center gap-2 text-white/90 bg-white/10 px-3 py-2 rounded-lg">
                  {isOnline ? <Wifi className="h-5 w-5 text-green-300" /> : <WifiOff className="h-5 w-5 text-red-300" />}
                  <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Currently Serving - Enhanced */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-12">
              {currentlyServing ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-4xl">🎟️</span>
                    </div>
                    <h2 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Now Serving
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div 
                      className={`font-black text-primary tracking-wider animate-pulse ${
                        currentSettings?.display_token_glow ? 'filter drop-shadow-2xl' : ''
                      }`}
                      style={{ 
                        fontSize: `${currentSettings?.display_token_font_size || 80}px`,
                        textShadow: currentSettings?.display_token_glow ? '0 0 30px rgba(59, 130, 246, 0.6)' : 'none'
                      }}
                    >
                      {currentlyServing.token}
                    </div>
                    
                    <div 
                      className="flex items-center justify-center gap-6 text-muted-foreground"
                      style={{ fontSize: `${currentSettings?.display_department_font_size || 24}px` }}
                    >
                      <span className="font-medium">Please proceed to</span>
                      <ArrowRight className="h-10 w-10 text-primary animate-pulse" />
                      <span className="font-bold text-primary bg-primary/10 px-6 py-3 rounded-lg text-2xl">
                        {getCounterForDepartment(currentlyServing.department)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 mt-8">
                      <Badge 
                        variant="outline" 
                        className="text-2xl px-8 py-4 font-semibold border-2 bg-primary/10 border-primary"
                      >
                        <Building2 className="h-6 w-6 mr-2" />
                        {currentlyServing.department}
                      </Badge>
                      
                      <StatusBadge 
                        status={currentlyServing.status} 
                        priority={currentlyServing.priority}
                        className="text-2xl px-8 py-4"
                      />
                      
                      {currentlyServing.priority === 'Emergency' && (
                        <Badge variant="destructive" className="text-2xl px-8 py-4 animate-bounce">
                          🚨 Emergency
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-8">
                  <div className="w-40 h-40 bg-muted/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Clock className="h-20 w-20 text-muted-foreground" />
                  </div>
                  <h2 className="text-6xl font-bold text-muted-foreground">No Active Queue</h2>
                  <p className="text-3xl text-muted-foreground">Please wait for the next announcement</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tokens - Enhanced */}
          {showUpcoming && upcomingTokens.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-8">
                <h3 className="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                  <Clock className="h-10 w-10 text-primary animate-spin" />
                  Next in Queue
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {upcomingTokens.map((token, index) => (
                    <div
                      key={token.id}
                      className={`
                        p-6 rounded-xl border-2 text-center transition-all duration-500 hover:scale-105
                        ${index === 0 ? 
                          'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg scale-105' : 
                          'border-muted bg-gradient-to-br from-muted/30 to-muted/10'
                        }
                      `}
                    >
                      <div className={`text-3xl font-black mb-3 ${
                        index === 0 ? 'text-primary animate-pulse' : 'text-muted-foreground'
                      }`}>
                        {token.token}
                      </div>
                      <div className="text-base text-muted-foreground font-medium">
                        {token.department}
                      </div>
                      {index === 0 && (
                        <Badge variant="default" className="mt-3 bg-primary text-white px-3 py-1">
                          Next Up
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Announcements Ticker */}
      <div className="bg-primary/90 backdrop-blur-sm border-t border-white/20 shadow-lg overflow-hidden">
        <div className="flex items-center py-4 px-6">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl animate-pulse">📢</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div 
              className="text-white font-medium whitespace-nowrap animate-marquee"
              style={{ 
                fontSize: `${currentSettings?.display_ticker_font_size || 20}px`,
                animationDuration: `${100 - (currentSettings?.ticker_speed || 50)}s`
              }}
            >
              {tickerText}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 py-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/90 text-lg">
            Powered by {hospitalName} Queue System © 2024 • 
            {audioEnabled && currentSettings?.enable_voice_announcements && !offlineMode ? 
              <span className="text-green-300 font-medium ml-2">🔊 Audio Enabled</span> : 
              <span className="text-white/70 ml-2">🔇 Audio {offlineMode ? 'Paused (Offline)' : 'Disabled'}</span>
            }
            {isFullscreen && <span className="text-blue-300 font-medium ml-2">⛶ Fullscreen</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueueDisplayPage;
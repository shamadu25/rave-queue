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
  Building2,
  Hospital,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  RefreshCw,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

interface UniversalQueueDisplayProps {
  enableAudio?: boolean;
}

// Offline cache management
const CACHE_KEY = 'universalDisplay_cache';

interface CachedData {
  entries: any[];
  settings: any;
  timestamp: number;
}

const UniversalQueueDisplay = ({ enableAudio = true }: UniversalQueueDisplayProps) => {
  const { entries, loading, error } = useQueueMonitor();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { announceWithChime, isEnabled } = useTextToSpeech();
  
  const [departmentQueues, setDepartmentQueues] = useState<{[key: string]: {currentServing: any; waiting: any[]; totalWaiting: number}}>({});
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [lastAnnouncedTokens, setLastAnnouncedTokens] = useState<{[key: string]: string}>({});
  const [userInteracted, setUserInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const maxReconnectAttempts = 10;

  // Department configuration with colors and icons
  const departmentConfig = {
    'Consultation': { color: '#3B82F6', icon: '👨‍⚕️', counter: 'Room 1-3' },
    'Lab': { color: '#10B981', icon: '🧪', counter: 'Lab Counter' },
    'Pharmacy': { color: '#F59E0B', icon: '💊', counter: 'Pharmacy' },
    'X-ray': { color: '#8B5CF6', icon: '📡', counter: 'X-ray Room' },
    'Scan': { color: '#EF4444', icon: '🏥', counter: 'Scan Room' },
    'Billing': { color: '#06B6D4', icon: '💳', counter: 'Billing Counter' }
  };

  // Dynamic document title and favicon updates
  useEffect(() => {
    const hospitalName = settings?.clinic_name || 'Queue Display';
    document.title = `${hospitalName} - Universal Queue Display`;
    
    if (settings?.clinic_logo) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.clinic_logo;
      }
    }
  }, [settings?.clinic_name, settings?.clinic_logo]);

  // Cache management
  const saveToCache = useCallback((entries: any[], settings: any) => {
    const cacheData: CachedData = { entries, settings, timestamp: Date.now() };
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
          console.log('Fullscreen not supported:', error);
        }
      };
      const timer = setTimeout(enterFullscreen, 2000);
      return () => clearTimeout(timer);
    }
  }, [settings?.enable_display_screen, isFullscreen]);

  // Connection monitoring and auto-reconnect logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineMode(false);
      setReconnectAttempts(0);
      setIsReconnecting(false);
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

  // Process queue entries by department
  useEffect(() => {
    const currentEntries = offlineMode && cachedData ? cachedData.entries : entries;
    
    if (!currentEntries || currentEntries.length === 0) {
      setDepartmentQueues({});
      return;
    }

    // Group entries by department
    const queues: {[key: string]: {currentServing: any; waiting: any[]; totalWaiting: number}} = {};
    
    Object.keys(departmentConfig).forEach(dept => {
      const deptEntries = currentEntries.filter(entry => entry.department === dept);
      
      // Find currently serving tokens
      const serving = deptEntries.filter(entry => 
        entry.status === 'Called' || entry.status === 'Served'
      );
      
      // Find waiting tokens
      const waiting = deptEntries.filter(entry => 
        entry.status === 'Waiting'
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const currentServing = serving.length > 0 ? serving[serving.length - 1] : null;
      
      queues[dept] = {
        currentServing,
        waiting: waiting.slice(0, 3),
        totalWaiting: waiting.length
      };

      // Handle announcements for each department
      if (!offlineMode && 
          currentServing && 
          audioEnabled && 
          settings?.enable_voice_announcements &&
          currentServing.token !== lastAnnouncedTokens[dept] &&
          currentServing.status === 'Called' &&
          userInteracted) {
        
        const template = settings?.announcement_template || 
          'Token {number}, please proceed to {room}, {department} at {hospitalName}';
        
        announceWithChime(
          currentServing.token,
          currentServing.department,
          departmentConfig[dept].counter,
          template
        );
        
        setLastAnnouncedTokens(prev => ({
          ...prev,
          [dept]: currentServing.token
        }));
      }
    });

    setDepartmentQueues(queues);
  }, [entries, cachedData, offlineMode, audioEnabled, lastAnnouncedTokens, userInteracted, settings]);

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

  const toggleAudio = () => setAudioEnabled(!audioEnabled);

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
      {/* Animated Background */}
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

      {/* Hospital Header */}
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
                    fontSize: `${currentSettings?.display_header_font_size || 42}px`,
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                    textShadow: '0 0 30px rgba(255,255,255,0.3)'
                  }}
                >
                  {headerText}
                </h1>
                <p className="text-white/90 text-xl font-medium mt-1 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Universal Queue Management System
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

      {/* Department Queue Grid */}
      <div className="flex-1 p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(departmentConfig).map(([department, config]) => {
              const queue = departmentQueues[department];
              const hasQueue = queue && (queue.currentServing || queue.waiting.length > 0);
              
              return (
                <Card 
                  key={department}
                  className="bg-white/95 backdrop-blur-sm shadow-xl border-0 overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    {/* Department Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: config.color + '20' }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl" style={{ color: config.color }}>
                          {department}
                        </h3>
                        <p className="text-sm text-muted-foreground">{config.counter}</p>
                      </div>
                    </div>

                    {/* Current Token */}
                    {queue?.currentServing ? (
                      <div className="text-center mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Now Serving</div>
                        <div 
                          className="text-4xl font-black mb-2 animate-pulse"
                          style={{ 
                            color: config.color,
                            textShadow: currentSettings?.display_token_glow ? `0 0 20px ${config.color}40` : 'none'
                          }}
                        >
                          {queue.currentServing.token}
                        </div>
                        <StatusBadge 
                          status={queue.currentServing.status} 
                          priority={queue.currentServing.priority}
                          className="text-sm"
                        />
                      </div>
                    ) : (
                      <div className="text-center mb-4 py-8">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <div className="text-lg text-muted-foreground">No Queue</div>
                      </div>
                    )}

                    {/* Waiting Count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Waiting</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="font-semibold"
                        style={{ borderColor: config.color, color: config.color }}
                      >
                        {queue?.totalWaiting || 0}
                      </Badge>
                    </div>

                    {/* Next in Queue */}
                    {queue?.waiting && queue.waiting.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-muted-foreground mb-2">Next Up</div>
                        <div className="flex gap-2">
                          {queue.waiting.slice(0, 3).map((token: any, index: number) => (
                            <div 
                              key={token.id}
                              className={`text-sm font-medium px-2 py-1 rounded ${
                                index === 0 ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'
                              }`}
                            >
                              {token.token}
                            </div>
                          ))}
                          {queue.waiting.length > 3 && (
                            <div className="text-sm text-muted-foreground px-2 py-1">
                              +{queue.waiting.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
            {hospitalName} © 2024 • Universal Queue Display • 
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

export default UniversalQueueDisplay;
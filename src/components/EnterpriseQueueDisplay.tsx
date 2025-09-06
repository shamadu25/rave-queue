import React, { useEffect, useState, useRef } from 'react';
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
  WifiOff
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface EnterpriseQueueDisplayProps {
  department?: string;
  showUpcoming?: boolean;
  enableAudio?: boolean;
}

export function EnterpriseQueueDisplay({ 
  department, 
  showUpcoming = true, 
  enableAudio = true 
}: EnterpriseQueueDisplayProps) {
  const { entries, loading } = useQueueMonitor();
  const { settings } = useSystemSettings();
  const { announceWithChime, isEnabled } = useTextToSpeech();
  
  const [currentlyServing, setCurrentlyServing] = useState<any>(null);
  const [upcomingTokens, setUpcomingTokens] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tickerText, setTickerText] = useState('');
  const [headerText, setHeaderText] = useState('');

  // Real-time settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      // Force re-render with new settings
      setTickerText(event.detail?.ticker_text || settings?.ticker_text || '');
      setHeaderText(event.detail?.display_header_text || settings?.display_header_text || '');
    };

    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
  }, [settings]);

  // Initialize display text from settings
  useEffect(() => {
    setTickerText(settings?.ticker_text || 'Welcome to our hospital. For emergency assistance, dial 911.');
    setHeaderText(settings?.display_header_text || `Welcome to ${settings?.clinic_name || 'Your Hospital'}`);
  }, [settings]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Process queue entries and handle announcements
  useEffect(() => {
    if (!entries || entries.length === 0) {
      setCurrentlyServing(null);
      setUpcomingTokens([]);
      return;
    }

    // Filter by department if specified
    const filteredEntries = department 
      ? entries.filter(entry => entry.department === department)
      : entries;

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
      
      // Trigger announcement for new tokens
      if (audioEnabled && 
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

    setUpcomingTokens(waiting.slice(0, 3));
  }, [entries, department, audioEnabled, lastAnnouncedToken, userInteracted, settings]);

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

  const hospitalName = settings?.clinic_name || 'Your Hospital Name';
  const hospitalLogo = settings?.clinic_logo;

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${settings?.display_background_start || '#3B82F6'}, ${settings?.display_background_end || '#1D4ED8'})`
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-48 -translate-y-48 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-32 animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-white/5 rounded-full translate-y-40 animate-pulse delay-4000"></div>
      </div>

      {/* Sliding Glowing Header */}
      <div className="relative bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse"></div>
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Hospital Branding */}
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                {hospitalLogo ? (
                  <img 
                    src={hospitalLogo} 
                    alt={hospitalName}
                    className="w-12 h-12 object-contain rounded-full"
                  />
                ) : (
                  <Hospital className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 
                  className="font-bold text-white text-shadow-lg animate-fade-in"
                  style={{ 
                    fontSize: `${settings?.display_header_font_size || 32}px`,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                >
                  {headerText}
                </h1>
                <p className="text-white/90 text-lg font-medium">
                  Live Queue Management System
                </p>
              </div>
            </div>
            
            {/* Status and Controls */}
            <div className="flex items-center gap-6">
              <div className="text-right text-white">
                <div className="text-2xl font-bold mb-1">{formatTime(currentTime)}</div>
                <div className="text-sm opacity-90">{formatDate(currentTime)}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className={`${audioEnabled ? 'text-white bg-white/20' : 'text-white/60 bg-white/10'} hover:bg-white/30 transition-all duration-300`}
                >
                  {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                
                <div className="flex items-center gap-1 text-white/90">
                  {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  <span className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>
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
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-3xl">🎟️</span>
                    </div>
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Now Serving
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div 
                      className={`font-black text-primary tracking-wider animate-pulse ${
                        settings?.display_token_glow ? 'filter drop-shadow-2xl' : ''
                      }`}
                      style={{ 
                        fontSize: `${settings?.display_token_font_size || 64}px`,
                        textShadow: settings?.display_token_glow ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                      }}
                    >
                      {currentlyServing.token}
                    </div>
                    
                    <div 
                      className="flex items-center justify-center gap-4 text-muted-foreground"
                      style={{ fontSize: `${settings?.display_department_font_size || 20}px` }}
                    >
                      <span className="font-medium">Please proceed to</span>
                      <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
                      <span className="font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
                        {getCounterForDepartment(currentlyServing.department)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 mt-8">
                      <Badge 
                        variant="outline" 
                        className={`text-xl px-6 py-3 font-semibold border-2 ${
                          settings?.display_department_colors ? 
                          `bg-${currentlyServing.department.toLowerCase()}/10 border-${currentlyServing.department.toLowerCase()}` : 
                          'bg-primary/10 border-primary'
                        }`}
                      >
                        <Building2 className="h-5 w-5 mr-2" />
                        {currentlyServing.department}
                      </Badge>
                      
                      <StatusBadge 
                        status={currentlyServing.status} 
                        priority={currentlyServing.priority}
                        className="text-xl px-6 py-3"
                      />
                      
                      {currentlyServing.priority === 'Emergency' && (
                        <Badge variant="destructive" className="text-xl px-6 py-3 animate-bounce">
                          🚨 Emergency
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-8">
                  <div className="w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Clock className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <h2 className="text-5xl font-bold text-muted-foreground">No Active Queue</h2>
                  <p className="text-2xl text-muted-foreground">Please wait for the next announcement</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tokens - Enhanced */}
          {showUpcoming && upcomingTokens.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-8">
                <h3 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                  <Clock className="h-8 w-8 text-primary animate-spin" />
                  Next in Queue
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {upcomingTokens.map((token, index) => (
                    <div
                      key={token.id}
                      className={`
                        p-8 rounded-xl border-2 text-center transition-all duration-500 hover:scale-105
                        ${index === 0 ? 
                          'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg' : 
                          'border-muted bg-gradient-to-br from-muted/30 to-muted/10'
                        }
                      `}
                    >
                      <div className={`text-4xl font-black mb-3 ${
                        index === 0 ? 'text-primary animate-pulse' : 'text-muted-foreground'
                      }`}>
                        {token.token}
                      </div>
                      <div className="text-lg text-muted-foreground font-medium">
                        {token.department}
                      </div>
                      {index === 0 && (
                        <Badge variant="default" className="mt-3 bg-primary text-white px-4 py-1">
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
                fontSize: `${settings?.display_ticker_font_size || 18}px`,
                animationDuration: `${100 - (settings?.ticker_speed || 50)}s`
              }}
            >
              {tickerText}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 py-3">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/90 text-sm">
            {hospitalName} © 2024 • Enterprise Queue Management System • 
            {audioEnabled && settings?.enable_voice_announcements ? 
              <span className="text-green-300 font-medium ml-2">🔊 Audio Enabled</span> : 
              <span className="text-white/70 ml-2">🔇 Audio Disabled</span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
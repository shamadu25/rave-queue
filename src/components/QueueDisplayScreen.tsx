import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextToSpeechService } from '@/components/TextToSpeechService';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { 
  Volume2, 
  VolumeX, 
  Activity, 
  Clock,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

interface QueueDisplayScreenProps {
  department?: string;
  showUpcoming?: boolean;
  enableAudio?: boolean;
}

export function QueueDisplayScreen({ 
  department, 
  showUpcoming = true, 
  enableAudio = true 
}: QueueDisplayScreenProps) {
  const { entries, loading } = useQueueMonitor();
  const { settings } = useSystemSettings();
  const [currentlyServing, setCurrentlyServing] = useState<any>(null);
  const [upcomingTokens, setUpcomingTokens] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false);
  
  const ttsService = useRef<TextToSpeechService | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize TTS service and enable user interaction
  useEffect(() => {
    // Check if voice announcements are enabled in settings
    const voiceEnabled = settings.enable_voice_announcements !== false;
    
    if (audioEnabled && voiceEnabled && !ttsService.current) {
      ttsService.current = TextToSpeechService.enableAudioOnUserInteraction();
    }

    // Set up user interaction detection
    const handleUserInteraction = () => {
      setUserInteracted(true);
      if (ttsService.current) {
        ttsService.current.setUserInteracted();
      }
    };

    // Add event listeners for first user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioEnabled, settings.enable_voice_announcements]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Process queue entries and trigger announcements
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

    // Find currently serving tokens (Called or Served status)
    const serving = filteredEntries.filter(entry => 
      entry.status === 'Called' || entry.status === 'Served'
    );

    // Find waiting tokens
    const waiting = filteredEntries.filter(entry => 
      entry.status === 'Waiting'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Set currently serving (most recent)
    const currentServing = serving.length > 0 ? serving[serving.length - 1] : null;
    
    if (currentServing) {
      setCurrentlyServing(currentServing);
      
      // Trigger audio announcement for new tokens
      if (audioEnabled && 
          settings.enable_voice_announcements !== false &&
          ttsService.current && 
          currentServing.token !== lastAnnouncedToken &&
          currentServing.status === 'Called' &&
          userInteracted) {
        
        const counter = getCounterForDepartment(currentServing.department);
        
        // Use system settings for voice parameters
        const useNativeVoice = settings.use_native_voice !== false;
        if (useNativeVoice) {
          // Configure TTS with system settings
          const voiceRate = parseFloat(settings.voice_rate?.toString() || '0.8');
          const voicePitch = parseFloat(settings.voice_pitch?.toString() || '1.0');
          const voiceVolume = parseFloat(settings.voice_volume?.toString() || '1.0');
          
          ttsService.current.speak(
            `Now serving token ${currentServing.token}. Please proceed to ${counter} in ${currentServing.department}.`,
            {
              rate: voiceRate,
              pitch: voicePitch,
              volume: voiceVolume,
              repeatCount: 2
            }
          );
        } else {
          // Use chime and announce for MP3-based fallback
          ttsService.current.chimeAndAnnounce(
            currentServing.token, 
            counter, 
            currentServing.department
          );
        }
        
        setLastAnnouncedToken(currentServing.token);
      }
    } else {
      setCurrentlyServing(null);
    }

    // Set upcoming tokens (next 3)
    setUpcomingTokens(waiting.slice(0, 3));
  }, [entries, department, audioEnabled, lastAnnouncedToken]);

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

  const toggleAudio = () => {
    if (audioEnabled && ttsService.current) {
      ttsService.current.stop();
    }
    setAudioEnabled(!audioEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {department ? `${department} Department` : settings.clinic_name?.toString().replace(/"/g, '') || 'SG CLINIC'}
              </h1>
              <p className="text-muted-foreground">
                {department ? 'Department Queue Display' : 'Live Queue Status'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-semibold">{formatTime(currentTime)}</div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={audioEnabled ? 'text-primary' : 'text-muted-foreground'}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Currently Serving */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-12">
              {currentlyServing ? (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎟️</span>
                    </div>
                    <h2 className="text-4xl font-bold text-foreground">Now Serving</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-8xl font-bold text-primary tracking-wider">
                      {currentlyServing.token}
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 text-2xl text-muted-foreground">
                      <span>Please proceed to</span>
                      <ArrowRight className="h-6 w-6" />
                      <span className="font-semibold text-foreground">
                        {getCounterForDepartment(currentlyServing.department)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        <Building2 className="h-4 w-4 mr-2" />
                        {currentlyServing.department}
                      </Badge>
                      <StatusBadge 
                        status={currentlyServing.status} 
                        priority={currentlyServing.priority}
                        className="text-lg px-4 py-2"
                      />
                      {currentlyServing.priority === 'Emergency' && (
                        <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
                          🚨 Emergency
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-4xl font-bold text-muted-foreground">No Active Queue</h2>
                  <p className="text-xl text-muted-foreground">Please wait for the next announcement</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tokens */}
          {showUpcoming && upcomingTokens.length > 0 && (
            <Card className="bg-white shadow-md">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Next in Queue
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingTokens.map((token, index) => (
                    <div
                      key={token.id}
                      className={`
                        p-6 rounded-lg border-2 text-center transition-all duration-200
                        ${index === 0 ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}
                      `}
                    >
                      <div className={`text-3xl font-bold mb-2 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {token.token}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {token.department}
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="mt-2">
                          Next Up
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="bg-white shadow-md">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Updating queue status...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            {settings.clinic_name?.toString().replace(/"/g, '') || 'SG CLINIC'} Queue Management System • Live Updates • 
            {audioEnabled && settings.enable_voice_announcements !== false ? 
              (userInteracted ? ' 🔊 Audio Ready' : ' 🔊 Click to Enable Audio') : 
              ' 🔇 Audio Disabled'
            }
            {settings.use_native_voice !== false ? ' • Native Voice' : ' • Enhanced Audio'}
          </p>
        </div>
      </div>
    </div>
  );
}
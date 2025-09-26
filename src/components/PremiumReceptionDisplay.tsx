import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { 
  Clock,
  Hospital,
  Users,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';

interface PremiumReceptionDisplayProps {
  enableAudio?: boolean;
}

const PremiumReceptionDisplay = ({ enableAudio = true }: PremiumReceptionDisplayProps) => {
  const { entries, loading } = useQueueMonitor();
  const { settings } = useSystemSettings();
  const { announceWithChime } = useTextToSpeech();
  
  const [currentServing, setCurrentServing] = useState<any>(null);
  const [nextInQueue, setNextInQueue] = useState<any[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle user interaction for audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [userInteracted]);

  // Document title and favicon
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

  // Process reception queue entries
  useEffect(() => {
    if (!entries || entries.length === 0) {
      setCurrentServing(null);
      setNextInQueue([]);
      return;
    }

    // Filter only Reception department entries
    const receptionEntries = entries.filter(entry => 
      entry.department === 'Reception'
    );

    // Find currently serving token
    const serving = receptionEntries.find(entry => entry.status === 'Called');
    setCurrentServing(serving);

    // Get waiting tokens (next 5)
    const waiting = receptionEntries
      .filter(entry => entry.status === 'Waiting')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 5);
    
    setNextInQueue(waiting);

    // Audio announcements
    if (serving && 
        audioEnabled && 
        userInteracted && 
        settings?.enable_announcements && 
        serving.token !== lastAnnouncedToken) {
      
      const template = settings?.announcement_template || "Now serving token {token} at Reception";
      announceWithChime(serving.token, 'Reception', 'Reception Desk', template);
      setLastAnnouncedToken(serving.token);
    }
  }, [entries, audioEnabled, userInteracted, settings, lastAnnouncedToken, announceWithChime]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date): string => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 flex items-center justify-center">
        <div className="animate-pulse text-2xl text-muted-foreground">Loading Reception Queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-muted/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Premium Header */}
      <div className="relative z-10 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-xl border-b border-border/50 shadow-2xl">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Hospital Branding */}
            <div className="flex items-center space-x-6">
              {settings?.clinic_logo ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <img 
                    src={settings.clinic_logo} 
                    alt="Hospital Logo" 
                    className="relative w-16 h-16 object-cover rounded-full border-2 border-primary/30 shadow-lg"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                    <Hospital className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {settings?.clinic_name || 'Reception Queue'}
                </h1>
                <p className="text-muted-foreground font-medium">Waiting Area Display</p>
              </div>
            </div>

            {/* Date, Time & Controls */}
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {formatDate(currentTime)}
                </div>
              </div>
              
              <button
                onClick={toggleAudio}
                className="p-3 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          
          {/* Now Serving Section */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl border-primary/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 rounded-full bg-primary/10 ring-4 ring-primary/20">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Now Serving</h2>
              </div>
              
              {currentServing ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
                    <span className="relative text-4xl font-bold text-primary-foreground">
                      {currentServing.token}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {currentServing.fullName}
                    </h3>
                    <Badge variant="secondary" className="text-sm px-4 py-1">
                      Reception Desk
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-12 h-12" />
                  </div>
                  <p className="text-lg">No one is currently being served</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next in Queue Section */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl border-accent/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5"></div>
            <CardContent className="relative p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 rounded-full bg-accent/10 ring-4 ring-accent/20">
                  <ArrowRight className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Next in Queue</h2>
              </div>
              
              {nextInQueue.length > 0 ? (
                <div className="space-y-4">
                  {nextInQueue.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 shadow-lg' 
                          : 'bg-muted/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 
                            ? 'bg-accent text-accent-foreground shadow-lg' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {entry.token}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{entry.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {index === 0 ? 'Next' : `Position ${index + 1}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-12 h-12" />
                  </div>
                  <p className="text-lg">No patients waiting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Footer */}
      <div className="relative z-10 bg-gradient-to-r from-card/60 via-card/80 to-card/60 backdrop-blur-xl border-t border-border/30 mt-12">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">Live Queue Display</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {audioEnabled && (
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">Audio Enabled</span>
                </div>
              )}
              <span className="text-sm">
                © 2024 {settings?.clinic_name || 'Hospital'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumReceptionDisplay;
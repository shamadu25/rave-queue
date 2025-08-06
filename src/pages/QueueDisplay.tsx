import React, { useState } from 'react';
import { QueueDisplayScreen } from '@/components/QueueDisplayScreen';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Monitor, 
  Volume2, 
  Building2,
  Maximize,
  RotateCcw
} from 'lucide-react';

const QueueDisplay = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [enableAudio, setEnableAudio] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showSettings, setShowSettings] = useState(!fullscreenMode);

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'Consultation', label: 'Consultation' },
    { value: 'Lab', label: 'Laboratory' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'X-ray', label: 'X-ray' },
    { value: 'Scan', label: 'Imaging/Scan' },
    { value: 'Billing', label: 'Billing' }
  ];

  const toggleFullscreen = () => {
    if (!fullscreenMode) {
      document.documentElement.requestFullscreen?.();
      setShowSettings(false);
    } else {
      document.exitFullscreen?.();
      setShowSettings(true);
    }
    setFullscreenMode(!fullscreenMode);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-card p-4">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Display Settings
                </CardTitle>
                <CardDescription>
                  Configure the queue display for optimal viewing on TVs, monitors, or kiosks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Department Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department Filter
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show Upcoming Tokens */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Show Upcoming
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-upcoming"
                        checked={showUpcoming}
                        onCheckedChange={setShowUpcoming}
                      />
                      <Label htmlFor="show-upcoming">Next tokens</Label>
                    </div>
                  </div>

                  {/* Audio Announcements */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Audio Announcements
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable-audio"
                        checked={enableAudio}
                        onCheckedChange={setEnableAudio}
                      />
                      <Label htmlFor="enable-audio">Female voice</Label>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-2">
                    <Label>Display Controls</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="flex items-center gap-1"
                      >
                        <Maximize className="h-3 w-3" />
                        Fullscreen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshPage}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Display */}
      <QueueDisplayScreen
        department={selectedDepartment === 'all' ? undefined : selectedDepartment}
        showUpcoming={showUpcoming}
        enableAudio={enableAudio}
      />

      {/* Floating Settings Button (in fullscreen) */}
      {fullscreenMode && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default QueueDisplay;
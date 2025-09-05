import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { toast } from 'sonner';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Save, 
  Copy,
  Settings,
  Mic,
  Bell,
  MessageSquare,
  Headphones 
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  prefix: string;
  color_code: string;
  icon_name: string;
  announcement_template: string;
  is_active: boolean;
}

export const AnnouncementSettings = () => {
  const { settings, updateSetting } = useSystemSettings();
  const { speak, testVoice, getVoices, isEnabled } = useTextToSpeech();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Global announcement settings
  const [globalSettings, setGlobalSettings] = useState({
    enable_announcements: settings?.enable_voice_announcements || false,
    enable_chime: settings?.enable_announcement_chime || true,
    voice_language: settings?.voice_language || 'en-US',
    voice_rate: settings?.voice_rate || 1.0,
    voice_pitch: settings?.voice_pitch || 1.0,
    voice_volume: settings?.voice_volume || 0.8,
    chime_volume: settings?.chime_volume || 0.6
  });

  useEffect(() => {
    fetchDepartments();
    loadVoices();
    
    // Update global settings when system settings change
    if (settings) {
      setGlobalSettings(prev => ({
        ...prev,
        enable_announcements: settings.enable_voice_announcements || false,
        enable_chime: settings.enable_announcement_chime || true,
        voice_language: settings.voice_language || 'en-US',
        voice_rate: parseFloat(String(settings.voice_rate || 1.0)),
        voice_pitch: parseFloat(String(settings.voice_pitch || 1.0)),
        voice_volume: parseFloat(String(settings.voice_volume || 0.8)),
        chime_volume: parseFloat(String(settings.chime_volume || 0.6))
      }));
    }
  }, [settings]);

  const loadVoices = () => {
    const voices = getVoices();
    setAvailableVoices(voices);
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (departmentId: string, template: string) => {
    try {
      setSaving(departmentId);
      
      const { error } = await supabase
        .from('departments')
        .update({ announcement_template: template })
        .eq('id', departmentId);

      if (error) throw error;

      // Update local state
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === departmentId 
            ? { ...dept, announcement_template: template }
            : dept
        )
      );

      toast.success('Announcement template updated');
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    } finally {
      setSaving(null);
    }
  };

  const duplicateTemplate = async (fromDepartmentId: string, toDepartmentId: string) => {
    const fromDept = departments.find(d => d.id === fromDepartmentId);
    if (!fromDept) return;

    await updateTemplate(toDepartmentId, fromDept.announcement_template);
  };

  const previewAnnouncement = async (department: Department) => {
    if (!isEnabled) {
      toast.error('Voice announcements are disabled');
      return;
    }

    try {
      setPreviewing(department.id);
      
      // Generate sample announcement
      const sampleText = processAnnouncementTemplate(
        department.announcement_template,
        '1',
        department.name,
        settings?.clinic_name || 'Hospital'
      );

      // Play chime if enabled
      if (globalSettings.enable_chime) {
        await playChime();
        // Small delay before announcement
        setTimeout(() => {
          speak(sampleText, 'high');
          toast.success(`Preview: ${sampleText}`, { duration: 3000 });
        }, 500);
      } else {
        speak(sampleText, 'high');
        toast.success(`Preview: ${sampleText}`, { duration: 3000 });
      }
      
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('Preview failed');
    } finally {
      setPreviewing(null);
    }
  };

  const processAnnouncementTemplate = (
    template: string, 
    tokenNumber: string, 
    department: string, 
    hospitalName: string,
    room?: string
  ) => {
    return template
      .replace(/{number}/g, tokenNumber)
      .replace(/{department}/g, department)
      .replace(/{hospitalName}/g, hospitalName)
      .replace(/{room}/g, room || '');
  };

  const playChime = async () => {
    return new Promise<void>((resolve) => {
      const audioContext = new AudioContext();
      const duration = 0.3;
      
      // Create two-tone chime
      const createTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(globalSettings.chime_volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        return oscillator;
      };

      // Play two-tone chime: high-low
      const now = audioContext.currentTime;
      createTone(800, now, duration);
      createTone(600, now + duration * 0.7, duration);
      
      setTimeout(resolve, (duration * 2) * 1000);
    });
  };

  const saveGlobalSettings = async () => {
    try {
      setSaving('global');
      
      const updates = [
        { key: 'enable_voice_announcements', value: globalSettings.enable_announcements, category: 'announcement' },
        { key: 'enable_announcement_chime', value: globalSettings.enable_chime, category: 'announcement' },
        { key: 'voice_language', value: globalSettings.voice_language, category: 'announcement' },
        { key: 'voice_rate', value: globalSettings.voice_rate, category: 'announcement' },
        { key: 'voice_pitch', value: globalSettings.voice_pitch, category: 'announcement' },
        { key: 'voice_volume', value: globalSettings.voice_volume, category: 'announcement' },
        { key: 'chime_volume', value: globalSettings.chime_volume, category: 'announcement' }
      ];

      for (const update of updates) {
        await updateSetting(update.key, update.value, update.category);
      }

      toast.success('Global announcement settings saved');
    } catch (error) {
      console.error('Failed to save global settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Queue Announcement System
        </h3>
        <p className="text-muted-foreground">Configure voice announcements and templates for each department</p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Voice & Sound Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide announcement behavior and voice settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  {globalSettings.enable_announcements ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Enable Voice Announcements
                </Label>
                <p className="text-sm text-muted-foreground">Play voice announcements when tokens are called</p>
              </div>
              <Switch
                checked={globalSettings.enable_announcements}
                onCheckedChange={(checked) => 
                  setGlobalSettings(prev => ({ ...prev, enable_announcements: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Enable Chime Sound
                </Label>
                <p className="text-sm text-muted-foreground">Play chime before announcements</p>
              </div>
              <Switch
                checked={globalSettings.enable_chime}
                onCheckedChange={(checked) => 
                  setGlobalSettings(prev => ({ ...prev, enable_chime: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Voice Language</Label>
              <Select
                value={globalSettings.voice_language}
                onValueChange={(value) => 
                  setGlobalSettings(prev => ({ ...prev, voice_language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-UK">English (UK)</SelectItem>
                  <SelectItem value="en-AU">English (AU)</SelectItem>
                  <SelectItem value="es-ES">Spanish (ES)</SelectItem>
                  <SelectItem value="fr-FR">French (FR)</SelectItem>
                  <SelectItem value="de-DE">German (DE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voice Rate: {globalSettings.voice_rate}</Label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={globalSettings.voice_rate}
                onChange={(e) => 
                  setGlobalSettings(prev => ({ ...prev, voice_rate: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Voice Volume: {globalSettings.voice_volume}</Label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={globalSettings.voice_volume}
                onChange={(e) => 
                  setGlobalSettings(prev => ({ ...prev, voice_volume: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Chime Volume: {globalSettings.chime_volume}</Label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={globalSettings.chime_volume}
                onChange={(e) => 
                  setGlobalSettings(prev => ({ ...prev, chime_volume: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => testVoice("This is a test announcement for the queue management system")}
              disabled={!globalSettings.enable_announcements}
              className="flex items-center gap-2"
            >
              <Headphones className="h-4 w-4" />
              Test Voice
            </Button>

            <Button
              onClick={saveGlobalSettings}
              disabled={saving === 'global'}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving === 'global' ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Department Announcement Templates</CardTitle>
          <CardDescription>
            Customize announcement messages for each department. Use variables: {'{number}'}, {'{department}'}, {'{hospitalName}'}, {'{room}'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((department) => (
              <div key={department.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      style={{ backgroundColor: department.color_code }}
                      className="text-white"
                    >
                      {department.prefix}
                    </Badge>
                    <h4 className="font-medium">{department.name}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewAnnouncement(department)}
                      disabled={previewing === department.id || !globalSettings.enable_announcements}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-3 w-3" />
                      {previewing === department.id ? 'Playing...' : 'Preview'}
                    </Button>
                    
                    <Select onValueChange={(value) => duplicateTemplate(value, department.id)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Copy from..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.filter(d => d.id !== department.id).map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            <div className="flex items-center gap-2">
                              <Copy className="h-3 w-3" />
                              {dept.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Announcement Template</Label>
                  <Textarea
                    value={department.announcement_template}
                    onChange={(e) => {
                      const newTemplate = e.target.value;
                      setDepartments(prev =>
                        prev.map(dept =>
                          dept.id === department.id
                            ? { ...dept, announcement_template: newTemplate }
                            : dept
                        )
                      );
                    }}
                    placeholder="Token {number}, please proceed to {department} at {hospitalName}."
                    rows={2}
                  />
                  <p className="text-sm text-muted-foreground">
                    Preview: "{processAnnouncementTemplate(
                      department.announcement_template,
                      '1',
                      department.name,
                      settings?.clinic_name || 'Hospital'
                    )}"
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => updateTemplate(department.id, department.announcement_template)}
                    disabled={saving === department.id}
                  >
                    {saving === department.id ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Template Variables</CardTitle>
          <CardDescription>Available variables you can use in announcement templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">{'{number}'}</code>
              <p className="text-sm text-muted-foreground">Token number (e.g., "A001", "B015")</p>
            </div>
            <div className="space-y-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">{'{department}'}</code>
              <p className="text-sm text-muted-foreground">Department/service name</p>
            </div>
            <div className="space-y-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">{'{hospitalName}'}</code>
              <p className="text-sm text-muted-foreground">Hospital/clinic name from settings</p>
            </div>
            <div className="space-y-2">
              <code className="bg-muted px-2 py-1 rounded text-sm">{'{room}'}</code>
              <p className="text-sm text-muted-foreground">Room number (if available)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
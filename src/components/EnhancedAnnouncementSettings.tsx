import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  Headphones,
  Users,
  TestTube2,
  Repeat
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

export const EnhancedAnnouncementSettings = () => {
  const { settings, updateSetting, updateMultipleSettings } = useSystemSettings();
  const { speak, testVoice, getVoices, isEnabled } = useTextToSpeech();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Enhanced global announcement settings
  const [globalSettings, setGlobalSettings] = useState({
    enable_announcements: settings?.enable_voice_announcements || false,
    enable_chime: settings?.enable_announcement_chime || true,
    voice_language: settings?.voice_language || 'en-US',
    voice_gender: settings?.voice_gender || 'female',
    voice_style: settings?.voice_style || 'professional',
    voice_accent: settings?.voice_accent || 'en-US',
    voice_rate: parseFloat(String(settings?.voice_rate || 1.0)),
    voice_pitch: parseFloat(String(settings?.voice_pitch || 1.0)),
    voice_volume: parseFloat(String(settings?.voice_volume || 0.8)),
    chime_volume: parseFloat(String(settings?.chime_volume || 0.6)),
    announcement_repeat_count: parseInt(String(settings?.announcement_repeat_count || 2)),
    announcement_delay: parseInt(String(settings?.announcement_delay || 500)),
    global_announcement_template: settings?.global_announcement_template || 'Token {number}, please proceed to {department} at {hospitalName}.'
  });

  useEffect(() => {
    fetchDepartments();
    loadVoices();
    
    // Update global settings when system settings change
    if (settings) {
      setGlobalSettings(prev => ({
        ...prev,
        enable_announcements: settings.enable_voice_announcements === true || String(settings.enable_voice_announcements) === 'true',
        enable_chime: settings.enable_announcement_chime === true || settings.enable_announcement_chime === 'true',
        voice_language: String(settings.voice_language || 'en-US'),
        voice_gender: String(settings.voice_gender || 'female'),
        voice_style: String(settings.voice_style || 'professional'),
        voice_accent: String(settings.voice_accent || 'en-US'),
        voice_rate: parseFloat(String(settings.voice_rate || 1.0)),
        voice_pitch: parseFloat(String(settings.voice_pitch || 1.0)),
        voice_volume: parseFloat(String(settings.voice_volume || 0.8)),
        chime_volume: parseFloat(String(settings.chime_volume || 0.6)),
        announcement_repeat_count: parseInt(String(settings.announcement_repeat_count || 2)),
        announcement_delay: parseInt(String(settings.announcement_delay || 500)),
        global_announcement_template: String(settings.global_announcement_template || 'Token {number}, please proceed to {department} at {hospitalName}.')
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

      toast.success('✅ Announcement template updated successfully');
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('❌ Failed to update template');
    } finally {
      setSaving(null);
    }
  };

  const duplicateTemplate = async (fromDepartmentId: string, toDepartmentId: string) => {
    const fromDept = departments.find(d => d.id === fromDepartmentId);
    if (!fromDept) return;

    await updateTemplate(toDepartmentId, fromDept.announcement_template);
    toast.success(`Template copied from ${fromDept.name}`);
  };

  const previewAnnouncement = async (department: Department) => {
    if (!globalSettings.enable_announcements) {
      toast.error('❌ Voice announcements are disabled. Enable them first to preview.');
      return;
    }

    try {
      setPreviewing(department.id);
      
      // Generate sample announcement
      const sampleText = processAnnouncementTemplate(
        department.announcement_template,
        '1',
        department.name,
        settings?.clinic_name?.toString().replace(/"/g, '') || 'Hospital'
      );

      // Play chime if enabled
      if (globalSettings.enable_chime) {
        await playChime();
        // Delay before announcement
        setTimeout(() => {
          // Repeat announcement based on settings
          for (let i = 0; i < globalSettings.announcement_repeat_count; i++) {
            setTimeout(() => {
              speak(sampleText, 'high');
            }, i * (globalSettings.announcement_delay + 2000));
          }
          toast.success(`🔊 Preview: "${sampleText}"`, { duration: 4000 });
        }, globalSettings.announcement_delay);
      } else {
        // Repeat announcement without chime
        for (let i = 0; i < globalSettings.announcement_repeat_count; i++) {
          setTimeout(() => {
            speak(sampleText, 'high');
          }, i * 2000);
        }
        toast.success(`🔊 Preview: "${sampleText}"`, { duration: 4000 });
      }
      
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('❌ Preview failed');
    } finally {
      setTimeout(() => setPreviewing(null), 1000);
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
      try {
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
      } catch (error) {
        console.error('Chime failed:', error);
        resolve();
      }
    });
  };

  const saveGlobalSettings = async () => {
    try {
      setSaving('global');
      
      const updates = [
        { key: 'enable_voice_announcements', value: globalSettings.enable_announcements, category: 'announcement' },
        { key: 'enable_announcement_chime', value: globalSettings.enable_chime, category: 'announcement' },
        { key: 'voice_language', value: globalSettings.voice_language, category: 'announcement' },
        { key: 'voice_gender', value: globalSettings.voice_gender, category: 'announcement' },
        { key: 'voice_style', value: globalSettings.voice_style, category: 'announcement' },
        { key: 'voice_accent', value: globalSettings.voice_accent, category: 'announcement' },
        { key: 'voice_rate', value: globalSettings.voice_rate, category: 'announcement' },
        { key: 'voice_pitch', value: globalSettings.voice_pitch, category: 'announcement' },
        { key: 'voice_volume', value: globalSettings.voice_volume, category: 'announcement' },
        { key: 'chime_volume', value: globalSettings.chime_volume, category: 'announcement' },
        { key: 'announcement_repeat_count', value: globalSettings.announcement_repeat_count, category: 'announcement' },
        { key: 'announcement_delay', value: globalSettings.announcement_delay, category: 'announcement' },
        { key: 'global_announcement_template', value: globalSettings.global_announcement_template, category: 'announcement' }
      ];

      const success = await updateMultipleSettings(updates);

      if (success) {
        toast.success('✅ Global announcement settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save global settings:', error);
      toast.error('❌ Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const testVoiceSample = () => {
    const sampleText = `This is a sample announcement in ${globalSettings.voice_style} style with ${globalSettings.voice_gender} voice.`;
    testVoice(sampleText);
    toast.info('🎵 Playing voice sample...');
  };

  const applyGlobalTemplateToAll = async () => {
    try {
      setSaving('apply-all');
      
      const promises = departments.map(dept => 
        supabase
          .from('departments')
          .update({ announcement_template: globalSettings.global_announcement_template })
          .eq('id', dept.id)
      );

      await Promise.all(promises);

      // Update local state
      setDepartments(prev => 
        prev.map(dept => ({ 
          ...dept, 
          announcement_template: globalSettings.global_announcement_template 
        }))
      );

      toast.success('✅ Global template applied to all departments');
    } catch (error) {
      console.error('Failed to apply global template:', error);
      toast.error('❌ Failed to apply template to all departments');
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
          Enhanced Queue Announcement System
        </h3>
        <p className="text-muted-foreground">Configure voice announcements with advanced options and department-specific templates</p>
      </div>

      {/* Enhanced Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Voice & Sound Settings
          </CardTitle>
          <CardDescription>
            Configure enterprise-grade announcement behavior with voice customization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 font-medium">
                  {globalSettings.enable_announcements ? <Volume2 className="h-4 w-4 text-green-600" /> : <VolumeX className="h-4 w-4 text-red-600" />}
                  Enable Voice Announcements
                </Label>
                <p className="text-sm text-muted-foreground">Master switch for all voice announcements</p>
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
                <Label className="flex items-center gap-2 font-medium">
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
          </div>

          {/* Voice Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Voice Gender</Label>
              <Select
                value={globalSettings.voice_gender}
                onValueChange={(value) => 
                  setGlobalSettings(prev => ({ ...prev, voice_gender: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voice Style/Tone</Label>
              <Select
                value={globalSettings.voice_style}
                onValueChange={(value) => 
                  setGlobalSettings(prev => ({ ...prev, voice_style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="studio">Studio Quality</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm & Soothing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language/Accent</Label>
              <Select
                value={globalSettings.voice_accent}
                onValueChange={(value) => 
                  setGlobalSettings(prev => ({ ...prev, voice_accent: value }))
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
          </div>

          {/* Voice Fine-Tuning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Speech Rate: {globalSettings.voice_rate.toFixed(1)}</Label>
                <Slider
                  value={[globalSettings.voice_rate]}
                  onValueChange={([value]) => 
                    setGlobalSettings(prev => ({ ...prev, voice_rate: value }))
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">0.5 = Very Slow, 2.0 = Very Fast</p>
              </div>

              <div className="space-y-2">
                <Label>Voice Pitch: {globalSettings.voice_pitch.toFixed(1)}</Label>
                <Slider
                  value={[globalSettings.voice_pitch]}
                  onValueChange={([value]) => 
                    setGlobalSettings(prev => ({ ...prev, voice_pitch: value }))
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">0.5 = Low Pitch, 2.0 = High Pitch</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Volume: {Math.round(globalSettings.voice_volume * 100)}%</Label>
                <Slider
                  value={[globalSettings.voice_volume]}
                  onValueChange={([value]) => 
                    setGlobalSettings(prev => ({ ...prev, voice_volume: value }))
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Chime Volume: {Math.round(globalSettings.chime_volume * 100)}%</Label>
                <Slider
                  value={[globalSettings.chime_volume]}
                  onValueChange={([value]) => 
                    setGlobalSettings(prev => ({ ...prev, chime_volume: value }))
                  }
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Announcement Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Repeat Count: {globalSettings.announcement_repeat_count}</Label>
              <Slider
                value={[globalSettings.announcement_repeat_count]}
                onValueChange={([value]) => 
                  setGlobalSettings(prev => ({ ...prev, announcement_repeat_count: value }))
                }
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">How many times to repeat each announcement</p>
            </div>

            <div className="space-y-2">
              <Label>Chime Delay: {globalSettings.announcement_delay}ms</Label>
              <Slider
                value={[globalSettings.announcement_delay]}
                onValueChange={([value]) => 
                  setGlobalSettings(prev => ({ ...prev, announcement_delay: value }))
                }
                min={0}
                max={2000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Delay between chime and voice</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={testVoiceSample}
              disabled={!globalSettings.enable_announcements}
              className="flex items-center gap-2"
            >
              <Headphones className="h-4 w-4" />
              Test Voice Sample
            </Button>

            <Button
              variant="outline"
              onClick={() => testVoice("Token one, please proceed to consultation at the hospital.")}
              disabled={!globalSettings.enable_announcements}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Test Full Announcement
            </Button>

            <div className="flex-1" />

            <Button
              onClick={saveGlobalSettings}
              disabled={saving === 'global'}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving === 'global' ? 'Saving...' : 'Save Voice Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Global Announcement Template
          </CardTitle>
          <CardDescription>
            Define a default template that can be applied to all departments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Template</Label>
            <Textarea
              value={globalSettings.global_announcement_template}
              onChange={(e) => 
                setGlobalSettings(prev => ({ ...prev, global_announcement_template: e.target.value }))
              }
              placeholder="Token {number}, please proceed to {department} at {hospitalName}."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Available variables: {'{number}'}, {'{department}'}, {'{hospitalName}'}, {'{room}'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={applyGlobalTemplateToAll}
              disabled={saving === 'apply-all'}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {saving === 'apply-all' ? 'Applying...' : 'Apply to All Departments'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const preview = processAnnouncementTemplate(
                  globalSettings.global_announcement_template,
                  '1',
                  'Consultation',
                  settings?.clinic_name?.toString().replace(/"/g, '') || 'Hospital'
                );
                speak(preview, 'high');
                toast.info(`Preview: "${preview}"`);
              }}
              disabled={!globalSettings.enable_announcements}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Preview Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Department-Specific Templates
          </CardTitle>
          <CardDescription>
            Customize announcement messages for each department with advanced controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {departments.map((department) => (
              <div key={department.id} className="border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      style={{ backgroundColor: department.color_code }}
                      className="text-white font-medium px-3 py-1"
                    >
                      {department.prefix}
                    </Badge>
                    <div>
                      <h4 className="font-semibold">{department.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Customize announcement template for this department
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewAnnouncement(department)}
                      disabled={previewing === department.id || !globalSettings.enable_announcements}
                      className="flex items-center gap-2"
                    >
                      {previewing === department.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                          Playing...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Preview
                        </>
                      )}
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

                <div className="space-y-3">
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
                  </div>

                  <div className="bg-muted/30 p-3 rounded-md">
                    <Label className="text-sm font-medium">Live Preview:</Label>
                    <p className="text-sm text-foreground mt-1">
                      "{processAnnouncementTemplate(
                        department.announcement_template,
                        '1',
                        department.name,
                        settings?.clinic_name?.toString().replace(/"/g, '') || 'Hospital'
                      )}"
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => updateTemplate(department.id, department.announcement_template)}
                      disabled={saving === department.id}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-3 w-3" />
                      {saving === department.id ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
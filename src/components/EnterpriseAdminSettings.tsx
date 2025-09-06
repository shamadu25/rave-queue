import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { 
  Hospital, 
  Settings, 
  Palette, 
  Volume2, 
  Monitor, 
  Printer,
  Eye,
  Play,
  Save,
  RotateCcw,
  TestTube,
  Megaphone
} from 'lucide-react';
import { toast } from 'sonner';

export const EnterpriseAdminSettings = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const { testVoice, playChime, getVoices } = useTextToSpeech();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Initialize form data from settings
  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  // Load available voices
  useEffect(() => {
    const voices = getVoices();
    setAvailableVoices(voices);
  }, [getVoices]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
        category: getSettingCategory(key)
      }));

      const success = await updateMultipleSettings(updates);
      if (success) {
        // Broadcast settings update for real-time sync
        window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { 
          detail: formData 
        }));
        toast.success('All settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaults = {
      clinic_name: 'Your Hospital Name',
      clinic_address: '',
      clinic_phone: '',
      clinic_email: '',
      website_url: '',
      operating_hours: '8:00 AM - 5:00 PM',
      emergency_contact: '',
      clinic_logo: '',
      footer_note: 'Thank you for visiting our hospital',
      enable_voice_announcements: true,
      voice_gender: 'female',
      voice_style: 'friendly',
      voice_accent: 'us',
      voice_rate: 0.8,
      voice_pitch: 1.0,
      voice_volume: 0.8,
      enable_announcement_chime: true,
      chime_volume: 0.6,
      display_background_start: '#3B82F6',
      display_background_end: '#1D4ED8',
      display_header_text: 'Welcome to Our Healthcare Facility',
      display_header_font_size: 32,
      display_header_color: '#FFFFFF',
      display_token_font_size: 64,
      display_department_font_size: 20,
      display_ticker_font_size: 18,
      display_logo_enabled: true,
      display_logo_size: 'md',
      display_token_glow: true,
      display_department_colors: true,
      ticker_text: 'Welcome to our hospital. For emergency assistance, dial 911.',
      ticker_speed: 50,
      ticker_color: '#FFFFFF',
      announcement_template: 'Token {number}, please proceed to {department} at {hospitalName}'
    };
    setFormData(defaults);
    toast.success('Settings reset to defaults');
  };

  const previewVoice = () => {
    const sampleText = `Hello! This is a preview of the ${formData.voice_gender} voice with ${formData.voice_style} style and ${formData.voice_accent} accent. Token A123, please proceed to consultation at ${formData.clinic_name || 'Your Hospital'}.`;
    testVoice(sampleText);
  };

  const previewAnnouncement = () => {
    const template = formData.announcement_template || 'Token {number}, please proceed to {department} at {hospitalName}';
    const sampleText = template
      .replace(/{number}/g, 'A123')
      .replace(/{department}/g, 'Consultation')
      .replace(/{hospitalName}/g, formData.clinic_name || 'Your Hospital');
    
    if (formData.enable_announcement_chime) {
      playChime(formData.chime_volume);
      setTimeout(() => testVoice(sampleText), 800);
    } else {
      testVoice(sampleText);
    }
  };

  const previewQueueDisplay = () => {
    window.open('/queue-display', '_blank', 'width=1200,height=800');
  };

  const getSettingCategory = (key: string): string => {
    if (key.startsWith('display_')) return 'display';
    if (key.startsWith('voice_') || key.includes('announcement')) return 'voice';
    if (key.startsWith('ticker_')) return 'ticker';
    if (key.includes('print')) return 'printing';
    return 'general';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Enterprise Admin Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your hospital's queue management system settings
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
          <Button onClick={saveAllSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="branding">Hospital Branding</TabsTrigger>
          <TabsTrigger value="display">Queue Display</TabsTrigger>
          <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Hospital Branding */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hospital className="h-5 w-5" />
                Hospital Branding & Information
              </CardTitle>
              <CardDescription>
                Configure your hospital's branding and contact information displayed across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Hospital Name *</Label>
                  <Input
                    id="clinic_name"
                    value={formData.clinic_name || ''}
                    onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                    placeholder="Enter hospital name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_logo">Hospital Logo URL</Label>
                  <Input
                    id="clinic_logo"
                    value={formData.clinic_logo || ''}
                    onChange={(e) => handleInputChange('clinic_logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_address">Address</Label>
                  <Textarea
                    id="clinic_address"
                    value={formData.clinic_address || ''}
                    onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                    placeholder="Enter hospital address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_phone">Phone Number</Label>
                  <Input
                    id="clinic_phone"
                    value={formData.clinic_phone || ''}
                    onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_email">Email</Label>
                  <Input
                    id="clinic_email"
                    type="email"
                    value={formData.clinic_email || ''}
                    onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                    placeholder="info@hospital.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url || ''}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://www.hospital.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operating_hours">Operating Hours</Label>
                  <Input
                    id="operating_hours"
                    value={formData.operating_hours || ''}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    placeholder="8:00 AM - 5:00 PM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="911 or emergency number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Display */}
        <TabsContent value="display">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Queue Display Configuration
                </CardTitle>
                <CardDescription>
                  Customize the appearance and behavior of your queue display screens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Background Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="display_background_start">Background Start Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="display_background_start"
                        type="color"
                        value={formData.display_background_start || '#3B82F6'}
                        onChange={(e) => handleInputChange('display_background_start', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.display_background_start || '#3B82F6'}
                        onChange={(e) => handleInputChange('display_background_start', e.target.value)}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_background_end">Background End Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="display_background_end"
                        type="color"
                        value={formData.display_background_end || '#1D4ED8'}
                        onChange={(e) => handleInputChange('display_background_end', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.display_background_end || '#1D4ED8'}
                        onChange={(e) => handleInputChange('display_background_end', e.target.value)}
                        placeholder="#1D4ED8"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Header Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_header_text">Header Text</Label>
                      <Input
                        id="display_header_text"
                        value={formData.display_header_text || ''}
                        onChange={(e) => handleInputChange('display_header_text', e.target.value)}
                        placeholder="Welcome to Our Healthcare Facility"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Header Font Size: {formData.display_header_font_size || 32}px</Label>
                      <Slider
                        value={[formData.display_header_font_size || 32]}
                        onValueChange={([value]) => handleInputChange('display_header_font_size', value)}
                        min={16}
                        max={64}
                        step={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_header_color">Header Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.display_header_color || '#FFFFFF'}
                          onChange={(e) => handleInputChange('display_header_color', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.display_header_color || '#FFFFFF'}
                          onChange={(e) => handleInputChange('display_header_color', e.target.value)}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Display Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Token Display</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Token Font Size: {formData.display_token_font_size || 64}px</Label>
                      <Slider
                        value={[formData.display_token_font_size || 64]}
                        onValueChange={([value]) => handleInputChange('display_token_font_size', value)}
                        min={32}
                        max={128}
                        step={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Department Font Size: {formData.display_department_font_size || 20}px</Label>
                      <Slider
                        value={[formData.display_department_font_size || 20]}
                        onValueChange={([value]) => handleInputChange('display_department_font_size', value)}
                        min={12}
                        max={36}
                        step={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="display_token_glow"
                        checked={formData.display_token_glow || false}
                        onCheckedChange={(checked) => handleInputChange('display_token_glow', checked)}
                      />
                      <Label htmlFor="display_token_glow">Token Glow Effect</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="display_department_colors"
                        checked={formData.display_department_colors || false}
                        onCheckedChange={(checked) => handleInputChange('display_department_colors', checked)}
                      />
                      <Label htmlFor="display_department_colors">Department Colors</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="display_logo_enabled"
                        checked={formData.display_logo_enabled || false}
                        onCheckedChange={(checked) => handleInputChange('display_logo_enabled', checked)}
                      />
                      <Label htmlFor="display_logo_enabled">Show Logo</Label>
                    </div>
                  </div>
                </div>

                {/* Ticker Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Announcement Ticker</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticker_text">Ticker Message</Label>
                      <Textarea
                        id="ticker_text"
                        value={formData.ticker_text || ''}
                        onChange={(e) => handleInputChange('ticker_text', e.target.value)}
                        placeholder="Welcome to our hospital. For emergency assistance, dial 911."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Ticker Speed: {formData.ticker_speed || 50}%</Label>
                        <Slider
                          value={[formData.ticker_speed || 50]}
                          onValueChange={([value]) => handleInputChange('ticker_speed', value)}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ticker Font Size: {formData.display_ticker_font_size || 18}px</Label>
                        <Slider
                          value={[formData.display_ticker_font_size || 18]}
                          onValueChange={([value]) => handleInputChange('display_ticker_font_size', value)}
                          min={12}
                          max={32}
                          step={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ticker_color">Ticker Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.ticker_color || '#FFFFFF'}
                            onChange={(e) => handleInputChange('ticker_color', e.target.value)}
                            className="w-16 h-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={previewQueueDisplay} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Queue Display
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice & Audio */}
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice & Audio Configuration
              </CardTitle>
              <CardDescription>
                Configure text-to-speech announcements and audio settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Switch
                  id="enable_voice_announcements"
                  checked={formData.enable_voice_announcements || false}
                  onCheckedChange={(checked) => handleInputChange('enable_voice_announcements', checked)}
                />
                <Label htmlFor="enable_voice_announcements" className="text-lg font-medium">
                  Enable Voice Announcements
                </Label>
              </div>

              {formData.enable_voice_announcements && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="voice_gender">Voice Gender</Label>
                      <Select 
                        value={formData.voice_gender || 'female'} 
                        onValueChange={(value) => handleInputChange('voice_gender', value)}
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
                      <Label htmlFor="voice_style">Voice Style</Label>
                      <Select 
                        value={formData.voice_style || 'friendly'} 
                        onValueChange={(value) => handleInputChange('voice_style', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="calm">Calm</SelectItem>
                          <SelectItem value="cheerful">Cheerful</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voice_accent">Voice Accent</Label>
                      <Select 
                        value={formData.voice_accent || 'us'} 
                        onValueChange={(value) => handleInputChange('voice_accent', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">US English</SelectItem>
                          <SelectItem value="uk">UK English</SelectItem>
                          <SelectItem value="au">Australian</SelectItem>
                          <SelectItem value="ca">Canadian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Voice Rate: {formData.voice_rate || 0.8}</Label>
                      <Slider
                        value={[formData.voice_rate || 0.8]}
                        onValueChange={([value]) => handleInputChange('voice_rate', value)}
                        min={0.3}
                        max={2.0}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Voice Pitch: {formData.voice_pitch || 1.0}</Label>
                      <Slider
                        value={[formData.voice_pitch || 1.0]}
                        onValueChange={([value]) => handleInputChange('voice_pitch', value)}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Voice Volume: {Math.round((formData.voice_volume || 0.8) * 100)}%</Label>
                      <Slider
                        value={[formData.voice_volume || 0.8]}
                        onValueChange={([value]) => handleInputChange('voice_volume', value)}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable_announcement_chime"
                        checked={formData.enable_announcement_chime || false}
                        onCheckedChange={(checked) => handleInputChange('enable_announcement_chime', checked)}
                      />
                      <Label htmlFor="enable_announcement_chime">Play Chime Before Announcements</Label>
                    </div>

                    {formData.enable_announcement_chime && (
                      <div className="space-y-2 ml-6">
                        <Label>Chime Volume: {Math.round((formData.chime_volume || 0.6) * 100)}%</Label>
                        <Slider
                          value={[formData.chime_volume || 0.6]}
                          onValueChange={([value]) => handleInputChange('chime_volume', value)}
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          className="max-w-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={previewVoice} variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Test Voice
                    </Button>
                    <Button onClick={previewAnnouncement} variant="outline">
                      <Megaphone className="h-4 w-4 mr-2" />
                      Preview Announcement
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Announcement & Ticket Templates</CardTitle>
              <CardDescription>
                Customize templates for voice announcements and printed tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="announcement_template">Announcement Template</Label>
                <Textarea
                  id="announcement_template"
                  value={formData.announcement_template || ''}
                  onChange={(e) => handleInputChange('announcement_template', e.target.value)}
                  placeholder="Token {number}, please proceed to {department} at {hospitalName}"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{number}'}, {'{department}'}, {'{hospitalName}'}, {'{room}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_note">Ticket Footer Template</Label>
                <Textarea
                  id="footer_note"
                  value={formData.footer_note || ''}
                  onChange={(e) => handleInputChange('footer_note', e.target.value)}
                  placeholder="Thank you for visiting {hospitalName}"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printing */}
        <TabsContent value="printing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Printing Configuration
              </CardTitle>
              <CardDescription>
                Configure ticket printing options and templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_auto_print"
                    checked={formData.enable_auto_print || false}
                    onCheckedChange={(checked) => handleInputChange('enable_auto_print', checked)}
                  />
                  <Label htmlFor="enable_auto_print">Auto Print Tickets</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_silent_printing"
                    checked={formData.enable_silent_printing || false}
                    onCheckedChange={(checked) => handleInputChange('enable_silent_printing', checked)}
                  />
                  <Label htmlFor="enable_silent_printing">Silent Printing (No Dialog)</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Advanced system configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_reset_midnight"
                    checked={formData.auto_reset_midnight || false}
                    onCheckedChange={(checked) => handleInputChange('auto_reset_midnight', checked)}
                  />
                  <Label htmlFor="auto_reset_midnight">Auto Reset at Midnight</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_sms_notifications"
                    checked={formData.enable_sms_notifications || false}
                    onCheckedChange={(checked) => handleInputChange('enable_sms_notifications', checked)}
                  />
                  <Label htmlFor="enable_sms_notifications">SMS Notifications</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
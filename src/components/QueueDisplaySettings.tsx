import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { 
  Monitor, 
  Palette, 
  Type, 
  Sparkles, 
  Eye,
  Settings,
  Save,
  RefreshCw,
  Layout,
  Image
} from 'lucide-react';

export const QueueDisplaySettings = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Update form data when settings change
  useEffect(() => {
    setFormData({
      // Visual Settings
      display_background_start: settings?.display_background_start || '#3B82F6',
      display_background_end: settings?.display_background_end || '#1D4ED8',
      display_animation_speed: parseInt(settings?.display_animation_speed?.toString() || '3'),
      display_particle_animation: settings?.display_particle_animation === true || settings?.display_particle_animation === 'true',
      display_particle_speed: parseInt(settings?.display_particle_speed?.toString() || '2'),
      
      // Header Settings
      display_header_text: settings?.display_header_text || 'Welcome to Our Healthcare Facility',
      display_header_font_size: parseInt(settings?.display_header_font_size?.toString() || '32'),
      display_header_color: settings?.display_header_color || '#FFFFFF',
      
      // Token Card Settings
      display_token_card_size: settings?.display_token_card_size || 'lg',
      display_token_glow: settings?.display_token_glow === true || settings?.display_token_glow === 'true',
      display_department_colors: settings?.display_department_colors === true || settings?.display_department_colors === 'true',
      display_token_font_size: parseInt(settings?.display_token_font_size?.toString() || '64'),
      display_department_font_size: parseInt(settings?.display_department_font_size?.toString() || '20'),
      
      // Ticker Settings
      display_ticker_font_size: parseInt(settings?.display_ticker_font_size?.toString() || '18'),
      display_ticker_color: settings?.display_ticker_color || '#FFFFFF',
      display_ticker_speed: parseInt(settings?.display_ticker_speed?.toString() || '50'),
      display_ticker_position: settings?.display_ticker_position || 'bottom',
      
      // Logo Settings
      display_logo_enabled: settings?.display_logo_enabled === true || settings?.display_logo_enabled === 'true',
      display_logo_size: settings?.display_logo_size || 'md',
      display_logo_position: settings?.display_logo_position || 'top-left',
      
      // DateTime Settings
      display_datetime_font_size: parseInt(settings?.display_datetime_font_size?.toString() || '16'),
      
      // Emergency Settings
      emergency_alert_color: settings?.emergency_alert_color || '#DC2626',
      
      // Display Limits
      waiting_queue_limit: parseInt(settings?.waiting_queue_limit?.toString() || '50')
    });
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      
      // Prepare settings for update with proper categories
      const settingsToUpdate = Object.entries(formData)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => ({
          key,
          value: value,
          category: 'display'
        }));

      const success = await updateMultipleSettings(settingsToUpdate);
      
      if (success) {
        // Force reload of display settings to ensure immediate propagation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('queueDisplaySettingsUpdated', { 
            detail: formData 
          }));
        }, 500);
        
        toast.success('✅ Queue Display settings saved! Changes will reflect immediately on all display screens.');
      }
    } catch (error) {
      console.error('Error saving display settings:', error);
      toast.error('❌ Failed to save display settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setFormData({
      display_background_start: '#3B82F6',
      display_background_end: '#1D4ED8',
      display_animation_speed: 3,
      display_particle_animation: true,
      display_particle_speed: 2,
      display_header_text: 'Welcome to Our Healthcare Facility',
      display_header_font_size: 32,
      display_header_color: '#FFFFFF',
      display_token_card_size: 'lg',
      display_token_glow: true,
      display_department_colors: true,
      display_token_font_size: 64,
      display_department_font_size: 20,
      display_ticker_font_size: 18,
      display_ticker_color: '#FFFFFF',
      display_ticker_speed: 50,
      display_ticker_position: 'bottom',
      display_logo_enabled: true,
      display_logo_size: 'md',
      display_logo_position: 'top-left',
      display_datetime_font_size: 16,
      emergency_alert_color: '#DC2626',
      waiting_queue_limit: 50
    });
    toast.info('Settings reset to defaults. Remember to save your changes.');
  };

  const openPreviewWindow = () => {
    const previewUrl = `${window.location.origin}/queue-display?preview=true`;
    const previewWindow = window.open(
      previewUrl,
      'QueueDisplayPreview',
      'width=1200,height=800,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );
    
    if (previewWindow) {
      toast.success('🎯 Preview window opened! Test your display settings live.');
    } else {
      toast.error('❌ Failed to open preview window. Please check your popup blocker.');
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Queue Display Visual Settings
          </h3>
          <p className="text-muted-foreground">Customize the appearance of your queue display screens</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openPreviewWindow}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Display
          </Button>
          
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Defaults
          </Button>
          
          <Button
            onClick={saveAllSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Background & Animation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Background & Animation
          </CardTitle>
          <CardDescription>Configure background colors and animation effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background Gradient Start Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.display_background_start}
                  onChange={(e) => handleInputChange('display_background_start', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.display_background_start}
                  onChange={(e) => handleInputChange('display_background_start', e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Gradient End Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.display_background_end}
                  onChange={(e) => handleInputChange('display_background_end', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.display_background_end}
                  onChange={(e) => handleInputChange('display_background_end', e.target.value)}
                  placeholder="#1D4ED8"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Animation Speed: {formData.display_animation_speed}</Label>
              <Slider
                value={[formData.display_animation_speed]}
                onValueChange={([value]) => handleInputChange('display_animation_speed', value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">1 = Slow, 10 = Very Fast</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Particle Animation</Label>
                <p className="text-sm text-muted-foreground">Floating particles effect</p>
              </div>
              <Switch
                checked={formData.display_particle_animation}
                onCheckedChange={(checked) => handleInputChange('display_particle_animation', checked)}
              />
            </div>

            {formData.display_particle_animation && (
              <div className="space-y-2">
                <Label>Particle Speed: {formData.display_particle_speed}</Label>
                <Slider
                  value={[formData.display_particle_speed]}
                  onValueChange={([value]) => handleInputChange('display_particle_speed', value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Header & Welcome Text
          </CardTitle>
          <CardDescription>Configure the sliding welcome header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Welcome Header Text</Label>
              <Input
                value={formData.display_header_text}
                onChange={(e) => handleInputChange('display_header_text', e.target.value)}
                placeholder="Welcome to Our Healthcare Facility"
              />
            </div>

            <div className="space-y-2">
              <Label>Header Font Size: {formData.display_header_font_size}px</Label>
              <Slider
                value={[formData.display_header_font_size]}
                onValueChange={([value]) => handleInputChange('display_header_font_size', value)}
                min={16}
                max={72}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Header Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.display_header_color}
                  onChange={(e) => handleInputChange('display_header_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.display_header_color}
                  onChange={(e) => handleInputChange('display_header_color', e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Token Cards & Typography
          </CardTitle>
          <CardDescription>Customize token appearance and text sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Token Card Size</Label>
              <Select
                value={formData.display_token_card_size}
                onValueChange={(value) => handleInputChange('display_token_card_size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Token Glow Effect</Label>
                <p className="text-sm text-muted-foreground">Glowing border effect</p>
              </div>
              <Switch
                checked={formData.display_token_glow}
                onCheckedChange={(checked) => handleInputChange('display_token_glow', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Department Colors</Label>
                <p className="text-sm text-muted-foreground">Use department color coding</p>
              </div>
              <Switch
                checked={formData.display_department_colors}
                onCheckedChange={(checked) => handleInputChange('display_department_colors', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Token Font Size: {formData.display_token_font_size}px</Label>
              <Slider
                value={[formData.display_token_font_size]}
                onValueChange={([value]) => handleInputChange('display_token_font_size', value)}
                min={32}
                max={128}
                step={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Department Font Size: {formData.display_department_font_size}px</Label>
              <Slider
                value={[formData.display_department_font_size]}
                onValueChange={([value]) => handleInputChange('display_department_font_size', value)}
                min={12}
                max={32}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Date/Time Font Size: {formData.display_datetime_font_size}px</Label>
              <Slider
                value={[formData.display_datetime_font_size]}
                onValueChange={([value]) => handleInputChange('display_datetime_font_size', value)}
                min={10}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticker & Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ticker Bar & Logo Display
          </CardTitle>
          <CardDescription>Configure announcement ticker and logo placement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ticker Font Size: {formData.display_ticker_font_size}px</Label>
              <Slider
                value={[formData.display_ticker_font_size]}
                onValueChange={([value]) => handleInputChange('display_ticker_font_size', value)}
                min={12}
                max={32}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Ticker Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.display_ticker_color}
                  onChange={(e) => handleInputChange('display_ticker_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.display_ticker_color}
                  onChange={(e) => handleInputChange('display_ticker_color', e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ticker Speed: {formData.display_ticker_speed}px/s</Label>
              <Slider
                value={[formData.display_ticker_speed]}
                onValueChange={([value]) => handleInputChange('display_ticker_speed', value)}
                min={20}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Ticker Position</Label>
              <Select
                value={formData.display_ticker_position}
                onValueChange={(value) => handleInputChange('display_ticker_position', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Hospital Logo</Label>
                <p className="text-sm text-muted-foreground">Display logo on screen</p>
              </div>
              <Switch
                checked={formData.display_logo_enabled}
                onCheckedChange={(checked) => handleInputChange('display_logo_enabled', checked)}
              />
            </div>

            {formData.display_logo_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Logo Size</Label>
                  <Select
                    value={formData.display_logo_size}
                    onValueChange={(value) => handleInputChange('display_logo_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <Select
                    value={formData.display_logo_position}
                    onValueChange={(value) => handleInputChange('display_logo_position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Emergency Alerts & Display Limits
          </CardTitle>
          <CardDescription>Configure emergency styling and queue limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Alert Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.emergency_alert_color}
                  onChange={(e) => handleInputChange('emergency_alert_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.emergency_alert_color}
                  onChange={(e) => handleInputChange('emergency_alert_color', e.target.value)}
                  placeholder="#DC2626"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Maximum Queue Display: {formData.waiting_queue_limit}</Label>
              <Slider
                value={[formData.waiting_queue_limit]}
                onValueChange={([value]) => handleInputChange('waiting_queue_limit', value)}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Maximum entries to show on screen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
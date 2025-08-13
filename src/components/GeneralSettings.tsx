import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { 
  Settings, 
  Building2, 
  Clock, 
  Monitor, 
  Save, 
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Globe,
  AlertTriangle
} from 'lucide-react';

export const GeneralSettings = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Update form data when settings change
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      const clinicName = formData.clinic_name?.toString().trim();
      if (!clinicName) {
        toast.error('❌ Hospital/Clinic name is required');
        return;
      }

      // Validate email format if provided
      const emailValue = formData.clinic_email?.toString().trim();
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        toast.error('❌ Please enter a valid email address');
        return;
      }

      // Validate website URL format if provided
      const websiteValue = formData.website_url?.toString().trim();
      if (websiteValue && !websiteValue.startsWith('http://') && !websiteValue.startsWith('https://')) {
        toast.error('❌ Website URL must start with http:// or https://');
        return;
      }

      // Prepare settings for update - handle empty strings gracefully
      const settingsToUpdate = Object.entries(formData)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => ({
          key,
          value: value === null ? '' : value, // Convert null to empty string
          category: getSettingCategory(key)
        }));

      const success = await updateMultipleSettings(settingsToUpdate);
      
      if (success) {
        toast.success('✅ Settings saved successfully! Changes will be reflected across all modules.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('❌ Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSettingCategory = (key: string): string => {
    const categories: Record<string, string> = {
      'clinic_name': 'general',
      'clinic_address': 'general',
      'clinic_phone': 'general',
      'clinic_email': 'general',
      'operating_hours': 'general',
      'website_url': 'general',
      'emergency_contact': 'general',
      'clinic_logo_url': 'general',
      'footer_note': 'general',
      'print_mode': 'general',
      'theme_mode': 'general',
      'enable_voice_announcements': 'general',
      'enable_online_booking': 'general',
      'enable_patient_feedback': 'general',
      'enable_auto_print': 'general',
      'auto_reset_midnight': 'queue',
      'display_estimated_wait': 'queue',
      'enable_display_screen': 'display',
      'enable_sound_alerts': 'display',
      'enable_sms_notifications': 'display',
      'refresh_interval': 'display',
      'max_queue_display_count': 'display',
      'show_department_colors': 'display',
      'default_priority': 'defaults',
      'max_emergency_tokens': 'defaults',
      'working_days': 'defaults'
    };
    return categories[key] || 'general';
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            General Settings
          </h2>
          <p className="text-muted-foreground">Configure system-wide options and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Clock className="h-4 w-4 mr-2" />
            Queue Config
          </TabsTrigger>
          <TabsTrigger value="display">
            <Monitor className="h-4 w-4 mr-2" />
            Display & Alerts
          </TabsTrigger>
          <TabsTrigger value="defaults">
            <Building2 className="h-4 w-4 mr-2" />
            Defaults
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hospital/Clinic Information
              </CardTitle>
              <CardDescription>Configure basic hospital/clinic information displayed throughout the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Hospital/Clinic Name *</Label>
                  <Input
                    id="clinic_name"
                    value={formData.clinic_name || ""}
                    onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                    placeholder="Enter hospital/clinic name"
                  />
                  <p className="text-sm text-muted-foreground">This name appears on tokens and welcome screens</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="clinic_email"
                    type="email"
                    value={formData.clinic_email || ""}
                    onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                    placeholder="info@sgclinic.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="clinic_phone"
                    type="tel"
                    value={formData.clinic_phone || ""}
                    onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergency_contact"
                    type="tel"
                    value={formData.emergency_contact || ""}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="+1 (555) 911-HELP"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinic_address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea
                    id="clinic_address"
                    value={formData.clinic_address || ""}
                    onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                    placeholder="123 Medical Center Drive, Healthcare City, HC 12345"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website URL
                  </Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url || ""}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://www.sgclinic.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operating_hours">Operating Hours</Label>
                  <Input
                    id="operating_hours"
                    value={formData.operating_hours || ""}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    placeholder="Monday - Friday: 8:00 AM - 6:00 PM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_logo_url">Clinic Logo URL</Label>
                  <Input
                    id="clinic_logo_url"
                    type="url"
                    value={formData.clinic_logo_url || ""}
                    onChange={(e) => handleInputChange('clinic_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">URL to your clinic's logo image</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="footer_note">Footer Note</Label>
                  <Input
                    id="footer_note"
                    value={formData.footer_note || ""}
                    onChange={(e) => handleInputChange('footer_note', e.target.value)}
                    placeholder="e.g., Powered by RAVESOFT"
                  />
                  <p className="text-sm text-muted-foreground">Text displayed at the bottom of printed tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Print Mode</Label>
                  <Select
                    value={formData.print_mode || "popup"}
                    onValueChange={(value) => handleInputChange('print_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Print</SelectItem>
                      <SelectItem value="popup">Print Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select
                    value={formData.theme_mode || "light"}
                    onValueChange={(value) => handleInputChange('theme_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voice Announcements</Label>
                    <p className="text-sm text-muted-foreground">Enable voice announcements when calling tokens</p>
                  </div>
                  <Switch
                    checked={formData.enable_voice_announcements || false}
                    onCheckedChange={(checked) => handleInputChange('enable_voice_announcements', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Online Booking</Label>
                    <p className="text-sm text-muted-foreground">Allow patients to book appointments online</p>
                  </div>
                  <Switch
                    checked={formData.enable_online_booking || false}
                    onCheckedChange={(checked) => handleInputChange('enable_online_booking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Patient Feedback</Label>
                    <p className="text-sm text-muted-foreground">Allow patients to provide feedback</p>
                  </div>
                  <Switch
                    checked={formData.enable_patient_feedback || false}
                    onCheckedChange={(checked) => handleInputChange('enable_patient_feedback', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Print Tickets</Label>
                    <p className="text-sm text-muted-foreground">Automatically print tickets when tokens are generated</p>
                  </div>
                  <Switch
                    checked={formData.enable_auto_print || false}
                    onCheckedChange={(checked) => handleInputChange('enable_auto_print', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Configuration Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Queue Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Reset at Midnight</Label>
                  <p className="text-sm text-muted-foreground">Automatically reset queue counters every day</p>
                </div>
                <Switch
                  checked={formData.auto_reset_midnight || false}
                  onCheckedChange={(checked) => handleInputChange('auto_reset_midnight', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Display Estimated Wait Time</Label>
                  <p className="text-sm text-muted-foreground">Show estimated wait times to patients</p>
                </div>
                <Switch
                  checked={formData.display_estimated_wait || false}
                  onCheckedChange={(checked) => handleInputChange('display_estimated_wait', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow All Users to Call Next Token</Label>
                  <p className="text-sm text-muted-foreground">Allow all staff to call tokens from any department</p>
                </div>
                <Switch
                  checked={formData.allow_all_users_call_tokens === 'true' || formData.allow_all_users_call_tokens === true}
                  onCheckedChange={(checked) => handleInputChange('allow_all_users_call_tokens', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display & Alerts Tab */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Display & Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.refresh_interval || "10"}
                    onChange={(e) => handleInputChange('refresh_interval', e.target.value)}
                    min="5"
                    max="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Queue Display Count</Label>
                  <Input
                    type="number"
                    value={formData.max_queue_display_count || "10"}
                    onChange={(e) => handleInputChange('max_queue_display_count', e.target.value)}
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Display Screen</Label>
                    <p className="text-sm text-muted-foreground">Show the public queue display screen</p>
                  </div>
                  <Switch
                    checked={formData.enable_display_screen || false}
                    onCheckedChange={(checked) => handleInputChange('enable_display_screen', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">Play sounds when queue status changes</p>
                  </div>
                  <Switch
                    checked={formData.enable_sound_alerts || false}
                    onCheckedChange={(checked) => handleInputChange('enable_sound_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS updates to patients</p>
                  </div>
                  <Switch
                    checked={formData.enable_sms_notifications || false}
                    onCheckedChange={(checked) => handleInputChange('enable_sms_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Department Colors</Label>
                    <p className="text-sm text-muted-foreground">Display department colors on queue screens</p>
                  </div>
                  <Switch
                    checked={formData.show_department_colors || false}
                    onCheckedChange={(checked) => handleInputChange('show_department_colors', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Default Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Priority</Label>
                  <Select
                    value={formData.default_priority || "Normal"}
                    onValueChange={(value) => handleInputChange('default_priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low Priority</SelectItem>
                      <SelectItem value="Normal">Normal Priority</SelectItem>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Max Emergency Tokens per Day</Label>
                  <Input
                    type="number"
                    value={formData.max_emergency_tokens || "10"}
                    onChange={(e) => handleInputChange('max_emergency_tokens', e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Changes
          </CardTitle>
          <CardDescription>Apply all changes to the system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={saveAllSettings} 
              disabled={saving} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reload Settings
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Make your changes and click "Save All Settings" to apply them to the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
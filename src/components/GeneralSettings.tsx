import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, 
  Building2, 
  Clock, 
  Monitor, 
  Bell, 
  Smartphone, 
  Save, 
  RotateCcw, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Palette,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  prefix: string;
  max_tokens_per_day: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  color_code: string;
  icon_name: string;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
}

export const GeneralSettings = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Department management state
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    prefix: '',
    max_tokens_per_day: 100,
    start_time: '08:00',
    end_time: '17:00',
    color_code: '#3b82f6',
    icon_name: 'activity'
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (deptError) throw deptError;
      setDepartments(deptData || []);
      
      // Load system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');
      
      if (settingsError) throw settingsError;
      
      const settingsMap = (settingsData || []).reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});
      
      setSettings(settingsMap);
      setFormData(settingsMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, category: string, showToast: boolean = true) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          category: category,
          description: getSettingDescription(key)
        });
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      if (showToast) {
        toast.success('Setting updated successfully');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      throw error;
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

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'clinic_name': 'Name of the clinic/hospital displayed on tickets and interface',
      'clinic_address': 'Physical address of the clinic/hospital',
      'clinic_phone': 'Primary phone number for the clinic',
      'clinic_email': 'Contact email address for the clinic',
      'operating_hours': 'Business operating hours displayed to patients',
      'website_url': 'Official website URL',
      'emergency_contact': 'Emergency contact number',
      'clinic_logo_url': 'URL or path to clinic logo image',
      'footer_note': 'Footer text displayed on printed tickets',
      'print_mode': 'How tokens should be printed (Direct or Popup)',
      'theme_mode': 'Application color theme (Light or Dark)',
      'enable_voice_announcements': 'Enable voice announcements for queue calls',
      'enable_online_booking': 'Allow patients to book appointments online',
      'enable_patient_feedback': 'Allow patients to provide feedback',
      'auto_reset_midnight': 'Automatically reset queue counters every day',
      'display_estimated_wait': 'Show estimated wait times to patients',
      'enable_display_screen': 'Show the public queue display screen',
      'enable_sound_alerts': 'Play sounds when queue status changes',
      'enable_sms_notifications': 'Send SMS updates to patients',
      'refresh_interval': 'Auto-refresh interval for display screens',
      'max_queue_display_count': 'Maximum number of queue entries to show on display screen',
      'show_department_colors': 'Display department colors on queue screens',
      'default_priority': 'Default priority level for new tokens',
      'max_emergency_tokens': 'Maximum emergency tokens allowed per day',
      'working_days': 'Days when the queue system is active',
      'use_native_voice': 'Use browser native voice synthesis instead of MP3 audio files',
      'voice_rate': 'Speech rate for voice announcements (0.5 to 2.0)',
      'voice_pitch': 'Speech pitch for voice announcements (0.0 to 2.0)',
      'voice_volume': 'Speech volume for voice announcements (0.0 to 1.0)'
    };
    return descriptions[key] || 'System setting';
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      const clinicName = formData.clinic_name?.toString().replace(/"/g, '').trim();
      if (!clinicName) {
        toast.error('Hospital/Clinic name is required');
        return;
      }

      // Validate email format if provided
      const emailValue = formData.clinic_email?.toString().replace(/"/g, '').trim();
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Validate website URL format if provided
      const websiteValue = formData.website_url?.toString().replace(/"/g, '').trim();
      if (websiteValue && websiteValue && !websiteValue.startsWith('http://') && !websiteValue.startsWith('https://')) {
        toast.error('Website URL must start with http:// or https://');
        return;
      }

      // Save all form data to database
      const settingsToUpdate = Object.entries(formData).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        category: getSettingCategory(key),
        description: getSettingDescription(key)
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsToUpdate);

      if (error) throw error;

      // Update local state to match database
      setSettings(formData);
      
      toast.success('✅ All settings saved successfully! Changes will be reflected across all modules.');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('❌ Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveDepartment = async () => {
    try {
      setSaving(true);
      
      if (editingDepartment) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            name: newDepartment.name,
            prefix: newDepartment.prefix,
            max_tokens_per_day: newDepartment.max_tokens_per_day,
            start_time: newDepartment.start_time,
            end_time: newDepartment.end_time,
            color_code: newDepartment.color_code,
            icon_name: newDepartment.icon_name
          })
          .eq('id', editingDepartment.id);
        
        if (error) throw error;
        toast.success('Department updated successfully');
      } else {
        // Add new department
        const { error } = await supabase
          .from('departments')
          .insert({
            name: newDepartment.name,
            prefix: newDepartment.prefix,
            max_tokens_per_day: newDepartment.max_tokens_per_day,
            start_time: newDepartment.start_time,
            end_time: newDepartment.end_time,
            color_code: newDepartment.color_code,
            icon_name: newDepartment.icon_name
          });
        
        if (error) throw error;
        toast.success('Department added successfully');
      }
      
      // Reset form and reload data
      setNewDepartment({
        name: '',
        prefix: '',
        max_tokens_per_day: 100,
        start_time: '08:00',
        end_time: '17:00',
        color_code: '#3b82f6',
        icon_name: 'activity'
      });
      setEditingDepartment(null);
      setShowAddDepartment(false);
      loadData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    try {
      // Check if department has active tokens
      const { data: activeTokens, error: checkError } = await supabase
        .from('queue_entries')
        .select('id')
        .eq('department', departments.find(d => d.id === departmentId)?.name)
        .in('status', ['Waiting', 'Called', 'Served']);
      
      if (checkError) throw checkError;
      
      if (activeTokens && activeTokens.length > 0) {
        toast.error('Cannot delete department with active tokens');
        return;
      }
      
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);
      
      if (error) throw error;
      
      toast.success('Department deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const toggleDepartmentStatus = async (departmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: isActive })
        .eq('id', departmentId);
      
      if (error) throw error;
      
      toast.success(`Department ${isActive ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch (error) {
      console.error('Error toggling department status:', error);
      toast.error('Failed to update department status');
    }
  };

  const resetToDefaults = async () => {
    try {
      setSaving(true);
      
      const defaultSettings = [
        { key: 'auto_reset_midnight', value: true, category: 'queue' },
        { key: 'display_estimated_wait', value: true, category: 'queue' },
        { key: 'enable_display_screen', value: true, category: 'display' },
        { key: 'enable_sound_alerts', value: true, category: 'display' },
        { key: 'enable_sms_notifications', value: false, category: 'display' },
        { key: 'refresh_interval', value: "10", category: 'display' },
        { key: 'default_priority', value: "Normal", category: 'defaults' },
        { key: 'max_emergency_tokens', value: "10", category: 'defaults' }
      ];
      
      for (const setting of defaultSettings) {
        await updateSetting(setting.key, setting.value, setting.category);
      }
      
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            General Settings
          </h2>
          <p className="text-muted-foreground">Configure system-wide options and preferences</p>
        </div>
        <Button onClick={resetToDefaults} variant="outline" disabled={saving}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4 mr-2" />
            Departments
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
            <Palette className="h-4 w-4 mr-2" />
            Defaults
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4">
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
                      value={formData.clinic_name?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinic_name: `"${e.target.value}"` }))}
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
                      value={formData.clinic_email?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinic_email: `"${e.target.value}"` }))}
                      placeholder="info@sgclinic.com"
                    />
                    <p className="text-sm text-muted-foreground">Primary contact email for the clinic</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic_phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="clinic_phone"
                      type="tel"
                      value={formData.clinic_phone?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinic_phone: `"${e.target.value}"` }))}
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-sm text-muted-foreground">Primary phone number for contact</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Emergency Contact
                    </Label>
                    <Input
                      id="emergency_contact"
                      type="tel"
                      value={formData.emergency_contact?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: `"${e.target.value}"` }))}
                      placeholder="+1 (555) 911-HELP"
                    />
                    <p className="text-sm text-muted-foreground">Emergency contact number</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic_address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <Textarea
                      id="clinic_address"
                      value={formData.clinic_address?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinic_address: `"${e.target.value}"` }))}
                      placeholder="123 Medical Center Drive, Healthcare City, HC 12345"
                      rows={2}
                    />
                    <p className="text-sm text-muted-foreground">Physical address of the clinic/hospital</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website URL
                    </Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, website_url: `"${e.target.value}"` }))}
                      placeholder="https://www.sgclinic.com"
                    />
                    <p className="text-sm text-muted-foreground">Official website URL</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operating_hours">Operating Hours</Label>
                    <Input
                      id="operating_hours"
                      value={formData.operating_hours?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, operating_hours: `"${e.target.value}"` }))}
                      placeholder="Monday - Friday: 8:00 AM - 6:00 PM"
                    />
                    <p className="text-sm text-muted-foreground">Business hours displayed to patients</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="footer_note">Footer Note</Label>
                    <Input
                      id="footer_note"
                      value={formData.footer_note?.toString().replace(/"/g, '') || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, footer_note: `"${e.target.value}"` }))}
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
                <CardDescription>Configure system behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Print Mode</Label>
                    <Select
                      value={formData.print_mode?.toString().replace(/"/g, '') || "popup"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, print_mode: `"${value}"` }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct Print</SelectItem>
                        <SelectItem value="popup">Print Popup</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">How tokens should be printed after generation</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Theme Mode</Label>
                    <Select
                      value={formData.theme_mode?.toString().replace(/"/g, '') || "light"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, theme_mode: `"${value}"` }))}
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
                    <p className="text-sm text-muted-foreground">Application color theme preference</p>
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
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_voice_announcements: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Online Booking</Label>
                      <p className="text-sm text-muted-foreground">Allow patients to book appointments online</p>
                    </div>
                    <Switch
                      checked={formData.enable_online_booking || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_online_booking: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Patient Feedback</Label>
                      <p className="text-sm text-muted-foreground">Allow patients to provide feedback</p>
                    </div>
                    <Switch
                      checked={formData.enable_patient_feedback || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_patient_feedback: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <Button onClick={loadData} variant="outline" disabled={saving}>
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
        </TabsContent>

        {/* Department Management */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>Add, edit, or remove departments from the system</CardDescription>
                </div>
                <Dialog open={showAddDepartment} onOpenChange={setShowAddDepartment}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingDepartment ? 'Edit Department' : 'Add New Department'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure the department details and operating hours.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Department Name</Label>
                          <Input
                            id="name"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Cardiology"
                          />
                        </div>
                        <div>
                          <Label htmlFor="prefix">Token Prefix</Label>
                          <Input
                            id="prefix"
                            value={newDepartment.prefix}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                            placeholder="e.g., CAR"
                            maxLength={3}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="max_tokens">Max Tokens Per Day</Label>
                        <Input
                          id="max_tokens"
                          type="number"
                          value={newDepartment.max_tokens_per_day}
                          onChange={(e) => setNewDepartment(prev => ({ ...prev, max_tokens_per_day: parseInt(e.target.value) || 100 }))}
                          min="1"
                          max="500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">Start Time</Label>
                          <Input
                            id="start_time"
                            type="time"
                            value={newDepartment.start_time}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">End Time</Label>
                          <Input
                            id="end_time"
                            type="time"
                            value={newDepartment.end_time}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, end_time: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="color_code">Department Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="color_code"
                            type="color"
                            value={newDepartment.color_code}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, color_code: e.target.value }))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">{newDepartment.color_code}</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowAddDepartment(false);
                        setEditingDepartment(null);
                        setNewDepartment({
                          name: '',
                          prefix: '',
                          max_tokens_per_day: 100,
                          start_time: '08:00',
                          end_time: '17:00',
                          color_code: '#3b82f6',
                          icon_name: 'activity'
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={saveDepartment} disabled={saving || !newDepartment.name || !newDepartment.prefix}>
                        {saving ? 'Saving...' : (editingDepartment ? 'Update' : 'Add')} Department
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Max Tokens/Day</TableHead>
                    <TableHead>Operating Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: dept.color_code }}
                          />
                          {dept.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dept.prefix}</Badge>
                      </TableCell>
                      <TableCell>{dept.max_tokens_per_day}</TableCell>
                      <TableCell>{dept.start_time} - {dept.end_time}</TableCell>
                      <TableCell>
                        <Switch
                          checked={dept.is_active}
                          onCheckedChange={(checked) => toggleDepartmentStatus(dept.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDepartment(dept);
                              setNewDepartment({
                                name: dept.name,
                                prefix: dept.prefix,
                                max_tokens_per_day: dept.max_tokens_per_day,
                                start_time: dept.start_time,
                                end_time: dept.end_time,
                                color_code: dept.color_code,
                                icon_name: dept.icon_name
                              });
                              setShowAddDepartment(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the {dept.name} department? 
                                  This action cannot be undone and will fail if there are active tokens.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDepartment(dept.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Configuration */}
        <TabsContent value="queue" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Queue Behavior</CardTitle>
                <CardDescription>Configure how the queue system operates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-reset at Midnight</Label>
                    <p className="text-sm text-muted-foreground">Automatically reset queue counters every day</p>
                  </div>
                  <Switch
                    checked={settings.auto_reset_midnight || false}
                    onCheckedChange={(checked) => updateSetting('auto_reset_midnight', checked, 'queue', false)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Display Estimated Wait Time</Label>
                    <p className="text-sm text-muted-foreground">Show estimated wait times to patients</p>
                  </div>
                  <Switch
                    checked={settings.display_estimated_wait || false}
                    onCheckedChange={(checked) => updateSetting('display_estimated_wait', checked, 'queue', false)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Working Days</CardTitle>
                <CardDescription>Select which days the queue system is active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const workingDays = settings.working_days || [];
                    const isActive = workingDays.includes(day);
                    
                    return (
                      <Button
                        key={day}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newDays = isActive 
                            ? workingDays.filter((d: string) => d !== day)
                            : [...workingDays, day];
                          updateSetting('working_days', newDays, 'queue', false);
                        }}
                      >
                        {day.slice(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Display & Notifications */}
        <TabsContent value="display" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Configure the public display screen behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Display Screen</Label>
                    <p className="text-sm text-muted-foreground">Show the public queue display screen</p>
                  </div>
                  <Switch
                    checked={settings.enable_display_screen || false}
                    onCheckedChange={(checked) => updateSetting('enable_display_screen', checked, 'display', false)}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Auto-refresh Interval</Label>
                    <Select
                      value={settings.refresh_interval?.toString() || "10"}
                      onValueChange={(value) => updateSetting('refresh_interval', value, 'display', false)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">How often to refresh the display screen</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Queue Display Count</Label>
                    <Input
                      type="number"
                      value={parseInt(settings.max_queue_display_count?.toString() || "20")}
                      onChange={(e) => updateSetting('max_queue_display_count', e.target.value, 'display', false)}
                      min="5"
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground">Maximum number of queue entries to show</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Department Colors</Label>
                    <p className="text-sm text-muted-foreground">Display department colors on queue screens</p>
                  </div>
                  <Switch
                    checked={settings.show_department_colors || false}
                    onCheckedChange={(checked) => updateSetting('show_department_colors', checked, 'display', false)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice Announcements</CardTitle>
                <CardDescription>Configure voice announcement settings for queue calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <div>
                      <Label>Enable Voice Announcements</Label>
                      <p className="text-sm text-muted-foreground">Announce token calls with voice</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enable_voice_announcements || false}
                    onCheckedChange={(checked) => updateSetting('enable_voice_announcements', checked, 'display', false)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use Native Voice</Label>
                    <p className="text-sm text-muted-foreground">Use browser's built-in speech synthesis (recommended)</p>
                  </div>
                  <Switch
                    checked={settings.use_native_voice !== false}
                    onCheckedChange={(checked) => updateSetting('use_native_voice', checked, 'display', false)}
                  />
                </div>

                {settings.use_native_voice !== false && (
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Speech Rate</Label>
                      <Select
                        value={settings.voice_rate?.toString() || "0.8"}
                        onValueChange={(value) => updateSetting('voice_rate', parseFloat(value), 'display', false)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">Very Slow (0.5x)</SelectItem>
                          <SelectItem value="0.7">Slow (0.7x)</SelectItem>
                          <SelectItem value="0.8">Recommended (0.8x)</SelectItem>
                          <SelectItem value="1.0">Normal (1.0x)</SelectItem>
                          <SelectItem value="1.2">Fast (1.2x)</SelectItem>
                          <SelectItem value="1.5">Very Fast (1.5x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Speech Pitch</Label>
                      <Select
                        value={settings.voice_pitch?.toString() || "1.0"}
                        onValueChange={(value) => updateSetting('voice_pitch', parseFloat(value), 'display', false)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.8">Lower Pitch</SelectItem>
                          <SelectItem value="1.0">Normal Pitch</SelectItem>
                          <SelectItem value="1.2">Higher Pitch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Speech Volume</Label>
                      <Select
                        value={settings.voice_volume?.toString() || "1.0"}
                        onValueChange={(value) => updateSetting('voice_volume', parseFloat(value), 'display', false)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">Quiet (50%)</SelectItem>
                          <SelectItem value="0.7">Medium (70%)</SelectItem>
                          <SelectItem value="1.0">Full Volume (100%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure alert and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <div>
                      <Label>Enable Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">Play sounds when queue status changes</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enable_sound_alerts || false}
                    onCheckedChange={(checked) => updateSetting('enable_sound_alerts', checked, 'display', false)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <Label>Enable SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send SMS updates to patients (demo mode)</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enable_sms_notifications || false}
                    onCheckedChange={(checked) => updateSetting('enable_sms_notifications', checked, 'display', false)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Defaults */}
        <TabsContent value="defaults" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Defaults</CardTitle>
                <CardDescription>Set default values for new queue entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Priority Level</Label>
                  <Select
                    value={settings.default_priority?.toString() || "Normal"}
                    onValueChange={(value) => updateSetting('default_priority', value, 'defaults', false)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Emergency Tokens Per Day</Label>
                  <Input
                    type="number"
                    value={parseInt(settings.max_emergency_tokens?.toString() || "10")}
                    onChange={(e) => updateSetting('max_emergency_tokens', e.target.value, 'defaults', false)}
                    min="1"
                    max="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Legacy System Name</Label>
                  <Input
                    value={settings.system_name?.toString().replace(/"/g, '') || "Hospital Queue Management System"}
                    onChange={(e) => updateSetting('system_name', `"${e.target.value}"`, 'defaults', false)}
                    placeholder="System display name"
                  />
                  <p className="text-sm text-muted-foreground">
                    Legacy field - Use "Hospital/Clinic Name" in General tab instead
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    System Information
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Departments:</span>
                    <Badge>{departments.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Departments:</span>
                    <Badge variant="outline">{departments.filter(d => d.is_active).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Updated:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
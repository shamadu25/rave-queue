import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemSettings {
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_email?: string;
  operating_hours?: string;
  website_url?: string;
  emergency_contact?: string;
  clinic_logo_url?: string;
  footer_note?: string;
  print_mode?: string;
  theme_mode?: string;
  enable_voice_announcements?: boolean;
  enable_online_booking?: boolean;
  enable_patient_feedback?: boolean;
  enable_auto_print?: boolean;
  enable_silent_printing?: boolean;
  auto_reset_midnight?: boolean;
  display_estimated_wait?: boolean;
  enable_display_screen?: boolean;
  enable_sound_alerts?: boolean;
  enable_sms_notifications?: boolean;
  refresh_interval?: string;
  max_queue_display_count?: string;
  show_department_colors?: boolean;
  default_priority?: string;
  max_emergency_tokens?: string;
  working_days?: string[];
  [key: string]: any;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    enable_silent_printing: false,  // Default to popup printing
    clinic_name: 'Your Hospital Name',
    clinic_logo: '',
    clinic_address: '',
    clinic_phone: '',
    clinic_email: '',
    website_url: '',
    operating_hours: '8:00 AM - 5:00 PM',
    emergency_contact: '',
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
    ticker_color: '#FFFFFF'
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: settingsData, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) {
        console.error('System settings query error:', error);
        // Don't throw error, just log it and use defaults
      }

      const settingsMap = (settingsData || []).reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as SystemSettings);

      // Merge with defaults to ensure all required settings exist
      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Failed to load system settings:', error);
      // Don't show toast error on load failure - use defaults silently
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, category: string = 'general') => {
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
      toast.success('Setting updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
      return false;
    }
  };

  const updateMultipleSettings = async (updates: Array<{ key: string; value: any; category: string }>) => {
    try {
      const settingsToUpsert = updates.map(update => ({
        setting_key: update.key,
        setting_value: update.value,
        category: update.category,
        description: getSettingDescription(update.key)
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Reload settings to ensure we have the latest state
      await loadSettings();

      // Broadcast settings update for real-time sync
      window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { 
        detail: settings 
      }));

      toast.success('Settings saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
      return false;
    }
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
      'enable_auto_print': 'Automatically print tickets when tokens are generated',
      'enable_silent_printing': 'Print tickets silently without showing print dialog',
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
      'working_days': 'Days when the queue system is active'
    };
    return descriptions[key] || 'System setting';
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { 
    settings, 
    loading, 
    loadSettings, 
    updateSetting, 
    updateMultipleSettings 
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  clinic_name?: string;
  footer_note?: string;
  [key: string]: any;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: settingsData, error } = await supabase
          .from('system_settings')
          .select('*');

        if (error) throw error;

        const settingsMap = (settingsData || []).reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as SystemSettings);

        setSettings(settingsMap);
      } catch (error) {
        console.error('Failed to load system settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
};
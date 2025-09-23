import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface Department {
  id: string;
  name: string;
  prefix: string;
  color_code: string;
  announcement_template: string;
}

export const useAnnouncementQueue = () => {
  const { settings } = useSystemSettings();
  const { announceWithChime, isEnabled } = useTextToSpeech();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, prefix, color_code, announcement_template')
        .eq('is_active', true);

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const processAnnouncementTemplate = (
    template: string,
    tokenNumber: string,
    departmentName: string, 
    hospitalName: string,
    room?: string
  ) => {
    // Extract prefix from token number
    const prefix = tokenNumber.match(/^[A-Z]+/)?.[0] || '';
    const numberOnly = tokenNumber.replace(/^[A-Z]+/, '');
    
    return template
      .replace(/{number}/g, tokenNumber)
      .replace(/{prefix}/g, prefix)
      .replace(/{department}/g, departmentName)
      .replace(/{hospitalName}/g, hospitalName)
      .replace(/{room}/g, room || '');
  };

  const announceToken = async (
    token: string, 
    departmentName: string, 
    room?: string
  ): Promise<{ message: string; department: Department | null }> => {
    if (!isEnabled) {
      return { message: '', department: null };
    }

    // Find department configuration
    const department = departments.find(d => d.name === departmentName);
    
    const template = department?.announcement_template || 
      'Token {number}, please proceed to {department} at {hospitalName}.';

    const message = processAnnouncementTemplate(
      template,
      token,
      departmentName,
      settings?.clinic_name || 'Hospital',
      room
    );

    // Play announcement with chime
    await announceWithChime(token, departmentName, room, template);

    return { message, department };
  };

  return {
    announceToken,
    departments,
    isEnabled
  };
};
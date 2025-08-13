import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  created_at: string;
  department: {
    id: string;
    name: string;
    color_code: string;
    prefix: string;
  };
}

export const useUserDepartments = (userId?: string) => {
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDepartments = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_departments')
        .select(`
          id,
          user_id,
          department_id,
          created_at,
          departments:department_id (
            id,
            name,
            color_code,
            prefix
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        department: item.departments
      }));

      setUserDepartments(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user departments:', err);
      setError('Failed to load user departments');
    } finally {
      setLoading(false);
    }
  };

  const assignDepartment = async (userId: string, departmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_departments')
        .insert({ user_id: userId, department_id: departmentId });

      if (error) throw error;
      
      await fetchUserDepartments();
      return true;
    } catch (err) {
      console.error('Error assigning department:', err);
      throw new Error('Failed to assign department');
    }
  };

  const removeDepartment = async (userDepartmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('id', userDepartmentId);

      if (error) throw error;
      
      await fetchUserDepartments();
      return true;
    } catch (err) {
      console.error('Error removing department:', err);
      throw new Error('Failed to remove department');
    }
  };

  useEffect(() => {
    fetchUserDepartments();
  }, [userId]);

  return {
    userDepartments,
    loading,
    error,
    assignDepartment,
    removeDepartment,
    refetch: fetchUserDepartments
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QueueEntry, Status, Department, Priority } from '@/types/queue';

export const useQueueEntries = () => {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedEntries: QueueEntry[] = data.map(entry => ({
        id: entry.id,
        token: entry.token,
        fullName: entry.full_name,
        phoneNumber: entry.phone_number,
        department: entry.department as Department,
        priority: entry.priority as Priority,
        status: entry.status as Status,
        timestamp: new Date(entry.created_at)
      }));

      setEntries(mappedEntries);
    } catch (err) {
      console.error('Error fetching queue entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<QueueEntry, 'id' | 'timestamp'>) => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          token: entryData.token,
          full_name: entryData.fullName,
          phone_number: entryData.phoneNumber,
          department: entryData.department,
          priority: entryData.priority,
          status: entryData.status
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: QueueEntry = {
        id: data.id,
        token: data.token,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        department: data.department as Department,
        priority: data.priority as Priority,
        status: data.status as Status,
        timestamp: new Date(data.created_at)
      };

      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      console.error('Error adding queue entry:', err);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => 
        prev.map(entry => 
          entry.id === id ? { ...entry, status } : entry
        )
      );
    } catch (err) {
      console.error('Error updating queue entry status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEntry: QueueEntry = {
              id: payload.new.id,
              token: payload.new.token,
              fullName: payload.new.full_name,
              phoneNumber: payload.new.phone_number,
              department: payload.new.department as Department,
              priority: payload.new.priority as Priority,
              status: payload.new.status as Status,
              timestamp: new Date(payload.new.created_at)
            };
            setEntries(prev => [newEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev => 
              prev.map(entry => 
                entry.id === payload.new.id 
                  ? {
                      ...entry,
                      status: payload.new.status as Status,
                      fullName: payload.new.full_name,
                      phoneNumber: payload.new.phone_number,
                      department: payload.new.department as Department,
                      priority: payload.new.priority as Priority
                    }
                  : entry
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(entry => entry.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateStatus,
    refetch: fetchEntries
  };
};
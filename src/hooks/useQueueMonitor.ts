import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QueueEntry, Status, Department } from '@/types/queue';

interface ExtendedQueueEntry extends QueueEntry {
  calledAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  transferredFrom?: string;
  servedBy?: string;
}

export const useQueueMonitor = (userDepartment?: string) => {
  const [entries, setEntries] = useState<ExtendedQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          profiles:served_by(full_name)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedEntries: ExtendedQueueEntry[] = data.map(entry => ({
        id: entry.id,
        token: entry.token,
        fullName: entry.full_name,
        phoneNumber: entry.phone_number,
        department: entry.department as Department,
        priority: entry.priority as 'Normal' | 'Emergency',
        status: entry.status as Status,
        timestamp: new Date(entry.created_at),
        calledAt: entry.called_at ? new Date(entry.called_at) : undefined,
        servedAt: entry.served_at ? new Date(entry.served_at) : undefined,
        completedAt: entry.completed_at ? new Date(entry.completed_at) : undefined,
        skippedAt: entry.skipped_at ? new Date(entry.skipped_at) : undefined,
        transferredFrom: entry.transferred_from,
        servedBy: entry.profiles?.full_name
      }));

      setEntries(mappedEntries);
    } catch (err) {
      console.error('Error fetching queue entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Status, userId?: string) => {
    try {
      const updateData: any = { status };
      
      // Set timestamp fields based on status
      switch (status) {
        case 'Called':
          updateData.called_at = new Date().toISOString();
          break;
        case 'Served':
          updateData.served_at = new Date().toISOString();
          updateData.served_by = userId;
          break;
        case 'Completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'Skipped':
          updateData.skipped_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('queue_entries')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === id ? { ...entry, status } : entry
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  const transferEntry = async (
    entryId: string, 
    toDepartment: Department, 
    transferredBy: string, 
    reason?: string
  ) => {
    try {
      // Get current entry
      const currentEntry = entries.find(e => e.id === entryId);
      if (!currentEntry) throw new Error('Entry not found');

      // Update the queue entry
      const { error: updateError } = await supabase
        .from('queue_entries')
        .update({
          department: toDepartment,
          status: 'Waiting',
          transferred_from: currentEntry.department,
          called_at: null,
          served_at: null,
          completed_at: null,
          skipped_at: null,
          served_by: null
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      // Log the transfer
      const { error: transferError } = await supabase
        .from('queue_transfers')
        .insert({
          queue_entry_id: entryId,
          from_department: currentEntry.department,
          to_department: toDepartment,
          transferred_by: transferredBy,
          reason
        });

      if (transferError) throw transferError;

      // Update local state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                department: toDepartment, 
                status: 'Waiting' as Status,
                transferredFrom: currentEntry.department
              }
            : entry
        )
      );
    } catch (err) {
      console.error('Error transferring entry:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-monitor-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        () => {
          fetchEntries(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter entries by department if specified
  const filteredEntries = userDepartment 
    ? entries.filter(entry => entry.department === userDepartment)
    : entries;

  return {
    entries: filteredEntries,
    loading,
    error,
    updateStatus,
    transferEntry,
    refetch: fetchEntries
  };
};
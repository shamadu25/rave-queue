import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface QueueEntry {
  id: string;
  token: string;
  full_name: string;
  department: string;
  status: string;
  called_at: string | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  color_code: string;
  prefix: string;
}

const PublicDisplay: React.FC = () => {
  const { settings } = useSystemSettings();
  const [currentCalls, setCurrentCalls] = useState<QueueEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [queueStats, setQueueStats] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchCurrentCalls();
    fetchDepartments();
    fetchQueueStats();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up real-time subscription
    const channel = supabase
      .channel('public_display')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          fetchCurrentCalls();
          fetchQueueStats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('status', 'Called')
        .order('called_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCurrentCalls(data || []);
    } catch (error) {
      console.error('Error fetching current calls:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('department, status')
        .eq('status', 'Waiting');

      if (error) throw error;

      const stats: Record<string, number> = {};
      (data || []).forEach(entry => {
        stats[entry.department] = (stats[entry.department] || 0) + 1;
      });

      setQueueStats(stats);
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const hospitalName = settings.clinic_name?.replace(/"/g, '') || 'Hospital Queue System';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-slate-800 mb-2">
            {hospitalName.toUpperCase()}
          </h1>
          <div className="flex items-center justify-center gap-2 text-xl text-slate-600">
            <Clock className="h-6 w-6" />
            {currentTime.toLocaleString()}
          </div>
        </div>

        {/* Current Calls */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              Now Calling
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentCalls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCalls.map((call) => {
                  const department = departments.find(d => d.name === call.department);
                  return (
                    <div 
                      key={call.id}
                      className="p-6 rounded-xl border-4 text-center animate-pulse-slow"
                      style={{ 
                        borderColor: department?.color_code || '#3b82f6',
                        backgroundColor: `${department?.color_code || '#3b82f6'}10`
                      }}
                    >
                      <div className="text-4xl font-bold mb-2" style={{ color: department?.color_code }}>
                        {call.token}
                      </div>
                      <div className="text-lg font-semibold text-slate-700 mb-1">
                        {call.department}
                      </div>
                      <div className="text-sm text-slate-500">
                        Called at {new Date(call.called_at!).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="text-2xl mb-4">No tokens currently being called</div>
                <div className="text-lg">Please wait for your token to be announced</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Queue Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => {
            const waitingCount = queueStats[department.name] || 0;
            return (
              <Card 
                key={department.id}
                className="border-2 shadow-lg bg-white/80 backdrop-blur-sm"
                style={{ borderColor: department.color_code }}
              >
                <CardHeader 
                  className="text-center"
                  style={{ backgroundColor: `${department.color_code}15` }}
                >
                  <CardTitle 
                    className="text-xl font-bold"
                    style={{ color: department.color_code }}
                  >
                    {department.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-3xl font-bold text-slate-700">
                    <Users className="h-8 w-8" />
                    {waitingCount}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    {waitingCount === 1 ? 'person waiting' : 'people waiting'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-600">
          <p className="text-lg">
            {settings.footer_note?.replace(/"/g, '') || 'Thank you for visiting our hospital'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicDisplay;
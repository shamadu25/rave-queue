import { TokenGenerator } from '@/components/TokenGenerator';
import { QueueList } from '@/components/QueueList';
import { QueueEntry, Status } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Index = () => {
  const { entries: queueEntries, loading, addEntry, updateStatus } = useQueueEntries();

  const handleTokenGenerated = async (newEntryData: Omit<QueueEntry, 'id' | 'timestamp'>) => {
    try {
      await addEntry(newEntryData);
    } catch (error) {
      toast.error('Failed to generate token. Please try again.');
      throw error;
    }
  };

  const handleStatusUpdate = async (id: string, status: Status) => {
    try {
      await updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  // Calculate stats
  const totalEntries = queueEntries.length;
  const waitingCount = queueEntries.filter(e => e.status === 'Waiting').length;
  const inProgressCount = queueEntries.filter(e => e.status === 'In Progress').length;
  const completedCount = queueEntries.filter(e => e.status === 'Completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading queue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Queue Management System</h1>
              <p className="text-muted-foreground">Hospital Queue Token Generator & Monitor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntries}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waiting</CardTitle>
              <Clock className="h-4 w-4 text-waiting" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-waiting">{waitingCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-in-progress" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-in-progress">{inProgressCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Activity className="h-4 w-4 text-completed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-completed">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Generator */}
          <div className="lg:col-span-1">
            <TokenGenerator onTokenGenerated={handleTokenGenerated} />
          </div>
          
          {/* Queue List */}
          <div className="lg:col-span-2">
            <QueueList 
              entries={queueEntries} 
              onUpdateStatus={handleStatusUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

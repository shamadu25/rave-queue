import { Link } from 'react-router-dom';
import { TokenGenerator } from '@/components/TokenGenerator';
import { ModernQueueList } from '@/components/ModernQueueList';
import { DashboardStats } from '@/components/DashboardStats';
import { QueueEntry, Status } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { Activity, Shield, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePrintTicket } from '@/hooks/usePrintTicket';

const Index = () => {
  const { entries: queueEntries, loading, addEntry, updateStatus } = useQueueEntries();
  const { profile } = useAuth();
  const { printTicket } = usePrintTicket();

  const handleTokenGenerated = async (newEntryData: Omit<QueueEntry, 'id' | 'timestamp'>) => {
    try {
      const newEntry = await addEntry(newEntryData);
      // Auto-trigger print after successful token creation
      if (newEntry) {
        printTicket(newEntry);
      }
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
  const inProgressCount = queueEntries.filter(e => e.status === 'Called' || e.status === 'Served').length;
  const completedCount = queueEntries.filter(e => e.status === 'Completed').length;

  const getPageTitle = () => {
    if (!profile) return "Queue Management Dashboard";
    
    switch (profile.role) {
      case 'admin':
        return "Hospital Admin Dashboard";
      case 'doctor':
        return "Doctor Dashboard";
      case 'receptionist':
        return "Reception Dashboard";
      default:
        return "Hospital Dashboard";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading queue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
          <p className="text-muted-foreground">Welcome to the Hospital Queue Management System</p>
        </div>
        <div className="flex items-center gap-3">
          {!profile && (
            <Link to="/auth">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Staff Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats
        totalEntries={totalEntries}
        waitingCount={waitingCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Generator */}
        <div className="lg:col-span-1">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="heading-secondary flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Generate New Token
              </CardTitle>
              <CardDescription>
                Create a new queue token for patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenGenerator onTokenGenerated={handleTokenGenerated} />
            </CardContent>
          </Card>
        </div>
        
        {/* Queue List */}
        <div className="lg:col-span-2">
          <ModernQueueList 
            entries={queueEntries} 
            title="Active Queue"
            description="Current patients in the queue system"
            canFilter={true}
            onUpdateStatus={handleStatusUpdate}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

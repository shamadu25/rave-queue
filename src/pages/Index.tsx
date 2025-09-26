import { Link } from 'react-router-dom';
import { TokenGenerator } from '@/components/TokenGenerator';
import { ModernQueueList } from '@/components/ModernQueueList';
import { DashboardStats } from '@/components/DashboardStats';
import { TopBar } from '@/components/TopBar';
import { QueueEntry, Status } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { Activity, Shield, PlusCircle, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePrintTicket } from '@/hooks/usePrintTicket';
import { DynamicBranding } from '@/components/DynamicBranding';
import { AnimatedBackground } from '@/components/AnimatedBackground';

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
      <AnimatedBackground variant="dashboard">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading queue data...</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground variant="dashboard">
      {profile && <TopBar title={getPageTitle()} />}
      <div className="p-6 space-y-6 relative z-10">
        {/* Enhanced Page Header with Dynamic Branding */}
        <div className="glass-card p-6 border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <DynamicBranding variant="header" logoSize="lg" />
             
            </div>
            <div className="flex items-center gap-3">
              <Link to="/display">
                <Button variant="outline" className="glow-on-hover">
                  <Monitor className="h-4 w-4 mr-2" />
                  Public Display
                </Button>
              </Link>
              <Link to="/token">
                <Button className="btn-gradient">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </Link>
              {!profile && (
                <Link to="/auth">
                  <Button variant="outline" className="glow-on-hover">
                    <Shield className="h-4 w-4 mr-2" />
                    Staff Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Stats */}
        <div className="animate-fade-in-up">
          <DashboardStats
            totalEntries={totalEntries}
            waitingCount={waitingCount}
            inProgressCount={inProgressCount}
            completedCount={completedCount}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Quick Actions */}
          <div className="lg:col-span-1">
            {profile?.role === 'admin' ? (
              <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="heading-secondary flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Control Panel
                  </CardTitle>
                  <CardDescription>
                    System management and oversight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link to="/settings">
                      <Button variant="outline" className="w-full justify-start glow-on-hover">
                        System Settings
                      </Button>
                    </Link>
                    <Link to="/monitor">
                      <Button variant="outline" className="w-full justify-start glow-on-hover">
                        Queue Monitor
                      </Button>
                    </Link>
                    <Link to="/display">
                      <Button variant="outline" className="w-full justify-start glow-on-hover">
                        <Monitor className="h-4 w-4 mr-2" />
                        Public Display
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border-white/20 hover:border-white/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="heading-secondary flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Essential tools and access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link to="/token">
                      <Button className="w-full btn-gradient">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Generate Token
                      </Button>
                    </Link>
                    <Link to="/monitor">
                      <Button variant="outline" className="w-full justify-start glow-on-hover">
                        <Activity className="h-4 w-4 mr-2" />
                        Monitor Queue
                      </Button>
                    </Link>
                    <Link to="/display">
                      <Button variant="outline" className="w-full justify-start glow-on-hover">
                        <Monitor className="h-4 w-4 mr-2" />
                        Public Display
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Enhanced Queue List */}
          <div className="lg:col-span-2">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
      </div>
    </AnimatedBackground>
  );
};

export default Index;

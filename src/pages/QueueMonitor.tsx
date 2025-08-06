import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { TransferModal } from '@/components/TransferModal';
import { QueueDisplay } from '@/components/QueueDisplay';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';
import { Department, Status } from '@/types/queue';
import { toast } from 'sonner';
import { Activity, LogOut } from 'lucide-react';

// Helper function to determine what department filter to apply based on role
const getUserDepartmentFilter = (role?: string, department?: string): string | undefined => {
  if (!role || !department) return undefined;
  
  switch (role) {
    case 'admin':
    case 'receptionist':
      return undefined; // See all departments
    case 'doctor':
      return 'Consultation';
    case 'lab_technician':
      return 'Lab';
    case 'pharmacist':
      return 'Pharmacy';
    case 'xray_technician':
      return 'X-ray';
    case 'imaging_technician':
      return 'Scan';
    case 'billing_staff':
      return 'Billing';
    default:
      return department; // Fallback to user's department
  }
};

export default function QueueMonitor() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    entryId: string;
    currentDepartment: Department;
    patientName: string;
    token: string;
  }>({
    isOpen: false,
    entryId: '',
    currentDepartment: 'Consultation',
    patientName: '',
    token: ''
  });

  // Get filtered entries based on user role and department
  const { entries, loading, updateStatus, transferEntry } = useQueueMonitor(
    getUserDepartmentFilter(profile?.role, profile?.department)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }


  const handleStatusUpdate = async (entryId: string, newStatus: Status) => {
    try {
      await updateStatus(entryId, newStatus, profile?.id);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleTransfer = async (toDepartment: Department, reason?: string) => {
    try {
      await transferEntry(transferModal.entryId, toDepartment, profile?.id || '', reason);
      toast.success(`Patient transferred to ${toDepartment}`);
      setTransferModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to transfer patient');
    }
  };

  const handleOpenTransferModal = (entryId: string, currentDepartment: Department, patientName: string, token: string) => {
    setTransferModal({
      isOpen: true,
      entryId,
      currentDepartment,
      patientName,
      token
    });
  };

  // Determine queue display configuration based on user role
  const getQueueConfig = () => {
    const role = profile?.role;
    const department = profile?.department;
    
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Dashboard - All Queues',
          description: 'Monitor and manage all department queues with full access controls',
          canFilter: true,
          canPerformActions: true
        };
      case 'receptionist':
        return {
          title: 'Reception Desk - Queue Overview',
          description: 'View all patient queues across departments (view-only access)',
          canFilter: true,
          canPerformActions: false
        };
      case 'doctor':
        return {
          title: 'Consultation Queue',
          description: 'Manage patients in the consultation department',
          canFilter: false,
          canPerformActions: true
        };
      case 'lab_technician':
        return {
          title: 'Laboratory Queue',
          description: 'Process laboratory requests and sample collections',
          canFilter: false,
          canPerformActions: true
        };
      case 'pharmacist':
        return {
          title: 'Pharmacy Queue',
          description: 'Dispense medications and handle pharmacy requests',
          canFilter: false,
          canPerformActions: true
        };
      case 'xray_technician':
        return {
          title: 'X-ray Department Queue',
          description: 'Handle X-ray imaging requests and appointments',
          canFilter: false,
          canPerformActions: true
        };
      case 'imaging_technician':
        return {
          title: 'Scan/Imaging Queue',
          description: 'Manage CT, MRI, and other advanced imaging requests',
          canFilter: false,
          canPerformActions: true
        };
      case 'billing_staff':
        return {
          title: 'Billing Department Queue',
          description: 'Process billing and payment-related requests',
          canFilter: false,
          canPerformActions: true
        };
      default:
        return {
          title: `${department} Queue`,
          description: `Manage your department's queue`,
          canFilter: false,
          canPerformActions: true
        };
    }
  };

  const queueConfig = getQueueConfig();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Queue Monitor</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {profile?.full_name} ({profile?.role}) - {profile?.department}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {profile?.role === 'admin' ? (
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue">Queue Management</TabsTrigger>
              <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="queue" className="mt-6">
              <QueueDisplay
                entries={entries}
                title={queueConfig.title}
                description={queueConfig.description}
                canFilter={queueConfig.canFilter}
                canPerformActions={queueConfig.canPerformActions}
                userRole={profile?.role}
                userDepartment={profile?.department}
                onStatusUpdate={handleStatusUpdate}
                onTransfer={handleOpenTransferModal}
                loading={loading}
              />
            </TabsContent>
            
            <TabsContent value="reports" className="mt-6">
              <ReportsAnalytics entries={entries} />
            </TabsContent>
          </Tabs>
        ) : (
          <QueueDisplay
            entries={entries}
            title={queueConfig.title}
            description={queueConfig.description}
            canFilter={queueConfig.canFilter}
            canPerformActions={queueConfig.canPerformActions}
            userRole={profile?.role}
            userDepartment={profile?.department}
            onStatusUpdate={handleStatusUpdate}
            onTransfer={handleOpenTransferModal}
            loading={loading}
          />
        )}
      </div>

      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}
        onTransfer={handleTransfer}
        currentDepartment={transferModal.currentDepartment}
        patientName={transferModal.patientName}
        token={transferModal.token}
      />
    </div>
  );
}
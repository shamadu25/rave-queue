import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { TransferModal } from '@/components/TransferModal';
import { Department, Status } from '@/types/queue';
import { toast } from 'sonner';
import { 
  Activity, 
  LogOut, 
  Phone, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Clock,
  User,
  Building2,
  AlertTriangle
} from 'lucide-react';

export default function QueueMonitor() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
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

  const { entries, loading, updateStatus, transferEntry } = useQueueMonitor();

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

  const filteredEntries = entries.filter(entry => {
    if (selectedDepartment !== 'all' && entry.department !== selectedDepartment) {
      return false;
    }
    if (selectedStatus !== 'all' && entry.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: Status, priority: string) => {
    if (priority === 'Emergency') {
      return 'bg-red-500 text-white border-red-600';
    }
    
    switch (status) {
      case 'Waiting':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Called':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Served':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Skipped':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

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
    } catch (error) {
      toast.error('Failed to transfer patient');
    }
  };

  const canPerformAction = (entryDepartment: string) => {
    return profile?.role === 'admin' || profile?.department === entryDepartment;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter queue entries by department and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <Select 
                  value={selectedDepartment} 
                  onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Lab">Laboratory</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Select 
                  value={selectedStatus} 
                  onValueChange={(value: Status | 'all') => setSelectedStatus(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Waiting">Waiting</SelectItem>
                    <SelectItem value="Called">Called</SelectItem>
                    <SelectItem value="Served">Served</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Entries ({filteredEntries.length})</CardTitle>
            <CardDescription>
              Live queue status with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading queue entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No queue entries found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-primary">
                          {entry.token}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{entry.fullName}</span>
                            {entry.priority === 'Emergency' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {entry.department}
                              {entry.transferredFrom && (
                                <span className="text-blue-600">
                                  (from {entry.transferredFrom})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(entry.status, entry.priority)}>
                        {entry.status}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    {canPerformAction(entry.department) && entry.status !== 'Completed' && entry.status !== 'Skipped' && (
                      <div className="flex gap-2 flex-wrap">
                        {entry.status === 'Waiting' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'Called')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        )}
                        
                        {entry.status === 'Called' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'Served')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Serve
                          </Button>
                        )}
                        
                        {entry.status === 'Served' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'Completed')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(entry.id, 'Skipped')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Skip
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTransferModal({
                            isOpen: true,
                            entryId: entry.id,
                            currentDepartment: entry.department,
                            patientName: entry.fullName,
                            token: entry.token
                          })}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Transfer
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
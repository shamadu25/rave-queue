import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Status, Department } from '@/types/queue';

interface ExtendedQueueEntry {
  id: string;
  token: string;
  fullName: string;
  phoneNumber?: string;
  department: Department;
  priority: 'Normal' | 'Emergency';
  status: Status;
  timestamp: Date;
  transferredFrom?: string;
}
import { 
  Activity, 
  Phone, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Stethoscope,
  TestTube,
  Pill,
  RadioIcon,
  ScanLine,
  Receipt
} from 'lucide-react';

interface QueueDisplayProps {
  entries: ExtendedQueueEntry[];
  title: string;
  description: string;
  canFilter?: boolean;
  canPerformActions?: boolean;
  userRole?: string;
  userDepartment?: string;
  onStatusUpdate?: (entryId: string, status: Status) => void;
  onTransfer?: (entryId: string, currentDepartment: Department, patientName: string, token: string) => void;
  loading?: boolean;
}

export const QueueDisplay: React.FC<QueueDisplayProps> = ({
  entries,
  title,
  description,
  canFilter = false,
  canPerformActions = false,
  userRole,
  userDepartment,
  onStatusUpdate,
  onTransfer,
  loading = false
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger a refresh by updating a state that causes re-render
      // This is handled by the parent component via real-time updates
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredEntries = entries.filter(entry => {
    if (selectedDepartment !== 'all' && entry.department !== selectedDepartment) {
      return false;
    }
    if (selectedStatus !== 'all' && entry.status !== selectedStatus) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

  const getDepartmentIcon = (department: Department) => {
    switch (department) {
      case 'Consultation':
        return <Stethoscope className="h-3 w-3" />;
      case 'Lab':
        return <TestTube className="h-3 w-3" />;
      case 'Pharmacy':
        return <Pill className="h-3 w-3" />;
      case 'X-ray':
        return <RadioIcon className="h-3 w-3" />;
      case 'Scan':
        return <ScanLine className="h-3 w-3" />;
      case 'Billing':
        return <Receipt className="h-3 w-3" />;
      default:
        return <Building2 className="h-3 w-3" />;
    }
  };

  const canPerformActionOnEntry = (entryDepartment: string) => {
    if (!canPerformActions) return false;
    return userRole === 'admin' || userDepartment === entryDepartment;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {title} ({filteredEntries.length})
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      {canFilter && (
        <CardContent className="pb-4">
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
                  <SelectItem value="X-ray">X-ray</SelectItem>
                  <SelectItem value="Scan">Scan</SelectItem>
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
      )}
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading queue entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active patients in queue.</p>
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
                          {getDepartmentIcon(entry.department)}
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
                {canPerformActionOnEntry(entry.department) && entry.status !== 'Completed' && entry.status !== 'Skipped' && (
                  <div className="flex gap-2 flex-wrap">
                    {entry.status === 'Waiting' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStatusUpdate?.(entry.id, 'Called')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                    
                    {entry.status === 'Called' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStatusUpdate?.(entry.id, 'Served')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Serve
                      </Button>
                    )}
                    
                    {entry.status === 'Served' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStatusUpdate?.(entry.id, 'Completed')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusUpdate?.(entry.id, 'Skipped')}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Skip
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTransfer?.(entry.id, entry.department, entry.fullName, entry.token)}
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
  );
};
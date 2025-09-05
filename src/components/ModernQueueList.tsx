import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useTextToSpeech } from '@/services/textToSpeechService';
import { AnnouncementTicker } from '@/components/AnnouncementTicker';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncementQueue } from '@/hooks/useAnnouncementQueue';
import { 
  Phone, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft,
  Clock,
  User,
  Building2,
  Stethoscope,
  TestTube,
  Pill,
  Radio,
  ScanLine,
  Receipt,
  Filter,
  Trash2
} from 'lucide-react';
import { QueueEntry, Status, Department } from '@/types/queue';

interface ModernQueueListProps {
  entries: QueueEntry[];
  title: string;
  description?: string;
  canFilter?: boolean;
  canPerformActions?: boolean;
  userRole?: string;
  userDepartment?: string;
  onUpdateStatus?: (id: string, status: Status) => Promise<void> | void;
  onTransfer?: (entryId: string, currentDepartment: Department, patientName: string, token: string) => void;
  onDelete?: (entryId: string) => Promise<void> | void;
  loading?: boolean;
}

export function ModernQueueList({
  entries,
  title,
  description,
  canFilter = false,
  canPerformActions = false,
  userRole,
  userDepartment,
  onUpdateStatus,
  onTransfer,
  onDelete,
  loading = false
}: ModernQueueListProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const { announceToken } = useAnnouncementQueue();
  const { settings } = useSystemSettings();
  const { profile } = useAuth();

  const filteredEntries = entries.filter(entry => {
    if (selectedDepartment !== 'all' && entry.department !== selectedDepartment) {
      return false;
    }
    if (selectedStatus !== 'all' && entry.status !== selectedStatus) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by priority first (Emergency first), then by timestamp
    if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
    if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const getDepartmentIcon = (department: Department) => {
    switch (department) {
      case 'Consultation':
        return <Stethoscope className="h-4 w-4" />;
      case 'Lab':
        return <TestTube className="h-4 w-4" />;
      case 'Pharmacy':
        return <Pill className="h-4 w-4" />;
      case 'X-ray':
        return <Radio className="h-4 w-4" />;
      case 'Scan':
        return <ScanLine className="h-4 w-4" />;
      case 'Billing':
        return <Receipt className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const canPerformActionOnEntry = (entryDepartment: string) => {
    if (!canPerformActions) return false;
    
    // Check if staff access is restricted to own department
    const restrictAccess = settings?.staff_access_own_department === true || String(settings?.staff_access_own_department) === 'true';
    
    if (restrictAccess && userRole !== 'admin') {
      // Non-admin users are restricted to their own department
      return userDepartment === entryDepartment;
    }
    
    // Admin or unrestricted access - can perform actions on any department
    return true;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNextAction = (status: Status) => {
    switch (status) {
      case 'Waiting':
        return { action: 'Called', label: 'Call', icon: Phone, variant: 'default' as const };
      case 'Called':
        return { action: 'Served', label: 'Serve', icon: Play, variant: 'default' as const };
      case 'Served':
        return { action: 'Completed', label: 'Complete', icon: CheckCircle, variant: 'default' as const };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="medical-card">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading queue...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="heading-secondary flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {title}
              <Badge variant="outline" className="ml-2">
                {filteredEntries.length}
              </Badge>
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>

        {/* Filters */}
        {canFilter && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
        )}
      </CardHeader>

      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No patients in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => {
              const nextAction = getNextAction(entry.status);
              const isCurrentlyServing = entry.status === 'Called' || entry.status === 'Served';
              
              return (
                <div
                  key={entry.id}
                  className={`
                    border rounded-lg p-4 transition-all duration-200 hover:shadow-sm
                    ${isCurrentlyServing ? 'ring-2 ring-primary/20 bg-primary/5' : 'bg-card'}
                    ${entry.priority === 'Emergency' ? 'border-destructive/50' : 'border-border'}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Token and Patient Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-center">
                        <div className={`
                          text-lg font-bold px-3 py-1 rounded-lg
                          ${entry.priority === 'Emergency' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}
                        `}>
                          {entry.token}
                        </div>
                        {index === 0 && entry.status === 'Waiting' && (
                          <div className="text-xs text-primary font-medium mt-1">Next</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entry.fullName}</span>
                          {entry.priority === 'Emergency' && (
                            <Badge variant="destructive" className="text-xs">
                              Emergency
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getDepartmentIcon(entry.department)}
                            <span>{entry.department}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(entry.timestamp)}</span>
                          </div>
                          {entry.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{entry.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <StatusBadge status={entry.status} priority={entry.priority} />
                  </div>

                  {/* Action Buttons */}
                  {canPerformActionOnEntry(entry.department) && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      {nextAction && (
                        <Button
                          size="sm"
                          variant={nextAction.variant}
                          onClick={async () => {
                            const newStatus = nextAction.action as Status;
                            onUpdateStatus?.(entry.id, newStatus);
                            
                            // Play announcement when calling a token
                            if (newStatus === 'Called') {
                              try {
                                await announceToken(entry.token, entry.department);
                              } catch (error) {
                                console.error('Announcement failed:', error);
                              }
                            }
                          }}
                          className="gap-1"
                        >
                          <nextAction.icon className="h-3 w-3" />
                          {nextAction.label}
                        </Button>
                      )}
                      
                      {/* Check cross-department transfer permission */}
                      {entry.status !== 'Completed' && entry.status !== 'Skipped' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateStatus?.(entry.id, 'Skipped')}
                            className="gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Skip
                          </Button>
                          
                          {(settings?.allow_cross_department_transfer === true || 
                            String(settings?.allow_cross_department_transfer) === 'true' || 
                            userRole === 'admin') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onTransfer?.(entry.id, entry.department, entry.fullName, entry.token)}
                              className="gap-1"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                              Transfer
                            </Button>
                          )}
                        </>
                      )}

                      {entry.status === 'Completed' && (
                        settings?.allow_cross_department_transfer === true || 
                        String(settings?.allow_cross_department_transfer) === 'true' || 
                        userRole === 'admin'
                      ) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onTransfer?.(entry.id, entry.department, entry.fullName, entry.token)}
                          className="gap-1"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          Next Department
                        </Button>
                      )}

                      {/* Admin delete button */}
                      {userRole === 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete?.(entry.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
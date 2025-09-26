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
      <div className="p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Building2 className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-white font-medium">Loading Queue Management...</p>
          <p className="text-blue-200">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-300" />
              {title}
              <Badge className="ml-3 bg-white/20 text-white border-white/30 text-lg px-3 py-1 font-bold">
                {filteredEntries.length}
              </Badge>
            </h2>
            {description && (
              <p className="text-lg text-blue-100 font-medium">{description}</p>
            )}
          </div>
        </div>

        {/* Filters */}
        {canFilter && (
          <div className="flex flex-wrap gap-4 pt-6 border-t border-white/20 mt-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-300" />
              <Select 
                value={selectedDepartment} 
                onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}
              >
                <SelectTrigger className="w-48 h-12 bg-white/10 border-white/30 text-white backdrop-blur-sm rounded-xl">
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
              <SelectTrigger className="w-40 h-12 bg-white/10 border-white/30 text-white backdrop-blur-sm rounded-xl">
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
      </div>

      <div>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-blue-300" />
            </div>
            <p className="text-xl text-white font-medium">No patients in queue</p>
            <p className="text-blue-200">All clear! No patients waiting at this time.</p>
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
                    border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl backdrop-blur-sm
                    ${isCurrentlyServing ? 'ring-2 ring-blue-400/50 bg-blue-500/20 border-blue-400/50' : 'bg-white/10 border-white/20'}
                    ${entry.priority === 'Emergency' ? 'border-red-400/50 bg-red-500/20 ring-2 ring-red-400/50' : ''}
                    hover:scale-[1.02] hover:bg-white/15
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Token and Patient Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-center">
                        <div className={`
                          text-2xl font-black px-4 py-2 rounded-xl shadow-lg
                          ${entry.priority === 'Emergency' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}
                        `}>
                          {entry.token}
                        </div>
                        {index === 0 && entry.status === 'Waiting' && (
                          <div className="text-sm text-green-300 font-bold mt-2 animate-pulse">Next</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-5 w-5 text-blue-300" />
                          <span className="font-bold text-white text-lg">{entry.fullName}</span>
                          {entry.priority === 'Emergency' && (
                            <Badge className="bg-red-500/20 text-red-300 border-red-400/50 text-sm font-bold">
                              Emergency
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-6 text-blue-200 font-medium">
                          <div className="flex items-center gap-2">
                            {getDepartmentIcon(entry.department)}
                            <span>{entry.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(entry.timestamp)}</span>
                          </div>
                          {entry.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
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
                    <div className="flex gap-3 mt-6 pt-4 border-t border-white/20">
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
      </div>
    </div>
  );
}
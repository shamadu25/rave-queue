import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueueEntry, Department, Status, QueueFilters } from '@/types/queue';
import { List, Filter, Clock, User, Building2, AlertTriangle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueListProps {
  entries: QueueEntry[];
  onUpdateStatus?: (id: string, status: Status) => void;
}

const getStatusColor = (status: Status, priority: string) => {
  if (priority === 'Emergency') {
    return 'bg-emergency text-emergency-foreground';
  }
  
  switch (status) {
    case 'Waiting':
      return 'bg-waiting text-waiting-foreground';
    case 'In Progress':
      return 'bg-in-progress text-in-progress-foreground';
    case 'Completed':
      return 'bg-completed text-completed-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPriorityIcon = (priority: string) => {
  if (priority === 'Emergency') {
    return <AlertTriangle className="h-3 w-3" />;
  }
  return null;
};

export const QueueList = ({ entries, onUpdateStatus }: QueueListProps) => {
  const [filters, setFilters] = useState<QueueFilters>({});

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        if (filters.department && entry.department !== filters.department) {
          return false;
        }
        if (filters.status && entry.status !== filters.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [entries, filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          Queue Management
        </CardTitle>
        <CardDescription>
          Current queue status - {filteredEntries.length} entries
        </CardDescription>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select 
              value={filters.department || ''} 
              onValueChange={(value: Department | '') => 
                setFilters(prev => ({ ...prev, department: value || undefined }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Lab">Laboratory</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select 
              value={filters.status || ''} 
              onValueChange={(value: Status | '') => 
                setFilters(prev => ({ ...prev, status: value || undefined }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filters.department || filters.status) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                        {getPriorityIcon(entry.priority)}
                      </div>
                      {entry.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          {entry.phoneNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge className={cn(getStatusColor(entry.status, entry.priority))}>
                    {entry.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {entry.department}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.timestamp)} • {formatDate(entry.timestamp)}
                    </div>
                  </div>

                  {onUpdateStatus && entry.status !== 'Completed' && (
                    <div className="flex gap-2">
                      {entry.status === 'Waiting' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(entry.id, 'In Progress')}
                        >
                          Start
                        </Button>
                      )}
                      {entry.status === 'In Progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(entry.id, 'Completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
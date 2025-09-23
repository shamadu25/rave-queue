import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Megaphone, Clock, Users, Search, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { QueueEntry, Status } from '@/types/queue';

interface Department {
  id: string;
  name: string;
  color_code: string;
  prefix: string;
}

const QueueManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const { userDepartments } = useUserDepartments(user?.id);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentToken, setCurrentToken] = useState<string>('');

  useEffect(() => {
    fetchQueueEntries();
    fetchDepartments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('queue_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchQueueEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueueEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedEntries = (data || []).map(entry => ({
        id: entry.id,
        token: entry.token,
        fullName: entry.full_name,
        phoneNumber: entry.phone_number,
        department: entry.department as any,
        priority: entry.priority as any,
        status: entry.status as any,
        timestamp: new Date(entry.created_at)
      }));

      setQueueEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching queue entries:', error);
      toast.error('Failed to load queue entries');
    } finally {
      setLoading(false);
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

  const callNextToken = async (department: string) => {
    try {
      // Find the next waiting token in the department
      const nextEntry = queueEntries.find(entry => 
        entry.department === department && 
        entry.status === 'Waiting'
      );

      if (!nextEntry) {
        toast.error(`No waiting tokens in ${department}`);
        return;
      }

      // Update entry status to 'Called'
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'Called',
          called_at: new Date().toISOString()
        })
        .eq('id', nextEntry.id);

      if (error) throw error;

      // Log the call
      const { error: logError } = await supabase
        .from('queue_calls')
        .insert({
          queue_entry_id: nextEntry.id,
          called_by: user?.id,
          department: department,
          token: nextEntry.token
        });

      if (logError) throw logError;

      setCurrentToken(nextEntry.token);
      
      // Announce the token
      announceToken(nextEntry.token, department);
      
      toast.success(`Called token ${nextEntry.token} for ${department}`);
      
    } catch (error) {
      console.error('Error calling next token:', error);
      toast.error('Failed to call next token');
    }
  };

  const announceToken = (token: string, department: string) => {
    if ('speechSynthesis' in window) {
      // Extract service prefix for proper announcement
      const prefix = token.match(/^[A-Z]+/)?.[0] || '';
      const serviceContext = department === 'Reception' 
        ? `Service token ${token}. Please proceed to Reception for registration.`
        : `Service token ${token}. Please proceed to ${department}.`;
        
      const utterance = new SpeechSynthesisUtterance(serviceContext);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const updateTokenStatus = async (entryId: string, newStatus: Status) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'Served') {
        updateData.served_at = new Date().toISOString();
        updateData.served_by = user?.id;
      } else if (newStatus === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'Skipped') {
        updateData.skipped_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('queue_entries')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Token status updated successfully');
    } catch (error) {
      console.error('Error updating token status:', error);
      toast.error('Failed to update token status');
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Waiting': return 'bg-waiting text-waiting-foreground';
      case 'Called': return 'bg-called text-called-foreground';
      case 'In Progress': return 'bg-in-progress text-in-progress-foreground';
      case 'Served': return 'bg-served text-served-foreground';
      case 'Completed': return 'bg-completed text-completed-foreground';
      case 'Skipped': return 'bg-skipped text-skipped-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Filter entries based on user departments (if not admin)
  const userDepartmentNames = userDepartments.map(ud => ud.department.name);
  const allowedDepartments = profile?.role === 'admin' 
    ? departments.map(d => d.name)
    : userDepartmentNames;

  const filteredEntries = queueEntries.filter(entry => {
    const matchesSearch = entry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.token.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || entry.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
    
    // For Reception-first workflow: Show all tokens in Reception queue to Reception staff
    // Show tokens transferred to department for department staff
    let hasPermission = false;
    if (profile?.role === 'admin') {
      hasPermission = true;
    } else if (allowedDepartments.includes('Reception') && entry.department === 'Reception') {
      hasPermission = true;
    } else if (allowedDepartments.includes(entry.department) && entry.department !== 'Reception') {
      hasPermission = true;
    }
    
    return matchesSearch && matchesDepartment && matchesStatus && hasPermission;
  });

  const getWaitingCount = (department: string) => {
    return queueEntries.filter(entry => 
      entry.department === department && entry.status === 'Waiting'
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Queue Management</h2>
        {currentToken && (
          <Badge className="text-lg px-4 py-2 bg-primary text-primary-foreground">
            Current: {currentToken}
          </Badge>
        )}
      </div>

      {/* Department Call Buttons */}
  // Department Call Buttons - Reception-First workflow aware
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Reception Department - Always show first with special styling */}
        <Card key="reception" className="border-2 border-yellow-400 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-gray-700">Reception</span>
              <Badge variant="outline" className="border-gray-500 text-gray-700">
                {getWaitingCount('Reception')} waiting
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => callNextToken('Reception')}
              disabled={getWaitingCount('Reception') === 0}
              className="w-full flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
            >
              <Megaphone className="h-4 w-4" />
              Call Next Patient
            </Button>
          </CardContent>
        </Card>

        {/* Other Departments */}
        {departments
          .filter(dept => allowedDepartments.includes(dept.name) && dept.name !== 'Reception')
          .map((department) => {
            const waitingCount = getWaitingCount(department.name);
            return (
              <Card key={department.id} className="border-2" style={{ borderColor: department.color_code }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{department.name}</span>
                    <Badge variant="outline">{waitingCount} waiting</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => callNextToken(department.name)}
                    disabled={waitingCount === 0}
                    className="w-full flex items-center gap-2"
                    style={{ 
                      backgroundColor: department.color_code,
                      color: 'white'
                    }}
                  >
                    <Megaphone className="h-4 w-4" />
                    Call Next Token
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Queue Entries
          </CardTitle>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments
                    .filter(dept => allowedDepartments.includes(dept.name))
                    .map(dept => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Called">Called</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No queue entries found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-bold text-lg">{entry.token}</TableCell>
                    <TableCell className="font-medium">{entry.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: departments.find(d => d.name === entry.department)?.color_code 
                          }}
                        />
                        {entry.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {entry.status === 'Called' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTokenStatus(entry.id, 'In Progress')}
                          >
                            Start
                          </Button>
                        )}
                        {entry.status === 'In Progress' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTokenStatus(entry.id, 'Served')}
                          >
                            Complete
                          </Button>
                        )}
                        {(entry.status === 'Waiting' || entry.status === 'Called') && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateTokenStatus(entry.id, 'Skipped')}
                          >
                            Skip
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueManagement;
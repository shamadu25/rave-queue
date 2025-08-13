import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Filter, FileText, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { QueueEntry } from '@/types/queue';

interface Department {
  id: string;
  name: string;
  color_code: string;
  prefix: string;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; entry: QueueEntry | null }>({
    open: false,
    entry: null
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchQueueEntries();
      fetchDepartments();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('admin_queue_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'queue_entries' },
          () => fetchQueueEntries()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, dateFilter]);

  const fetchQueueEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .gte('created_at', getDateFilterQuery())
        .order('created_at', { ascending: false });

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

  const getDateFilterQuery = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
      case 'last3days':
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return threeDaysAgo.toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
  };

  const handleDeleteEntry = (entry: QueueEntry) => {
    setDeleteDialog({ open: true, entry });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.entry) return;

    try {
      const { error } = await supabase
        .from('queue_entries')
        .delete()
        .eq('id', deleteDialog.entry.id);

      if (error) throw error;

      setQueueEntries(queueEntries.filter(e => e.id !== deleteDialog.entry!.id));
      toast.success('Queue entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setDeleteDialog({ open: false, entry: null });
    }
  };

  const exportData = () => {
    const csvData = filteredEntries.map(entry => ({
      Token: entry.token,
      'Patient Name': entry.fullName,
      Department: entry.department,
      Status: entry.status,
      'Created At': entry.timestamp.toLocaleString(),
      'Phone Number': entry.phoneNumber || ''
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queue-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const autoDeleteOldEntries = async () => {
    try {
      const { error } = await supabase.rpc('auto_delete_old_queue_entries');
      if (error) throw error;
      
      toast.success('Old entries deleted successfully');
      fetchQueueEntries();
    } catch (error) {
      console.error('Error auto-deleting entries:', error);
      toast.error('Failed to delete old entries');
    }
  };

  const filteredEntries = queueEntries.filter(entry => {
    const matchesSearch = entry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.token.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || entry.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'bg-blue-100 text-blue-800';
      case 'Called': return 'bg-orange-100 text-orange-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Served': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Skipped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

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
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage queue entries and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={autoDeleteOldEntries} variant="outline" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clean Old Entries
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredEntries.filter(e => e.status === 'Waiting').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredEntries.filter(e => ['Called', 'In Progress', 'Served'].includes(e.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredEntries.filter(e => e.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last3days">Last 3 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
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
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No queue entries found for the selected filters</p>
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
                  <TableHead>Phone</TableHead>
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
                    <TableCell className="text-sm">
                      {entry.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.phoneNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, entry: null })}
        onConfirm={confirmDelete}
        title="Delete Queue Entry"
        message={`Are you sure you want to delete token ${deleteDialog.entry?.token}? This action cannot be undone.`}
      />
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DepartmentForm } from './DepartmentForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface Department {
  id: string;
  name: string;
  prefix: string;
  max_tokens_per_day: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_internal: boolean;
  icon_name: string;
  color_code: string;
  created_at: string;
  updated_at: string;
}

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; department: Department | null }>({
    open: false,
    department: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setShowForm(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDeleteDialog({ open: true, department });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.department) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deleteDialog.department.id);

      if (error) throw error;

      setDepartments(departments.filter(d => d.id !== deleteDialog.department!.id));
      toast({
        title: "Success",
        description: "Department deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, department: null });
    }
  };

  const handleFormSuccess = (department: Department, isEdit: boolean) => {
    if (isEdit) {
      setDepartments(departments.map(d => d.id === department.id ? department : d));
      toast({
        title: "Success",
        description: "Department updated successfully.",
      });
    } else {
      setDepartments([...departments, department]);
      toast({
        title: "Success",
        description: "Department created successfully.",
      });
    }
    setShowForm(false);
    setEditingDepartment(null);
  };

  // Filter and paginate departments
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.prefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Department Management</h1>
            <p className="text-muted-foreground">Manage hospital departments and their settings</p>
          </div>
        </div>
        <Button onClick={handleCreateDepartment} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredDepartments.length} department(s) found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Operating Hours</TableHead>
                <TableHead>Daily Token Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDepartments.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No departments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: department.color_code }}
                        >
                          {department.prefix}
                        </div>
                        <span className="font-medium">{department.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{department.prefix}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={department.is_internal ? "secondary" : "outline"}>
                        {department.is_internal ? "Internal" : "Public"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatTime(department.start_time)} - {formatTime(department.end_time)}
                    </TableCell>
                    <TableCell>{department.max_tokens_per_day}</TableCell>
                    <TableCell>
                      <Badge variant={department.is_active ? "default" : "secondary"}>
                        {department.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDepartment(department)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDepartments.length)} of {filteredDepartments.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Form Modal */}
      {showForm && (
        <DepartmentForm
          department={editingDepartment}
          onClose={() => {
            setShowForm(false);
            setEditingDepartment(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, department: null })}
        onConfirm={confirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteDialog.department?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowRight, Workflow } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceFlow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  flow_departments: string[];
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
  is_internal: boolean;
}

export const ServiceFlowManagement = () => {
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<ServiceFlow | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState('');

  useEffect(() => {
    fetchFlows();
    fetchDepartments();
  }, []);

  const fetchFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('service_flows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows((data || []).map(flow => ({
        ...flow,
        flow_departments: Array.isArray(flow.flow_departments) 
          ? flow.flow_departments as string[]
          : JSON.parse(flow.flow_departments as string)
      })));
    } catch (error) {
      console.error('Error fetching service flows:', error);
      toast.error('Failed to load service flows');
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_active, is_internal')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setSelectedDepartments([]);
    setCurrentDepartment('');
    setEditingFlow(null);
  };

  const handleEdit = (flow: ServiceFlow) => {
    setEditingFlow(flow);
    setName(flow.name);
    setDescription(flow.description || '');
    setIsActive(flow.is_active);
    setSelectedDepartments(flow.flow_departments);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim() || selectedDepartments.length < 2) {
      toast.error('Please provide a name and at least 2 departments');
      return;
    }

    try {
      const flowData = {
        name: name.trim(),
        description: description.trim() || null,
        is_active: isActive,
        flow_departments: selectedDepartments
      };

      if (editingFlow) {
        const { error } = await supabase
          .from('service_flows')
          .update(flowData)
          .eq('id', editingFlow.id);

        if (error) throw error;
        toast.success('Service flow updated successfully');
      } else {
        const { error } = await supabase
          .from('service_flows')
          .insert(flowData);

        if (error) throw error;
        toast.success('Service flow created successfully');
      }

      setShowDialog(false);
      resetForm();
      fetchFlows();
    } catch (error) {
      console.error('Error saving service flow:', error);
      toast.error('Failed to save service flow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service flow?')) return;

    try {
      const { error } = await supabase
        .from('service_flows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Service flow deleted successfully');
      fetchFlows();
    } catch (error) {
      console.error('Error deleting service flow:', error);
      toast.error('Failed to delete service flow');
    }
  };

  const addDepartment = () => {
    if (currentDepartment && !selectedDepartments.includes(currentDepartment)) {
      setSelectedDepartments([...selectedDepartments, currentDepartment]);
      setCurrentDepartment('');
    }
  };

  const removeDepartment = (index: number) => {
    setSelectedDepartments(selectedDepartments.filter((_, i) => i !== index));
  };

  const moveDepartment = (index: number, direction: 'up' | 'down') => {
    const newDepartments = [...selectedDepartments];
    if (direction === 'up' && index > 0) {
      [newDepartments[index], newDepartments[index - 1]] = [newDepartments[index - 1], newDepartments[index]];
    } else if (direction === 'down' && index < newDepartments.length - 1) {
      [newDepartments[index], newDepartments[index + 1]] = [newDepartments[index + 1], newDepartments[index]];
    }
    setSelectedDepartments(newDepartments);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading service flows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Flow Management</h2>
          <p className="text-muted-foreground">
            Create predefined patient flows through departments
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFlow ? 'Edit Service Flow' : 'Create Service Flow'}
              </DialogTitle>
              <DialogDescription>
                Define a sequence of departments for patient workflow automation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Flow Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Standard Consultation"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when to use this flow..."
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <Label>Department Flow Sequence *</Label>
                
                <div className="flex gap-2">
                  <Select value={currentDepartment} onValueChange={setCurrentDepartment}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select department to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name} {dept.is_internal && '(Internal)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addDepartment} disabled={!currentDepartment}>
                    Add
                  </Button>
                </div>

                {selectedDepartments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Flow sequence ({selectedDepartments.length} departments):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDepartments.map((dept, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {dept}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeDepartment(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                          {index < selectedDepartments.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingFlow ? 'Update Flow' : 'Create Flow'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {flows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    {flow.name}
                    {!flow.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  {flow.description && (
                    <CardDescription>{flow.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(flow)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(flow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {flow.flow_departments.map((dept, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Badge variant="outline">{dept}</Badge>
                    {index < flow.flow_departments.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {flows.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No service flows created yet. Create your first flow to automate patient routing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
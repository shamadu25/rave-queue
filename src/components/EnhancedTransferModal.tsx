import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRightLeft, Workflow, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface Department {
  id: string;
  name: string;
  is_internal: boolean;
  is_active: boolean;
}

interface ServiceFlow {
  id: string;
  name: string;
  description: string;
  flow_departments: string[];
  is_active: boolean;
}

interface EnhancedTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (toDepartment: string, reason?: string, flowId?: string) => void;
  currentDepartment: string;
  patientName: string;
  token: string;
}

export const EnhancedTransferModal = ({ 
  isOpen, 
  onClose, 
  onTransfer, 
  currentDepartment, 
  patientName, 
  token 
}: EnhancedTransferModalProps) => {
  const { canTransferToAnyDepartment } = useRoleAccess();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchServiceFlows();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_internal, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchServiceFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('service_flows')
        .select('*')
        .eq('is_active', true)
        .order('name');

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

  const handleManualTransfer = async () => {
    if (!selectedDepartment) return;

    setLoading(true);
    try {
      await onTransfer(selectedDepartment, reason.trim() || undefined);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlowTransfer = async () => {
    if (!selectedFlow) return;

    const flow = flows.find(f => f.id === selectedFlow);
    if (!flow) return;

    // Find current department position in flow
    const currentIndex = flow.flow_departments.indexOf(currentDepartment);
    let nextDepartment = '';

    if (currentIndex === -1) {
      // Not in flow, start from beginning (skip Reception if already there)
      nextDepartment = flow.flow_departments.find(dept => dept !== currentDepartment) || flow.flow_departments[0];
    } else if (currentIndex < flow.flow_departments.length - 1) {
      // Move to next department in flow
      nextDepartment = flow.flow_departments[currentIndex + 1];
    } else {
      toast.error('Patient has completed this flow');
      return;
    }

    setLoading(true);
    try {
      await onTransfer(
        nextDepartment, 
        `Flow: ${flow.name}${reason.trim() ? ` - ${reason.trim()}` : ''}`,
        selectedFlow
      );
      resetForm();
      onClose();
    } catch (error) {
      console.error('Flow transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDepartment('');
    setSelectedFlow('');
    setReason('');
    setActiveTab('manual');
  };

  const getNextDepartmentInFlow = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return null;

    const currentIndex = flow.flow_departments.indexOf(currentDepartment);
    if (currentIndex === -1) {
      return flow.flow_departments.find(dept => dept !== currentDepartment) || flow.flow_departments[0];
    } else if (currentIndex < flow.flow_departments.length - 1) {
      return flow.flow_departments[currentIndex + 1];
    }
    return null;
  };

  const availableDepartments = departments.filter(
    dept => dept.name !== currentDepartment && (canTransferToAnyDepartment() || dept.is_active)
  );

  const availableFlows = flows.filter(flow => {
    // Show flows that include current department or can start from current department
    return flow.flow_departments.includes(currentDepartment) || currentDepartment === 'Reception';
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Patient
          </DialogTitle>
          <DialogDescription>
            Transfer {patientName} (Token: {token}) to another department or follow a service flow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Department</Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
              <User className="h-4 w-4" />
              {currentDepartment}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Transfer</TabsTrigger>
              <TabsTrigger value="flow">Service Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Transfer To *</Label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        <div className="flex items-center gap-2">
                          {dept.name}
                          {dept.is_internal && <Badge variant="secondary" className="text-xs">Internal</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for transfer..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualTransfer} 
                  disabled={!selectedDepartment || loading}
                >
                  {loading ? 'Transferring...' : 'Transfer Patient'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flow">Select Service Flow *</Label>
                <Select 
                  value={selectedFlow} 
                  onValueChange={setSelectedFlow}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service flow" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFlows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        <div className="space-y-1">
                          <div className="font-medium">{flow.name}</div>
                          {flow.description && (
                            <div className="text-xs text-muted-foreground">{flow.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFlow && (
                <div className="space-y-2">
                  <Label>Flow Preview</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {flows.find(f => f.id === selectedFlow)?.flow_departments.map((dept, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <Badge 
                            variant={dept === currentDepartment ? "default" : "outline"}
                            className={dept === currentDepartment ? "bg-primary" : ""}
                          >
                            {dept}
                          </Badge>
                          {index < flows.find(f => f.id === selectedFlow)!.flow_departments.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Next: <span className="font-medium text-primary">
                        {getNextDepartmentInFlow(selectedFlow) || 'Flow Complete'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="flow-reason">Additional Notes (Optional)</Label>
                <Textarea
                  id="flow-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Additional notes for this transfer..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFlowTransfer} 
                  disabled={!selectedFlow || loading}
                  className="flex items-center gap-2"
                >
                  <Workflow className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Follow Flow'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {availableFlows.length === 0 && activeTab === 'flow' && (
            <div className="text-center text-muted-foreground py-4">
              No service flows available for current department
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
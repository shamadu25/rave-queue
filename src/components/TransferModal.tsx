import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types/queue';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (toDepartment: Department, reason?: string) => void;
  currentDepartment: Department;
  patientName: string;
  token: string;
}

interface DepartmentData {
  id: string;
  name: string;
  is_internal: boolean;
  is_active: boolean;
}

export const TransferModal = ({ 
  isOpen, 
  onClose, 
  onTransfer, 
  currentDepartment, 
  patientName, 
  token 
}: TransferModalProps) => {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
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

  const handleTransfer = async () => {
    if (!selectedDepartment) return;

    setLoading(true);
    try {
      await onTransfer(selectedDepartment, reason.trim() || undefined);
      onClose();
      setSelectedDepartment('');
      setReason('');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableDepartments = departments.filter(
    dept => dept.name !== currentDepartment
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Patient
          </DialogTitle>
          <DialogDescription>
            Transfer {patientName} (Token: {token}) to another department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Department</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {currentDepartment}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Transfer To *</Label>
            <Select 
              value={selectedDepartment} 
              onValueChange={(value: Department) => setSelectedDepartment(value)}
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedDepartment || loading}
          >
            {loading ? 'Transferring...' : 'Transfer Patient'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
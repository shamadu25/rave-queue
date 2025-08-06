import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Department } from '@/types/queue';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (toDepartment: Department, reason?: string) => void;
  currentDepartment: Department;
  patientName: string;
  token: string;
}

const departments = [
  { value: 'Consultation', label: 'Consultation' },
  { value: 'Lab', label: 'Laboratory' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Billing', label: 'Billing' }
];

export const TransferModal = ({ 
  isOpen, 
  onClose, 
  onTransfer, 
  currentDepartment, 
  patientName, 
  token 
}: TransferModalProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

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
    dept => dept.value !== currentDepartment
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
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
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
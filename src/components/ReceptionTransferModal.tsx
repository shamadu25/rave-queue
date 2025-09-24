import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, Building2, CheckCircle, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ReceptionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (targetDepartment: string, reason?: string) => Promise<void>;
  currentDepartment: string;
  patientName: string;
  token: string;
  entryId: string;
}

interface DepartmentData {
  id: string;
  name: string;
  color_code: string;
  prefix: string;
  is_active: boolean;
  is_internal: boolean;
}

const ReceptionTransferModal: React.FC<ReceptionTransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  currentDepartment,
  patientName,
  token,
  entryId
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [intendedDepartment, setIntendedDepartment] = useState<string>('');

  // Load departments and intended department
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available departments (exclude Reception, include both public and internal for staff)
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .neq('name', 'Reception')
          .order('is_internal, name'); // Show public departments first, then internal

        if (deptError) throw deptError;
        setDepartments(deptData || []);

        // Load intended department for this entry
        const { data: entryData, error: entryError } = await supabase
          .from('queue_entries')
          .select('intended_department')
          .eq('id', entryId)
          .single();

        if (entryError) throw entryError;
        if (entryData?.intended_department) {
          setIntendedDepartment(entryData.intended_department);
          setSelectedDepartment(entryData.intended_department);
          setReason(`Transfer to intended department: ${entryData.intended_department}`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, entryId]);

  const handleTransfer = async () => {
    if (!selectedDepartment) return;
    
    setLoading(true);
    try {
      await onTransfer(selectedDepartment, reason);
      onClose();
      setSelectedDepartment('');
      setReason('');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeptColor = (deptName: string) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color_code || '#6B7280';
  };

  const getDeptIcon = (deptName: string) => {
    const icons: {[key: string]: string} = {
      'CONSULTATION': '👨‍⚕️',
      'ENQUIRY': '❓',
      'IOM SERVICE': '🩺',
      'OTHERS': '📋',
      'RESULT PICKUP': '📄'
    };
    return icons[deptName] || '🏥';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Reception Transfer
          </DialogTitle>
          <DialogDescription>
            Complete registration and transfer <strong>{patientName}</strong> (Token: <strong>{token}</strong>) to their service department
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Currently at</div>
              <Badge variant="outline" className="text-lg px-4 py-2 border-gray-500">
                <Building2 className="h-4 w-4 mr-2" />
                Reception
              </Badge>
            </div>
          </div>

          {/* Intended Service Display */}
          {intendedDepartment && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-800">Patient's Selected Service</div>
                  <div className="text-green-700 font-semibold">{intendedDepartment}</div>
                </div>
              </div>
              <div className="text-sm text-green-600">
                Registration complete - Ready to transfer to service department
              </div>
            </div>
          )}
          
          {/* Target Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="department">Transfer to Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select service department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dept.color_code }}
                      />
                      <span>{getDeptIcon(dept.name)}</span>
                      <span>{dept.name}</span>
                      {dept.is_internal && (
                        <Badge variant="secondary" className="text-xs ml-1">Internal</Badge>
                      )}
                      {dept.name === intendedDepartment && (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Notes */}
          <div className="space-y-2">
            <Label htmlFor="reason">Transfer Notes (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter any notes or special instructions..."
              className="min-h-[80px]"
            />
          </div>

          {/* Reception Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-medium mb-1">
              📋 Reception Checklist
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Patient identity verified</li>
              <li>✓ Registration form completed</li>
              <li>✓ Service fee processed (if applicable)</li>
              <li>✓ Ready for department transfer</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedDepartment || loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Transferring...' : 'Complete & Transfer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceptionTransferModal;
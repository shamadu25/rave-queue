import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePrintTicket } from '@/hooks/usePrintTicket';
import { QueueEntry, Department, Priority } from '@/types/queue';
import { UserPlus, Phone, Building2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TokenGeneratorProps {
  onTokenGenerated: (entry: Omit<QueueEntry, 'id' | 'timestamp'>) => Promise<void>;
}

interface DepartmentData {
  id: string;
  name: string;
  prefix: string;
  is_internal: boolean;
  is_active: boolean;
}

// Remove hardcoded department prefixes - now fetched from database

export const TokenGenerator = ({ onTokenGenerated }: TokenGeneratorProps) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [intendedDepartment, setIntendedDepartment] = useState<string>(''); // Store intended service
  const [priority, setPriority] = useState<Priority>('Normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [publicDepartments, setPublicDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { printTicket } = usePrintTicket();

  // Fetch public departments (patient-selectable services)
  useEffect(() => {
    const fetchPublicDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, prefix, is_internal, is_active')
          .eq('is_active', true)
          .eq('is_internal', false) // Only public departments for token kiosk
          .order('name');

        if (error) throw error;
        setPublicDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: "Error",
          description: "Failed to load departments. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDepartments();
  }, []);

  const generateToken = (deptData: DepartmentData): string => {
    const prefix = deptData.prefix || deptData.name.substring(0, 2).toUpperCase();
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${randomNumber.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !department) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const selectedDept = publicDepartments.find(d => d.name === department);
    if (!selectedDept) {
      toast({
        title: "Error",
        description: "Invalid department selection.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const token = generateToken(selectedDept);
      const entryData = {
        token,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        department: 'Reception' as Department, // Always start at Reception (Reception-first workflow)
        intended_department: department, // Store the patient's intended service
        priority,
        status: 'Waiting' as const
      };

      await onTokenGenerated(entryData);

      // Auto-print ticket if enabled
      const mockEntry: QueueEntry = {
        id: `temp-${Date.now()}`,
        token,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        department: 'Reception' as Department,
        intended_department: department,
        priority,
        status: 'Waiting' as const,
        timestamp: new Date()
      };
      printTicket(mockEntry);

      toast({
        title: "Token Generated Successfully!",
        description: `Your queue token is ${token} for ${department}. Please proceed to Reception first.`,
        variant: "default"
      });

      // Reset form
      setFullName('');
      setPhoneNumber('');
      setDepartment('');
      setIntendedDepartment('');
      setPriority('Normal');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate token. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="fullName" className="text-base font-medium text-slate-700">
            Patient Full Name *
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter patient's full name"
            className="h-12 text-base bg-white border-slate-200 focus:border-primary"
            required
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium text-slate-700 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Primary Service *
          </Label>
          <Select value={department} onValueChange={(value: Department) => setDepartment(value)}>
            <SelectTrigger className="h-12 text-base bg-white border-slate-200 focus:border-primary">
              <SelectValue placeholder="Choose your primary service" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {publicDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the main service you need. You will first be directed to Reception for registration.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="phoneNumber" className="text-base font-medium text-slate-700 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Number (Optional)
          </Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            type="tel"
            className="h-12 text-base bg-white border-slate-200 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium text-slate-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Priority
          </Label>
          <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
            <SelectTrigger className="h-12 text-base bg-white border-slate-200 focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-200" 
          disabled={isGenerating || publicDepartments.length === 0}
        >
          {isGenerating ? 'Generating Token...' : 'Generate Token'}
        </Button>
        
        {publicDepartments.length === 0 && !loading && (
          <p className="text-center text-red-500 text-sm">
            No services available. Please contact administration.
          </p>
        )}
      </form>
    </div>
  );
};
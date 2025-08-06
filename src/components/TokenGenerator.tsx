import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { QueueEntry, Department, Priority } from '@/types/queue';
import { UserPlus, Phone, Building2, AlertTriangle } from 'lucide-react';

interface TokenGeneratorProps {
  onTokenGenerated: (entry: Omit<QueueEntry, 'id' | 'timestamp'>) => Promise<void>;
}

const departmentPrefixes = {
  Consultation: 'C',
  Lab: 'L',
  Pharmacy: 'P',
  'X-ray': 'X',
  Scan: 'S',
  Billing: 'B'
};

export const TokenGenerator = ({ onTokenGenerated }: TokenGeneratorProps) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateToken = (dept: Department): string => {
    const prefix = departmentPrefixes[dept];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${prefix}${randomNumber.toString().padStart(3, '0')}`;
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

    setIsGenerating(true);

    try {
      const token = generateToken(department);
      const entryData = {
        token,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        department,
        priority,
        status: 'Waiting' as const
      };

      await onTokenGenerated(entryData);

      toast({
        title: "Token Generated Successfully!",
        description: `Your queue token is ${token}`,
        variant: "default"
      });

      // Reset form
      setFullName('');
      setPhoneNumber('');
      setDepartment('');
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
            Select Department *
          </Label>
          <Select value={department} onValueChange={(value: Department) => setDepartment(value)}>
            <SelectTrigger className="h-12 text-base bg-white border-slate-200 focus:border-primary">
              <SelectValue placeholder="Choose a department" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="Consultation">Consultation</SelectItem>
              <SelectItem value="Lab">Laboratory</SelectItem>
              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
              <SelectItem value="X-ray">X-ray</SelectItem>
              <SelectItem value="Scan">Scan</SelectItem>
              <SelectItem value="Billing">Billing</SelectItem>
            </SelectContent>
          </Select>
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
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating Token...' : 'Generate Token'}
        </Button>
      </form>
    </div>
  );
};
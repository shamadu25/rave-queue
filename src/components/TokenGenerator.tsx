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
  onTokenGenerated: (entry: QueueEntry) => void;
}

const departmentPrefixes = {
  Consultation: 'C',
  Lab: 'L',
  Pharmacy: 'P',
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

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newEntry: QueueEntry = {
      id: crypto.randomUUID(),
      token: generateToken(department),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      department,
      priority,
      status: 'Waiting',
      timestamp: new Date()
    };

    onTokenGenerated(newEntry);

    toast({
      title: "Token Generated Successfully!",
      description: `Your queue token is ${newEntry.token}`,
      variant: "default"
    });

    // Reset form
    setFullName('');
    setPhoneNumber('');
    setDepartment('');
    setPriority('Normal');
    setIsGenerating(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Generate Queue Token
        </CardTitle>
        <CardDescription>
          Fill in your details to get a queue token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Department/Service *
            </Label>
            <Select value={department} onValueChange={(value: Department) => setDepartment(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Lab">Laboratory</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority
            </Label>
            <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Token'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
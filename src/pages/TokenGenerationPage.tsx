import React, { useState, useEffect } from 'react';
import { QueueEntry, Department } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { usePrintTicket } from '@/hooks/usePrintTicket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Printer, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DepartmentData {
  id: string;
  name: string;
  color_code: string;
  prefix: string;
  is_active: boolean;
  is_internal: boolean;
}

const TokenGenerationPage = () => {
  const { addEntry } = useQueueEntries();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { printTicket, printTicketManual } = usePrintTicket();
  const [generatedToken, setGeneratedToken] = useState<QueueEntry | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, color_code, prefix, is_active, is_internal')
        .eq('is_active', true)
        .eq('is_internal', false) // Only show public departments to patients
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const generateToken = (department: DepartmentData): string => {
    const prefix = department.prefix;
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${prefix}${randomNumber.toString().padStart(3, '0')}`;
  };

  const handleDepartmentClick = async (department: DepartmentData) => {
    if (!patientName.trim()) {
      toast.error('Please enter your name first');
      return;
    }

    setSelectedDepartment(department.id);

    try {
      // Generate token with service prefix while maintaining Reception-First workflow
      const token = generateToken(department);
      const entryData = {
        token,
        fullName: patientName.trim(),
        department: 'Reception' as Department, // Always go to Reception first
        priority: 'Normal' as const,
        status: 'Waiting' as const
      };

      // Store the intended department and add to Reception queue
      const newEntry = await addEntry({
        ...entryData,
        // Store intended department in a custom field for now
      });
      
      // Also store intended department in database
      if (newEntry) {
        const { error } = await supabase
          .from('queue_entries')
          .update({ intended_department: department.name })
          .eq('id', newEntry.id);
          
        if (error) console.error('Error updating intended department:', error);
        
        setGeneratedToken({ ...newEntry, intended_department: department.name });
        setShowConfirmation(true);
        setPatientName('');
        setSelectedDepartment(null);
        printTicket({ ...newEntry, intended_department: department.name }, department.color_code);
        toast.success(`Service token ${token} generated for ${department.name} - First report to Reception!`);
        
        // Auto-redirect after 20 seconds
        setTimeout(() => {
          handleNewToken();
        }, 20000);
      }
    } catch (error) {
      toast.error('Failed to generate token. Please try again.');
      setSelectedDepartment(null);
    }
  };

  const handlePrintToken = () => {
    if (generatedToken) {
      // Find the department color for the generated token
      const dept = departments.find(d => d.name === (generatedToken as any)?.intended_department);
      printTicketManual(generatedToken, dept?.color_code);
    }
  };

  const handleNewToken = () => {
    setGeneratedToken(null);
    setShowConfirmation(false);
    setPatientName('');
    setSelectedDepartment(null);
  };

  const hospitalName = settings?.clinic_name?.replace(/"/g, '') || 'Hospital Clinic';

  if (settingsLoading || loadingDepartments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Hospital Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{hospitalName}</h1>
          <p className="text-xl text-slate-600">Queue Token Generation</p>
        </div>

        {/* Main Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {showConfirmation && generatedToken ? (
            // Confirmation Card
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Service Token Generated Successfully!
                    </h3>
                    <p className="text-slate-600">
                      Please keep your token number for reference
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Your Service Token</p>
                      <p className="text-4xl font-bold text-primary">
                        {generatedToken.token}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="text-center bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-yellow-800 font-semibold text-lg mb-1">🏥 First Report To: Reception</p>
                        <p className="text-yellow-700">Selected Service: <span className="font-semibold">{(generatedToken as any)?.intended_department || 'N/A'}</span></p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-600">Current Queue</p>
                          <p className="font-semibold text-slate-800">{generatedToken.department}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Status</p>
                          <p className="font-semibold text-waiting">Waiting</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={handlePrintToken}
                      variant="outline" 
                      className="flex-1"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Again
                    </Button>
                    <Button 
                      onClick={handleNewToken}
                      className="flex-1 bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90"
                    >
                      Generate New Token
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Token Generation Form
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Get Your Service Token
                  </h3>
                   <p className="text-slate-600">
                     Enter your name and select your service. You will first be called to Reception for registration.
                   </p>
                </div>
                
                {/* Patient Name Input */}
                <div className="mb-8">
                  <Label htmlFor="patientName" className="text-base font-medium text-slate-700 flex items-center gap-2 mb-3">
                    <User className="h-5 w-5" />
                    Enter your name
                  </Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Your full name"
                    className="h-14 text-lg bg-white border-slate-200 focus:border-primary"
                  />
                </div>

                {/* Department Buttons */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 text-center">
                    Select Service
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((department) => (
                      <Button
                        key={department.id}
                        onClick={() => handleDepartmentClick(department)}
                        disabled={selectedDepartment === department.id}
                        className={`
                          h-20 p-4 text-white font-bold text-lg transition-all duration-200
                          hover:scale-105 hover:shadow-lg active:scale-95
                          ${selectedDepartment === department.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{
                          backgroundColor: department.color_code,
                          borderColor: department.color_code,
                        }}
                      >
                        <div className="text-center">
                          <div className="text-sm opacity-90">{department.prefix}</div>
                          <div>{selectedDepartment === department.id ? 'Generating...' : department.name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {departments.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No services available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenGenerationPage;
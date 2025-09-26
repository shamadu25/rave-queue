import React, { useState, useEffect } from 'react';
import { QueueEntry, Department } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { usePrintTicket } from '@/hooks/usePrintTicket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Printer, User, Building2, Globe, Stethoscope, FileText, Shield } from 'lucide-react';
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
        toast.success(`Service token ${token} generated for ${department.name} - Report to Globe Health Reception first!`);
        
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Globe className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-white font-medium">Loading Globe Health Assessment Kiosk...</p>
          <p className="text-blue-200">Please wait while we prepare your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+CjwvZz4KPC9nPgo8L3N2Zz4=')] opacity-30"></div>
      </div>

      {/* Globe Health Assessment Clinic Header */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-blue-700/95 backdrop-blur-lg border-b border-white/20 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                  Globe Health Assessment Clinic
                </h1>
                <p className="text-xl text-blue-100 font-medium">
                  Professional Health Assessment Services
                </p>
                <p className="text-blue-200 font-medium">
                  Excellence in Health & Medical Solutions
                </p>
              </div>
            </div>
            <div className="text-right text-white/90">
              <div className="text-sm font-medium mb-1">KIOSK TERMINAL</div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">

        {/* Main Content */}
        <div className="animate-fade-in">
          {showConfirmation && generatedToken ? (
            // Premium Success Card
            <Card className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20">
              <CardContent className="p-12">
                <div className="text-center space-y-8">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                      <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-black text-white mb-4">
                      Service Request Confirmed
                    </h3>
                    <p className="text-xl text-blue-100 leading-relaxed max-w-md mx-auto">
                      Your service token has been generated. Please keep this number for reference.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-6 border border-white/20">
                    <div className="text-center">
                      <p className="text-lg text-blue-200 mb-3 font-medium">Your Service Token</p>
                      <p className="text-6xl font-black text-white animate-token-glow tracking-wider">
                        {generatedToken.token}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="text-center bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-yellow-400/30">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Building2 className="w-6 h-6 text-yellow-300" />
                          <p className="text-yellow-100 font-bold text-xl">First Report To: Globe Health Reception</p>
                        </div>
                        <p className="text-yellow-200">Requested Service: <span className="font-bold">{(generatedToken as any)?.intended_department || 'N/A'}</span></p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-blue-200 mb-1 font-medium">Queue Status</p>
                          <p className="font-bold text-white text-lg">{generatedToken.department}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-blue-200 mb-1 font-medium">Current Status</p>
                          <p className="font-bold text-green-300 text-lg">Waiting</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={handlePrintToken}
                      variant="outline" 
                      className="flex-1 h-14 text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Print Token
                    </Button>
                    <Button 
                      onClick={handleNewToken}
                      className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      Generate New Token
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Premium Token Generation Form
            <Card className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20">
              <CardContent className="p-12">
                <div className="text-center mb-10">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-3xl font-black text-white mb-2">
                        Service Request Kiosk
                      </h3>
                      <p className="text-xl text-blue-100">
                        Professional Health Assessment Services
                      </p>
                    </div>
                  </div>
                   <p className="text-lg text-blue-200 leading-relaxed max-w-2xl mx-auto">
                     Please enter your information and select your required service. You will first be directed to our reception for verification and processing.
                   </p>
                </div>
                
                {/* Patient Information */}
                <div className="mb-10">
                  <Label htmlFor="patientName" className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Full Name (Required)
                  </Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter your full name as it appears on your documents"
                    className="h-16 text-xl bg-white/15 border-white/30 text-white placeholder:text-blue-200 focus:border-blue-400 focus:bg-white/20 backdrop-blur-sm rounded-xl"
                  />
                </div>

                {/* Service Selection */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                      <Shield className="w-8 h-8 text-blue-300" />
                      Select Required Service
                    </h4>
                    <p className="text-blue-200 text-lg">Choose the service you need assistance with today</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {departments.map((department) => (
                      <Button
                        key={department.id}
                        onClick={() => handleDepartmentClick(department)}
                        disabled={selectedDepartment === department.id}
                        className={`
                          group relative h-24 p-6 text-white font-bold text-xl transition-all duration-300
                          bg-gradient-to-br hover:scale-105 hover:shadow-2xl active:scale-95 rounded-2xl
                          border-2 border-white/20 hover:border-white/40
                          ${selectedDepartment === department.id ? 'opacity-60 cursor-not-allowed scale-95' : 'hover:shadow-2xl'}
                        `}
                        style={{
                          background: selectedDepartment === department.id 
                            ? `linear-gradient(135deg, ${department.color_code}80, ${department.color_code}60)`
                            : `linear-gradient(135deg, ${department.color_code}E6, ${department.color_code})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 text-center space-y-2">
                          <div className="text-lg font-black tracking-wider opacity-90">
                            {department.prefix}
                          </div>
                          <div className="text-xl font-bold">
                            {selectedDepartment === department.id ? 'Processing...' : department.name}
                          </div>
                        </div>
                        {selectedDepartment === department.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {departments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-8 h-8 text-blue-300" />
                      </div>
                      <p className="text-xl text-blue-200">No services currently available</p>
                      <p className="text-blue-300">Please contact reception for assistance</p>
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
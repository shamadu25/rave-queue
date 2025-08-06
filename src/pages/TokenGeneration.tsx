import { useState } from 'react';
import { TokenGenerator } from '@/components/TokenGenerator';
import { QueueEntry } from '@/types/queue';
import { useQueueEntries } from '@/hooks/useQueueEntries';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { usePrintTicket } from '@/hooks/usePrintTicket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';

const TokenGeneration = () => {
  const { addEntry } = useQueueEntries();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { printTicket } = usePrintTicket();
  const [generatedToken, setGeneratedToken] = useState<QueueEntry | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleTokenGenerated = async (newEntryData: Omit<QueueEntry, 'id' | 'timestamp'>) => {
    try {
      const newEntry = await addEntry(newEntryData);
      if (newEntry) {
        setGeneratedToken(newEntry);
        setShowConfirmation(true);
        // Auto-trigger print after successful token creation
        printTicket(newEntry);
      }
    } catch (error) {
      toast.error('Failed to generate token. Please try again.');
      throw error;
    }
  };

  const handlePrintToken = () => {
    if (generatedToken) {
      printTicket(generatedToken);
    }
  };

  const handleNewToken = () => {
    setGeneratedToken(null);
    setShowConfirmation(false);
  };

  const hospitalName = settings.clinic_name?.replace(/"/g, '') || 'Hospital Clinic';

  if (settingsLoading) {
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
        {/* Welcome Heading */}
        <div className="mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">
            WELCOME TO
          </h1>
          <h2 className="text-4xl lg:text-5xl font-bold text-primary">
            {hospitalName.toUpperCase()}
          </h2>
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
                      Token Generated Successfully!
                    </h3>
                    <p className="text-slate-600">
                      Please keep your token number for reference
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Your Token Number</p>
                      <p className="text-4xl font-bold text-primary">
                        {generatedToken.token}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Department</p>
                        <p className="font-semibold text-slate-800">{generatedToken.department}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Status</p>
                        <p className="font-semibold text-waiting">Waiting</p>
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
                      Print Token
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
                    Get Your Queue Token
                  </h3>
                  <p className="text-slate-600">
                    Fill in your details to receive a queue token
                  </p>
                </div>
                
                <TokenGenerator onTokenGenerated={handleTokenGenerated} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenGeneration;
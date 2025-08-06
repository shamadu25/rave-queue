import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { Department } from '@/types/queue';
import { 
  Activity,
  Stethoscope,
  TestTube,
  Pill,
  RadioIcon,
  ScanLine,
  Receipt,
  Clock,
  User,
  ArrowRight,
  Volume2
} from 'lucide-react';

const departments: Department[] = ['Consultation', 'Lab', 'Pharmacy', 'X-ray', 'Scan', 'Billing'];

export default function QueueDisplay() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(
    (searchParams.get('department') as Department) || 'Consultation'
  );
  const [autoCycle, setAutoCycle] = useState(!searchParams.get('department'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastServedToken, setLastServedToken] = useState<string | null>(null);

  const { entries } = useQueueMonitor();

  // Update URL when department changes
  useEffect(() => {
    if (!autoCycle) {
      setSearchParams({ department: selectedDepartment });
    }
  }, [selectedDepartment, autoCycle, setSearchParams]);

  // Auto-cycle between departments every 15 seconds
  useEffect(() => {
    if (!autoCycle) return;

    const interval = setInterval(() => {
      setSelectedDepartment(prev => {
        const currentIndex = departments.indexOf(prev);
        const nextIndex = (currentIndex + 1) % departments.length;
        return departments[nextIndex];
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [autoCycle]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Play sound when serving token changes
  useEffect(() => {
    const currentServed = departmentEntries.find(e => e.status === 'Served');
    if (currentServed && lastServedToken && currentServed.token !== lastServedToken) {
      // Simple beep sound (you can replace with actual audio file)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
    if (currentServed) {
      setLastServedToken(currentServed.token);
    }
  }, [entries, selectedDepartment]);

  const departmentEntries = entries
    .filter(entry => entry.department === selectedDepartment)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const nowServing = departmentEntries.find(entry => entry.status === 'Served');
  const calledEntries = departmentEntries.filter(entry => entry.status === 'Called');
  const waitingEntries = departmentEntries.filter(entry => entry.status === 'Waiting');
  
  const nextInLine = calledEntries[0] || waitingEntries[0];

  const getDepartmentIcon = (department: Department) => {
    const iconProps = { className: "h-16 w-16 text-white" };
    
    switch (department) {
      case 'Consultation':
        return <Stethoscope {...iconProps} />;
      case 'Lab':
        return <TestTube {...iconProps} />;
      case 'Pharmacy':
        return <Pill {...iconProps} />;
      case 'X-ray':
        return <RadioIcon {...iconProps} />;
      case 'Scan':
        return <ScanLine {...iconProps} />;
      case 'Billing':
        return <Receipt {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getDepartmentColor = (department: Department) => {
    switch (department) {
      case 'Consultation':
        return 'bg-blue-600';
      case 'Lab':
        return 'bg-green-600';
      case 'Pharmacy':
        return 'bg-purple-600';
      case 'X-ray':
        return 'bg-orange-600';
      case 'Scan':
        return 'bg-indigo-600';
      case 'Billing':
        return 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getPatientDisplay = (fullName: string) => {
    // Show first name and last initial for privacy
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[names.length - 1][0]}.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className={`${getDepartmentColor(selectedDepartment)} text-white py-8 px-8`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {getDepartmentIcon(selectedDepartment)}
            <div>
              <h1 className="text-5xl font-bold mb-2">{selectedDepartment} Department</h1>
              <p className="text-xl opacity-90">Queue Status Display</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-semibold">{formatTime(currentTime)}</div>
            <div className="text-lg opacity-90">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-lg font-medium">Department:</label>
            <Select 
              value={selectedDepartment} 
              onValueChange={(value: Department) => {
                setSelectedDepartment(value);
                setAutoCycle(false);
              }}
            >
              <SelectTrigger className="w-48 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept} className="text-lg">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`px-4 py-2 rounded-lg font-medium ${
                autoCycle 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              Auto-cycle: {autoCycle ? 'ON' : 'OFF'}
            </button>
            
            <div className="flex items-center gap-2 text-gray-600">
              <div className={`h-3 w-3 rounded-full ${autoCycle ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Display */}
      <div className="max-w-6xl mx-auto px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Now Serving */}
          <Card className="p-12 border-4 border-green-200 bg-green-50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-green-500 text-white p-3 rounded-full">
                  <Volume2 className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-bold text-green-700">NOW SERVING</h2>
              </div>
              
              {nowServing ? (
                <div>
                  <div className="text-8xl font-bold text-green-600 mb-4">
                    {nowServing.token}
                  </div>
                  <div className="text-3xl text-gray-700 mb-2">
                    {getPatientDisplay(nowServing.fullName)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xl text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Called at {formatTime(nowServing.timestamp)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-4xl text-gray-500">
                  No patients currently being served
                </div>
              )}
            </div>
          </Card>

          {/* Next in Line */}
          <Card className="p-12 border-4 border-blue-200 bg-blue-50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-blue-500 text-white p-3 rounded-full">
                  <ArrowRight className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-bold text-blue-700">NEXT IN LINE</h2>
              </div>
              
              {nextInLine ? (
                <div>
                  <div className="text-6xl font-bold text-blue-600 mb-4">
                    {nextInLine.token}
                  </div>
                  <div className="text-2xl text-gray-700 mb-2">
                    {getPatientDisplay(nextInLine.fullName)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
                    <User className="h-5 w-5" />
                    <Badge className={nextInLine.status === 'Called' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                      {nextInLine.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-3xl text-gray-500">
                  No patients waiting
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Queue Summary */}
        <Card className="mt-8 p-8 bg-white border-2">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">Queue Summary</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {departmentEntries.filter(e => e.status === 'Served').length}
                </div>
                <div className="text-lg text-gray-600">Being Served</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {departmentEntries.filter(e => e.status === 'Called').length}
                </div>
                <div className="text-lg text-gray-600">Called</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {departmentEntries.filter(e => e.status === 'Waiting').length}
                </div>
                <div className="text-lg text-gray-600">Waiting</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-600">
                  {departmentEntries.filter(e => e.status === 'Completed').length}
                </div>
                <div className="text-lg text-gray-600">Completed Today</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Marquee Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-xl">
          <span className="mx-8">🏥 Please wait for your token to be called...</span>
          <span className="mx-8">📞 Listen for your number on the announcement system</span>
          <span className="mx-8">⏰ Current time: {formatTime(currentTime)}</span>
          <span className="mx-8">🎯 Thank you for your patience</span>
          <span className="mx-8">🏥 Please wait for your token to be called...</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% {
              transform: translate3d(100%, 0, 0);
            }
            100% {
              transform: translate3d(-100%, 0, 0);
            }
          }
          
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `
      }} />
    </div>
  );
}
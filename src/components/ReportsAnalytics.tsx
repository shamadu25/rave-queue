import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isWithinInterval, differenceInMinutes, parseISO } from 'date-fns';
import { CalendarIcon, Download, FileText, BarChart3, PieChart, TrendingUp, Users, Clock, XCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, Legend, Pie } from 'recharts';
import { cn } from '@/lib/utils';
import { Department, Status } from '@/types/queue';
import { toast } from 'sonner';

interface ExtendedQueueEntry {
  id: string;
  token: string;
  fullName: string;
  phoneNumber?: string;
  department: Department;
  priority: 'Normal' | 'Emergency';
  status: Status;
  timestamp: Date;
  calledAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  transferredFrom?: string;
  servedBy?: string;
}

interface ReportsAnalyticsProps {
  entries: ExtendedQueueEntry[];
}

const COLORS = {
  Consultation: '#3b82f6',
  Lab: '#10b981',
  Pharmacy: '#8b5cf6',
  'X-ray': '#f59e0b',
  Scan: '#6366f1',
  Billing: '#6b7280'
};

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ entries }) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter entries based on selected criteria
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const isInDateRange = isWithinInterval(entryDate, {
        start: dateRange.from,
        end: dateRange.to
      });
      
      const matchesDepartment = selectedDepartment === 'all' || entry.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || entry.status === selectedStatus;
      
      return isInDateRange && matchesDepartment && matchesStatus;
    });
  }, [entries, dateRange, selectedDepartment, selectedStatus]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalTokens = filteredEntries.length;
    const servedCount = filteredEntries.filter(e => e.status === 'Completed').length;
    const skippedCount = filteredEntries.filter(e => e.status === 'Skipped').length;
    
    // Calculate average wait time (from entry to called)
    const waitTimes = filteredEntries
      .filter(e => e.calledAt)
      .map(e => differenceInMinutes(e.calledAt!, e.timestamp));
    const avgWaitTime = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
    
    // Calculate average serve time (from called to completed)
    const serveTimes = filteredEntries
      .filter(e => e.calledAt && e.completedAt)
      .map(e => differenceInMinutes(e.completedAt!, e.calledAt!));
    const avgServeTime = serveTimes.length > 0 ? Math.round(serveTimes.reduce((a, b) => a + b, 0) / serveTimes.length) : 0;
    
    return {
      totalTokens,
      servedCount,
      skippedCount,
      avgWaitTime,
      avgServeTime
    };
  }, [filteredEntries]);

  // Prepare hourly data for line chart
  const hourlyData = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    filteredEntries
      .filter(e => e.status === 'Completed')
      .forEach(entry => {
        const hour = new Date(entry.timestamp).getHours();
        hourCounts[hour]++;
      });
    
    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      tokens: count
    }));
  }, [filteredEntries]);

  // Prepare department distribution for pie chart
  const departmentData = useMemo(() => {
    const deptCounts = filteredEntries.reduce((acc, entry) => {
      acc[entry.department] = (acc[entry.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(deptCounts).map(([dept, count]) => ({
      name: dept,
      value: count,
      color: COLORS[dept as Department] || '#6b7280'
    }));
  }, [filteredEntries]);

  // Prepare served vs skipped data for bar chart
  const statusData = useMemo(() => {
    const data = Object.values(Department).map(dept => {
      const deptEntries = filteredEntries.filter(e => e.department === dept);
      return {
        department: dept,
        served: deptEntries.filter(e => e.status === 'Completed').length,
        skipped: deptEntries.filter(e => e.status === 'Skipped').length
      };
    });
    return data.filter(d => d.served > 0 || d.skipped > 0);
  }, [filteredEntries]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Token ID', 'Patient Name', 'Department', 'Status', 'Priority',
      'Time of Entry', 'Time Called', 'Time Served', 'Time Completed'
    ];
    
    const rows = filteredEntries.map(entry => [
      entry.token,
      entry.fullName,
      entry.department,
      entry.status,
      entry.priority,
      format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      entry.calledAt ? format(entry.calledAt, 'yyyy-MM-dd HH:mm:ss') : '',
      entry.servedAt ? format(entry.servedAt, 'yyyy-MM-dd HH:mm:ss') : '',
      entry.completedAt ? format(entry.completedAt, 'yyyy-MM-dd HH:mm:ss') : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported as CSV');
  };

  const exportToPDF = () => {
    // Simple PDF export using window.print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>Queue Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { border: 1px solid #ddd; padding: 15px; text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Queue Management Report</h1>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'HH:mm')}</p>
            <p>Date Range: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <h3>Total Tokens</h3>
              <p>${metrics.totalTokens}</p>
            </div>
            <div class="metric">
              <h3>Patients Served</h3>
              <p>${metrics.servedCount}</p>
            </div>
            <div class="metric">
              <h3>Average Wait Time</h3>
              <p>${metrics.avgWaitTime} min</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Patient Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Time of Entry</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map(entry => `
                <tr>
                  <td>${entry.token}</td>
                  <td>${entry.fullName}</td>
                  <td>${entry.department}</td>
                  <td>${entry.status}</td>
                  <td>${format(entry.timestamp, 'MMM dd, yyyy HH:mm')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    toast.success('Report opened for PDF export');
  };

  const formatTime = (date?: Date) => {
    return date ? format(date, 'HH:mm') : '-';
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Waiting': return 'bg-gray-100 text-gray-800';
      case 'Called': return 'bg-blue-100 text-blue-800';
      case 'Served': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Skipped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Queue performance metrics and detailed reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Pick date range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({
                          from: startOfDay(range.from),
                          to: endOfDay(range.to)
                        });
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Department Filter */}
            <Select value={selectedDepartment} onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Lab">Laboratory</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="X-ray">X-ray</SelectItem>
                <SelectItem value="Scan">Scan</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value: Status | 'all') => setSelectedStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Called">Called</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTokens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.servedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Skipped</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.skippedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.avgWaitTime}m</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Serve Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.avgServeTime}m</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tokens Served Per Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Token Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Served vs Skipped Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Served vs Skipped Tokens by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="served" fill="#10b981" name="Served" />
                <Bar dataKey="skipped" fill="#ef4444" name="Skipped" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Queue Log</CardTitle>
          <CardDescription>Complete record of queue entries with timestamps</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Called</TableHead>
                <TableHead>Served</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.token}</TableCell>
                  <TableCell>{entry.fullName}</TableCell>
                  <TableCell>{entry.department}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.priority === 'Emergency' && (
                      <Badge className="bg-red-100 text-red-800">Emergency</Badge>
                    )}
                  </TableCell>
                  <TableCell>{format(entry.timestamp, 'HH:mm')}</TableCell>
                  <TableCell>{formatTime(entry.calledAt)}</TableCell>
                  <TableCell>{formatTime(entry.servedAt)}</TableCell>
                  <TableCell>{formatTime(entry.completedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
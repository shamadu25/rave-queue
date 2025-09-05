import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useBranding } from '@/components/DynamicBranding';
import { toast } from 'sonner';
import { 
  Printer, 
  Image, 
  Type, 
  Settings,
  Save,
  Eye,
  Download,
  Smartphone,
  QrCode,
  FileText,
  TestTube
} from 'lucide-react';

export const EnhancedPrintSettings = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const { hospitalName, logo } = useBranding();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState({
    token: 'A001',
    department: 'Consultation', 
    patientName: 'John Doe',
    timestamp: new Date()
  });

  useEffect(() => {
    setFormData({
      print_thermal_mode: settings?.print_thermal_mode === true || String(settings?.print_thermal_mode) === 'true',
      print_logo_size: settings?.print_logo_size || 'md',
      print_font_bold: settings?.print_font_bold === true || String(settings?.print_font_bold) === 'true',
      print_include_qr: settings?.print_include_qr === true || String(settings?.print_include_qr) === 'true',
      enable_auto_print: settings?.enable_auto_print === true || String(settings?.enable_auto_print) === 'true',
      enable_silent_printing: settings?.enable_silent_printing === true || String(settings?.enable_silent_printing) === 'true'
    });
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const savePrintSettings = async () => {
    try {
      setSaving(true);
      
      const settingsToUpdate = Object.entries(formData)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => ({
          key,
          value: value,
          category: 'print'
        }));

      const success = await updateMultipleSettings(settingsToUpdate);
      
      if (success) {
        toast.success('✅ Print settings saved! Changes will apply to all new printed tickets.');
      }
    } catch (error) {
      console.error('Error saving print settings:', error);
      toast.error('❌ Failed to save print settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const generatePreviewTicket = () => {
    const ticket = generateTicketHTML(previewData);
    const previewWindow = window.open('', 'TicketPreview', 'width=400,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes');
    
    if (previewWindow) {
      previewWindow.document.write(ticket);
      previewWindow.document.close();
      toast.success('🎯 Ticket preview opened!');
    } else {
      toast.error('❌ Failed to open preview. Please check popup blocker.');
    }
  };

  const downloadSampleTicket = () => {
    const ticket = generateTicketHTML(previewData);
    const blob = new Blob([ticket], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-ticket-${previewData.token}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📁 Sample ticket downloaded!');
  };

  const generateTicketHTML = (data: typeof previewData) => {
    const { token, department, patientName, timestamp } = data;
    const logoSize = formData.print_logo_size === 'sm' ? '40px' : formData.print_logo_size === 'lg' ? '80px' : '60px';
    const fontWeight = formData.print_font_bold ? 'bold' : 'normal';
    const thermalWidth = formData.print_thermal_mode ? '80mm' : 'auto';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Queue Ticket - ${token}</title>
          <style>
            @page {
              size: ${thermalWidth} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-weight: ${fontWeight};
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
              max-width: ${thermalWidth};
            }
            .ticket {
              text-align: center;
              border: 2px solid #000;
              padding: 15px;
              background: #fff;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 15px;
              flex-wrap: wrap;
            }
            .logo {
              width: ${logoSize};
              height: ${logoSize};
              object-fit: contain;
            }
            .hospital-name {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .token-number {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 3px;
              margin: 20px 0;
              border: 3px solid #000;
              padding: 10px;
              background: #f0f0f0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 5px 0;
              border-bottom: 1px dashed #ccc;
            }
            .label {
              font-weight: bold;
            }
            .qr-code {
              margin: 15px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              ${logo && formData.print_logo_size !== 'none' ? `<img src="${logo}" alt="Logo" class="logo">` : ''}
              <div class="hospital-name">${hospitalName}</div>
            </div>
            
            <div class="token-number">
              TOKEN: ${token}
            </div>
            
            <div class="info-row">
              <span class="label">Patient:</span>
              <span>${patientName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Department:</span>
              <span>${department}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Date:</span>
              <span>${timestamp.toLocaleDateString()}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Time:</span>
              <span>${timestamp.toLocaleTimeString()}</span>
            </div>
            
            ${formData.print_include_qr ? `
              <div class="qr-code">
                <div style="width: 100px; height: 100px; border: 2px solid #000; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  QR CODE<br/>${token}
                </div>
              </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>Thank you for visiting ${hospitalName}</strong></p>
              <p>Please wait for your token to be called</p>
              ${settings?.footer_note ? `<p>${settings.footer_note.toString().replace(/"/g, '')}</p>` : ''}
              <p>Generated: ${timestamp.toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Enhanced Print & Ticket Settings
          </h3>
          <p className="text-muted-foreground">Configure thermal printer optimization and ticket appearance</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generatePreviewTicket}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Ticket
          </Button>
          
          <Button
            variant="outline"
            onClick={downloadSampleTicket}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Sample
          </Button>
          
          <Button
            onClick={savePrintSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Preview Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Live Ticket Preview
          </CardTitle>
          <CardDescription>Customize sample data to test ticket appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Sample Token</Label>
              <Input
                value={previewData.token}
                onChange={(e) => setPreviewData(prev => ({ ...prev, token: e.target.value }))}
                placeholder="A001"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={previewData.department}
                onValueChange={(value) => setPreviewData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Lab">Laboratory</SelectItem>
                  <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="X-ray">X-ray</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Patient Name</Label>
              <Input
                value={previewData.patientName}
                onChange={(e) => setPreviewData(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Test Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePreviewTicket}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Thermal Printer Optimization
          </CardTitle>
          <CardDescription>Configure settings for 58mm and 80mm thermal printers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Thermal Printer Mode</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Optimize layout for thermal printers (58mm/80mm)
                </p>
              </div>
              <Switch
                checked={formData.print_thermal_mode}
                onCheckedChange={(checked) => handleInputChange('print_thermal_mode', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Bold Font Printing</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use bold fonts for better visibility on thermal paper
                </p>
              </div>
              <Switch
                checked={formData.print_font_bold}
                onCheckedChange={(checked) => handleInputChange('print_font_bold', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Auto-Print Tokens</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically print tickets when tokens are generated
                </p>
              </div>
              <Switch
                checked={formData.enable_auto_print}
                onCheckedChange={(checked) => handleInputChange('enable_auto_print', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Silent Printing</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Print without showing print dialog (faster)
                </p>
              </div>
              <Switch
                checked={formData.enable_silent_printing}
                onCheckedChange={(checked) => handleInputChange('enable_silent_printing', checked)}
              />
            </div>
          </div>

          {formData.print_thermal_mode && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Thermal Printer Recommendations</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use 58mm or 80mm thermal paper for best results</li>
                <li>• Enable bold fonts for better visibility</li>
                <li>• QR codes work best at medium to large logo sizes</li>
                <li>• Test print alignment before production use</li>
                <li>• Keep printer paper roll properly aligned</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Ticket Appearance & Branding
          </CardTitle>
          <CardDescription>Customize logo size and visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hospital Logo Size on Tickets</Label>
              <Select
                value={formData.print_logo_size}
                onValueChange={(value) => handleInputChange('print_logo_size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Logo</SelectItem>
                  <SelectItem value="sm">Small (40px)</SelectItem>
                  <SelectItem value="md">Medium (60px)</SelectItem>
                  <SelectItem value="lg">Large (80px)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current logo: {logo ? '✅ Configured' : '❌ Not set'}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Include QR Code
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add QR code with token information
                </p>
              </div>
              <Switch
                checked={formData.print_include_qr}
                onCheckedChange={(checked) => handleInputChange('print_include_qr', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printing Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Printing Tips & Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">🖨️ For Thermal Printers</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Enable thermal printer mode above</li>
                <li>• Use ESC/POS compatible printers</li>
                <li>• Test with sample tickets first</li>
                <li>• Adjust printer settings for paper width</li>
                <li>• Clean printer heads regularly</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">🖥️ For Regular Printers</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Disable thermal printer mode</li>
                <li>• Use standard A4 or letter paper</li>
                <li>• Adjust browser print settings</li>
                <li>• Enable background graphics</li>
                <li>• Set margins to minimum</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>💡 Pro Tip:</strong> Use the preview function to test your settings before printing actual tickets. 
              Different printers may require slight adjustments for optimal results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
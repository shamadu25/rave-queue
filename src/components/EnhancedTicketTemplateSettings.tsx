import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useEnhancedBranding } from '@/components/EnhancedDynamicBranding';
import { toast } from 'sonner';
import { 
  FileText, 
  Eye, 
  Download, 
  Copy,
  Save,
  Settings,
  Image,
  Type,
  Layout,
  Printer
} from 'lucide-react';

export const EnhancedTicketTemplateSettings = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const { hospitalName, logo, hasLogo } = useEnhancedBranding();
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
      // Ticket Template Settings
      ticket_header_template: settings?.ticket_header_template?.toString().replace(/"/g, '') || 'Logo + {hospitalName}',
      ticket_body_template: settings?.ticket_body_template?.toString().replace(/"/g, '') || 'Token: {token}\nService: {department}\nDate: {date}\nTime: {time}',
      ticket_footer_template: settings?.ticket_footer_template?.toString().replace(/"/g, '') || 'Thank you for visiting {hospitalName}',
      
      // Print Layout Settings
      print_logo_enabled: settings?.print_logo_enabled === true || String(settings?.print_logo_enabled) === 'true',
      print_logo_size: settings?.print_logo_size || 'md',
      print_hospital_name_bold: settings?.print_hospital_name_bold === true || String(settings?.print_hospital_name_bold) === 'true',
      print_token_font_size: parseInt(String(settings?.print_token_font_size || 36)),
      print_department_font_size: parseInt(String(settings?.print_department_font_size || 14)),
      print_date_time_font_size: parseInt(String(settings?.print_date_time_font_size || 12)),
      
      // Thermal Printer Optimization
      print_thermal_width: settings?.print_thermal_width || '80mm',
      print_paper_cutting: settings?.print_paper_cutting === true || String(settings?.print_paper_cutting) === 'true',
      print_margin_size: parseInt(String(settings?.print_margin_size || 10)),
      
      // QR Code Settings
      print_qr_enabled: settings?.print_qr_enabled === true || String(settings?.print_qr_enabled) === 'true',
      print_qr_size: settings?.print_qr_size || 'md',
      print_qr_position: settings?.print_qr_position || 'bottom',
      
      // Advanced Settings
      print_border_enabled: settings?.print_border_enabled === true || String(settings?.print_border_enabled) === 'true',
      print_divider_style: settings?.print_divider_style || 'dashed',
      print_background_pattern: settings?.print_background_pattern || 'none'
    });
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveTicketSettings = async () => {
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
        // Notify other components about template changes
        window.dispatchEvent(new CustomEvent('ticketTemplateUpdated', { 
          detail: formData 
        }));
        
        toast.success('✅ Ticket template settings saved! All new tickets will use the updated design.');
      }
    } catch (error) {
      console.error('Error saving ticket settings:', error);
      toast.error('❌ Failed to save ticket settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const generatePreviewTicket = () => {
    const ticket = generateTicketHTML(previewData);
    const previewWindow = window.open('', 'TicketPreview', 'width=400,height=700,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes');
    
    if (previewWindow) {
      previewWindow.document.write(ticket);
      previewWindow.document.close();
      toast.success('🎯 Ticket preview opened with current template!');
    } else {
      toast.error('❌ Failed to open preview. Please check popup blocker.');
    }
  };

  const copyTemplateCode = (templateKey: string) => {
    const template = formData[templateKey];
    if (template) {
      navigator.clipboard.writeText(template);
      toast.success('📋 Template copied to clipboard!');
    }
  };

  const generateTicketHTML = (data: typeof previewData) => {
    const { token, department, patientName, timestamp } = data;
    const logoSize = formData.print_logo_size === 'sm' ? '40px' : formData.print_logo_size === 'lg' ? '80px' : '60px';
    const thermalWidth = formData.print_thermal_width === '58mm' ? '58mm' : '80mm';
    const tokenFontSize = formData.print_token_font_size || 36;
    const departmentFontSize = formData.print_department_font_size || 14;
    const dateTimeFontSize = formData.print_date_time_font_size || 12;
    const marginSize = formData.print_margin_size || 10;
    
    // Process templates
    const processTemplate = (template: string) => {
      return template
        .replace(/{hospitalName}/g, hospitalName)
        .replace(/{token}/g, token)
        .replace(/{department}/g, department)
        .replace(/{patientName}/g, patientName)
        .replace(/{date}/g, timestamp.toLocaleDateString())
        .replace(/{time}/g, timestamp.toLocaleTimeString())
        .replace(/\\n/g, '<br/>');
    };
    
    const headerContent = processTemplate(formData.ticket_header_template);
    const bodyContent = processTemplate(formData.ticket_body_template);
    const footerContent = processTemplate(formData.ticket_footer_template);
    
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
              font-weight: bold;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              margin: 0;
              padding: ${marginSize}px;
              max-width: ${thermalWidth};
            }
            .ticket {
              text-align: center;
              ${formData.print_border_enabled ? 'border: 2px solid #000;' : ''}
              padding: 15px;
              background: #fff;
              ${formData.print_background_pattern !== 'none' ? `background-image: ${formData.print_background_pattern};` : ''}
            }
            .header {
              margin-bottom: 15px;
            }
            .logo {
              width: ${logoSize};
              height: ${logoSize};
              object-fit: contain;
              margin-bottom: 10px;
            }
            .hospital-name {
              font-size: 16px;
              ${formData.print_hospital_name_bold ? 'font-weight: bold;' : 'font-weight: normal;'}
              text-transform: uppercase;
            }
            .token-number {
              font-size: ${tokenFontSize}px;
              font-weight: bold;
              letter-spacing: 3px;
              margin: 20px 0;
              border: 3px solid #000;
              padding: 10px;
              background: #f0f0f0;
            }
            .body-content {
              font-size: ${departmentFontSize}px;
              margin: 15px 0;
              line-height: 1.6;
            }
            .date-time {
              font-size: ${dateTimeFontSize}px;
            }
            .divider {
              ${formData.print_divider_style === 'solid' ? 'border-top: 1px solid #000;' : 
                formData.print_divider_style === 'dashed' ? 'border-top: 1px dashed #000;' : 
                'border-top: 1px dotted #000;'}
              margin: 10px 0;
            }
            .qr-code {
              margin: 15px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 10px;
              color: #000;
              ${formData.print_border_enabled ? 'border-top: 1px solid #000; padding-top: 10px;' : ''}
            }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              ${formData.print_logo_enabled && hasLogo ? `<img src="${logo}" alt="Logo" class="logo">` : ''}
              <div class="hospital-name">${headerContent}</div>
            </div>
            
            <div class="token-number">
              TOKEN: ${token}
            </div>
            
            <div class="divider"></div>
            
            <div class="body-content">
              ${bodyContent}
            </div>
            
            <div class="divider"></div>
            
            ${formData.print_qr_enabled && formData.print_qr_position === 'middle' ? `
              <div class="qr-code">
                <div style="width: 80px; height: 80px; border: 2px solid #000; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 8px;">
                  QR CODE<br/>${token}
                </div>
              </div>
              <div class="divider"></div>
            ` : ''}
            
            <div class="footer">
              ${footerContent}
            </div>
            
            ${formData.print_qr_enabled && formData.print_qr_position === 'bottom' ? `
              <div class="qr-code">
                <div style="width: 60px; height: 60px; border: 2px solid #000; margin: 10px auto 0; display: flex; align-items: center; justify-content: center; font-size: 6px;">
                  QR<br/>${token}
                </div>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const resetTemplates = () => {
    setFormData(prev => ({
      ...prev,
      ticket_header_template: 'Logo + {hospitalName}',
      ticket_body_template: 'Token: {token}\nService: {department}\nDate: {date}\nTime: {time}',
      ticket_footer_template: 'Thank you for visiting {hospitalName}'
    }));
    toast.info('📝 Templates reset to defaults. Remember to save your changes.');
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
            <FileText className="h-5 w-5" />
            Enhanced Ticket Template Designer
          </h3>
          <p className="text-muted-foreground">Design professional ticket layouts with custom templates and thermal printer optimization</p>
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
            onClick={resetTemplates}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Reset Templates
          </Button>
          
          <Button
            onClick={saveTicketSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Live Preview Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview Controls
          </CardTitle>
          <CardDescription>Customize sample data to test your ticket template</CardDescription>
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
              <Label>Actions</Label>
              <Button
                variant="outline"
                onClick={generatePreviewTicket}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Ticket Template Configuration
          </CardTitle>
          <CardDescription>
            Customize header, body, and footer templates with dynamic placeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Header Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Header Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyTemplateCode('ticket_header_template')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={formData.ticket_header_template}
                onChange={(e) => handleInputChange('ticket_header_template', e.target.value)}
                placeholder="Enter header template..."
                rows={2}
                className="font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">Available: {hospitalName}, Logo</Badge>
              </div>
            </div>

            {/* Body Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Body Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyTemplateCode('ticket_body_template')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={formData.ticket_body_template}
                onChange={(e) => handleInputChange('ticket_body_template', e.target.value)}
                placeholder="Enter body template..."
                rows={4}
                className="font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{`{token}`}</Badge>
                <Badge variant="secondary" className="text-xs">{`{department}`}</Badge>
                <Badge variant="secondary" className="text-xs">{`{patientName}`}</Badge>
                <Badge variant="secondary" className="text-xs">{`{date}`}</Badge>
                <Badge variant="secondary" className="text-xs">{`{time}`}</Badge>
              </div>
            </div>

            {/* Footer Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Footer Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyTemplateCode('ticket_footer_template')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={formData.ticket_footer_template}
                onChange={(e) => handleInputChange('ticket_footer_template', e.target.value)}
                placeholder="Enter footer template..."
                rows={2}
                className="font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{`{hospitalName}`}</Badge>
                <Badge variant="outline" className="text-xs">Use \\n for line breaks</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout & Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout & Typography Settings
          </CardTitle>
          <CardDescription>Fine-tune fonts, sizes, and visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Token Font Size: {formData.print_token_font_size}px</Label>
              <input
                type="range"
                min="24"
                max="72"
                step="4"
                value={formData.print_token_font_size}
                onChange={(e) => handleInputChange('print_token_font_size', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Department Font Size: {formData.print_department_font_size}px</Label>
              <input
                type="range"
                min="10"
                max="24"
                step="2"
                value={formData.print_department_font_size}
                onChange={(e) => handleInputChange('print_department_font_size', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Date/Time Font Size: {formData.print_date_time_font_size}px</Label>
              <input
                type="range"
                min="8"
                max="16"
                step="1"
                value={formData.print_date_time_font_size}
                onChange={(e) => handleInputChange('print_date_time_font_size', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo Size</Label>
              <Select
                value={formData.print_logo_size}
                onValueChange={(value) => handleInputChange('print_logo_size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small (40px)</SelectItem>
                  <SelectItem value="md">Medium (60px)</SelectItem>
                  <SelectItem value="lg">Large (80px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thermal Paper Width</Label>
              <Select
                value={formData.print_thermal_width}
                onValueChange={(value) => handleInputChange('print_thermal_width', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Small)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Divider Style</Label>
              <Select
                value={formData.print_divider_style}
                onValueChange={(value) => handleInputChange('print_divider_style', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashed">Dashed Line</SelectItem>
                  <SelectItem value="solid">Solid Line</SelectItem>
                  <SelectItem value="dotted">Dotted Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Enable Logo</Label>
                <p className="text-sm text-muted-foreground">Show hospital logo on tickets</p>
              </div>
              <Switch
                checked={formData.print_logo_enabled}
                onCheckedChange={(checked) => handleInputChange('print_logo_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Bold Hospital Name</Label>
                <p className="text-sm text-muted-foreground">Make hospital name bold</p>
              </div>
              <Switch
                checked={formData.print_hospital_name_bold}
                onCheckedChange={(checked) => handleInputChange('print_hospital_name_bold', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">QR Code</Label>
                <p className="text-sm text-muted-foreground">Include QR code with token info</p>
              </div>
              <Switch
                checked={formData.print_qr_enabled}
                onCheckedChange={(checked) => handleInputChange('print_qr_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Border</Label>
                <p className="text-sm text-muted-foreground">Add border around ticket</p>
              </div>
              <Switch
                checked={formData.print_border_enabled}
                onCheckedChange={(checked) => handleInputChange('print_border_enabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
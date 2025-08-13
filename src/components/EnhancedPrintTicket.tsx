import React, { useEffect } from 'react';
import { QueueEntry } from '@/types/queue';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface EnhancedPrintTicketProps {
  entry: QueueEntry;
  clinicName?: string;
  footerNote?: string;
  departmentColor?: string;
}

export const EnhancedPrintTicket: React.FC<EnhancedPrintTicketProps> = ({
  entry,
  clinicName,
  footerNote,
  departmentColor = '#3b82f6'
}) => {
  const { settings } = useSystemSettings();
  
  useEffect(() => {
    // Print immediately without delay
    try {
      window.print();
    } catch (error) {
      console.error('Print failed:', error);
    }
  }, []);

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const { date, time } = formatDateTime(entry.timestamp);
  const actualClinicName = clinicName || settings.clinic_name?.replace(/"/g, '') || 'Medical Center';
  const actualFooterNote = footerNote || settings.footer_note?.replace(/"/g, '') || 'Powered by RAVESOFT';

  const formatPrintDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <>
      <style>
        {`
          @media print {
            * {
              visibility: hidden;
            }
            .thermal-ticket, .thermal-ticket * {
              visibility: visible;
            }
            .thermal-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            @page {
              size: 58mm auto;
              margin: 0;
            }
            
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 0;
              background: white;
              color: #000 !important;
            }
            
            .ticket-content {
              width: 58mm;
              max-width: 58mm;
              background: white !important;
              color: #000 !important;
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.3;
              text-align: center;
              padding: 3mm;
              margin: 0;
              box-sizing: border-box;
            }
            
              /* 80mm printer support */
              @media print and (min-width: 80mm) {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                .ticket-content {
                  width: 80mm;
                  max-width: 80mm;
                  padding: 4mm;
                  font-size: 12px;
                }
                .hospital-name {
                  font-size: 22px !important;
                }
                .token-display {
                  font-size: 32px !important;
                }
                .department-name {
                  font-size: 16px !important;
                }
                .counter-info {
                  font-size: 12px !important;
                }
                .datetime-info {
                  font-size: 10px !important;
                }
                .footer-text {
                  font-size: 11px !important;
                }
              }
            
            .clinic-logo {
              width: 25mm !important;
              height: auto !important;
              max-height: 15mm !important;
              margin: 0 auto 2mm auto !important;
              display: block !important;
            }
            
            .hospital-name {
              font-size: 18px !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              margin: 2mm 0 1mm 0 !important;
              color: #000 !important;
              text-align: center !important;
              line-height: 1.1 !important;
            }
            
            .separator {
              color: #000 !important;
              text-align: center !important;
              margin: 1mm 0 2mm 0 !important;
              font-weight: bold !important;
              font-size: 12px !important;
            }
            
            .token-display {
              font-size: 28px !important;
              font-weight: bold !important;
              margin: 2mm 0 !important;
              color: #000 !important;
              text-align: center !important;
              background: none !important;
              border: 3px solid #000 !important;
              padding: 3mm !important;
            }
            
            .department-name {
              font-size: 14px !important;
              font-weight: bold !important;
              margin: 2mm 0 !important;
              color: #000 !important;
              text-align: center !important;
            }
            
            .counter-info {
              font-size: 11px !important;
              font-weight: bold !important;
              margin: 1mm 0 !important;
              color: #000 !important;
              text-align: center !important;
            }
            
            .datetime-info {
              font-size: 9px !important;
              font-weight: bold !important;
              color: #000 !important;
              text-align: center !important;
              margin: 2mm 0 1mm 0 !important;
            }
            
            .footer-text {
              font-size: 10px !important;
              font-weight: bold !important;
              color: #000 !important;
              text-align: center !important;
              margin: 2mm 0 0 0 !important;
            }
            
            .emergency-badge {
              background: #000 !important;
              color: white !important;
              padding: 1mm 2mm !important;
              margin: 2mm 0 !important;
              font-size: 8px !important;
              font-weight: bold !important;
            }
          }
          
          @media screen {
            .thermal-ticket {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: rgba(0,0,0,0.8);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .ticket-content {
              width: 220px;
              max-width: 220px;
              background: white;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              text-align: center;
              padding: 15px;
              border: 2px solid #ddd;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              border-radius: 4px;
            }
            
            .clinic-logo {
              width: 50px;
              height: auto;
              max-height: 30px;
              margin: 0 auto 8px auto;
              display: block;
            }
            
            .hospital-name {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 8px 0;
              color: #333;
              text-align: center;
              line-height: 1.2;
            }
            
            .separator {
              border-top: 1px dashed #ccc;
              margin: 12px 0;
              width: 100%;
            }
            
            .token-display {
              font-size: 28px;
              font-weight: bold;
              margin: 12px 0;
              color: #2563eb;
              text-align: center;
              border: 2px solid #2563eb;
              padding: 8px;
              border-radius: 4px;
            }
            
            .department-name {
              font-size: 14px;
              font-weight: bold;
              margin: 8px 0;
              color: #333;
              text-align: center;
            }
            
            .counter-info {
              font-size: 12px;
              margin: 4px 0;
              color: #666;
              text-align: center;
            }
            
            .datetime-info {
              font-size: 10px;
              color: #666;
              text-align: left;
              margin: 12px 0 4px 0;
            }
            
            .footer-text {
              font-size: 11px;
              color: #666;
              text-align: center;
              margin: 8px 0 0 0;
              font-style: italic;
            }
            
            .emergency-badge {
              background: #dc2626;
              color: white;
              padding: 4px 8px;
              margin: 8px 0;
              font-size: 10px;
              font-weight: bold;
              border-radius: 12px;
              display: inline-block;
            }
          }
        `}
      </style>

      <div className="thermal-ticket">
        <div className="ticket-content">
          {/* Company Logo */}
          {settings.clinic_logo_url && (
            <img 
              src={settings.clinic_logo_url.replace(/"/g, '')} 
              alt="Clinic Logo" 
              className="clinic-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          
          {/* Hospital Name - Bold, Centered, Large Font */}
          <div className="hospital-name">
            {actualClinicName}
          </div>
          
          <div className="separator">========================</div>
          
          {/* Token Number - Extra Large, Bold, Centered */}
          <div 
            className="token-display"
            style={{
              borderColor: entry.priority === 'Emergency' ? '#dc2626' : '#000',
              color: entry.priority === 'Emergency' ? '#dc2626' : '#000'
            }}
          >
            TOKEN: {entry.token}
          </div>
          
          {/* Emergency Priority Badge */}
          {entry.priority === 'Emergency' && (
            <div className="emergency-badge">
              EMERGENCY PRIORITY
            </div>
          )}
          
          {/* Department Name - Centered */}
          <div className="department-name">
            {entry.department}
          </div>
          
          {/* Counter Number (if assigned) */}
          <div className="counter-info">
            Counter: Available at Service Window
          </div>
          
          <div className="separator">========================</div>
          
          {/* Patient Information */}
          <div className="counter-info">
            Patient: {entry.fullName}
          </div>
          
          {entry.phoneNumber && (
            <div className="counter-info">
              Phone: {entry.phoneNumber}
            </div>
          )}
          
          <div className="separator">========================</div>
          
          {/* Date & Time - Small Font, Bottom Left */}
          <div className="datetime-info">
            Issued: {formatPrintDateTime(entry.timestamp)}
          </div>
          
          {/* Custom Footer Text - Centered */}
          {actualFooterNote && (
            <div className="footer-text">
              {actualFooterNote}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
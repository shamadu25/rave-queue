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
    // Auto-print after component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
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

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: 80mm 120mm;
              margin: 5mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: white;
            }
            .ticket-container {
              width: 70mm;
              background: white;
              padding: 5mm;
              text-align: center;
              border: 1px solid #ddd;
            }
            .no-print {
              display: none !important;
            }
          }

          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
              font-family: 'Arial', sans-serif;
            }
            .ticket-container {
              width: 80mm;
              max-width: 300px;
              margin: 0 auto;
              background: white;
              padding: 15px;
              border: 2px dashed #ddd;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
          }

          .ticket-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          .clinic-name {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 4px 0;
            color: #333;
          }

          .ticket-datetime {
            font-size: 10px;
            color: #666;
            margin: 2px 0;
          }

          .token-section {
            margin: 15px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
          }

          .token-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }

          .token-number {
            font-size: 32px;
            font-weight: bold;
            margin: 8px 0;
            padding: 8px;
            border: 2px solid;
            border-radius: 6px;
            background: white;
          }

          .patient-info {
            margin: 12px 0;
            text-align: left;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            font-size: 11px;
          }

          .info-label {
            color: #666;
            font-weight: 500;
          }

          .info-value {
            color: #333;
            font-weight: bold;
          }

          .department-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            color: white;
            margin: 8px 0;
          }

          .status-section {
            margin: 12px 0;
            padding: 8px;
            background: #f0f8ff;
            border-radius: 4px;
          }

          .status-label {
            font-size: 10px;
            color: #666;
            margin-bottom: 2px;
          }

          .status-value {
            font-size: 14px;
            font-weight: bold;
            color: #0066cc;
          }

          .footer-section {
            border-top: 1px solid #eee;
            padding-top: 8px;
            margin-top: 12px;
          }

          .footer-note {
            font-size: 9px;
            color: #666;
            font-style: italic;
          }

          .instructions {
            font-size: 9px;
            color: #666;
            margin-top: 6px;
            line-height: 1.3;
          }

          .priority-emergency {
            background: #dc2626 !important;
            color: white !important;
            border-color: #dc2626 !important;
          }
        `}
      </style>

      <div className="ticket-container">
        {/* Header */}
        <div className="ticket-header">
          <h1 className="clinic-name">{actualClinicName}</h1>
          <div className="ticket-datetime">
            <div>{date}</div>
            <div>{time}</div>
          </div>
        </div>

        {/* Token Section */}
        <div className="token-section">
          <div className="token-label">Queue Token</div>
          <div 
            className={`token-number ${entry.priority === 'Emergency' ? 'priority-emergency' : ''}`}
            style={{
              borderColor: entry.priority === 'Emergency' ? '#dc2626' : departmentColor,
              color: entry.priority === 'Emergency' ? '#dc2626' : departmentColor
            }}
          >
            {entry.token}
          </div>
          {entry.priority === 'Emergency' && (
            <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>
              EMERGENCY PRIORITY
            </div>
          )}
        </div>

        {/* Patient Information */}
        <div className="patient-info">
          <div className="info-row">
            <span className="info-label">Patient:</span>
            <span className="info-value">{entry.fullName}</span>
          </div>
          {entry.phoneNumber && (
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{entry.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Department */}
        <div 
          className="department-badge"
          style={{ backgroundColor: departmentColor }}
        >
          {entry.department}
        </div>

        {/* Status */}
        <div className="status-section">
          <div className="status-label">Current Status</div>
          <div className="status-value">{entry.status}</div>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <div className="instructions">
            Please wait for your token to be called.
            <br />
            Stay near the waiting area.
          </div>
          {actualFooterNote && (
            <div className="footer-note">{actualFooterNote}</div>
          )}
        </div>
      </div>
    </>
  );
};
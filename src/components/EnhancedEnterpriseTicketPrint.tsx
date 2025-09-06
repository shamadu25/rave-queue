import React, { useEffect } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface EnhancedEnterpriseTicketPrintProps {
  entry: {
    token: string;
    department: string;
    timestamp: string;
    status: string;
    priority: string;
    full_name?: string;
  };
  departmentColor?: string;
}

export const EnhancedEnterpriseTicketPrint: React.FC<EnhancedEnterpriseTicketPrintProps> = ({
  entry,
  departmentColor = '#3B82F6'
}) => {
  const { settings } = useSystemSettings();

  // Auto-print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const hospitalName = settings?.clinic_name || 'Your Hospital Name';
  const hospitalLogo = settings?.clinic_logo;
  const footerText = settings?.footer_note || `Thank you for visiting ${hospitalName}`;
  const hospitalAddress = settings?.clinic_address || '';
  const hospitalPhone = settings?.clinic_phone || '';
  
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr };
  };

  const { date, time } = formatDateTime(entry.timestamp);

  return (
    <div className="max-w-sm mx-auto bg-white">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        
        @media screen {
          .print-area {
            max-width: 300px;
            margin: 20px auto;
            padding: 20px;
            border: 2px dashed #ccc;
            font-family: 'Courier New', monospace;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
        }

        .ticket-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .hospital-logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 10px;
          border-radius: 50%;
          object-fit: cover;
        }

        .hospital-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #000;
        }

        .ticket-body {
          text-align: center;
          padding: 15px 0;
        }

        .token-number {
          font-size: 36px;
          font-weight: bold;
          color: #000;
          margin: 15px 0;
          padding: 10px;
          border: 3px solid #000;
          border-radius: 8px;
          background-color: #f8f9fa;
        }

        .department-info {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin: 10px 0;
          padding: 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }

        .timestamp-info {
          font-size: 14px;
          color: #333;
          margin: 10px 0;
        }

        .priority-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: #fff;
          background-color: #666;
          margin: 5px 0;
        }

        .priority-emergency {
          background-color: #dc2626 !important;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.7; }
        }

        .ticket-footer {
          text-align: center;
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 15px;
          font-size: 12px;
          color: #333;
        }

        .footer-text {
          font-weight: bold;
          margin-bottom: 8px;
          color: #000;
        }

        .contact-info {
          font-size: 10px;
          color: #666;
          line-height: 1.4;
        }

        .qr-placeholder {
          width: 40px;
          height: 40px;
          border: 1px solid #000;
          margin: 10px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #666;
        }
      `}</style>

      <div className="print-area">
        {/* Header */}
        <div className="ticket-header">
          {hospitalLogo && (
            <img 
              src={hospitalLogo} 
              alt={hospitalName}
              className="hospital-logo"
            />
          )}
          <div className="hospital-name">{hospitalName}</div>
          {hospitalAddress && (
            <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
              {hospitalAddress}
            </div>
          )}
          {hospitalPhone && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              Tel: {hospitalPhone}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="ticket-body">
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            QUEUE TOKEN
          </div>
          
          <div className="token-number">
            {entry.token}
          </div>

          <div className="department-info">
            Service: {entry.department}
          </div>

          {entry.full_name && (
            <div style={{ fontSize: '14px', margin: '8px 0', color: '#333' }}>
              Name: {entry.full_name}
            </div>
          )}

          <div className="timestamp-info">
            <div>Date: {date}</div>
            <div>Time: {time}</div>
          </div>

          <div 
            className={`priority-badge ${entry.priority === 'Emergency' ? 'priority-emergency' : ''}`}
          >
            Priority: {entry.priority}
          </div>

          {entry.priority === 'Emergency' && (
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', margin: '5px 0' }}>
              🚨 EMERGENCY - IMMEDIATE ATTENTION REQUIRED
            </div>
          )}

          <div className="qr-placeholder">
            QR CODE
          </div>
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          <div className="footer-text">
            {footerText}
          </div>
          <div className="contact-info">
            <div>Please keep this ticket for reference</div>
            <div>Status updates will be displayed on screen</div>
            {settings?.emergency_contact && (
              <div>Emergency: {settings.emergency_contact}</div>
            )}
          </div>
          <div style={{ fontSize: '8px', marginTop: '8px', color: '#999' }}>
            Powered by Enterprise Queue Management System
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useEffect } from 'react';
import { QueueEntry } from '@/types/queue';

interface PrintTicketProps {
  entry: QueueEntry;
  clinicName?: string;
  footerNote?: string;
}

export const PrintTicket: React.FC<PrintTicketProps> = ({ 
  entry, 
  clinicName = "Hospital Clinic", 
  footerNote = "Thank you for visiting" 
}) => {
  useEffect(() => {
    // Auto-trigger print dialog when component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const formatDateTime = (date: Date) => {
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
    <div className="print-ticket">
      <div className="ticket-content">
        <div className="ticket-header">
          <h2 className="clinic-name">{clinicName}</h2>
          <p className="date-time">Date: {formatDateTime(entry.timestamp)}</p>
        </div>
        
        <div className="ticket-divider">----------------------------</div>
        
        <div className="ticket-info">
          <p className="token-number">Token Number: <strong>{entry.token}</strong></p>
          <p className="department">Department: {entry.department}</p>
          <p className="status">Status: {entry.status}</p>
        </div>
        
        <div className="ticket-message">
          <p>👉 Please wait to be called</p>
        </div>
        
        <div className="ticket-divider">----------------------------</div>
        
        <div className="ticket-footer">
          <p className="footer-note">{footerNote}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-ticket, .print-ticket * {
            visibility: visible;
          }
          .print-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .ticket-content {
            width: 58mm;
            margin: 0 auto;
            padding: 4mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
          }
          
          .clinic-name {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 0 0 2mm 0;
            text-transform: uppercase;
          }
          
          .date-time {
            text-align: center;
            margin: 0 0 2mm 0;
            font-size: 10px;
          }
          
          .ticket-divider {
            text-align: center;
            margin: 2mm 0;
            font-weight: bold;
          }
          
          .ticket-info p {
            margin: 1mm 0;
          }
          
          .token-number {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
          }
          
          .ticket-message {
            text-align: center;
            margin: 3mm 0;
            font-weight: bold;
          }
          
          .ticket-footer {
            text-align: center;
            font-size: 10px;
            margin-top: 2mm;
          }
        }
        
        @media screen {
          .print-ticket {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .ticket-content {
            width: 200px;
            padding: 20px;
            border: 2px dashed #ccc;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .clinic-name {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 0 0 8px 0;
            text-transform: uppercase;
          }
          
          .date-time {
            text-align: center;
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #666;
          }
          
          .ticket-divider {
            text-align: center;
            margin: 8px 0;
            font-weight: bold;
            color: #333;
          }
          
          .ticket-info p {
            margin: 4px 0;
          }
          
          .token-number {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            color: #2563eb;
          }
          
          .ticket-message {
            text-align: center;
            margin: 12px 0;
            font-weight: bold;
            color: #059669;
          }
          
          .ticket-footer {
            text-align: center;
            font-size: 12px;
            margin-top: 8px;
            color: #666;
          }
        }
      `}</style>
    </div>
  );
};
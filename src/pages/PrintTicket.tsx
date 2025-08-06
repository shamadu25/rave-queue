import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PrintTicket } from '@/components/PrintTicket';
import { QueueEntry } from '@/types/queue';
import { supabase } from '@/integrations/supabase/client';

const PrintTicketPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        // Load queue entry
        const { data: entryData, error: entryError } = await supabase
          .from('queue_entries')
          .select('*')
          .eq('id', tokenId)
          .single();

        if (entryError) throw entryError;

        // Load system settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('*');

        if (settingsError) throw settingsError;

        const settingsMap = (settingsData || []).reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setEntry({
          id: entryData.id,
          token: entryData.token,
          fullName: entryData.full_name,
          phoneNumber: entryData.phone_number,
          department: entryData.department as any,
          priority: entryData.priority as any,
          status: entryData.status as any,
          timestamp: new Date(entryData.created_at)
        });

        setSystemSettings(settingsMap);
      } catch (error) {
        console.error('Failed to load print data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tokenId, navigate]);

  useEffect(() => {
    // Close window after print dialog is dismissed
    const handleAfterPrint = () => {
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work (popup blockers), navigate back
        navigate('/', { replace: true });
      }, 1000);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    
    // Fallback: close after 10 seconds
    const fallbackTimer = setTimeout(() => {
      window.close();
      navigate('/', { replace: true });
    }, 10000);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  if (loading || !entry) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p>Preparing ticket for printing...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <PrintTicket
      entry={entry}
      clinicName={systemSettings.clinic_name || "Hospital Clinic"}
      footerNote={systemSettings.footer_note || "Thank you for visiting"}
    />
  );
};

export default PrintTicketPage;
import React from 'react';
import { QueueEntry } from '@/types/queue';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { EnhancedPrintTicket } from '@/components/EnhancedPrintTicket';
import { createRoot } from 'react-dom/client';

export const usePrintTicket = () => {
  const { settings } = useSystemSettings();
  
  const printTicket = (entry: QueueEntry, departmentColor?: string) => {
    // Check if auto-print is enabled (handle both boolean and string values from settings)
    const autoPrintValue = settings.enable_auto_print;
    const autoPrintEnabled = autoPrintValue === true || String(autoPrintValue) === 'true';
    
    if (!autoPrintEnabled) {
      console.log('Auto-print disabled, skipping automatic print');
      return;
    }

    // Check if silent printing is enabled (handle both boolean and string values from settings)
    const silentPrintValue = settings.enable_silent_printing;
    const silentPrintingEnabled = silentPrintValue === true || String(silentPrintValue) === 'true';
    
    // Create URL with department color parameter
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    
    if (silentPrintingEnabled) {
      // Enhanced silent printing with React component rendering
      try {
        const printContainer = document.createElement('div');
        printContainer.style.position = 'fixed';
        printContainer.style.top = '-9999px';
        printContainer.style.left = '-9999px';
        printContainer.style.visibility = 'hidden';
        document.body.appendChild(printContainer);

        const root = createRoot(printContainer);
        root.render(
          React.createElement(EnhancedPrintTicket, {
            entry,
            departmentColor
          })
        );

        // Allow rendering to complete, then print and cleanup
        setTimeout(() => {
          try {
            window.print();
            setTimeout(() => {
              if (document.body.contains(printContainer)) {
                root.unmount();
                document.body.removeChild(printContainer);
              }
            }, 2000);
          } catch (error) {
            console.warn('Enhanced silent printing failed, falling back to iframe:', error);
            // Fallback to iframe method
            if (document.body.contains(printContainer)) {
              root.unmount();
              document.body.removeChild(printContainer);
            }
            fallbackIframePrint(printUrl);
          }
        }, 500);
      } catch (error) {
        console.warn('React rendering failed, using iframe fallback:', error);
        fallbackIframePrint(printUrl);
      }
    } else {
      // Standard printing - open print dialog for manual printer selection
      const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
      
      if (!printWindow) {
        // Fallback: navigate to print page in same window
        window.location.href = printUrl;
      }
    }
  };

  const fallbackIframePrint = (printUrl: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.src = printUrl;
    
    iframe.onload = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      } catch (error) {
        console.warn('Iframe printing also failed:', error);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };
    
    iframe.onerror = () => {
      console.error('Failed to load print content');
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
    
    document.body.appendChild(iframe);
  };

  const printTicketManual = (entry: QueueEntry, departmentColor?: string) => {
    // For manual printing, always open in new window regardless of auto-print setting
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    
    const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
    
    if (!printWindow) {
      // Fallback: navigate to print page in same window
      window.location.href = printUrl;
    }
  };

  return { printTicket, printTicketManual };
};
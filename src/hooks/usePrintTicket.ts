import { QueueEntry } from '@/types/queue';
import { useSystemSettings } from '@/hooks/useSystemSettings';

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
      // Silent printing - use iframe approach to avoid dialogs
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.src = printUrl;
      
      iframe.onload = () => {
        try {
          // Print immediately without delay to default printer
          if (iframe.contentWindow) {
            iframe.contentWindow.print();
          }
          
          // Clean up iframe after printing
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        } catch (error) {
          console.warn('Silent printing failed:', error);
          // Clean up iframe on error
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      };
      
      iframe.onerror = () => {
        console.error('Failed to load print content for silent printing');
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };
      
      document.body.appendChild(iframe);
    } else {
      // Standard printing - open print dialog for manual printer selection
      const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
      
      if (!printWindow) {
        // Fallback: navigate to print page in same window
        window.location.href = printUrl;
      }
    }
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
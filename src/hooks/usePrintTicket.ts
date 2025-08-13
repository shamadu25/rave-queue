import { QueueEntry } from '@/types/queue';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const usePrintTicket = () => {
  const { settings } = useSystemSettings();
  
  const printTicket = (entry: QueueEntry, departmentColor?: string) => {
    // Check if auto-print is enabled
    const autoPrintEnabled = settings.enable_auto_print === 'true' || settings.enable_auto_print === true;
    
    if (!autoPrintEnabled) {
      console.log('Auto-print disabled, skipping automatic print');
      return;
    }

    // Create URL with department color parameter
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    
    // For thermal printer compatibility, use direct print approach
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.src = printUrl;
    
    iframe.onload = () => {
      try {
        // Small delay to ensure content is loaded
        setTimeout(() => {
          // Try direct iframe printing for better thermal printer support
          if (iframe.contentWindow) {
            iframe.contentWindow.print();
          }
          
          // Remove iframe after printing attempt
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }, 500);
      } catch (error) {
        console.warn('Silent printing failed:', error);
        // Clean up iframe on error
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
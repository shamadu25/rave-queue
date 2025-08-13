import { QueueEntry } from '@/types/queue';

export const usePrintTicket = () => {
  const printTicket = (entry: QueueEntry, departmentColor?: string) => {
    // Create URL with department color parameter
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    
    // For silent auto-printing, open in a hidden iframe and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = printUrl;
    
    iframe.onload = () => {
      try {
        // Try to print the iframe content directly
        iframe.contentWindow?.print();
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      } catch (error) {
        console.warn('Silent printing failed, opening print window:', error);
        // Fallback to opening print window
        const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
        
        if (!printWindow) {
          // Final fallback: navigate to print page in same window
          window.location.href = printUrl;
        } else {
          // Close the print window after a short delay
          setTimeout(() => {
            printWindow.close();
          }, 3000);
        }
      }
    };
    
    document.body.appendChild(iframe);
  };

  return { printTicket };
};
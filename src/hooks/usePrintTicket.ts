import { QueueEntry } from '@/types/queue';

export const usePrintTicket = () => {
  const printTicket = (entry: QueueEntry, departmentColor?: string) => {
    // Create URL with department color parameter
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    
    // For direct printing, just open the window and it will auto-print
    const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
    
    if (!printWindow) {
      // Fallback: navigate to print page in same window
      window.location.href = printUrl;
    } else {
      // Close the print window after a short delay to allow printing
      setTimeout(() => {
        printWindow.close();
      }, 3000);
    }
  };

  return { printTicket };
};
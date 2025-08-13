import { QueueEntry } from '@/types/queue';

export const usePrintTicket = () => {
  const printTicket = (entry: QueueEntry, departmentColor?: string) => {
    // Create URL with department color parameter
    const colorParam = departmentColor ? `?color=${encodeURIComponent(departmentColor)}` : '';
    const printUrl = `/print/${entry.id}${colorParam}`;
    const printWindow = window.open(printUrl, '_blank', 'width=400,height=600,scrollbars=no,resizable=no');
    
    if (!printWindow) {
      // Fallback: navigate to print page in same window
      window.location.href = printUrl;
    }
  };

  return { printTicket };
};
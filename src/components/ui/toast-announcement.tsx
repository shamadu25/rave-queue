import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2, MessageSquare } from 'lucide-react';

interface ToastAnnouncementProps {
  message: string;
  token?: string;
  department?: string;
  className?: string;
}

export const ToastAnnouncement: React.FC<ToastAnnouncementProps> = ({
  message,
  token,
  department,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg",
      "bg-blue-600 text-white shadow-lg",
      "border-l-4 border-blue-300",
      className
    )}>
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5 animate-pulse" />
        <MessageSquare className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        {token && department && (
          <div className="text-blue-100 text-sm font-medium mb-1">
            {token} • {department}
          </div>
        )}
        <div className="text-white font-medium">
          {message}
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Volume2 } from 'lucide-react';

interface AnnouncementTickerProps {
  message: string;
  department?: string;
  departmentColor?: string;
  token?: string;
  show: boolean;
  onHide: () => void;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({
  message,
  department,
  departmentColor,
  token,
  show,
  onHide
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onHide, 300); // Allow fade out animation
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, onHide]);

  if (!show && !visible) return null;

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
      transition-all duration-300 ease-in-out
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
    `}>
      <Card className="
        bg-gradient-to-r from-blue-600 to-blue-700 
        border-blue-500 shadow-lg shadow-blue-500/20
        text-white animate-pulse-slow
        min-w-96 max-w-2xl
      ">
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 animate-bounce" />
            <MessageSquare className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {token && (
                <Badge 
                  style={{ backgroundColor: departmentColor || '#3b82f6' }}
                  className="text-white font-bold"
                >
                  {token}
                </Badge>
              )}
              {department && (
                <span className="text-blue-100 text-sm font-medium">
                  {department}
                </span>
              )}
            </div>
            
            <p className="text-white font-medium text-lg leading-tight">
              {message}
            </p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-white/70 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-2 h-2 bg-white/50 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </Card>
    </div>
  );
};
import { CheckCircle, Clock, Play, AlertTriangle, XCircle } from "lucide-react";
import { Status } from "@/types/queue";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  priority?: 'Normal' | 'Emergency';
  className?: string;
}

export function StatusBadge({ status, priority, className }: StatusBadgeProps) {
  const getStatusConfig = (status: Status, priority?: string) => {
    // Emergency cases always get red treatment
    if (priority === 'Emergency') {
      return {
        className: "bg-destructive text-destructive-foreground",
        icon: AlertTriangle,
        label: `${status} (Emergency)`
      };
    }

    switch (status) {
      case 'Waiting':
        return {
          className: "status-waiting",
          icon: Clock,
          label: "Waiting"
        };
      case 'Called':
        return {
          className: "status-serving", 
          icon: Play,
          label: "Called"
        };
      case 'Served':
        return {
          className: "status-serving",
          icon: Play,
          label: "In Progress"
        };
      case 'Completed':
        return {
          className: "status-completed",
          icon: CheckCircle,
          label: "Completed"
        };
      case 'Skipped':
        return {
          className: "bg-destructive/10 text-destructive border border-destructive/20",
          icon: XCircle,
          label: "Skipped"
        };
      default:
        return {
          className: "status-waiting",
          icon: Clock,
          label: status
        };
    }
  };

  const config = getStatusConfig(status, priority);
  const Icon = config.icon;

  return (
    <div className={cn("status-pill", config.className, className)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
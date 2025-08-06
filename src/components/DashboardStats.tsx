import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, TrendingUp, Activity } from "lucide-react";

interface DashboardStatsProps {
  totalEntries: number;
  waitingCount: number;
  inProgressCount: number;
  completedCount: number;
  averageWaitTime?: string;
}

export function DashboardStats({ 
  totalEntries, 
  waitingCount, 
  inProgressCount, 
  completedCount,
  averageWaitTime = "15 min"
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Tokens Today",
      value: totalEntries,
      icon: Users,
      color: "text-foreground"
    },
    {
      title: "Currently Waiting",
      value: waitingCount,
      icon: Clock,
      color: "text-status-waiting-foreground"
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: TrendingUp,
      color: "text-status-serving-foreground"
    },
    {
      title: "Completed",
      value: completedCount,
      icon: Activity,
      color: "text-status-completed-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="medical-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            {stat.title === "Currently Waiting" && (
              <p className="text-xs text-muted-foreground mt-1">
                Avg wait: {averageWaitTime}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
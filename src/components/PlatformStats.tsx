import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useStatsUpdater } from "@/utils/statsUpdater";
import { CheckCircle, Users, MessageCircle, Building, Target } from "lucide-react";

const PlatformStats = () => {
  const { stats, loading, formatStatValue } = usePlatformStats();
  useStatsUpdater(); // Enable real-time stats updates

  const getIcon = (metricName: string) => {
    switch (metricName) {
      case 'total_users': return Users;
      case 'total_posts': return MessageCircle;
      case 'total_communities': return Building;
      case 'success_rate': return Target;
      default: return CheckCircle;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 lg:pt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-center lg:justify-start gap-3">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 lg:pt-8">
      {stats.slice(0, 3).map((stat) => {
        const IconComponent = getIcon(stat.metric_name);
        return (
          <div key={stat.metric_name} className="flex items-center justify-center lg:justify-start gap-3">
            <IconComponent className="h-5 w-5 text-success" />
            <div className="text-center lg:text-left">
              <div className="text-sm font-bold">{formatStatValue(stat.metric_value, stat.metric_type)}</div>
              <div className="text-xs text-muted-foreground">{stat.display_label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformStats;
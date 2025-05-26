
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Crown } from "lucide-react";

interface PlanBannerProps {
  planType: "Basic" | "Pro Plus" | "Premium";
  className?: string;
}

export function PlanBanner({ planType, className }: PlanBannerProps) {
  const planConfigs = {
    "Basic": {
      gradient: "from-blue-100 to-blue-200",
      accentColor: "text-blue-700",
      borderColor: "border-blue-300",
      title: "Basic Plan - Essential features",
      icon: "📋",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    "Pro Plus": {
      gradient: "from-green-100 to-green-200",
      accentColor: "text-green-700",
      borderColor: "border-green-300",
      title: "Pro Plus Plan - Premium features",
      icon: "👑",
      badgeColor: "bg-green-100 text-green-800"
    },
    "Premium": {
      gradient: "from-purple-100 to-purple-200",
      accentColor: "text-purple-700",
      borderColor: "border-purple-300",
      title: "Premium Plan - Advanced features",
      icon: "⭐",
      badgeColor: "bg-purple-100 text-purple-800"
    }
  };

  const config = planConfigs[planType];

  return (
    <Card className={`
      mt-5 mx-4 p-4 rounded-xl border-2 ${config.borderColor}
      bg-gradient-to-r ${config.gradient}
      shadow-lg hover:shadow-xl transition-all duration-200
      transform hover:scale-[1.01]
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-semibold ${config.accentColor}`}>
              {config.title}
            </h3>
            <p className="text-sm text-gray-600">
              You're currently on the {planType} plan
            </p>
          </div>
        </div>
        <Badge className={config.badgeColor}>
          Active
        </Badge>
      </div>
    </Card>
  );
}

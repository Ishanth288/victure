import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Updated PlanBannerProps to reflect the actual plan names
interface PlanBannerProps {
  planType: "FREE" | "PRO" | "PRO PLUS"; // Updated types to match your plans
  className?: string;
}

export function PlanBanner({ planType, className }: PlanBannerProps) {
  const planConfigs = {
    // Renamed "Basic" to "FREE"
    "FREE": {
      gradient: "from-blue-100 to-blue-200",
      accentColor: "text-blue-700",
      borderColor: "border-blue-300",
      title: "Free Plan - Essential features", // Updated title
      icon: "📋",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    // Renamed "Pro Plus" to "PRO"
    "PRO": {
      gradient: "from-green-100 to-green-200",
      accentColor: "text-green-700",
      borderColor: "border-green-300",
      title: "PRO Plan - Premium features", // Updated title
      icon: "👑",
      badgeColor: "bg-green-100 text-green-800"
    },
    // Renamed "Premium" to "PRO PLUS"
    "PRO PLUS": {
      gradient: "from-purple-100 to-purple-200",
      accentColor: "text-purple-700",
      borderColor: "border-purple-300",
      title: "PRO PLUS Plan - Advanced features", // Updated title
      icon: "⭐",
      badgeColor: "bg-purple-100 text-purple-800"
    }
  };

  // Safely get the config. If planType is not found, default to "FREE".
  // This assumes "FREE" is your base/fallback plan.
  const config = planConfigs[planType];

  if (!config) {
    console.warn(`PlanBanner received an unexpected planType: "${planType}". Defaulting to "FREE" plan.`);
    // Fallback to the "FREE" plan config if the provided planType is not recognized
    const defaultConfig = planConfigs["FREE"];
    return (
      <Card className={`
        mt-5 mx-4 p-4 rounded-xl border-2 ${defaultConfig.borderColor}
        bg-gradient-to-r ${defaultConfig.gradient}
        shadow-lg hover:shadow-xl transition-all duration-200
        transform hover:scale-[1.01]
        ${className || ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{defaultConfig.icon}</span>
            <div>
              <h3 className={`font-semibold ${defaultConfig.accentColor}`}>
                {defaultConfig.title}
              </h3>
              <p className="text-sm text-gray-600">
                You're currently on an **unknown** plan (defaulted to Free)
              </p>
            </div>
          </div>
          <Badge className={defaultConfig.badgeColor}>
            Active
          </Badge>
        </div>
      </Card>
    );
  }

  // If a valid config was found, proceed with rendering
  return (
    <Card className={`
      mt-5 mx-4 p-4 rounded-xl border-2 ${config.borderColor}
      bg-gradient-to-r ${config.gradient}
      shadow-lg hover:shadow-xl transition-all duration-200
      transform hover:scale-[1.01]
      ${className || ''}
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
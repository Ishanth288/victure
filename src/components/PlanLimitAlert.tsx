
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PlanLimitAlertProps {
  currentValue: number;
  maxValue: number;
  resourceName: string;
  showUpgradeButton?: boolean;
  variant?: "warning" | "danger" | "info";
}

export function PlanLimitAlert({
  currentValue,
  maxValue,
  resourceName,
  showUpgradeButton = true,
  variant = "info"
}: PlanLimitAlertProps) {
  const navigate = useNavigate();
  
  // Calculate percentage of limit used
  const percentageUsed = (currentValue / maxValue) * 100;
  const isNearLimit = percentageUsed >= 80;
  const isAtLimit = percentageUsed >= 95;
  
  // Determine which variant to show based on usage
  const displayVariant = isAtLimit ? "danger" : isNearLimit ? "warning" : variant;
  
  // Get appropriate colors based on variant
  const getBgColor = () => {
    switch (displayVariant) {
      case "danger": return "bg-red-50 border-red-200";
      case "warning": return "bg-amber-50 border-amber-200";
      case "info": 
      default: return "bg-blue-50 border-blue-200";
    }
  };
  
  const getIconColor = () => {
    switch (displayVariant) {
      case "danger": return "text-red-500";
      case "warning": return "text-amber-500";
      case "info": 
      default: return "text-blue-500";
    }
  };

  // Generate appropriate message based on usage
  const getMessage = () => {
    if (isAtLimit) {
      return `You've nearly reached your plan limit for ${resourceName} (${currentValue}/${maxValue}).`;
    } else if (isNearLimit) {
      return `You're approaching your plan limit for ${resourceName} (${currentValue}/${maxValue}).`;
    } else {
      return `You've used ${currentValue} of ${maxValue} available ${resourceName} in your current plan.`;
    }
  };

  const handleUpgradeClick = () => {
    navigate('/#pricing');
  };

  return (
    <Alert className={`${getBgColor()} mb-4`}>
      <div className="flex items-start">
        <AlertCircle className={`h-5 w-5 ${getIconColor()} mt-0.5 flex-shrink-0 mr-3`} />
        <div className="flex-1">
          <AlertTitle className="text-sm font-medium">
            {isAtLimit ? "Plan Limit Almost Reached" : isNearLimit ? "Approaching Plan Limit" : "Plan Usage"}
          </AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            {getMessage()}
            {showUpgradeButton && (currentValue / maxValue) > 0.7 && (
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white"
                  onClick={handleUpgradeClick}
                >
                  Upgrade Plan
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

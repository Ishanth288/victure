
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "Free Trial" | "PRO" | "PRO PLUS";

interface PlanLimits {
  monthlyBillsLimit: number;
  dailyBillsLimit?: number;
  inventoryLimit: number;
}

// Plan configuration
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  "Free Trial": {
    monthlyBillsLimit: 600,
    dailyBillsLimit: 30,
    inventoryLimit: 501
  },
  "PRO": {
    monthlyBillsLimit: 1501,
    inventoryLimit: 4001
  },
  "PRO PLUS": {
    monthlyBillsLimit: 10000,
    inventoryLimit: 10000
  }
};

// Get user plan from Supabase
export const getUserPlan = async (userId: string): Promise<PlanType> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error getting user plan:", error);
      return "Free Trial";
    }
    
    return (data?.plan_type as PlanType) || "Free Trial";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "Free Trial";
  }
};

// Upgrade user to a specific plan using Supabase
export const upgradeUserPlan = async (userId: string, newPlan: PlanType): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        plan_type: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error("Error upgrading user plan:", error);
      return false;
    }
    
    console.log(`User ${userId} upgraded to ${newPlan} plan`);
    return true;
  } catch (error) {
    console.error("Error upgrading user plan:", error);
    return false;
  }
};

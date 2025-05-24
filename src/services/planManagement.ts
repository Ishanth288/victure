
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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

// Get user plan
export const getUserPlan = async (userId: string) => {
  try {
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().plan_type || "Free Trial";
    }
    
    return "Free Trial";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "Free Trial";
  }
};

// Upgrade user to a specific plan
export const upgradeUserPlan = async (userId: string, newPlan: PlanType) => {
  const { toast } = useToast();
  
  try {
    const userRef = doc(db, "profiles", userId);
    
    // Update the user's plan
    await updateDoc(userRef, {
      plan_type: newPlan,
      // If upgrading from trial, update the trial expiration
      ...(newPlan !== "Free Trial" && {
        trial_expiration_date: null
      })
    });
    
    // Also update in the subscriptions collection for tracking
    const subscriptionRef = doc(db, "subscriptions", userId);
    await setDoc(subscriptionRef, {
      user_id: userId,
      plan_type: newPlan,
      updated_at: new Date().toISOString(),
      status: "active"
    }, { merge: true });
    
    console.log(`User ${userId} upgraded to ${newPlan} plan`);
    
    toast({
      title: "Plan Upgraded",
      description: `User has been upgraded to ${newPlan} plan`,
      variant: "success"
    });
    
    return true;
  } catch (error) {
    console.error("Error upgrading user plan:", error);
    toast({
      title: "Upgrade Failed",
      description: "Failed to upgrade the user plan. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};

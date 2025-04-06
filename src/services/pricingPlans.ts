
import { supabase } from "@/integrations/supabase/client";
import { PricingPlan } from "@/types/database";

export interface PricingPlanUI {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  planId?: string;
  href: string;
  isPopular: boolean;
}

export const fetchPricingPlans = async (): Promise<PricingPlanUI[]> => {
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error("Error fetching pricing plans:", error);
      return getDefaultPlans();
    }
    
    if (!data || data.length === 0) {
      return getDefaultPlans();
    }
    
    // Transform the database plans to the format expected by the UI
    return data.map((plan: PricingPlan): PricingPlanUI => {
      return {
        name: plan.name,
        price: plan.price_monthly.toString(),
        yearlyPrice: plan.price_yearly.toString(),
        period: "per month",
        features: Array.isArray(plan.features) ? plan.features : [],
        description: plan.description,
        buttonText: plan.name === "FREE" ? "Get Started" : "Upgrade Now",
        planId: plan.plan_id || undefined,
        href: plan.name === "FREE" ? "/auth?signup=true" : "#",
        isPopular: Boolean(plan.is_popular),
      };
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return getDefaultPlans();
  }
};

// Fallback default plans in case the database fetch fails
const getDefaultPlans = (): PricingPlanUI[] => [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "30-day trial access",
      "Limited to 501 products in inventory",
      "30 bills per day",
      "600 bills per month",
      "Basic pharmacy management",
      "Standard customer support",
    ],
    description: "Perfect for trying out the system",
    buttonText: "Get Started",
    href: "/auth?signup=true",
    isPopular: false,
  },
  {
    name: "PRO",
    price: "2,899",
    yearlyPrice: "24,299",
    period: "per month",
    planId: "pro_monthly",
    features: [
      "Annual access",
      "Up to 4001 products in inventory",
      "1501 bills per month",
      "1501 patients per month",
      "Data storage for 1 year",
      "Access to insights page",
      "Advanced reporting",
      "Priority customer support",
    ],
    description: "Best for growing pharmacies",
    buttonText: "Upgrade Now",
    href: "#",
    isPopular: true,
  },
  {
    name: "PRO PLUS",
    price: "4,899",
    yearlyPrice: "38,999",
    period: "per month",
    planId: "pro_plus_monthly",
    features: [
      "Everything in Pro plan",
      "Up to 10,000 products in inventory",
      "10,000 bills per month",
      "10,000 patients per month",
      "Custom website for multibranch",
      "Premium AI insights every month",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced data analytics",
    ],
    description: "For large pharmacy chains with multiple locations",
    buttonText: "Upgrade Now",
    href: "#",
    isPopular: false,
  },
];

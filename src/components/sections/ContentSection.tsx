
import { Suspense, lazy, memo } from "react";
import Features from "@/components/Features";
import Benefits from "@/components/Benefits";
import Demo from "@/components/Demo";
import CTA from "@/components/CTA";
import { Pricing } from "@/components/blocks/Pricing";

// Memoize pricing plans to prevent unnecessary re-renders
const pricingPlans = [
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
    planId: "pro_monthly", // Replace with your actual Razorpay plan ID
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
    planId: "pro_plus_monthly", // Replace with your actual Razorpay plan ID
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

// Create lazy-loaded components with loading boundaries
const LazyFeatures = memo(Features);
const LazyBenefits = memo(Benefits);
const LazyDemo = memo(Demo);
const LazyPricing = memo(Pricing);
const LazyCTA = memo(CTA);

// Loading placeholder
const LoadingPlaceholder = () => (
  <div className="h-40 w-full flex items-center justify-center">
    <div className="animate-pulse w-10 h-10 rounded-full bg-gray-200"></div>
  </div>
);

export const ContentSection = memo(() => {
  return (
    <>
      <Suspense fallback={<LoadingPlaceholder />}>
        <LazyFeatures />
      </Suspense>
      
      <Suspense fallback={<LoadingPlaceholder />}>
        <LazyBenefits />
      </Suspense>
      
      <Suspense fallback={<LoadingPlaceholder />}>
        <LazyDemo />
      </Suspense>
      
      <div id="pricing" className="content-visibility-auto">
        <Suspense fallback={<LoadingPlaceholder />}>
          <LazyPricing 
            plans={pricingPlans}
            title="Choose Your Perfect Plan"
            description="Select the plan that best fits your pharmacy needs. All plans include our powerful pharmacy management features with specific usage limits for each tier."
          />
        </Suspense>
      </div>
      
      <Suspense fallback={<LoadingPlaceholder />}>
        <LazyCTA />
      </Suspense>
    </>
  );
});

ContentSection.displayName = 'ContentSection';

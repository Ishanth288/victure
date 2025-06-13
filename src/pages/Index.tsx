
import React, { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Hero } from "@/components/blocks/Hero";
import { Features } from "@/components/blocks/Features";
import { Benefits } from "@/components/blocks/Benefits";
import { ScrollAnimation } from "@/components/blocks/ScrollAnimation";
import { Footer } from "@/components/blocks/Footer";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { fetchPricingPlans } from "@/services/pricingPlans";

// Lazy load the Pricing component to improve initial load time
const Pricing = lazy(() => import("@/components/blocks/Pricing").then(module => ({ default: module.Pricing })));

// Define fallback pricing data with consistent type
interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  planId?: string;
}

const fallbackPlans: PricingPlan[] = [
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

export default function Index() {
  const navigate = useNavigate();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(fallbackPlans);
  const [isPricingLoading, setIsPricingLoading] = useState(true);

  useEffect(() => {
    // Load pricing plans with fallback
    const loadPricingPlans = async () => {
      try {
        console.log('🔄 Loading pricing plans...');
        const plans = await fetchPricingPlans();
        if (plans && plans.length > 0) {
          // Transform the plans to match our PricingPlan interface
          const transformedPlans: PricingPlan[] = plans.map(plan => ({
            name: plan.name,
            price: plan.price,
            yearlyPrice: plan.yearlyPrice,
            period: plan.period,
            features: plan.features,
            description: plan.description,
            buttonText: plan.buttonText,
            href: plan.href,
            isPopular: plan.isPopular,
            planId: plan.planId
          }));
          setPricingPlans(transformedPlans);
          console.log('✅ Pricing plans loaded successfully');
        } else {
          console.log('ℹ️ Using fallback pricing plans');
        }
      } catch (error) {
        console.warn('⚠️ Error loading pricing plans, using fallback:', error);
      } finally {
        setIsPricingLoading(false);
      }
    };

    loadPricingPlans();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-16">
        <Hero />
      </section>

      {/* Features Section */}
      <section id="features">
        <Features />
      </section>

      {/* Benefits Section */}
      <section id="benefits">
        <Benefits />
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <Suspense fallback={
          <div className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <LoadingAnimation text="Loading pricing plans..." />
              </div>
            </div>
          </div>
        }>
          {!isPricingLoading && (
            <Pricing 
              plans={pricingPlans}
              title="Simple, Transparent Pricing"
              description="Choose the plan that works for you. All plans include access to our platform, lead generation tools, and dedicated support."
            />
          )}
          {isPricingLoading && (
            <div className="py-20">
              <div className="container mx-auto px-4">
                <div className="text-center">
                  <LoadingAnimation text="Loading pricing plans..." />
                </div>
              </div>
            </div>
          )}
        </Suspense>
      </section>

      {/* About Section */}
      <section id="scroll-animation">
        <ScrollAnimation />
      </section>

      {/* Footer */}
      <section id="footer">
        <Footer />
      </section>
    </div>
  );
}

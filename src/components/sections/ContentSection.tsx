
import { Suspense, lazy, memo, useState, useEffect } from "react";
import Features from "@/components/Features";
import Benefits from "@/components/Benefits";
import Demo from "@/components/Demo";
import CTA from "@/components/CTA";
import { Pricing } from "@/components/blocks/Pricing";
import { fetchPricingPlans, PricingPlanUI } from "@/services/pricingPlans";

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
  const [pricingPlans, setPricingPlans] = useState<PricingPlanUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await fetchPricingPlans();
        setPricingPlans(plans);
      } catch (error) {
        console.error("Error loading pricing plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

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
          {isLoading ? (
            <div className="py-20">
              <div className="container">
                <div className="text-center space-y-4 mb-12">
                  <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Choose Your Perfect Plan
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border-[1px] p-6 bg-background">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                          ))}
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <LazyPricing 
              plans={pricingPlans}
              title="Choose Your Perfect Plan"
              description="Select the plan that best fits your pharmacy needs. All plans include our powerful pharmacy management features with specific usage limits for each tier."
            />
          )}
        </Suspense>
      </div>
      
      <Suspense fallback={<LoadingPlaceholder />}>
        <LazyCTA />
      </Suspense>
    </>
  );
});

ContentSection.displayName = 'ContentSection';

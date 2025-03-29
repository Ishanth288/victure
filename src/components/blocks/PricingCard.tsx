
import { memo } from "react";
import { Check, Star } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PricingPlan {
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

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  isMonthly: boolean;
  isDesktop: boolean;
  isLoading: string | null;
  handlePlanSelection: (plan: PricingPlan) => void;
}

const PricingCard = memo(({ 
  plan, 
  index, 
  isMonthly, 
  isDesktop, 
  isLoading, 
  handlePlanSelection 
}: PricingCardProps) => {
  return (
    <m.div
      key={plan.name}
      initial={{ opacity: 0, y: 50 }}
      whileInView={
        isDesktop
          ? {
              y: plan.isPopular ? -20 : 0,
              opacity: 1,
              x: index === 2 ? -30 : index === 0 ? 30 : 0,
              scale: index === 0 || index === 2 ? 0.94 : 1.0,
            }
          : { opacity: 1, y: 0 }
      }
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        type: "spring",
        stiffness: 80,
        damping: 25,
        delay: 0.2 + (index * 0.1),
        opacity: { duration: 0.4 },
      }}
      className={cn(
        `rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`,
        plan.isPopular ? "border-primary border-2" : "border-border",
        "flex flex-col",
        !plan.isPopular && "mt-5",
        index === 0 || index === 2
          ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]"
          : "z-10",
        index === 0 && "origin-right",
        index === 2 && "origin-left"
      )}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {plan.isPopular && (
        <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
          <Star className="text-primary-foreground h-4 w-4 fill-current" />
          <span className="text-primary-foreground ml-1 font-sans font-semibold">
            Popular
          </span>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <p className="text-base font-semibold text-neutral-600">
          {plan.name}
        </p>
        <div className="mt-6 flex items-center justify-center gap-x-2">
          <span className="text-5xl font-bold tracking-tight text-foreground">
            ₹{isMonthly ? plan.price : plan.yearlyPrice}
          </span>
          {plan.period !== "Next 3 months" && (
            <span className="text-sm font-semibold leading-6 tracking-wide text-neutral-600">
              / {plan.period}
            </span>
          )}
        </div>

        <p className="text-xs leading-5 text-neutral-600">
          {isMonthly ? "billed monthly" : "billed annually"}
        </p>

        <ul className="mt-5 gap-2 flex flex-col">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <span className="text-left">{feature}</span>
            </li>
          ))}
        </ul>

        <hr className="w-full my-4" />

        <button
          onClick={() => handlePlanSelection(plan)}
          disabled={isLoading === plan.name}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "group relative w-full gap-2 text-lg font-semibold tracking-tighter",
            "transform-gpu transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
            plan.isPopular
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground"
          )}
        >
          {isLoading === plan.name ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            plan.buttonText
          )}
        </button>

        <p className="mt-6 text-xs leading-5 text-neutral-600">
          {plan.description}
        </p>
      </div>
    </m.div>
  );
});

PricingCard.displayName = 'PricingCard';

export default PricingCard;

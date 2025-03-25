import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you. All plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [razorpayScript, setRazorpayScript] = useState(false);

  useEffect(() => {
    if (!razorpayScript) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayScript(true);
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [razorpayScript]);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#0D9488", "#F97316", "#475569", "#CBD5E1"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  const handlePlanSelection = async (plan: PricingPlan) => {
    setIsLoading(plan.name);
    
    try {
      if (plan.name === "FREE") {
        navigate('/auth', { 
          state: { 
            isLogin: false, 
            fromPricing: true,
            planType: 'Free Trial'
          } 
        });
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in or create an account first",
          variant: "default",
        });
        
        navigate('/auth', { 
          state: { 
            isLogin: true,
            redirectAfterAuth: '/pricing'
          } 
        });
        return;
      }
      
      if (!plan.planId) {
        toast({
          title: "Configuration error",
          description: "Plan information is missing. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(null);
        return;
      }
      
      const amount = isMonthly 
        ? parseInt(plan.price.replace(/,/g, ''))
        : parseInt(plan.yearlyPrice.replace(/,/g, ''));
      
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          planId: plan.planId,
          planName: plan.name,
          amount: amount,
          currency: 'INR',
          userId: session.user.id,
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.orderId || !data.keyId) {
        throw new Error('Invalid response from payment server');
      }
      
      const options = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: data.currency,
        name: "Victure Pharmacy",
        description: `${plan.name} Plan - ${isMonthly ? 'Monthly' : 'Annual'} Subscription`,
        order_id: data.orderId,
        prefill: {
          name: data.userName,
          email: data.userEmail,
        },
        theme: {
          color: "#0D9488",
        },
        handler: function(response: any) {
          toast({
            title: "Payment successful",
            description: `Your payment for the ${plan.name} plan was successful!`,
            variant: "default",
          });
          
          navigate('/dashboard');
        },
      };
      
      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
      
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment processing error",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="container py-20" id="pricing">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="text-neutral-600 text-lg whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold">
          Annual billing <span className="text-primary">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {plans.map((plan, index) => (
          <m.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
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
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
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
        ))}
      </div>
    </div>
  );
}


import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PricingCard from "./PricingCard";

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

export const Pricing = memo(({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you. All plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) => {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [razorpayScript, setRazorpayScript] = useState(false);
  const planContainerRef = useRef<HTMLDivElement>(null);
  const [hasIntersected, setHasIntersected] = useState(false);

  // Load Razorpay script only when pricing section is visible
  useEffect(() => {
    if (hasIntersected && !razorpayScript) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayScript(true);
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [razorpayScript, hasIntersected]);

  // Use Intersection Observer for performance optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Mark as intersected to load Razorpay script
            setHasIntersected(true);
            // Add GPU acceleration for smoother animations
            entry.target.classList.add('gpu-accelerated');
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (planContainerRef.current) {
      observer.observe(planContainerRef.current);
    }

    return () => {
      if (planContainerRef.current) {
        observer.unobserve(planContainerRef.current);
      }
    };
  }, []);

  const handleToggle = useCallback((checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 15,
        spread: 30,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#0D9488", "#F97316", "#475569"],
        ticks: 80,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 15,
        shapes: ["circle"],
      });
    }
  }, []);

  const handlePlanSelection = useCallback(async (plan: PricingPlan) => {
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
      
      const options: any = {
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
  }, [isMonthly, navigate, toast]);

  // Memoize the plans to prevent recreation during renders
  const memoizedPlans = useMemo(() => plans, [plans]);

  return (
    <div 
      className="py-20 content-visibility-auto" 
      id="pricing"
      style={{
        contain: 'content',
        containIntrinsicSize: '1000px',
      }}
    >
      <div className="container">
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

        <div 
          ref={planContainerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{
            willChange: 'transform',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            perspective: '1000px',
            transform: 'translateZ(0)',
          }}
        >
          {memoizedPlans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              index={index}
              isMonthly={isMonthly}
              isDesktop={isDesktop}
              isLoading={isLoading}
              handlePlanSelection={handlePlanSelection}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

Pricing.displayName = 'Pricing';


import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

// Add types for plan information
interface PlanInfo {
  planType: string | null;
  registrationDate: string | null;
  trialExpirationDate: string | null;
  monthlyBillsCount: number | null;
  dailyBillsCount: number | null;
  daysRemaining: number;
}

export function PlanBanner() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPlanInfo() {
      try {
        setIsLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Fetch plan information from profiles
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('plan_type, registration_date, trial_expiration_date, monthly_bills_count, daily_bills_count')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Failed to fetch plan information');
        }
        
        if (data) {
          // Calculate days remaining
          const expirationDate = new Date(data.trial_expiration_date);
          const daysRemaining = differenceInDays(expirationDate, new Date());
          
          setPlanInfo({
            planType: data.plan_type,
            registrationDate: data.registration_date,
            trialExpirationDate: data.trial_expiration_date,
            monthlyBillsCount: data.monthly_bills_count,
            dailyBillsCount: data.daily_bills_count,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
          });
        }
      } catch (err: any) {
        console.error('Error fetching plan info:', err);
        setError(err.message);
        toast({
          title: "Error fetching plan information",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlanInfo();
  }, [toast]);
  
  if (isLoading) {
    return (
      <Card className="bg-neutral-50 border-neutral-200 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-pulse h-4 w-48 bg-neutral-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return null; // Don't show anything if there's an error
  }
  
  if (!planInfo) {
    return null;
  }
  
  // Don't show banner for non-free plans
  if (planInfo.planType !== 'Free Trial') {
    return null;
  }
  
  // Determine banner color based on days remaining
  const isExpiringSoon = planInfo.daysRemaining <= 5;
  const isExpired = planInfo.daysRemaining <= 0;
  
  // Banner colors
  const bannerClasses = isExpired 
    ? "bg-red-50 border-red-200" 
    : isExpiringSoon 
      ? "bg-amber-50 border-amber-200" 
      : "bg-blue-50 border-blue-200";
  
  // Icon component  
  const IconComponent = isExpired 
    ? AlertCircle 
    : isExpiringSoon 
      ? Clock 
      : Info;
  
  // Icon color
  const iconColor = isExpired 
    ? "text-red-500" 
    : isExpiringSoon 
      ? "text-amber-500" 
      : "text-blue-500";
      
  return (
    <Card className={`${bannerClasses} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">
                  {isExpired 
                    ? "Your Free Trial has expired" 
                    : isExpiringSoon 
                      ? `Your Free Trial is expiring soon (${planInfo.daysRemaining} days left)`
                      : `Free Trial - ${planInfo.daysRemaining} days remaining`
                  }
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  {planInfo.registrationDate && (
                    <>Started on {format(new Date(planInfo.registrationDate), 'PPP')}</>
                  )}
                  {planInfo.trialExpirationDate && (
                    <> · Expires on {format(new Date(planInfo.trialExpirationDate), 'PPP')}</>
                  )}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <Link to="/#pricing">
                  <Button size="sm" variant={isExpiringSoon || isExpired ? "default" : "outline"}>
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>
                  <strong>{planInfo.monthlyBillsCount || 0}</strong>/600 monthly bills
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  <strong>{planInfo.dailyBillsCount || 0}</strong>/30 daily bills
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>
                  <strong>0</strong>/501 inventory items
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

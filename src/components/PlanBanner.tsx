import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Info, Crown, Zap, FileText, Package, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { safeSelectByField, handleQueryData, safeCast } from '@/utils/supabaseHelpers';

// Add types for plan information
interface PlanInfo {
  planType: string | null;
  registrationDate: string | null;
  trialExpirationDate: string | null;
  monthlyBillsCount: number | null;
  dailyBillsCount: number | null;
  inventoryCount: number | null;
  daysRemaining: number;
}

// Type for profile data from Supabase
interface ProfileData {
  plan_type?: string;
  registration_date?: string;
  trial_expiration_date?: string;
  monthly_bills_count?: number;
  daily_bills_count?: number;
  [key: string]: any;
}

export function PlanBanner() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPlanInfo = async () => {
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
      const { data, error: profileError } = await safeSelectByField(
        'profiles',
        'id',
        user.id,
        { select: 'plan_type, registration_date, trial_expiration_date, monthly_bills_count, daily_bills_count', single: true }
      );
      
      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to fetch plan information');
      }
      
      // Count inventory items
      const { count: inventoryCount, error: inventoryError } = await (supabase as any)
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (inventoryError) {
        console.error('Inventory error:', inventoryError);
      }
      
      // Count monthly bills
      const { count: actualMonthlyBillsCount, error: monthlyBillsError } = await (supabase as any)
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (monthlyBillsError) {
        console.error('Monthly bills error:', monthlyBillsError);
      }
      
      // Count daily bills - bills created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: actualDailyBillsCount, error: dailyBillsError } = await (supabase as any)
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
      
      if (dailyBillsError) {
        console.error('Daily bills error:', dailyBillsError);
      }
      
      // Type-safe conversion of the data
      const profileData = safeCast<ProfileData>(data, {
        plan_type: 'Free Trial',
        registration_date: null,
        trial_expiration_date: null,
        monthly_bills_count: 0,
        daily_bills_count: 0
      });
      
      // Calculate days remaining (only for Free Trial)
      let daysRemaining = 0;
      if (profileData.plan_type === 'Free Trial' && profileData.trial_expiration_date) {
        const expirationDate = new Date(profileData.trial_expiration_date);
        daysRemaining = differenceInDays(expirationDate, new Date());
        daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
      }
      
      setPlanInfo({
        planType: profileData.plan_type || 'Free Trial',
        registrationDate: profileData.registration_date || null,
        trialExpirationDate: profileData.trial_expiration_date || null,
        monthlyBillsCount: actualMonthlyBillsCount || 0,
        dailyBillsCount: actualDailyBillsCount || 0,
        inventoryCount: inventoryCount || 0,
        daysRemaining: daysRemaining
      });
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
  };

  useEffect(() => {
    fetchPlanInfo();
    
    // Set up real-time subscription for bills and inventory changes
    const channel = supabase
      .channel('plan-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bills' }, 
        () => fetchPlanInfo()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' }, 
        () => fetchPlanInfo()
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
        () => fetchPlanInfo()
      )
      .subscribe();
    
    // Refresh data every 5 minutes as a fallback
    const interval = setInterval(fetchPlanInfo, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
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
  
  // Get plan-specific limits
  const getPlanLimits = () => {
    switch (planInfo.planType) {
      case 'PRO':
        return {
          monthlyBillsLimit: 1501,
          inventoryLimit: 4001,
          icon: <Zap className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />,
          bgColor: "bg-blue-50 border-blue-200",
          description: "Pro Plan - Enhanced capabilities for your pharmacy"
        };
      case 'PRO PLUS':
        return {
          monthlyBillsLimit: 10000,
          inventoryLimit: 10000,
          icon: <Crown className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />,
          bgColor: "bg-green-50 border-green-200",
          description: "Pro Plus Plan - Premium features for your business"
        };
      default: // Free Trial
        return {
          monthlyBillsLimit: 600,
          dailyBillsLimit: 30,
          inventoryLimit: 501,
          icon: <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />,
          bgColor: "bg-blue-50 border-blue-200",
          description: "Free Trial"
        };
    }
  };
  
  const planLimits = getPlanLimits();
  
  const handleUpgradeClick = () => {
    navigate('/#pricing');
  };
  
  // For paid plans, show a different banner
  if (planInfo?.planType !== 'Free Trial') {
    return (
      <Card className={`${planLimits?.bgColor || 'bg-blue-50 border-blue-200'} mb-6 shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {planLimits?.icon}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">
                    {planLimits?.description || 'Pro Plan'}
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    {planInfo?.registrationDate && (
                      <>Started on {format(new Date(planInfo.registrationDate), 'PPP')}</>
                    )}
                  </p>
                </div>
                {planInfo?.planType === 'PRO' && (
                  <div className="mt-3 sm:mt-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={handleUpgradeClick}
                    >
                      Upgrade to Pro Plus
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1 text-green-600" />
                    <span>
                      <strong>{planInfo?.monthlyBillsCount}</strong>/{planLimits?.monthlyBillsLimit} monthly bills
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    <span>
                      <strong>{planInfo?.dailyBillsCount}</strong> bills today
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <div className="flex items-center">
                    <Package className="h-3.5 w-3.5 mr-1 text-purple-600" />
                    <span>
                      <strong>{planInfo?.inventoryCount}</strong>/{planLimits?.inventoryLimit} inventory items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Below code is for Free Trial plan
  // Determine banner color based on days remaining
  const isExpiringSoon = planInfo?.daysRemaining <= 5;
  const isExpired = planInfo?.daysRemaining <= 0;
  
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
    <Card className={`${bannerClasses} mb-6 shadow-sm`}>
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
                      ? `Your Free Trial is expiring soon (${planInfo?.daysRemaining} days left)`
                      : `Free Trial - ${planInfo?.daysRemaining} days remaining`
                  }
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  {planInfo?.registrationDate && (
                    <>Started on {format(new Date(planInfo.registrationDate), 'PPP')}</>
                  )}
                  {planInfo?.trialExpirationDate && (
                    <> · Expires on {format(new Date(planInfo.trialExpirationDate), 'PPP')}</>
                  )}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <Button 
                  size="sm" 
                  variant={isExpiringSoon || isExpired ? "default" : "outline"}
                  onClick={handleUpgradeClick}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1 text-green-600" />
                  <span>
                    <strong>{planInfo?.monthlyBillsCount}</strong>/{planLimits?.monthlyBillsLimit} monthly bills
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  <span>
                    <strong>{planInfo?.dailyBillsCount}</strong>/{planLimits?.dailyBillsLimit} daily bills
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <div className="flex items-center">
                  <Package className="h-3.5 w-3.5 mr-1 text-purple-600" />
                  <span>
                    <strong>{planInfo?.inventoryCount}</strong>/{planLimits?.inventoryLimit} inventory items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

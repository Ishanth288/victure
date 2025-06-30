
import React, { useState, useEffect } from 'react';
import { MainContent } from '@/components/dashboard/layout/MainContent';
import { SidebarContainer } from '@/components/dashboard/layout/SidebarContainer';
import { PlanBanner } from '@/components/dashboard/PlanBanner';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { SEO } from '@/components/SEO/index.tsx';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "PRO PLUS" | null>(null);
  const [planDataConfirmed, setPlanDataConfirmed] = useState(false);

  useEffect(() => {
    async function getUserAndPlan() {
      console.log('DashboardLayout: getUserAndPlan started');
      setLoading(true);
      setPlanDataConfirmed(false);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('DashboardLayout: supabase.auth.getUser() response', user);

        if (user) {
          setUser(user);
          console.log('DashboardLayout: User found', user);

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', user.id)
            .single();
          console.log('DashboardLayout: Profile fetch result', { profile, profileError });

          if (profileError) {
            console.error('DashboardLayout: Error fetching user profile plan:', profileError);
            // Only set fallback after confirmed database response
            await new Promise(resolve => setTimeout(resolve, 200));
            setUserPlan("FREE");
            setPlanDataConfirmed(true);
          } else if (profile && profile.plan_type) {
            const fetchedPlan = profile.plan_type;
            console.log('DashboardLayout: Fetched plan from profile', fetchedPlan);
            
            // Map old plan names to new plan names if needed
            const planMapping: Record<string, "FREE" | "PRO" | "PRO PLUS"> = {
              "Basic": "FREE",
              "Free Trial": "FREE",
              "Pro Plus": "PRO", 
              "Premium": "PRO PLUS"
            };
            
            // Check if it's already a valid plan type
            const validPlans: ("FREE" | "PRO" | "PRO PLUS")[] = ["FREE", "PRO", "PRO PLUS"];
            
            if (validPlans.includes(fetchedPlan as "FREE" | "PRO" | "PRO PLUS")) {
              setUserPlan(fetchedPlan as "FREE" | "PRO" | "PRO PLUS");
            } else if (planMapping[fetchedPlan]) {
              setUserPlan(planMapping[fetchedPlan]);
            } else {
              console.warn(`DashboardLayout: Unexpected plan type from profiles: "${fetchedPlan}". Defaulting to FREE.`);
              setUserPlan("FREE");
            }
            setPlanDataConfirmed(true);
          } else {
            console.warn("DashboardLayout: No plan_type found in profile. Defaulting to FREE.");
            await new Promise(resolve => setTimeout(resolve, 200));
            setUserPlan("FREE");
            setPlanDataConfirmed(true);
          }
        } else {
          console.log('DashboardLayout: No user found from supabase.auth.getUser()');
          setUser(null);
          setUserPlan("FREE");
          setPlanDataConfirmed(true);
        }
      } catch (error) {
        console.error("DashboardLayout: Error in getUserAndPlan:", error);
        setUserPlan("FREE");
        setPlanDataConfirmed(true);
      } finally {
        console.log('DashboardLayout: getUserAndPlan finished. Loading:', false);
        setLoading(false);
      }
    }

    getUserAndPlan();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('DashboardLayout: onAuthStateChange event', { event, session });
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          getUserAndPlan();
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading || !planDataConfirmed) {
        console.warn('⚠️ DashboardLayout loading timeout - setting default plan');
        setLoading(false);
        setUserPlan("FREE");
        setPlanDataConfirmed(true);
      }
    }, 3000); // Reduced to 3s

    return () => clearTimeout(timeoutId);
  }, []); // Fixed: Remove dependencies that cause infinite loop

  return (
    <>
      <SEO
        title="Dashboard"
        description="Victure Dashboard"
        canonicalUrl="https://victure.app/dashboard"
        noIndex
      />
      <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarContainer />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <MainContent>
          <div className="container mx-auto px-4 py-0">
            {/* NEVER show banner until we have 100% confirmed plan data */}
            {planDataConfirmed && userPlan && !loading ? (
              <PlanBanner planType={userPlan} />
            ) : null}

            {children}
          </div>
        </MainContent>
      </div>
    </div>
    </>
  );
}

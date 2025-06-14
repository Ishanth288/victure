
'use client';

import React, { useState, useEffect } from 'react';
import { MainContent } from '@/components/dashboard/layout/MainContent';
import { SidebarContainer } from '@/components/dashboard/layout/SidebarContainer';
import { PlanBanner } from '@/components/dashboard/PlanBanner';
import { LoadingAnimation } from '@/components/LoadingAnimation';
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
      setLoading(true);
      setPlanDataConfirmed(false);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUser(user);

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile plan:', profileError);
            // Only set fallback after confirmed database response
            await new Promise(resolve => setTimeout(resolve, 200));
            setUserPlan("FREE");
            setPlanDataConfirmed(true);
          } else if (profile && profile.plan_type) {
            const fetchedPlan = profile.plan_type;
            
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
              console.warn(`Unexpected plan type from profiles: "${fetchedPlan}". Defaulting to FREE.`);
              setUserPlan("FREE");
            }
            setPlanDataConfirmed(true);
          } else {
            console.warn("No plan_type found in profile. Defaulting to FREE.");
            await new Promise(resolve => setTimeout(resolve, 200));
            setUserPlan("FREE");
            setPlanDataConfirmed(true);
          }
        } else {
          setUser(null);
          setUserPlan("FREE");
          setPlanDataConfirmed(true);
        }
      } catch (error) {
        console.error("Error in getUserAndPlan:", error);
        setUserPlan("FREE");
        setPlanDataConfirmed(true);
      } finally {
        setLoading(false);
      }
    }

    getUserAndPlan();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
  }, [loading, planDataConfirmed]);

  return (
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
  );
}

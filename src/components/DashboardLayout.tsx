'use client';

import React, { useState, useEffect } from 'react';
import { MainContent } from '@/components/dashboard/layout/MainContent';
import { SidebarContainer } from '@/components/dashboard/layout/SidebarContainer';
import { PlanBanner } from '@/components/dashboard/PlanBanner';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "PRO PLUS" | null>(null);

  useEffect(() => {
    async function getUserAndPlan() {
      setLoading(true);
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
          setUserPlan("FREE");
        } else if (profile && profile.plan_type) {
          const fetchedPlan = profile.plan_type;
          const allowedPlans = ["FREE", "PRO", "PRO PLUS"] as const;

          if (allowedPlans.includes(fetchedPlan)) {
            setUserPlan(fetchedPlan as typeof allowedPlans[number]);
          } else {
            console.warn(`Unexpected plan type from profiles: "${fetchedPlan}". Defaulting to FREE.`);
            setUserPlan("FREE");
          }
        } else {
          console.warn("No plan_type found in profile. Defaulting to FREE.");
          setUserPlan("FREE");
        }
      } else {
        setUser(null);
        setUserPlan("FREE");
      }

      setLoading(false);
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarContainer />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <MainContent>
          <div className="container mx-auto px-4 py-4">
            {loading ? (
              <div className="mt-5 mx-4 p-4 text-center text-gray-500">Loading plan...</div>
            ) : (
              <PlanBanner
                planType={["FREE", "PRO", "PRO PLUS"].includes(userPlan ?? "") ? userPlan! : "FREE"}
              />
            )}

            {children}
          </div>
        </MainContent>
      </div>
    </div>
  );
}

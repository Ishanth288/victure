
// src/components/dashboard/layout/DashboardLayout.tsx

'use client'; // This might already be there, but ensuring it is for client components

import React, { useState, useEffect } from 'react';
import { MainContent } from '@components/dashboard/layout/MainContent';
import { SidebarContainer } from '@components/dashboard/layout/SidebarContainer';
import { AnnouncementBanner } from '@components/AnnouncementBanner'; // Keep this if you still use it, otherwise replace
// Assuming PlanBanner is in src/components/PlanBanner.tsx based on previous context
import { PlanBanner } from '@/components/PlanBanner'; // Import PlanBanner here
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // State to hold the plan fetched from the profiles table
  const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "PRO PLUS" | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUserAndPlan() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // --- Fetch plan from the profiles table ---
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // Assuming your table is named 'profiles'
          .select('plan_type') // Assuming your column is named 'plan_type'
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile plan:', profileError);
          setUserPlan("FREE"); // Fallback to FREE on error
        } else if (profile && profile.plan_type) {
          const fetchedPlan = profile.plan_type as "FREE" | "PRO" | "PRO PLUS";
          if (["FREE", "PRO", "PRO PLUS"].includes(fetchedPlan)) {
            setUserPlan(fetchedPlan);
          } else {
            console.warn(`Workspaceed an unrecognized plan type from profiles: "${fetchedPlan}". Defaulting to FREE.`);
            setUserPlan("FREE");
          }
        } else {
          console.warn("No plan_type found in profile. Defaulting to FREE.");
          setUserPlan("FREE"); // Default if plan_type is null or not found
        }
      } else {
        setUser(null);
        setUserPlan("FREE"); // Default to FREE if no user is logged in
      }
      setLoading(false);
    }

    getUserAndPlan();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          getUserAndPlan(); // Re-fetch user and plan on auth state change
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []); // Run once on component mount

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarContainer />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <MainContent>
          <div className="container mx-auto px-4 py-4">
            {/* If you have both, adjust placement as needed */}
            {/* <AnnouncementBanner /> */}

            {/* Render PlanBanner based on loading state and userPlan */}
            {loading ? (
              <div className="mt-5 mx-4 p-4 text-center text-gray-500">Loading plan...</div>
            ) : (
              // Ensure userPlan is not null before passing, though state management should prevent this
              <PlanBanner planType={userPlan || "FREE"} />
            )}

            {children}
          </div>
        </MainContent>
      </div>
    </div>
  );
}
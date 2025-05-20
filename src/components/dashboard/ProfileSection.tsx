
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeSelectByField, safeCast } from "@/utils/supabaseHelpers";
import { TextSkeleton, PharmacyNameSkeleton } from "@/components/ui/loading-skeleton";

interface ProfileData {
  pharmacy_name?: string;
  owner_name?: string;
  [key: string]: any;
}

export function useProfileData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Clear any existing profile data immediately to prevent overlap
    setProfileData(null);
    setIsLoading(true);
    
    // Clean up any old pharmacy name in localStorage to prevent leakage
    localStorage.removeItem('pharmacyName');
    
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data, error } = await safeSelectByField(
            'profiles',
            'id',
            session.user.id,
            { single: true }
          );

          if (error) {
            console.error("Error fetching profile:", error);
            setIsLoading(false);
            return;
          }

          if (data) {
            // Type-safe conversion of the data
            const typedData = safeCast<ProfileData>(data, {
              pharmacy_name: 'Pharmacy',
              owner_name: 'Owner'
            });
            
            setProfileData(typedData);
            
            // Safely access pharmacy_name with a default value
            const pharmacyName = typedData.pharmacy_name || 'Pharmacy';
            // Store pharmacy name in localStorage
            localStorage.setItem('pharmacyName', pharmacyName);
            
            // Dispatch event to update pharmacy name throughout the app
            window.dispatchEvent(new Event('pharmacyNameUpdated'));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    const handlePharmacyNameUpdate = () => {
      const updatedName = localStorage.getItem('pharmacyName');
      if (updatedName && profileData) {
        setProfileData({ ...profileData, pharmacy_name: updatedName });
      }
    };

    window.addEventListener('pharmacyNameUpdated', handlePharmacyNameUpdate);

    return () => {
      window.removeEventListener('pharmacyNameUpdated', handlePharmacyNameUpdate);
    };
  }, []);

  return { profileData, isLoading };
}

export function ProfileSection() {
  const { profileData, isLoading } = useProfileData();
  
  return (
    <div className="flex items-center">
      {isLoading ? (
        <TextSkeleton className="w-24" />
      ) : (
        <span className="text-sm font-medium mr-4">
          {profileData?.owner_name || 'Welcome'}
        </span>
      )}
    </div>
  );
}

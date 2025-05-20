
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeSelectByField, safeCast } from "@/utils/supabaseHelpers";
import { TextSkeleton } from "@/components/ui/loading-skeleton";

interface ProfileData {
  pharmacy_name?: string;
  owner_name?: string;
  [key: string]: any;
}

export function useProfileData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
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

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await safeSelectByField(
          'profiles',
          'id',
          session.user.id,
          { single: true }
        );

        if (!error && data) {
          // Type-safe conversion of the data
          const typedData = safeCast<ProfileData>(data, {
            pharmacy_name: 'Pharmacy',
            owner_name: 'Owner'
          });
          
          setProfileData(typedData);
          
          // Safely access pharmacy_name with a default value
          const pharmacyName = typedData.pharmacy_name || 'Pharmacy';
          // Clear any old pharmacy name before setting the new one
          localStorage.removeItem('pharmacyName');
          localStorage.setItem('pharmacyName', pharmacyName);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

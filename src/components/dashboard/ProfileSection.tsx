
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeSelectByField, safeCast } from "@/utils/supabaseHelpers";

interface ProfileData {
  pharmacy_name?: string;
  owner_name?: string;
  [key: string]: any;
}

export function useProfileData() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
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
          owner_name: 'Owner'
        });
        
        setProfileData(typedData);
      }
    }
  };

  return { profileData };
}

export function ProfileSection() {
  const { profileData } = useProfileData();
  
  return (
    <div className="flex items-center">
      <span className="text-sm font-medium mr-4">
        {profileData?.owner_name || 'Loading...'}
      </span>
    </div>
  );
}

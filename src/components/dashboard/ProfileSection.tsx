
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

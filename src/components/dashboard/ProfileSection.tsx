
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeSelectByField, safeCast } from "@/utils/supabaseHelpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account",
          variant: "default",
        });
        navigate('/auth');
      }
    } catch (error: any) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleSettings = () => {
    navigate('/settings');
  };
  
  const initials = profileData?.owner_name
    ? profileData.owner_name.split(' ').map(n => n[0]).join('')
    : 'U';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <div className="text-sm font-medium text-gray-700 hidden md:block">
            {profileData?.owner_name || 'Loading...'}
          </div>
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

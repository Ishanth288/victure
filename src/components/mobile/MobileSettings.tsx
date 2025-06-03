
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  User,
  Building,
  MapPin,
  Phone,
  CreditCard,
  Save,
  LogOut
} from "lucide-react";
import { hapticFeedback } from "@/utils/mobileUtils";

interface Profile {
  pharmacy_name: string;
  owner_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  gstin: string;
  plan_type: string;
}

export function MobileSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    pharmacy_name: '',
    owner_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    gstin: '',
    plan_type: 'Free Trial'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;

      await hapticFeedback('medium');
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await hapticFeedback('medium');
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate(-1);
  };

  const updateProfile = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-blue-100">Manage your profile</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Pharmacy Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Pharmacy Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
              <Input
                id="pharmacy_name"
                value={profile.pharmacy_name}
                onChange={(e) => updateProfile('pharmacy_name', e.target.value)}
                placeholder="Enter pharmacy name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name</Label>
              <Input
                id="owner_name"
                value={profile.owner_name}
                onChange={(e) => updateProfile('owner_name', e.target.value)}
                placeholder="Enter owner name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={profile.gstin}
                onChange={(e) => updateProfile('gstin', e.target.value)}
                placeholder="Enter GSTIN number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => updateProfile('phone', e.target.value)}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => updateProfile('address', e.target.value)}
                placeholder="Enter address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => updateProfile('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => updateProfile('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={profile.pincode}
                onChange={(e) => updateProfile('pincode', e.target.value)}
                placeholder="Enter pincode"
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Plan Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900">Current Plan</p>
              <p className="text-2xl font-bold text-blue-600">{profile.plan_type}</p>
              <p className="text-sm text-blue-700 mt-1">
                {profile.plan_type === 'Free Trial' 
                  ? 'Upgrade to unlock more features'
                  : 'Thank you for your subscription'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full h-12"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

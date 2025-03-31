
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoFields } from "@/components/registration/BasicInfoFields";
import { AddressFields } from "@/components/registration/AddressFields";
import { AccountFields } from "@/components/registration/AccountFields";
import { Package, ShoppingCart, LineChart, Shield } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";

interface LocationState {
  fromPricing?: boolean;
  planType?: string;
  fromLegal?: boolean;
  isLogin?: boolean;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const [isLogin, setIsLogin] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    pharmacy_name: "",
    owner_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });

  const fromPricing = locationState?.fromPricing || false;
  const planType = locationState?.planType || 'Free Trial';
  const fromLegal = locationState?.fromLegal || false;

  const showFreePlanInfo = !isLogin;

  const handleLoginDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Reset error message when switching between login and register
    setError("");
  }, [isLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Set a flag to show post-login onboarding
        localStorage.setItem('show-post-login-onboarding', 'true');
        
        // Show welcome message with pharmacy name if available
        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('pharmacy_name')
            .eq('id', data.user.id)
            .single();
            
          const pharmacyName = profileData?.pharmacy_name || 'Victure';
          
          stableToast({
            title: `Welcome back to ${pharmacyName}!`,
            description: "You've successfully logged in.",
            variant: "success",
          });
        }
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      toast({
        title: "Login error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate password match
    if (registrationData.password !== registrationData.confirmPassword) {
      setError("Passwords do not match");
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            name: registrationData.name,
            pharmacy_name: registrationData.pharmacy_name,
            owner_name: registrationData.owner_name,
            address: registrationData.address,
            city: registrationData.city,
            state: registrationData.state,
            pincode: registrationData.pincode,
            gstin: registrationData.gstin,
            plan_type: planType,
          },
        },
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Set a flag to show the onboarding tour immediately after registration
        localStorage.setItem('show-post-login-onboarding', 'true');
        
        stableToast({
          title: "Registration successful!",
          description: "Welcome to Victure PharmEase! Your account has been created.",
          variant: "success",
        });
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      toast({
        title: "Registration error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (locationState?.isLogin !== undefined) {
      setIsLogin(locationState.isLogin);
    }
  }, [locationState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin(e);
    } else {
      await handleRegistration(e);
    }
  };

  return (
    <div className="grid h-screen place-items-center">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {isLogin ? "Login" : "Register"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access your account"
              : "Create an account to get started"}
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue={isLogin ? "login" : "register"} className="space-y-4">
          <TabsList>
            <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
              Login
            </TabsTrigger>
            <TabsTrigger value="register" onClick={() => setIsLogin(false)}>
              Register
            </TabsTrigger>
          </TabsList>
          <CardContent className="grid gap-4">
            {showFreePlanInfo && (
              <div className="rounded-md border p-4">
                <div className="flex items-center">
                  <Package className="h-4 w-4 shrink-0 text-secondary" />
                  <h4 className="ml-2 text-sm font-medium">Free Trial Plan</h4>
                </div>
                <p className="leading-relaxed text-sm text-muted-foreground">
                  Enjoy a 14-day free trial with full access to all features.
                </p>
                <ul className="my-2 ml-4 list-disc text-sm text-muted-foreground">
                  <li>Unlimited Invoices</li>
                  <li>Up to 5 Products</li>
                  <li>Basic Reporting</li>
                </ul>
                <p className="text-sm">
                  <Button variant="link" onClick={() => navigate('/pricing')}>
                    Compare plans <ShoppingCart className="h-3 w-3 ml-1" />
                  </Button>
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="mail@example.com"
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginDataChange}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your registered email address.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      placeholder="Password"
                      type="password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginDataChange}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your account password.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <BasicInfoFields
                    formData={registrationData}
                    onChange={handleRegistrationDataChange}
                  />
                  <AddressFields
                    formData={registrationData}
                    onChange={handleRegistrationDataChange}
                    onStateChange={(value) => setRegistrationData(prev => ({ ...prev, state: value }))}
                  />
                  <AccountFields
                    formData={registrationData}
                    onChange={handleRegistrationDataChange}
                    onRoleChange={(value) => setRegistrationData(prev => ({ ...prev, role: value }))}
                  />
                </>
              )}
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : (isLogin ? "Login" : "Register")}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

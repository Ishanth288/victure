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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoFields } from "@/components/registration/BasicInfoFields";
import { AddressFields } from "@/components/registration/AddressFields";
import { AccountFields } from "@/components/registration/AccountFields";
import { Package, ShoppingCart, Check, CheckCircle2, ListChecks, Shield, Activity } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";
import { RegistrationData } from "@/types/registration";
import Navigation from "@/components/Navigation";

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
  const [isLogin, setIsLogin] = useState(locationState?.isLogin !== false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirect') || '/dashboard';
        navigate(redirectTo);
      }
    };
    checkUser();
  }, [navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registrationData, setRegistrationData] = useState<RegistrationData>({
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
    phone: "",
    role: ""
  });

  const fromPricing = locationState?.fromPricing || false;
  const planType = locationState?.planType || 'Free Trial';

  const handleLoginDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setError("");
    if (locationState?.isLogin !== undefined) {
      setIsLogin(locationState.isLogin);
    }
  }, [isLogin, locationState]);

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
      } else if (data.user) {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/dashboard';
        navigate(redirectTo);
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
            phone: registrationData.phone,
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
        toast({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin(e);
    } else {
      await handleRegistration(e);
    }
  };

  const features = [
    { icon: <CheckCircle2 className="h-5 w-5 text-primary" />, text: "Complete pharmacy management solution" },
    { icon: <Activity className="h-5 w-5 text-primary" />, text: "Real-time inventory tracking" },
    { icon: <ListChecks className="h-5 w-5 text-primary" />, text: "Smart prescription management" },
    { icon: <Shield className="h-5 w-5 text-primary" />, text: "Secure patient data handling" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          <div className="w-full lg:w-1/2 max-w-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Victure PharmEase</h2>
            <p className="text-lg text-gray-700 mb-8">
              Streamline your pharmacy operations with our all-in-one management solution.
            </p>
            
            <div className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  {feature.icon}
                  <span className="ml-2 text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                Join thousands of pharmacies that trust Victure for their daily operations.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 max-w-md">
            <Card className="border-none shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">
                  {isLogin ? "Welcome Back" : "Create Your Account"}
                </CardTitle>
                <CardDescription className="text-center">
                  {isLogin
                    ? "Sign in to your pharmacy account"
                    : "Sign up to get started with Victure"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-4">
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
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginDataChange}
                        required
                      />
                    </div>
                    
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                    
                    <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {fromPricing && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <h4 className="flex items-center text-sm font-medium text-blue-800">
                          <Package className="h-4 w-4 mr-2" />
                          Free Trial Plan
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">You are signing up for the Free Plan. This includes:</p>
                        <ul className="mt-2 space-y-1">
                          <li className="text-sm text-blue-700 flex items-center">
                            <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>30-day trial access</span>
                          </li>
                          <li className="text-sm text-blue-700 flex items-center">
                            <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>Limited to 501 products in inventory</span>
                          </li>
                          <li className="text-sm text-blue-700 flex items-center">
                            <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>30 bills per day</span>
                          </li>
                          <li className="text-sm text-blue-700 flex items-center">
                            <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>600 bills per month</span>
                          </li>
                          <li className="text-sm text-blue-700 flex items-center">
                            <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>Basic pharmacy management features</span>
                          </li>
                        </ul>
                      </div>
                    )}
                    
                    <form onSubmit={handleRegistration} className="space-y-6">
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
                      
                      {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                      )}
                      
                      <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-col">
                <div className="text-center w-full">
                  {isLogin ? (
                    <p className="text-sm text-gray-500">
                      Don't have an account?{" "}
                      <button 
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-primary hover:underline focus:outline-none"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Already have an account?{" "}
                      <button 
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-primary hover:underline focus:outline-none"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

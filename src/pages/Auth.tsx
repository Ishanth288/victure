import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { INDIAN_STATES } from "@/constants/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, X, Info, Home } from "lucide-react";
import { BackgroundCells } from "@/components/ui/background-cells";
import { Link } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success' | 'info' | null; message: string | null }>({
    type: null,
    message: null
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    pharmacyName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
  });

  const fromPricing = location.state?.fromPricing || false;
  const planType = location.state?.planType || 'Free Trial';

  const showFreePlanInfo = !isLogin;

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    isValid: false
  });

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const isValid = minLength && hasNumber;
    
    setPasswordValidation({
      minLength,
      hasNumber,
      isValid
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    if (field === 'password') {
      validatePassword(value);
    }
  };

  useEffect(() => {
    const checkEmailVerificationToken = async () => {
      setIsVerifying(true);
      
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      const accessToken = searchParams.get('access_token') || 
                           (hash.includes('access_token=') ? hash.split('access_token=')[1]?.split('&')[0] : null);
      const refreshToken = searchParams.get('refresh_token') || 
                           (hash.includes('refresh_token=') ? hash.split('refresh_token=')[1]?.split('&')[0] : null);
      const tokenType = searchParams.get('type') || 
                        (hash.includes('type=') ? hash.split('type=')[1]?.split('&')[0] : null);
      
      console.log("Verification check:", { accessToken: !!accessToken, tokenType, hash, params: Object.fromEntries(searchParams) });
      
      if (tokenType === 'recovery' || tokenType === 'signup' || tokenType === 'email_verification' || accessToken) {
        try {
          if (accessToken) {
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) throw error;
            
            setVerificationSuccess(true);
            
            setAuthMessage({
              type: 'success',
              message: "Email verified successfully! You can now log in to your account."
            });
            
            toast({
              title: "Email verified successfully!",
              description: "You can now log in to your account.",
            });
            
            setIsLogin(true);
            
            if (window.history.pushState) {
              const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
              window.history.pushState({ path: newUrl }, '', newUrl);
            }
          } else {
            throw new Error("Verification link appears to be invalid or expired.");
          }
        } catch (error: any) {
          console.error('Verification error:', error);
          setAuthMessage({
            type: 'error',
            message: error.message
          });
          toast({
            title: "Verification failed",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    };

    checkEmailVerificationToken();
  }, [navigate, toast]);

  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      setIsLogin(location.state.isLogin);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthMessage({ type: null, message: null });

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        
        if (data.session) {
          setAuthMessage({
            type: 'success',
            message: "Login successful! Redirecting to dashboard..."
          });
          
          toast({
            title: "Login successful!",
            description: "Welcome to your pharmacy dashboard.",
          });
          
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        }
      } else {
        if (!passwordValidation.isValid) {
          setAuthMessage({
            type: 'error',
            message: "Please ensure your password meets all requirements."
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              pharmacy_name: formData.pharmacyName,
              owner_name: formData.ownerName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              gstin: formData.gstin,
              plan_type: planType,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) throw error;

        if (data.user) {
          setAuthMessage({
            type: 'success',
            message: "Registration successful! Please check your email to verify your account."
          });
          
          toast({
            title: "Registration successful!",
            description: "Please check your email to verify your account. Click the verification link to complete the process.",
          });
          
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthMessage({
        type: 'error',
        message: error.message
      });
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundCells className="bg-slate-950" />
        <div className="absolute top-4 left-4 z-50">
          <Button asChild variant="ghost" className="text-white hover:text-indigo-300 hover:bg-indigo-950/50">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Home
            </Link>
          </Button>
        </div>
        <div className="relative z-30">
          <Card className="w-full max-w-md shadow-xl border-opacity-50 bg-black/30 backdrop-blur-md border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Verifying Your Email</CardTitle>
              <CardDescription className="text-center text-gray-300">
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundCells className="bg-slate-950" />
        <div className="absolute top-4 left-4 z-50">
          <Button asChild variant="ghost" className="text-white hover:text-indigo-300 hover:bg-indigo-950/50">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Home
            </Link>
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-30"
        >
          <Card className="shadow-xl border-opacity-50 bg-black/30 backdrop-blur-md border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-indigo-400">
                Email Verified Successfully!
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Your account has been verified. You can now log in.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-indigo-900/50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={() => {
                  setVerificationSuccess(false);
                  setIsLogin(true);
                }}
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <BackgroundCells className="bg-slate-950" />
      <div className="absolute top-4 left-4 z-50">
        <Button asChild variant="ghost" className="text-white hover:text-indigo-300 hover:bg-indigo-950/50">
          <Link to="/">
            <Home className="h-5 w-5 mr-2" />
            Home
          </Link>
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-30"
      >
        <Card className="shadow-xl backdrop-blur-md bg-black/30 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              {isLogin
                ? "Sign in to your pharmacy account"
                : "Register your pharmacy"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMessage.type && (
              <Alert 
                variant={authMessage.type === 'error' ? 'destructive' : 'default'} 
                className={`mb-4 ${authMessage.type === 'success' ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' : authMessage.type === 'info' ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-red-900/50 text-red-300 border-red-700'}`}
              >
                {authMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : authMessage.type === 'info' ? (
                  <Info className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {authMessage.type === 'error' ? 'Error' : authMessage.type === 'info' ? 'Information' : 'Success'}
                </AlertTitle>
                <AlertDescription>
                  {authMessage.message}
                </AlertDescription>
              </Alert>
            )}

            {showFreePlanInfo && (
              <Alert className="mb-4 bg-indigo-900/50 text-indigo-300 border-indigo-700">
                <Info className="h-4 w-4" />
                <AlertTitle>Free Trial Plan</AlertTitle>
                <AlertDescription>
                  You are signing up for the Free Plan. This includes:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>30-day trial access</li>
                    <li>Limited to 501 products in inventory</li>
                    <li>30 bills per day</li>
                    <li>600 bills per month</li>
                    <li>Basic pharmacy management features</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pharmacyName" className="text-white">Pharmacy Name*</Label>
                    <Input
                      id="pharmacyName"
                      value={formData.pharmacyName}
                      onChange={(e) =>
                        updateFormData("pharmacyName", e.target.value)
                      }
                      required={!isLogin}
                      placeholder="Enter pharmacy name"
                      className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-white">Owner Name*</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) =>
                        updateFormData("ownerName", e.target.value)
                      }
                      required={!isLogin}
                      placeholder="Enter owner name"
                      className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number*</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        updateFormData("phone", e.target.value)
                      }
                      required={!isLogin}
                      placeholder="Enter phone number"
                      className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">Address*</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        updateFormData("address", e.target.value)
                      }
                      required={!isLogin}
                      placeholder="Enter complete address"
                      className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">City*</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          updateFormData("city", e.target.value)
                        }
                        required={!isLogin}
                        placeholder="Enter city"
                        className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-white">State*</Label>
                      <Select 
                        value={formData.state}
                        onValueChange={(value) => updateFormData("state", value)}
                      >
                        <SelectTrigger className="bg-black/50 border-indigo-800/50 text-white focus:ring-indigo-500">
                          <SelectValue placeholder="Select state" className="text-gray-400" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-indigo-800 text-white">
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state} className="focus:bg-indigo-900 focus:text-white">
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-white">PIN Code*</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) =>
                          updateFormData("pincode", e.target.value)
                        }
                        required={!isLogin}
                        placeholder="Enter PIN code"
                        className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin" className="text-white">GSTIN (Optional)</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) =>
                          updateFormData("gstin", e.target.value)
                        }
                        placeholder="Enter GSTIN"
                        className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    updateFormData("email", e.target.value)
                  }
                  required
                  placeholder="Enter email address"
                  className="bg-black/50 border-indigo-800/50 focus:border-indigo-500 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password*</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    updateFormData("password", e.target.value)
                  }
                  required
                  placeholder="Enter password"
                  className={`bg-black/50 focus:border-indigo-500 text-white placeholder:text-gray-400 ${!isLogin && formData.password ? (passwordValidation.isValid ? "border-indigo-500" : "border-red-500") : "border-indigo-800/50"}`}
                />
                
                {!isLogin && formData.password && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium mb-1 text-white">Password requirements:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center">
                        {passwordValidation.minLength ? (
                          <CheckCircle className="h-4 w-4 text-indigo-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.minLength ? "text-indigo-400" : "text-red-400"}>
                          At least 6 characters
                        </span>
                      </li>
                      <li className="flex items-center">
                        {passwordValidation.hasNumber ? (
                          <CheckCircle className="h-4 w-4 text-indigo-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={passwordValidation.hasNumber ? "text-indigo-400" : "text-red-400"}>
                          Contains at least one number
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                type="submit" 
                disabled={isLoading || (!isLogin && formData.password && !passwordValidation.isValid)}
              >
                {isLoading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                  ? "Sign in"
                  : "Create account"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-indigo-400 hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

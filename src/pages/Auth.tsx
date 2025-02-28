
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
import { AlertCircle, CheckCircle } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success' | null; message: string | null }>({
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

  useEffect(() => {
    const checkEmailVerificationToken = async () => {
      setIsVerifying(true);
      
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      const accessToken = searchParams.get('access_token') || hash.split('access_token=')[1]?.split('&')[0];
      const tokenType = searchParams.get('type') || (hash.includes('type=') ? hash.split('type=')[1]?.split('&')[0] : null);
      
      if (tokenType === 'recovery' || tokenType === 'signup' || tokenType === 'email_verification' || accessToken) {
        try {
          if (accessToken) {
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: '',
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
          
          // Short timeout to show success message before redirect
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        }
      } else {
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Verifying Your Email</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-600">
                Email Verified Successfully!
              </CardTitle>
              <CardDescription className="text-center">
                Your account has been verified. You can now log in.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Button 
                className="w-full" 
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Sign in to your pharmacy account"
                : "Register your pharmacy"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMessage.type && (
              <Alert 
                variant={authMessage.type === 'error' ? 'destructive' : 'default'} 
                className={`mb-4 ${authMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
              >
                {authMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {authMessage.type === 'error' ? 'Error' : 'Success'}
                </AlertTitle>
                <AlertDescription>
                  {authMessage.message}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pharmacyName">Pharmacy Name*</Label>
                    <Input
                      id="pharmacyName"
                      value={formData.pharmacyName}
                      onChange={(e) =>
                        setFormData({ ...formData, pharmacyName: e.target.value })
                      }
                      required={!isLogin}
                      placeholder="Enter pharmacy name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name*</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerName: e.target.value })
                      }
                      required={!isLogin}
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number*</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required={!isLogin}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address*</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      required={!isLogin}
                      placeholder="Enter complete address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City*</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        required={!isLogin}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State*</Label>
                      <Select 
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code*</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        required={!isLogin}
                        placeholder="Enter PIN code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN (Optional)</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) =>
                          setFormData({ ...formData, gstin: e.target.value })
                        }
                        placeholder="Enter GSTIN"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password*</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  placeholder="Enter password"
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
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
                className="text-sm text-primary hover:underline"
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

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { INDIAN_STATES } from "@/constants/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, X, Info, Mail, HelpCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverInfoCard } from "@/components/ui/hover-info-card";
import { Package, ShoppingCart, LineChart, Shield } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";

export default function Auth() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        stableToast({
          title: "Already logged in",
          description: "Redirecting to dashboard",
          variant: "success"
        });
        
        localStorage.setItem('show-post-login-onboarding', 'true');
        navigate('/dashboard');
      }
    };
    
    checkUser();
  }, [navigate]);
  
  const handleAuthSuccess = () => {
    localStorage.setItem('show-post-login-onboarding', 'true');
    navigate('/dashboard');
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
  const fromLegal = location.state?.fromLegal || false;

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
      
      const accessToken = searchParams.get('access_token') || (hash.includes('access_token=') ? hash.split('access_token=')[1]?.split('&')[0] : null);
      const refreshToken = searchParams.get('refresh_token') || (hash.includes('refresh_token=') ? hash.split('refresh_token=')[1]?.split('&')[0] : null);
      const tokenType = searchParams.get('type') || (hash.includes('type=') ? hash.split('type=')[1]?.split('&')[0] : null);
      
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
            handleAuthSuccess();
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

        if (!termsAccepted) {
          setAuthMessage({
            type: 'error',
            message: "You must accept the Terms of Service and Privacy Policy to register."
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

  const handleContactAdmin = () => {
    const subject = "Password Reset Request";
    const body = "Hello,\n\nI forgot my password and need assistance resetting it.\n\nMy contact details:\nEmail: [Your Email]\nPhone: [Your Phone Number]\n\nThank you,\n[Your Name]";
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=victurehealthcaresolutions@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        <Card className="w-full max-w-md relative z-10 shadow-xl border-opacity-50">
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="shadow-xl border-opacity-50">
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
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="absolute top-4 left-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary hover:bg-green-50"
          onClick={() => navigate('/')}
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 mb-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">Victure</span> - Smart Pharmacy Management
          </h1>
          <p className="text-lg text-neutral-700 max-w-xl">
            Join thousands of pharmacies that streamlined their operations with our comprehensive solution.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <HoverInfoCard 
              title="Smart Inventory" 
              description="Track expiry dates, get low stock alerts, and automate reordering with our intelligent inventory management."
              icon={<Package className="h-6 w-6" />}
              className="w-full"
            />
            <HoverInfoCard 
              title="Seamless Billing" 
              description="Generate invoices instantly, manage returns, and track sales with our intuitive billing system."
              icon={<ShoppingCart className="h-6 w-6" />}
              className="w-full"
            />
            <HoverInfoCard 
              title="Business Analytics" 
              description="Make data-driven decisions with comprehensive sales reports and inventory analytics."
              icon={<LineChart className="h-6 w-6" />}
              className="w-full"
            />
            <HoverInfoCard 
              title="Secure & Compliant" 
              description="Your data is protected with enterprise-grade security. Our system is compliant with industry standards."
              icon={<Shield className="h-6 w-6" />}
              className="w-full"
            />
          </div>
        </motion.div>
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="shadow-xl backdrop-blur-sm bg-white/90 border-opacity-50">
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
                  className={`mb-4 ${authMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : authMessage.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''}`}
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
                <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
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
              
              <ScrollArea className={!isLogin ? "h-[400px] pr-4" : ""}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="pharmacyName">Pharmacy Name*</Label>
                        <Input
                          id="pharmacyName"
                          value={formData.pharmacyName}
                          onChange={(e) =>
                            updateFormData("pharmacyName", e.target.value)
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
                            updateFormData("ownerName", e.target.value)
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
                            updateFormData("phone", e.target.value)
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
                            updateFormData("address", e.target.value)
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
                              updateFormData("city", e.target.value)
                            }
                            required={!isLogin}
                            placeholder="Enter city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State*</Label>
                          <Select 
                            value={formData.state}
                            onValueChange={(value) => updateFormData("state", value)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
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
                              updateFormData("pincode", e.target.value)
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
                              updateFormData("gstin", e.target.value)
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
                        updateFormData("email", e.target.value)
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
                        updateFormData("password", e.target.value)
                      }
                      required
                      placeholder="Enter password"
                      className={!isLogin && formData.password ? (passwordValidation.isValid ? "border-green-500" : "border-red-500") : ""}
                    />
                    
                    {!isLogin && formData.password && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium mb-1">Password requirements:</p>
                        <ul className="space-y-1">
                          <li className="flex items-center">
                            {passwordValidation.minLength ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className={passwordValidation.minLength ? "text-green-600" : "text-red-600"}>
                              At least 6 characters
                            </span>
                          </li>
                          <li className="flex items-center">
                            {passwordValidation.hasNumber ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className={passwordValidation.hasNumber ? "text-green-600" : "text-red-600"}>
                              Contains at least one number
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {!isLogin && (
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox 
                        id="terms" 
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        required
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I accept the{" "}
                        <Link 
                          to="/legal/terms-of-service" 
                          state={{ fromRegistration: true }}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link 
                          to="/legal/privacy-policy" 
                          state={{ fromRegistration: true }}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                  )}
                  
                  <Button className="w-full" type="submit" disabled={isLoading || (!isLogin && formData.password && !passwordValidation.isValid) || (!isLogin && !termsAccepted)}>
                    {isLoading
                      ? isLogin
                        ? "Signing in..."
                        : "Creating account..."
                      : isLogin
                      ? "Sign in"
                      : "Create account"}
                  </Button>
                </form>
              </ScrollArea>
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
            
            {isLogin && (
              <CardFooter className="flex justify-center pb-4">
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  onClick={handleContactAdmin}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Contact Administrator</span>
                  <HelpCircle className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

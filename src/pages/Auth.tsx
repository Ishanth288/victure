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
import { 
  Package, 
  ShoppingCart, 
  Check, 
  CheckCircle2, 
  ListChecks, 
  Shield, 
  Activity, 
  Home,
  Heart,
  Star,
  Sparkles,
  Flower,
  Eye,
  EyeOff
} from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";
import { RegistrationData } from "@/types/registration";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
    if (locationState?.isLogin !== undefined) {
      setIsLogin(locationState.isLogin);
    }
  }, [isLogin, locationState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
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
        setSuccessMessage("Login successful! Redirecting...");
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
          description: "Welcome to Victure Healthcare Solutions! Your account has been created.",
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
    { icon: <Heart className="h-5 w-5 text-orange-500" />, text: "Caring for Community Health" },
    { icon: <Activity className="h-5 w-5 text-green-500" />, text: "Real-time Health Monitoring" },
    { icon: <Shield className="h-5 w-5 text-blue-500" />, text: "Secure & Trusted Platform" },
    { icon: <Sparkles className="h-5 w-5 text-purple-500" />, text: "AI-Powered Insights" },
  ];

  // Enhanced floating animation variants
  const floatingVariants = {
    animate: {
      y: [-20, -30, -20],
      rotate: [0, 5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const mandalaVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stunning Background with Indian-inspired gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
        {/* Traditional Indian patterns overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Floating geometric elements */}
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 text-orange-200 text-6xl opacity-20"
        >
          🕉️
        </motion.div>
        
        <motion.div 
          variants={mandalaVariants}
          animate="animate"
          className="absolute top-32 right-20 w-24 h-24 border-2 border-rose-200 rounded-full opacity-20"
        />
        
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          className="absolute bottom-32 left-20 text-amber-200 text-4xl opacity-30"
        >
          🪷
        </motion.div>
        
        <motion.div 
          variants={mandalaVariants}
          animate="animate"
          className="absolute bottom-20 right-10 w-16 h-16 border border-orange-200 rounded-full opacity-25"
        />
      </div>

      {/* Home Button - Top Right for better positioning */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-6 right-6 z-50"
      >
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            try {
              console.log('Home button clicked - navigating to /');
              navigate('/');
            } catch (error) {
              console.error('Navigation error:', error);
              // Fallback to window.location
              window.location.href = '/';
            }
          }}
          className="bg-white/90 backdrop-blur-md hover:bg-white border border-orange-200/80 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center gap-2"
        >
          <Home className="h-4 w-4 text-orange-600" />
          <span className="text-gray-700 font-medium hidden sm:inline">Home</span>
        </Button>
      </motion.div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding (Hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16"
        >
          <div className="max-w-lg">
            {/* Logo and Brand */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Flower className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Victure
                </h1>
                <p className="text-lg text-gray-600 font-medium">Healthcare Solutions</p>
              </div>
            </motion.div>

            {/* Welcome Message */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
                Transforming Healthcare,
                <span className="block text-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text">
                  One Pharmacy at a Time
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Join thousands of healthcare professionals who trust Victure to streamline their pharmacy operations with cutting-edge technology and traditional care values.
              </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="space-y-4"
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-white/50"
                >
                  {feature.icon}
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="mt-12 flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">4.9/5 Rating</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="text-sm text-gray-600">
                <span className="font-bold text-orange-600">10,000+</span> Happy Pharmacies
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8"
        >
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="lg:hidden flex flex-col items-center mb-8"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <Flower className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent text-center">
                Victure Healthcare Solutions
              </h1>
              <p className="text-gray-600 text-center mt-2">Your Trusted Healthcare Partner</p>
            </motion.div>

            {/* Auth Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0 rounded-2xl overflow-hidden">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-orange-50 to-rose-50">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {isLogin ? 'Welcome Back!' : 'Join Our Family'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {isLogin 
                      ? 'Sign in to continue your healthcare journey' 
                      : 'Start your digital transformation today'
                    }
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error/Success Messages */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg"
                        >
                          <div className="flex">
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {successMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg"
                        >
                          <div className="flex">
                            <div className="ml-3">
                              <p className="text-sm text-green-700">{successMessage}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={isLogin ? loginData.email : registrationData.email}
                        onChange={isLogin ? handleLoginDataChange : handleRegistrationDataChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                        placeholder="Enter your email address"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          required
                          value={isLogin ? loginData.password : registrationData.password}
                          onChange={isLogin ? handleLoginDataChange : handleRegistrationDataChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 pr-12 transition-all duration-200"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {!isLogin && (
                        <p className="text-xs text-gray-500 mt-1">
                          Password should be at least 8 characters long
                        </p>
                      )}
                    </div>

                    {/* Registration-only fields */}
                    <AnimatePresence>
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={registrationData.confirmPassword}
                                onChange={handleRegistrationDataChange}
                                className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 pr-12 transition-all duration-200"
                                placeholder="Confirm your password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          {/* Name */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              autoComplete="name"
                              required
                              value={registrationData.name}
                              onChange={handleRegistrationDataChange}
                              className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                              placeholder="Enter your full name"
                            />
                          </div>

                          {/* Pharmacy Name */}
                          <div className="space-y-2">
                            <Label htmlFor="pharmacy_name" className="text-sm font-semibold text-gray-700">
                              Pharmacy Name
                            </Label>
                            <Input
                              id="pharmacy_name"
                              name="pharmacy_name"
                              type="text"
                              required
                              value={registrationData.pharmacy_name}
                              onChange={handleRegistrationDataChange}
                              className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                              placeholder="Enter your pharmacy name"
                            />
                          </div>

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                              Phone Number
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              autoComplete="tel"
                              required
                              value={registrationData.phone}
                              onChange={handleRegistrationDataChange}
                              className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                              placeholder="Enter your phone number"
                            />
                          </div>

                          {/* Plan Information */}
                          {!fromPricing && (
                            <div className="bg-gradient-to-r from-orange-50 to-rose-50 p-6 rounded-xl border border-orange-200">
                              <h4 className="flex items-center text-sm font-bold text-orange-800 mb-3">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Free Trial Plan - Start Your Journey!
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center text-orange-700">
                                  <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span>30-day trial access</span>
                                </div>
                                <div className="flex items-center text-orange-700">
                                  <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span>501 products in inventory</span>
                                </div>
                                <div className="flex items-center text-orange-700">
                                  <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span>30 bills per day</span>
                                </div>
                                <div className="flex items-center text-orange-700">
                                  <Check className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span>600 bills per month</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                          />
                          {isLogin ? 'Signing In...' : 'Creating Account...'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Sparkles className="h-5 w-5 mr-2" />
                          {isLogin ? 'Sign In to Dashboard' : 'Start Free Trial'}
                        </div>
                      )}
                    </Button>

                    {/* Toggle Auth Mode */}
                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors underline-offset-4 hover:underline"
                      >
                        {isLogin 
                          ? "New to Victure? Create your account" 
                          : "Already have an account? Sign in"
                        }
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom Trust Elements */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-600 mb-4">
                Trusted by healthcare professionals across India
              </p>
              <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-500" />
                  <span>SSL Secured</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  <span>Made in India</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

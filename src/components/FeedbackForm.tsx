
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Check } from "lucide-react";
import { sanitizeInput } from "@/utils/securityUtils";

export function FeedbackForm() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors and success state
    setEmailError("");
    setIsSuccess(false);
    
    // Validate inputs
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting",
        variant: "destructive"
      });
      return;
    }
    
    if (!email.trim()) {
      setEmailError("Email is required");
      toast({
        title: "Email required",
        description: "Please provide your email address",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Sanitize inputs to prevent XSS
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFeedback = sanitizeInput(feedback);
      
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          email: sanitizedEmail, 
          message: sanitizedFeedback,
          created_at: new Date().toISOString(),
          is_read: false
        });
        
      if (error) {
        console.error("Feedback submission error:", error);
        throw error;
      }
      
      // Show success state and toast notification
      setIsSuccess(true);
      toast({
        title: "Feedback received",
        description: "Thank you for your valuable feedback!",
      });
      
      // Reset form
      setEmail("");
      setFeedback("");
      console.log("Feedback successfully submitted");
      
      // Reset success state after 5 seconds to allow user to see it
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">We Value Your Feedback</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Help us improve our services by sharing your thoughts and suggestions.
      </p>
      
      {isSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 flex items-center gap-2 text-green-700">
          <Check className="h-5 w-5 text-green-500" />
          <span>Thank you! Your feedback has been submitted successfully.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${emailError ? "border-red-500" : ""}`}
              required
              aria-required="true"
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
          
          <div>
            <Textarea
              placeholder="Share your feedback with us..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      )}
    </div>
  );
}

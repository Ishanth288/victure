
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";

export function FeedbackForm() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          email: email || null, 
          message: feedback,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Feedback received",
        description: "Thank you for your valuable feedback!",
      });
      
      setEmail("");
      setFeedback("");
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later",
        variant: "destructive"
      });
      console.error("Error submitting feedback:", error);
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="Your email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
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
    </div>
  );
}

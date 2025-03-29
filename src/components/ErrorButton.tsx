
import React, { useState, useEffect } from 'react';
import * as Sentry from "@sentry/react";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const ErrorButton: React.FC = () => {
  const [hasClicked, setHasClicked] = useState(false);
  
  // Reset click state after error boundary catches the error
  useEffect(() => {
    if (hasClicked) {
      const timer = setTimeout(() => setHasClicked(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasClicked]);

  const handleBreakWorld = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent event bubbling
    
    console.log("Error button clicked - sending test error to Sentry");
    setHasClicked(true);
    
    // Show a toast notification
    toast({
      title: "Test Error Triggered",
      description: "Sending error to Sentry...",
      variant: "destructive",
    });
    
    // Log the error to Sentry first
    Sentry.captureException(new Error("Intentional error for testing Sentry error tracking"));
    
    // Short delay to ensure Sentry logs the error before the UI breaks
    setTimeout(() => {
      // Throw an error to trigger the error boundary
      throw new Error("This button intentionally breaks the UI to demonstrate error handling");
    }, 100);
  };

  return (
    <div className="relative z-10 my-4 flex justify-center">
      <Button 
        variant="destructive"
        size="lg"
        onClick={handleBreakWorld}
        className="font-bold shadow-lg hover:scale-105 transition-transform flex gap-2 items-center cursor-pointer"
        data-testid="error-button"
        aria-label="Break the World - Error Test Button"
        tabIndex={0}
        style={{ 
          position: 'relative',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
        }}
      >
        <AlertTriangle className="h-5 w-5" />
        {hasClicked ? "Breaking..." : "Break the World"}
      </Button>
    </div>
  );
};

export default ErrorButton;

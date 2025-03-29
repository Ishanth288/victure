
import React from 'react';
import * as Sentry from "@sentry/react";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

export const ErrorButton: React.FC = () => {
  const handleBreakWorld = () => {
    // Log the error to Sentry first
    Sentry.captureException(new Error("Intentional error for testing Sentry error tracking"));
    
    // Throw an error to trigger the error boundary
    throw new Error("This button intentionally breaks the UI to demonstrate error handling");
  };

  return (
    <Button 
      variant="destructive"
      size="lg"
      onClick={handleBreakWorld}
      className="font-bold shadow-lg hover:scale-105 transition-transform flex gap-2 items-center"
      data-testid="error-button"
      aria-label="Break the World - Error Test Button"
    >
      <AlertTriangle className="h-5 w-5" />
      Break the World
    </Button>
  );
};

export default ErrorButton;


import React from 'react';
import * as Sentry from "@sentry/react";

export const ErrorButton: React.FC = () => {
  const handleBreakWorld = () => {
    // Log the error to Sentry first
    Sentry.captureException(new Error("Intentional error for testing Sentry error tracking"));
    
    // Throw an error to trigger the error boundary
    throw new Error("This button intentionally breaks the UI to demonstrate error handling");
  };

  return (
    <button 
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      onClick={handleBreakWorld}
    >
      Break the World
    </button>
  );
};

export default ErrorButton;

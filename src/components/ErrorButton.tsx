
import React from 'react';
import * as Sentry from "@sentry/react";

export const ErrorButton: React.FC = () => {
  const handleBreakWorld = () => {
    try {
      // First log the error to Sentry
      Sentry.captureException(new Error("This is a tracked error!"));
      
      // Then actually throw an error to trigger the error boundary
      throw new Error("This is a thrown error that breaks the UI!");
    } catch (error) {
      // Re-throw the error so it propagates up to the error boundary
      throw error;
    }
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

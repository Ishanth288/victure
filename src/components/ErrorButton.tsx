
import React from 'react';
import * as Sentry from "@sentry/react";

export const ErrorButton: React.FC = () => {
  const handleBreakWorld = () => {
    // This will trigger a Sentry error report
    Sentry.captureException(new Error("This is your first error!"));
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

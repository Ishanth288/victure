
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialize Sentry
Sentry.init({
  dsn: "https://aa91fdc816d181a9bbc526a3ba0be025@o4509056293470208.ingest.us.sentry.io/4509059112435712",
  integrations: [
    new BrowserTracing({
      tracePropagationTargets: ["localhost", /^\//],
    }),
    new Sentry.BrowserProfilingIntegration(),
    new Sentry.Replay(),
  ],
  
  // Adjust sample rates for production environment
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
  
  // Set appropriate replay sample rates for production
  replaysSessionSampleRate: import.meta.env.DEV ? 0.1 : 0.05,
  
  // Set release information for source map association
  release: import.meta.env.VITE_SENTRY_RELEASE || 'local-development',
  
  // Configure error fingerprinting
  beforeSend(event) {
    // Remove debugging console.log
    return event;
  },
  
  // Only enable debug in development
  debug: import.meta.env.DEV,
});

// Create a custom fallback component for the error boundary
const FallbackComponent = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
      <p className="text-gray-700 mb-4">
        An unexpected error has occurred and our team has been notified. 
        Please try refreshing the page or come back later.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<FallbackComponent />}>
    <App />
  </Sentry.ErrorBoundary>
);

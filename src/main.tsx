
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialize Sentry
// Note: Replace the DSN below with your actual Sentry DSN
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0", // Replace with your actual DSN
  integrations: [new BrowserTracing()],
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Adjust this value in production, or use tracesSampler for greater control
  replaysSessionSampleRate: 0.1,
  
  // Performance monitoring settings
  performance: {
    // Sample rate for performance monitoring
    tracingOrigins: ["localhost", /^\//],
  },
  
  // Configure error fingerprinting
  beforeSend(event) {
    // Check if it's a known issue
    if (event.exception) {
      console.log("Sending error to Sentry:", event.exception.values?.[0]?.type);
    }
    return event;
  },
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p>An error has occurred. Our team has been notified.</p>}>
    <App />
  </Sentry.ErrorBoundary>
);

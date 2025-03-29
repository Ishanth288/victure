
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
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  
  // Adjust this value in production, or use tracesSampler for greater control
  replaysSessionSampleRate: 0.1,
  
  // Set release information for source map association
  release: import.meta.env.VITE_SENTRY_RELEASE || 'local-development',
  
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

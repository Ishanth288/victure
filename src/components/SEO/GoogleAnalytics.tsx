
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId = 'G-G-0Q0N9Q2ZRC' }: GoogleAnalyticsProps) {
  const location = useLocation();

  useEffect(() => {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    // Fix: Use Date object directly, not ISO string
    gtag('js', new Date());
    gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="${measurementId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', measurementId, {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location, measurementId]);

  return null;
}

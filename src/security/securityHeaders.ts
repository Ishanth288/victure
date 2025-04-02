
/**
 * Security headers middleware for enhancing website security
 * These headers help prevent various common web vulnerabilities
 */

export const securityHeaders = {
  // Prevent XSS attacks by controlling which resources can be loaded
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://*.ingest.sentry.io https://cdn.gpteng.co;
    connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.sentry-cdn.com https://*.ingest.sentry.io https://trends.google.com https://newsapi.org https://api.whatsapp.com;
    img-src 'self' data: https: blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.google.com https://www.youtube.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control iframe embedding - use CSP frame-ancestors instead for better control
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Add an additional layer of XSS protection for older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control information exposed in referrer header
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Enable HTTP Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Specify permitted capabilities for your application
  'Permissions-Policy': 'camera=self, microphone=self, geolocation=self, interest-cohort=()',
  
  // Allow requests from all origins for development and preview environments
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization,X-Client-Info',
  'Access-Control-Allow-Credentials': 'true',
  
  // Cache control for improved performance and reduced flickering
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  
  // Feature-Policy header for additional security
  'Feature-Policy': 'camera self; microphone self; geolocation self;',
};

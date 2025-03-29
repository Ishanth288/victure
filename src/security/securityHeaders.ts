
/**
 * Security headers middleware for enhancing website security
 * These headers help prevent various common web vulnerabilities
 */

export const securityHeaders = {
  // Prevent XSS attacks by controlling which resources can be loaded
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://prod.spline.design https://*.sentry.io https://js.stripe.com https://*.lovableproject.com https://*.lovable.app https://*.lovable.dev https://cdn.gpteng.co https://*.google.com https://trends.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co https://*.sentry.io https://*.lovableproject.com https://*.lovable.app https://*.lovable.dev https://*.google.com;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://*.sentry.io https://vitals.vercel-insights.com wss://*.supabase.co https://*.lovableproject.com https://*.lovable.app https://*.lovable.dev https://*.google.com https://trends.google.com https://newsapi.org;
    frame-src 'self' https://js.stripe.com https://*.lovableproject.com https://*.gpteng.co https://*.lovable.app https://*.lovable.dev https://*.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://*.lovableproject.com https://*.lovable.app https://*.lovable.dev https://preview--victure.lovable.app https://*.gpteng.co https://lovable.dev https://preview.lovable.ai;
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
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Allow requests from all origins for development and preview environments
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization,X-Client-Info',
  'Access-Control-Allow-Credentials': 'true',
};


/**
 * Security headers middleware for enhancing website security
 * These headers help prevent various common web vulnerabilities
 */

export const securityHeaders = {
  // Prevent XSS attacks by controlling which resources can be loaded
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://prod.spline.design https://*.sentry.io https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co https://*.sentry.io;
    font-src 'self';
    connect-src 'self' https://*.supabase.co https://*.sentry.io https://vitals.vercel-insights.com;
    frame-src 'self' https://js.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control iframe embedding
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Add an additional layer of XSS protection for older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control information exposed in referrer header
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Enable HTTP Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Specify permitted capabilities for your application
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

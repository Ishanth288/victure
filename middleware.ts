/**
 * Next.js Middleware
 * Integrates Priority 2 Security Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './src/middleware/security';

// Define paths that should be protected by security middleware
const PROTECTED_PATHS = [
  '/api',
  '/admin',
  '/dashboard',
  '/patients',
  '/prescriptions',
  '/inventory',
  '/billing',
  '/reports'
];

// Define paths that should bypass security middleware
const BYPASS_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/public'
];

// Check if path should be protected
const shouldProtectPath = (pathname: string): boolean => {
  // Skip static files and Next.js internal paths
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return false;
  }
  
  // Protect specific paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  // Protect all API routes by default
  if (pathname.startsWith('/api/')) {
    return true;
  }
  
  return false;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for certain paths
  if (!shouldProtectPath(pathname)) {
    return NextResponse.next();
  }
  
  // Apply security middleware
  return await securityMiddleware(request);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
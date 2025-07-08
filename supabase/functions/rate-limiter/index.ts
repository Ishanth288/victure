import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

interface RateLimitRequest {
  action: string;
  identifier: string; // user_id, IP address, or other identifier
  maxAttempts?: number;
  timeWindowMs?: number;
}

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Default rate limits for different actions
const DEFAULT_LIMITS = {
  'login': { maxAttempts: 5, timeWindowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  'admin_access': { maxAttempts: 3, timeWindowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  'api_call': { maxAttempts: 100, timeWindowMs: 60 * 1000 }, // 100 calls per minute
  'patient_create': { maxAttempts: 10, timeWindowMs: 60 * 1000 }, // 10 patients per minute
  'prescription_create': { maxAttempts: 20, timeWindowMs: 60 * 1000 }, // 20 prescriptions per minute
  'bill_create': { maxAttempts: 30, timeWindowMs: 60 * 1000 }, // 30 bills per minute
  'inventory_update': { maxAttempts: 50, timeWindowMs: 60 * 1000 }, // 50 updates per minute
  'password_reset': { maxAttempts: 3, timeWindowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  'email_send': { maxAttempts: 10, timeWindowMs: 60 * 60 * 1000 }, // 10 emails per hour
  'file_upload': { maxAttempts: 20, timeWindowMs: 60 * 1000 }, // 20 uploads per minute
  'search': { maxAttempts: 100, timeWindowMs: 60 * 1000 }, // 100 searches per minute
  'export': { maxAttempts: 5, timeWindowMs: 60 * 1000 }, // 5 exports per minute
  'backup': { maxAttempts: 2, timeWindowMs: 60 * 60 * 1000 }, // 2 backups per hour
  'bulk_operation': { maxAttempts: 3, timeWindowMs: 60 * 1000 } // 3 bulk operations per minute
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { action, identifier, maxAttempts, timeWindowMs }: RateLimitRequest = await req.json()

    if (!action || !identifier) {
      return new Response(
        JSON.stringify({ error: 'Action and identifier are required' }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get rate limit configuration
    const limits = DEFAULT_LIMITS[action as keyof typeof DEFAULT_LIMITS] || DEFAULT_LIMITS.api_call
    const finalMaxAttempts = maxAttempts || limits.maxAttempts
    const finalTimeWindow = timeWindowMs || limits.timeWindowMs

    const now = Date.now()
    const windowStart = now - finalTimeWindow
    const rateLimitKey = `${action}:${identifier}`

    // Check existing rate limit records
    const { data: existingRecords, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('rate_limit_key', rateLimitKey)
      .gte('created_at', new Date(windowStart).toISOString())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching rate limit records:', fetchError)
      // In case of database error, allow the request but log the issue
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: finalMaxAttempts - 1, 
          resetTime: now + finalTimeWindow,
          warning: 'Rate limiting temporarily unavailable'
        }),
        { 
          status: 200, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      )
    }

    const currentAttempts = existingRecords?.length || 0
    const remaining = Math.max(0, finalMaxAttempts - currentAttempts - 1)
    const resetTime = now + finalTimeWindow

    // Check if rate limit is exceeded
    if (currentAttempts >= finalMaxAttempts) {
      // Calculate retry after time based on oldest record
      const oldestRecord = existingRecords[existingRecords.length - 1]
      const retryAfter = oldestRecord 
        ? Math.max(0, new Date(oldestRecord.created_at).getTime() + finalTimeWindow - now)
        : finalTimeWindow

      // Log rate limit violation
      await logSecurityEvent(supabase, 'RATE_LIMIT_EXCEEDED', {
        action,
        identifier,
        attempts: currentAttempts,
        maxAttempts: finalMaxAttempts,
        timeWindow: finalTimeWindow,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      })

      const response: RateLimitResponse = {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(retryAfter / 1000) // Convert to seconds
      }

      return new Response(
        JSON.stringify(response),
        { 
          status: 429, 
          headers: { 
            ...CORS_HEADERS, 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(retryAfter / 1000).toString(),
            'X-RateLimit-Limit': finalMaxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
          } 
        }
      )
    }

    // Record this attempt
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        rate_limit_key: rateLimitKey,
        action,
        identifier,
        metadata: {
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          timestamp: now
        }
      })

    if (insertError) {
      console.error('Error inserting rate limit record:', insertError)
    }

    // Clean up old records (optional, can be done via cron job)
    if (Math.random() < 0.1) { // 10% chance to clean up
      await cleanupOldRecords(supabase, windowStart)
    }

    const response: RateLimitResponse = {
      allowed: true,
      remaining,
      resetTime
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...CORS_HEADERS, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': finalMaxAttempts.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
        } 
      }
    )

  } catch (error) {
    console.error('Rate limiter error:', error)
    
    // In case of any error, allow the request but log the issue
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: 99, 
        resetTime: Date.now() + 60000,
        warning: 'Rate limiting temporarily unavailable'
      }),
      { 
        status: 200, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to log security events
async function logSecurityEvent(supabase: any, eventType: string, details: any) {
  try {
    await supabase
      .from('security_logs')
      .insert({
        event_type: eventType,
        details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

// Helper function to clean up old rate limit records
async function cleanupOldRecords(supabase: any, cutoffTime: number) {
  try {
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', new Date(cutoffTime).toISOString())
  } catch (error) {
    console.error('Error cleaning up old records:', error)
  }
}
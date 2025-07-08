/**
 * Security logging utility for centralized security event management
 * Priority 2 Security Implementation
 */

import { supabase } from '../integrations/supabase/client';
import { SECURITY_EVENTS, getSecurityEventSeverity } from '../config/security';

interface SecurityLogEntry {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  severity?: string;
  created_at?: string;
}

/**
 * Log security events to the database
 */
export async function logSecurityEvent(eventType: string, details: any): Promise<void> {
  try {
    // Temporarily disable database logging to prevent authentication issues
    // Just log to console for now
    const logEntry = {
      event_type: eventType,
      details,
      severity: getSeverityLevel(eventType),
      timestamp: new Date().toISOString()
    };
    
    // Log to console instead of database
    if (isHighSeverityEvent(eventType)) {
      console.warn('HIGH SEVERITY SECURITY EVENT:', logEntry);
    } else {
      console.log('Security Event:', logEntry);
    }
    
    // TODO: Re-enable database logging once security_logs table is properly set up
    // const { data: { session } } = await supabase.auth.getSession();
    // const { error } = await supabase.from('security_logs').insert(logEntry);
    
  } catch (error) {
    console.error('Security logging error:', error);
    // Fallback logging to console
    console.warn('Security Event (fallback):', {
      event_type: eventType,
      details,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | null> {
  try {
    // This is a simplified approach - in production, you might want to use a service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

/**
 * Determine severity level based on event type
 */
function getSeverityLevel(eventType: string): string {
  // Try to get severity from security config first
  try {
    return getSecurityEventSeverity(eventType as keyof typeof SECURITY_EVENTS);
  } catch {
    // Fallback severity mapping
    const severityMap: Record<string, string> = {
      'RATE_LIMIT_EXCEEDED': 'medium',
      'MULTIPLE_FAILED_LOGINS': 'high',
      'ADMIN_ACCESS_ATTEMPT': 'high',
      'SUSPICIOUS_ACTIVITY': 'high',
      'RATE_LIMITER_ERROR': 'low',
      'AUTHENTICATION_FAILURE': 'medium',
      'UNAUTHORIZED_ACCESS': 'high',
      'DATA_BREACH_ATTEMPT': 'critical',
      'SYSTEM_ERROR': 'low',
      'INPUT_SANITIZATION': 'low',
      'SECURITY_VIOLATION': 'high'
    };
    
    return severityMap[eventType] || 'info';
  }
}

/**
 * Check if an event type is high severity
 */
function isHighSeverityEvent(eventType: string): boolean {
  const severity = getSeverityLevel(eventType);
  return severity === 'high' || severity === 'critical';
}

/**
 * Batch log multiple security events
 */
export async function logSecurityEvents(events: Array<{ eventType: string; details: any }>): Promise<void> {
  try {
    // Temporarily disable database logging to prevent authentication issues
    // Just log to console for now
    console.log('Batch Security Events:', events.map(event => ({
      event_type: event.eventType,
      details: event.details,
      severity: getSeverityLevel(event.eventType),
      timestamp: new Date().toISOString()
    })));
    
    // TODO: Re-enable database logging once security_logs table is properly set up
    // const { data: { session } } = await supabase.auth.getSession();
    // const { error } = await supabase.from('security_logs').insert(logEntries);
    
  } catch (error) {
    console.error('Batch security logging error:', error);
    // Fallback to individual logging
    for (const event of events) {
      await logSecurityEvent(event.eventType, event.details);
    }
  }
}

/**
 * Create a security event logger with context
 */
export function createSecurityLogger(context: { component?: string; action?: string }) {
  return {
    log: (eventType: string, details: any) => {
      const enhancedDetails = {
        ...details,
        context
      };
      return logSecurityEvent(eventType, enhancedDetails);
    },
    
    logError: (error: Error, additionalDetails?: any) => {
      return logSecurityEvent('SYSTEM_ERROR', {
        error: error.message,
        stack: error.stack,
        ...additionalDetails,
        context
      });
    },
    
    logSuspiciousActivity: (activityType: string, details: any) => {
      return logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        activity_type: activityType,
        ...details,
        context
      });
    }
  };
}

export default {
  logSecurityEvent,
  logSecurityEvents,
  createSecurityLogger
};
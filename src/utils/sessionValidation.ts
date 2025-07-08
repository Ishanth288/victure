import { supabase } from '@/integrations/supabase/client';
import { SESSION_CONFIG } from '@/config/security';
import { sessionManager } from './sessionManager';

/**
 * Session validation utilities for enhanced security
 */
export class SessionValidator {
  private static instance: SessionValidator;
  private validationInterval: NodeJS.Timeout | null = null;
  private lastValidation: number = 0;

  private constructor() {}

  static getInstance(): SessionValidator {
    if (!SessionValidator.instance) {
      SessionValidator.instance = new SessionValidator();
    }
    return SessionValidator.instance;
  }

  /**
   * Start continuous session validation
   */
  startValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    // Validate every 30 seconds
    this.validationInterval = setInterval(() => {
      this.validateCurrentSession();
    }, 30000);

    // Initial validation
    this.validateCurrentSession();
  }

  /**
   * Stop session validation
   */
  stopValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Validate current session against security rules
   */
  private async validateCurrentSession(): Promise<boolean> {
    try {
      const now = Date.now();
      
      // Throttle validation calls
      if (now - this.lastValidation < 10000) {
        return true;
      }
      this.lastValidation = now;

      const session = await sessionManager.getSession();
      if (!session) {
        return false;
      }

      // Check session expiry
      const expiresAt = new Date(session.expires_at || 0).getTime();
      if (now >= expiresAt) {
        console.warn('Session expired, logging out');
        await sessionManager.logout();
        return false;
      }

      // Check if session needs refresh
      const timeUntilExpiry = expiresAt - now;
      const renewThreshold = SESSION_CONFIG.renewThreshold * 60 * 1000; // Convert to ms
      
      if (timeUntilExpiry <= renewThreshold) {
        console.log('Session approaching expiry, attempting refresh');
        const refreshed = await sessionManager.refreshSession();
        if (!refreshed) {
          console.warn('Failed to refresh session, logging out');
          await sessionManager.logout();
          return false;
        }
      }

      // Validate session with server
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.warn('Server session validation failed:', error);
        await sessionManager.logout();
        return false;
      }

      // Check for suspicious activity
      await this.checkSuspiciousActivity(user.id);

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Check for suspicious activity that should trigger logout
   */
  private async checkSuspiciousActivity(userId: string): Promise<void> {
    try {
      const { data: activities, error } = await supabase
        .from('suspicious_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error checking suspicious activity:', error);
        return;
      }

      if (activities && activities.length > 0) {
        const highSeverityActivity = activities.find(activity => 
          activity.risk_score >= 80 // High risk scores (80+) indicate high/critical severity
        );

        if (highSeverityActivity) {
          console.warn('High severity suspicious activity detected, logging out:', highSeverityActivity);
          await sessionManager.logout();
          
          // Log security event
          await supabase.from('security_logs').insert({
            user_id: userId,
            event_type: 'forced_logout',
            severity: 'high',
            details: {
              reason: 'suspicious_activity_detected',
              activity_id: highSeverityActivity.id,
              activity_type: highSeverityActivity.activity_type
            },
            ip_address: await this.getClientIP(),
            user_agent: navigator.userAgent
          });
        }
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // This is a simple approach - in production you might want to use a service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Validate session for sensitive operations
   */
  async validateForSensitiveOperation(): Promise<boolean> {
    if (!SESSION_CONFIG.requireReauthForSensitive) {
      return true;
    }

    const session = await sessionManager.getSession();
    if (!session) {
      return false;
    }

    // Check if session is recent enough for sensitive operations (within last 15 minutes)
    const sessionAge = Date.now() - new Date(session.user?.created_at || 0).getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes

    if (sessionAge > maxAge) {
      // Require re-authentication for sensitive operations
      console.log('Session too old for sensitive operation, requiring re-auth');
      return false;
    }

    return true;
  }

  /**
   * Force logout all sessions for a user (security breach response)
   */
  async forceLogoutAllSessions(userId: string, reason: string): Promise<void> {
    try {
      // Log the security event
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: 'force_logout_all_sessions',
        severity: 'critical',
        details: {
          reason,
          timestamp: new Date().toISOString()
        },
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });

      // In a real implementation, you would invalidate all sessions server-side
      // For now, we'll just logout the current session
      await sessionManager.logout();
      
      console.log(`All sessions force logged out for user ${userId}: ${reason}`);
    } catch (error) {
      console.error('Error forcing logout all sessions:', error);
    }
  }
}

export const sessionValidator = SessionValidator.getInstance();
/**
 * Session Management Utility
 * Priority 3 Security Implementation
 * Handles session timeout, refresh, validation, and security
 */

import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { SESSION_CONFIG } from '@/config/security';
import { logSecurityEvent } from '@/utils/securityLogger';

interface SessionState {
  session: Session | null;
  user: User | null;
  lastActivity: number;
  expiresAt: number;
  isValid: boolean;
  warningShown: boolean;
}

interface SessionManagerConfig {
  maxAge: number;
  renewThreshold: number;
  warningThreshold: number;
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
  logoutOnSuspiciousActivity: boolean;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionState: SessionState;
  private config: SessionManagerConfig;
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private sessionListeners: ((session: Session | null) => void)[] = [];
  private isInitialized = false;

  private constructor() {
    this.config = {
      maxAge: SESSION_CONFIG.maxAge,
      renewThreshold: SESSION_CONFIG.renewThreshold,
      warningThreshold: 5 * 60 * 1000, // 5 minutes warning
      maxConcurrentSessions: SESSION_CONFIG.maxConcurrentSessions,
      requireReauthForSensitive: SESSION_CONFIG.requireReauthForSensitive,
      logoutOnSuspiciousActivity: SESSION_CONFIG.logoutOnSuspiciousActivity
    };

    this.sessionState = {
      session: null,
      user: null,
      lastActivity: Date.now(),
      expiresAt: 0,
      isValid: false,
      warningShown: false
    };
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session initialization error:', error);
        await this.logSecurityEvent('SESSION_INITIALIZATION_ERROR', { error: error.message });
        return;
      }

      if (session) {
        await this.setSession(session);
        await this.logSecurityEvent('SESSION_INITIALIZED', { userId: session.user.id });
      }

      // Set up activity tracking
      this.setupActivityTracking();
      
      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('SessionManager: Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await this.setSession(session);
          await this.logSecurityEvent('SESSION_CREATED', { userId: session.user.id });
        } else if (event === 'SIGNED_OUT') {
          await this.clearSession();
          await this.logSecurityEvent('SESSION_DESTROYED', {});
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await this.setRefreshedSession(session);
          await this.logSecurityEvent('SESSION_REFRESHED', { userId: session.user.id });
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Session manager initialization failed:', error);
      await this.logSecurityEvent('SESSION_MANAGER_INIT_FAILED', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async setSession(session: Session): Promise<void> {
    const now = Date.now();
    const expiresAt = new Date(session.expires_at! * 1000).getTime();
    
    this.sessionState = {
      session,
      user: session.user,
      lastActivity: now,
      expiresAt,
      isValid: true,
      warningShown: false
    };

    // Schedule session timeout
    this.scheduleSessionTimeout();
    
    // Notify listeners
    this.notifySessionListeners(session);
  }

  private async setRefreshedSession(session: Session): Promise<void> {
    if (!this.sessionState.isValid) return;

    const now = Date.now();
    const expiresAt = new Date(session.expires_at! * 1000).getTime();
    
    this.sessionState.session = session;
    this.sessionState.user = session.user;
    this.sessionState.expiresAt = expiresAt;
    this.sessionState.lastActivity = now;
    this.sessionState.warningShown = false;

    // Reschedule timeout
    this.scheduleSessionTimeout();
    
    // Notify listeners
    this.notifySessionListeners(session);
  }

  private async clearSession(): Promise<void> {
    this.sessionState = {
      session: null,
      user: null,
      lastActivity: Date.now(),
      expiresAt: 0,
      isValid: false,
      warningShown: false
    };

    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    // Notify listeners
    this.notifySessionListeners(null);
  }

  private scheduleSessionTimeout(): void {
    // Clear existing timeouts
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

    const now = Date.now();
    const timeUntilExpiry = this.sessionState.expiresAt - now;
    const timeUntilWarning = timeUntilExpiry - this.config.warningThreshold;

    // Schedule warning
    if (timeUntilWarning > 0) {
      this.warningTimeoutId = setTimeout(() => {
        this.showSessionWarning();
      }, timeUntilWarning);
    }

    // Schedule logout
    if (timeUntilExpiry > 0) {
      this.timeoutId = setTimeout(() => {
        this.handleSessionTimeout();
      }, timeUntilExpiry);
    }
  }

  private showSessionWarning(): void {
    if (this.sessionState.warningShown || !this.sessionState.isValid) return;
    
    this.sessionState.warningShown = true;
    
    // Show warning dialog
    const shouldExtend = confirm(
      'Your session will expire in 5 minutes. Would you like to extend it?'
    );
    
    if (shouldExtend) {
      this.extendSession();
    }
  }

  private async handleSessionTimeout(): Promise<void> {
    await this.logSecurityEvent('SESSION_TIMEOUT', { 
      userId: this.sessionState.user?.id 
    });
    
    await this.logout('Session expired');
  }

  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Store cleanup function
    this.activityListeners.push(() => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    });
  }

  private updateActivity(): void {
    if (!this.sessionState.isValid) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.sessionState.lastActivity;
    
    // Only update if significant time has passed (avoid excessive updates)
    if (timeSinceLastActivity > 30000) { // 30 seconds
      this.sessionState.lastActivity = now;
      
      // Check if session needs refresh
      const timeUntilExpiry = this.sessionState.expiresAt - now;
      if (timeUntilExpiry < this.config.renewThreshold) {
        this.attemptSessionRefresh();
      }
    }
  }

  private async attemptSessionRefresh(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        await this.logSecurityEvent('SESSION_REFRESH_FAILED', { 
          error: error.message,
          userId: this.sessionState.user?.id 
        });
        return;
      }

      if (session) {
        await this.setRefreshedSession(session);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.logSecurityEvent('SESSION_REFRESH_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.sessionState.user?.id 
      });
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        await this.logSecurityEvent('SESSION_REFRESH_FAILED', { 
          error: error?.message || 'No session returned',
          userId: this.sessionState.user?.id 
        });
        return false;
      }

      await this.setRefreshedSession(session);
      await this.logSecurityEvent('SESSION_REFRESHED', { userId: session.user.id });
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.logSecurityEvent('SESSION_REFRESH_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.sessionState.user?.id 
      });
      return false;
    }
  }

  async extendSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        await this.logSecurityEvent('SESSION_EXTEND_FAILED', { 
          error: error?.message || 'No session returned',
          userId: this.sessionState.user?.id 
        });
        return false;
      }

      await this.setRefreshedSession(session);
      await this.logSecurityEvent('SESSION_EXTENDED', { userId: session.user.id });
      return true;
    } catch (error) {
      console.error('Session extension error:', error);
      await this.logSecurityEvent('SESSION_EXTEND_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.sessionState.user?.id 
      });
      return false;
    }
  }

  async logout(reason?: string): Promise<void> {
    try {
      await this.logSecurityEvent('SESSION_LOGOUT', { 
        reason: reason || 'User initiated',
        userId: this.sessionState.user?.id 
      });
      
      await supabase.auth.signOut();
      await this.clearSession();
    } catch (error) {
      console.error('Logout error:', error);
      await this.logSecurityEvent('LOGOUT_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: this.sessionState.user?.id 
      });
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.sessionState.session) return false;
    
    const now = Date.now();
    
    // Check if session is expired
    if (now >= this.sessionState.expiresAt) {
      await this.handleSessionTimeout();
      return false;
    }
    
    // Check if session is still valid with Supabase
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  requireReauth(): boolean {
    return this.config.requireReauthForSensitive;
  }

  getSession(): Session | null {
    return this.sessionState.session;
  }

  getUser(): User | null {
    return this.sessionState.user;
  }

  isSessionValid(): boolean {
    return this.sessionState.isValid && Date.now() < this.sessionState.expiresAt;
  }

  getTimeUntilExpiry(): number {
    return Math.max(0, this.sessionState.expiresAt - Date.now());
  }

  onSessionChange(callback: (session: Session | null) => void): () => void {
    this.sessionListeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.sessionListeners.indexOf(callback);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  private notifySessionListeners(session: Session | null): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  private async logSecurityEvent(eventType: string, details: any): Promise<void> {
    try {
      await logSecurityEvent(eventType as any, details);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  destroy(): void {
    // Clear timeouts
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
    
    // Clear activity listeners
    this.activityListeners.forEach(cleanup => cleanup());
    this.activityListeners = [];
    
    // Clear session listeners
    this.sessionListeners = [];
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export utility functions
export const initializeSessionManager = () => sessionManager.initialize();
export const validateCurrentSession = () => sessionManager.validateSession();
export const extendCurrentSession = () => sessionManager.extendSession();
export const logoutCurrentSession = (reason?: string) => sessionManager.logout(reason);
export const getCurrentSession = () => sessionManager.getSession();
export const getCurrentUser = () => sessionManager.getUser();
export const isCurrentSessionValid = () => sessionManager.isSessionValid();
export const getSessionTimeRemaining = () => sessionManager.getTimeUntilExpiry();
export const onSessionChange = (callback: (session: Session | null) => void) => 
  sessionManager.onSessionChange(callback);

// React hook for session management
export const useSessionManager = () => {
  return {
    session: sessionManager.getSession(),
    user: sessionManager.getUser(),
    isValid: sessionManager.isSessionValid(),
    timeRemaining: sessionManager.getTimeUntilExpiry(),
    extendSession: sessionManager.extendSession.bind(sessionManager),
    logout: sessionManager.logout.bind(sessionManager),
    validateSession: sessionManager.validateSession.bind(sessionManager),
    requireReauth: sessionManager.requireReauth.bind(sessionManager)
  };
};
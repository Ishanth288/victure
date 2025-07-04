
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
  if (Capacitor.isNativePlatform()) {
    try {
      const impactMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
        success: ImpactStyle.Light,
        warning: ImpactStyle.Medium,
        error: ImpactStyle.Heavy
      };

      await Haptics.impact({ style: impactMap[type] });
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Prevent external navigation in native apps
export const preventExternalNavigation = () => {
  if (Capacitor.isNativePlatform()) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href, window.location.origin);
        
        // Prevent navigation to external domains
        if (url.origin !== window.location.origin) {
          e.preventDefault();
          console.log('Prevented external navigation to:', link.href);
        }
      }
    });
  }
};

// Enhanced error handling for mobile
export const handleMobileError = (error: any, context: string) => {
  console.error(`Mobile Error [${context}]:`, error);
  
  // Send haptic feedback for errors
  hapticFeedback('error');
  
  // Return user-friendly error message
  if (error?.message?.includes('network')) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  if (error?.message?.includes('auth')) {
    return 'Authentication error. Please sign in again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

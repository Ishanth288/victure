
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/supabaseErrorHandling";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  action_link?: string;
  category: 'inventory' | 'appointment' | 'prescription' | 'system' | 'billing';
}

/**
 * Fetch user notifications
 */
export async function fetchNotifications(limit = 30) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    return await executeWithRetry<Notification[]>(
      async () => {
        return await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);
      },
      { context: 'fetching notifications' }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await executeWithRetry(
      async () => {
        return await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      },
      { context: 'updating notification' }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    return await executeWithRetry(
      async () => {
        return await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      },
      { context: 'updating all notifications' }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
}

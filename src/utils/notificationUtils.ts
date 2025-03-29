
import { supabase } from "@/integrations/supabase/client";

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

// Mock notifications for testing until we have a real table
const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'current-user',
    title: 'Low inventory alert',
    message: 'Paracetamol is running low. Current stock: 15 units',
    type: 'warning',
    read: false,
    created_at: new Date().toISOString(),
    category: 'inventory'
  },
  {
    id: '2',
    user_id: 'current-user',
    title: 'Appointment reminder',
    message: 'You have an appointment with John Doe tomorrow at 10:00 AM',
    type: 'info',
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    category: 'appointment'
  },
  {
    id: '3',
    user_id: 'current-user',
    title: 'Prescription filled',
    message: 'Prescription #1234 has been successfully filled',
    type: 'success',
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    category: 'prescription'
  }
];

/**
 * Fetch user notifications
 * This is a mock implementation until we create the notifications table
 */
export async function fetchNotifications(limit = 30) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'User not authenticated' };

    // Mock notifications response
    return { 
      data: mockNotifications.map(n => ({
        ...n,
        user_id: user.id
      })), 
      error: null 
    };
    
    // Real implementation would be:
    // return await supabase
    //   .from('notifications')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false })
    //   .limit(limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
}

/**
 * Mark notification as read
 * This is a mock implementation until we create the notifications table
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    // Mock implementation
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      mockNotifications[index].read = true;
    }
    
    return { data: { success: true }, error: null };
    
    // Real implementation would be:
    // return await supabase
    //   .from('notifications')
    //   .update({ read: true })
    //   .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

/**
 * Mark all notifications as read
 * This is a mock implementation until we create the notifications table
 */
export async function markAllNotificationsAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    // Mock implementation
    mockNotifications.forEach(notification => {
      if (notification.user_id === user.id) {
        notification.read = true;
      }
    });
    
    return { data: { success: true }, error: null };
    
    // Real implementation would be:
    // return await supabase
    //   .from('notifications')
    //   .update({ read: true })
    //   .eq('user_id', user.id)
    //   .eq('read', false);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
}

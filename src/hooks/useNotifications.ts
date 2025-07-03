
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/notification';
import { showNotificationToast, checkProjectDeadlines } from '@/utils/notificationUtils';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Fetch user's notifications
  const { 
    data: notifications = [],
    isLoading,
    refetch 
  } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filter notifications based on user role
        let filteredNotifications = data || [];
        
        if (user.role === 'admin') {
          filteredNotifications = filteredNotifications.filter(
            n => n.recipient_role === 'admin'
          );
        } else {
          filteredNotifications = filteredNotifications.filter(
            n => n.recipient_id === user.id
          );
        }
        
        console.log("Filtered notifications:", filteredNotifications);
        
        // Transform the data to match our Notification interface, handling optional fields
        return filteredNotifications.map(n => ({
          ...n,
          priority: n.priority || 'medium',
          icon: n.icon || null,
          action_url: n.action_url || null
        })) as Notification[];
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  // Check for new assignments
  const checkForNewAssignments = async () => {
    if (!user || user.role !== 'freelancer') return;
    
    try {
      const { data: newAssignments, error } = await supabase
        .from('projects')
        .select('*')
        .eq('assigned_to', user.id)
        .gt('updated_at', lastCheck.toISOString());

      if (error) throw error;
      
      if (newAssignments && newAssignments.length > 0) {
        newAssignments.forEach(project => {
          showNotificationToast(
            `New project assignment: ${project.title}. You have 24 hours to respond.`,
            'assignment',
            'high',
            `/project/${project.id}`
          );
        });
        
        queryClient.invalidateQueries({ queryKey: ['assignedProjects', user.id] });
      }
    } catch (error) {
      console.error("Error checking for new assignments:", error);
    }
    
    setLastCheck(new Date());
  };

  // Check for new notifications
  const checkForNewNotifications = async () => {
    if (!user) return;
    
    try {
      const { data: newNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .gt('created_at', lastCheck.toISOString())
        .eq('read', false);
        
      if (error) throw error;
      
      let filteredNotifications = newNotifications || [];
      
      if (user.role === 'admin') {
        filteredNotifications = filteredNotifications.filter(
          n => n.recipient_role === 'admin'
        );
      } else {
        filteredNotifications = filteredNotifications.filter(
          n => n.recipient_id === user.id
        );
      }
      
      if (filteredNotifications.length > 0) {
        filteredNotifications.forEach(notification => {
          showNotificationToast(
            notification.message,
            notification.notification_type,
            (notification.priority as any) || 'medium',
            notification.action_url || (notification.project_id ? `/project/${notification.project_id}` : undefined)
          );
        });
        
        refetch();
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error);
    }
  };

  // Setup real-time subscription for notifications
  useEffect(() => {
    if (!user) return;
    
    const notificationChannel = supabase
      .channel('notification-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
      }, (payload) => {
        console.log('New notification:', payload);
        
        const notification = payload.new as Notification;
        let isForCurrentUser = false;
        
        if (user.role === 'admin' && notification.recipient_role === 'admin') {
          isForCurrentUser = true;
        } else if (notification.recipient_id === user.id) {
          isForCurrentUser = true;
        }
        
        if (isForCurrentUser) {
          showNotificationToast(
            notification.message,
            notification.notification_type,
            notification.priority,
            notification.action_url || (notification.project_id ? `/project/${notification.project_id}` : undefined)
          );
          refetch();
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user, refetch]);

  // Background tasks polling
  useEffect(() => {
    if (!user) return;
    
    const runBackgroundTasks = async () => {
      await checkForNewAssignments();
      await checkForNewNotifications();
      
      // Only admins run deadline monitoring
      if (user.role === 'admin') {
        await checkProjectDeadlines();
      }
    };
    
    // Initial run
    runBackgroundTasks();
    
    // Set up polling every 30 seconds
    const interval = setInterval(runBackgroundTasks, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Get notifications by priority
  const getNotificationsByPriority = (priority: string) => {
    return notifications.filter(n => n.priority === priority);
  };

  // Get unread count by priority
  const getUnreadCountByPriority = (priority: string) => {
    return notifications.filter(n => !n.read && n.priority === priority).length;
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    urgentCount: getUnreadCountByPriority('urgent'),
    highPriorityCount: getUnreadCountByPriority('high'),
    isLoading,
    refetch,
    markAsRead,
    getNotificationsByPriority,
    getUnreadCountByPriority
  };
}


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationCreateInput, NotificationPriority, ProjectWithDeadlineTracking } from "@/types/notification";
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, User, Zap } from "lucide-react";

// Map notification types to icons
const getNotificationIcon = (type: string, customIcon?: string) => {
  if (customIcon) return customIcon;
  
  const iconMap: Record<string, string> = {
    'proposal_submitted': 'clipboard',
    'proposal_accepted': 'check-circle',
    'proposal_rejected': 'x-circle',
    'assignment': 'user',
    'assignment_accepted': 'check-circle',
    'assignment_declined': 'x-circle',
    'project_submitted': 'clipboard',
    'deadline_reminder': 'clock',
    'deadline_warning': 'alert-triangle',
    'deadline_passed': 'alert-triangle',
    'default': 'bell'
  };
  
  return iconMap[type] || iconMap.default;
};

// Map priority to toast styling
const getPriorityToastOptions = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        duration: 8000,
        style: { border: '2px solid #ef4444', backgroundColor: '#fef2f2' }
      };
    case 'high':
      return {
        duration: 6000,
        style: { border: '2px solid #f59e0b', backgroundColor: '#fffbeb' }
      };
    case 'medium':
      return {
        duration: 4000,
        style: { border: '1px solid #6b7280' }
      };
    case 'low':
      return {
        duration: 3000,
        style: { opacity: 0.8 }
      };
    default:
      return { duration: 4000 };
  }
};

// Enhanced notification creation
export const createNotification = async (input: NotificationCreateInput) => {
  try {
    const icon = getNotificationIcon(input.notificationType, input.icon);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: input.recipientId,
        recipient_role: input.recipientRole,
        message: input.message,
        notification_type: input.notificationType,
        project_id: input.projectId,
        priority: input.priority || 'medium',
        icon,
        action_url: input.actionUrl,
        read: false
      })
      .select();
      
    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error };
  }
};

// Show enhanced toast notification
export const showNotificationToast = (
  message: string,
  type: string,
  priority: NotificationPriority = 'medium',
  actionUrl?: string
) => {
  const icon = getNotificationIcon(type);
  const options = getPriorityToastOptions(priority);
  
  toast(
    type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    {
      description: message,
      ...options,
      action: actionUrl ? {
        label: "View",
        onClick: () => window.location.href = actionUrl
      } : undefined
    }
  );
};

// Deadline monitoring utility
export const checkProjectDeadlines = async () => {
  try {
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'in_progress')
      .not('deadline', 'is', null);

    if (error) throw error;

    // Cast to our extended type to handle the new fields
    const projects = projectsData as ProjectWithDeadlineTracking[];

    for (const project of projects || []) {
      const deadline = new Date(project.deadline!);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before deadline
      if (daysUntilDeadline === 3 && !project.deadline_reminder_sent) {
        await createNotification({
          recipientId: project.assigned_to,
          message: `Reminder: Project "${project.title}" is due in 3 days`,
          notificationType: 'deadline_reminder',
          projectId: project.id,
          priority: 'medium',
          actionUrl: `/project/${project.id}`
        });

        // Mark reminder as sent - use raw query to avoid TypeScript issues
        await supabase.rpc('update_project_deadline_flag', {
          project_id: project.id,
          flag_name: 'deadline_reminder_sent',
          flag_value: true
        });
      }

      // Send warning 1 day before deadline
      if (daysUntilDeadline === 1 && !project.deadline_warning_sent) {
        await createNotification({
          recipientId: project.assigned_to,
          message: `Warning: Project "${project.title}" is due tomorrow!`,
          notificationType: 'deadline_warning',
          projectId: project.id,
          priority: 'high',
          actionUrl: `/project/${project.id}`
        });

        // Notify admin
        await createNotification({
          recipientRole: 'admin',
          message: `Project "${project.title}" deadline is tomorrow`,
          notificationType: 'deadline_warning',
          projectId: project.id,
          priority: 'high',
          actionUrl: `/project/${project.id}`
        });

        // Mark warning as sent - use raw query to avoid TypeScript issues
        await supabase.rpc('update_project_deadline_flag', {
          project_id: project.id,
          flag_name: 'deadline_warning_sent',
          flag_value: true
        });
      }

      // Send alert if deadline has passed
      if (daysUntilDeadline < 0) {
        await createNotification({
          recipientRole: 'admin',
          message: `Project "${project.title}" deadline has passed (${Math.abs(daysUntilDeadline)} days overdue)`,
          notificationType: 'deadline_passed',
          projectId: project.id,
          priority: 'urgent',
          actionUrl: `/project/${project.id}`
        });

        // Notify client
        await createNotification({
          recipientId: project.client_id,
          message: `Your project "${project.title}" deadline has passed`,
          notificationType: 'deadline_passed',
          projectId: project.id,
          priority: 'high',
          actionUrl: `/project/${project.id}`
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking project deadlines:", error);
    return { success: false, error };
  }
};

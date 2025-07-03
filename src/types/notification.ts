
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  project_id: string;
  message: string;
  created_at: string;
  read: boolean;
  notification_type: string;
  priority: NotificationPriority;
  icon?: string;
  action_url?: string;
  recipient_id?: string;
  recipient_role?: string;
  sender_id?: string;
}

export interface NotificationCreateInput {
  recipientId?: string | null;
  recipientRole?: string;
  message: string;
  notificationType: string;
  projectId?: string;
  priority?: NotificationPriority;
  icon?: string;
  actionUrl?: string;
}

// Extended project type to include deadline tracking fields
export interface ProjectWithDeadlineTracking {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
  assigned_to: string | null;
  client_id: string;
  deadline_reminder_sent?: boolean;
  deadline_warning_sent?: boolean;
  [key: string]: any; // Allow other project fields
}

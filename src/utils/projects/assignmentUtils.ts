
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/utils/notificationUtils";

export type ProjectStatus = "pending_approval" | "open" | "in_progress" | "completed" | "canceled";

// Check for expired assignments
export const checkExpiredAssignments = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'in_progress');
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} active projects to check for expiration`);
    }
    
    return { success: true, data, message: "Successfully checked for expired assignments" };
  } catch (error) {
    console.error("Error checking for expired assignments:", error);
    return { success: false, error, message: "Failed to check expired assignments" };
  }
};

// Assign a project to a freelancer
export const assignProject = async (projectId: string, freelancerId: string) => {
  try {
    if (!projectId || !freelancerId) {
      toast.error("Missing project or freelancer information");
      return { success: false, error: new Error("Missing required information"), message: "Missing required information" };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      toast.error("You must be logged in to assign a project");
      return { success: false, error: new Error("No active session"), message: "No active session" };
    }
    
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userProfile || userProfile.role !== 'admin') {
      toast.error("You don't have permission to assign projects");
      return { success: false, error: new Error("Insufficient permissions"), message: "Insufficient permissions" };
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update({
        assigned_to: freelancerId,
        status: 'in_progress',
        available_for_bidding: false
      })
      .eq('id', projectId)
      .select();
      
    if (error) throw error;
    
    // Get project title for notification
    const project = data[0];
    
    // Create enhanced notification for the freelancer
    await createNotification({
      recipientId: freelancerId,
      message: `A project "${project?.title || 'Untitled'}" has been assigned to you by an admin. You have 24 hours to respond.`,
      notificationType: 'assignment',
      projectId,
      priority: 'high',
      actionUrl: `/project/${projectId}`
    });
    
    return { success: true, data, message: "Project assigned successfully" };
  } catch (error: any) {
    console.error("Error assigning project:", error);
    toast.error(`Error assigning project: ${error.message}`);
    return { success: false, error, message: `Error assigning project: ${error.message}` };
  }
};

// Respond to a project assignment
export const respondToAssignment = async (projectId: string, accepted: boolean) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      toast.error("You must be logged in to respond to a project assignment");
      return { success: false, error: new Error("No active session"), message: "No active session" };
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('assigned_to', session.user.id)
      .single();
      
    if (projectError || !project) {
      toast.error("Project not found or not assigned to you");
      return { success: false, error: projectError || new Error("Project not found"), message: "Project not found or not assigned to you" };
    }
    
    const newStatus: ProjectStatus = accepted ? 'in_progress' : 'open';
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: newStatus,
        assigned_to: accepted ? session.user.id : null,
      })
      .eq('id', projectId)
      .select();
      
    if (error) throw error;
    
    const { data: freelancerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();
    
    const freelancerName = freelancerProfile?.full_name || "A freelancer";
    
    // Notify admin users about the decision
    await createNotification({
      recipientRole: 'admin',
      message: `${freelancerName} has ${accepted ? 'accepted' : 'declined'} project "${project.title}"`,
      notificationType: accepted ? 'assignment_accepted' : 'assignment_declined',
      projectId,
      priority: accepted ? 'medium' : 'high',
      actionUrl: `/project/${projectId}`
    });
    
    // Notify the client about the decision
    if (project.client_id) {
      await createNotification({
        recipientId: project.client_id,
        message: `A freelancer has ${accepted ? 'accepted' : 'declined'} your project "${project.title}"`,
        notificationType: accepted ? 'assignment_accepted' : 'assignment_declined',
        projectId,
        priority: accepted ? 'medium' : 'high',
        actionUrl: `/project/${projectId}`
      });
    }
    
    return { success: true, data, message: `Project ${accepted ? 'accepted' : 'declined'} successfully` };
  } catch (error: any) {
    console.error("Error responding to assignment:", error);
    toast.error(`Error: ${error.message}`);
    return { success: false, error, message: `Error: ${error.message}` };
  }
};

// Submit project work
export const submitProjectWork = async (
  projectId: string, 
  submissionUrl: string, 
  submissionNotes: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      toast.error("You must be logged in to submit project work");
      return { success: false, error: new Error("No active session"), message: "No active session" };
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('assigned_to', session.user.id)
      .single();
      
    if (projectError || !project) {
      toast.error("Project not found or not assigned to you");
      return { success: false, error: projectError || new Error("Project not found"), message: "Project not found or not assigned to you" };
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update({
        submission_url: submissionUrl,
        submission_notes: submissionNotes,
        submission_date: new Date().toISOString(),
        submission_status: 'submitted',
        status: 'completed'
      })
      .eq('id', projectId)
      .select();
      
    if (error) throw error;
    
    const { data: freelancerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();
    
    const freelancerName = freelancerProfile?.full_name || "A freelancer";
    
    // Notify admin users about the submission
    await createNotification({
      recipientRole: 'admin',
      message: `${freelancerName} has submitted work for project "${project.title}"`,
      notificationType: 'project_submitted',
      projectId,
      priority: 'medium',
      actionUrl: `/project/${projectId}`
    });
    
    // Notify the client about the submission
    if (project.client_id) {
      await createNotification({
        recipientId: project.client_id,
        message: `Work has been submitted for your project "${project.title}"`,
        notificationType: 'project_submitted',
        projectId,
        priority: 'medium',
        actionUrl: `/project/${projectId}`
      });
    }
    
    return { 
      success: true, 
      data, 
      message: "Project work submitted successfully" 
    };
  } catch (error: any) {
    console.error("Error submitting project work:", error);
    toast.error(`Error: ${error.message}`);
    return { success: false, error, message: `Error: ${error.message}` };
  }
};

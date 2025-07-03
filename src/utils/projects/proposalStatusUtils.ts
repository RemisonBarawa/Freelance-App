
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/utils/notificationUtils";

export const updateProposalStatus = async (proposalId: string, status: 'accepted' | 'rejected') => {
  try {
    if (!proposalId) {
      console.error("Missing proposal ID");
      toast.error("Invalid proposal information");
      return { success: false, error: new Error("Missing proposal ID") };
    }
    
    console.log(`Updating proposal ${proposalId} status to ${status}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error("No active session found");
      toast.error("You must be logged in to update a proposal");
      return { success: false, error: new Error("No active session") };
    }
    
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'client')) {
      console.error("User does not have permission to update proposals");
      toast.error("You don't have permission to update proposals");
      return { success: false, error: new Error("Insufficient permissions") };
    }
    
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, project_id, freelancer_id')
      .eq('id', proposalId)
      .single();
      
    if (proposalError || !proposal) {
      console.error("Error fetching proposal:", proposalError || "Proposal not found");
      toast.error("Proposal not found");
      return { success: false, error: proposalError || new Error("Proposal not found") };
    }
    
    if (userProfile.role === 'client') {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', proposal.project_id)
        .single();
        
      if (projectError || !project || project.client_id !== session.user.id) {
        console.error("Client does not own this project");
        toast.error("You can only update proposals for your own projects");
        return { success: false, error: new Error("Not project owner") };
      }
    }
    
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status })
      .eq('id', proposalId);
    
    if (updateError) {
      console.error("Error updating proposal:", updateError);
      toast.error("Failed to update proposal status");
      return { success: false, error: updateError };
    }
    
    // Get project information for notification
    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', proposal.project_id)
      .single();
    
    if (status === 'accepted') {
      const { error: assignmentError } = await supabase
        .from('projects')
        .update({
          assigned_to: proposal.freelancer_id,
          status: 'in_progress',
          available_for_bidding: false
        })
        .eq('id', proposal.project_id);
      
      if (assignmentError) {
        console.error("Error assigning project:", assignmentError);
        toast.error("Failed to assign project to freelancer");
        return { success: true, warning: "Proposal accepted but project assignment failed" };
      }
      
      // Send enhanced notification to the freelancer
      await createNotification({
        recipientId: proposal.freelancer_id,
        message: `Your proposal for "${project?.title || 'a project'}" has been accepted! You can now submit work for this project.`,
        notificationType: 'proposal_accepted',
        projectId: proposal.project_id,
        priority: 'high',
        actionUrl: `/project/${proposal.project_id}`
      });
      
      // Notify admin about the proposal acceptance
      await createNotification({
        recipientRole: 'admin',
        message: `A proposal for project "${project?.title || 'a project'}" has been accepted by a client.`,
        notificationType: 'proposal_accepted_by_client',
        projectId: proposal.project_id,
        priority: 'medium',
        actionUrl: `/project/${proposal.project_id}`
      });
      
      // Reject all other proposals for this project
      await supabase
        .from('proposals')
        .update({ status: 'rejected' })
        .eq('project_id', proposal.project_id)
        .neq('id', proposalId);
    } else if (status === 'rejected') {
      // Send enhanced notification to the freelancer
      await createNotification({
        recipientId: proposal.freelancer_id,
        message: `Your proposal for "${project?.title || 'a project'}" has been rejected.`,
        notificationType: 'proposal_rejected',
        projectId: proposal.project_id,
        priority: 'medium',
        actionUrl: `/project/${proposal.project_id}`
      });
    }
    
    return { 
      success: true, 
      message: `Proposal ${status} successfully`
    };
  } catch (error: any) {
    console.error("Error in updateProposalStatus:", error);
    toast.error(`Error updating proposal: ${error.message}`);
    return { success: false, error };
  }
};

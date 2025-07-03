
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProposalSubmission {
  projectId: string;
  freelancerId: string;
  bidAmount: number;
  estimatedDays?: number;
  coverLetter?: string;
}

export const submitProposal = async (proposal: ProposalSubmission) => {
  try {
    if (!proposal.projectId || !proposal.freelancerId || !proposal.bidAmount) {
      console.error("Missing required proposal details");
      toast.error("Please fill in all required fields");
      return { success: false, error: new Error("Missing required proposal details") };
    }
    
    console.log(`Submitting proposal for project ${proposal.projectId} by freelancer ${proposal.freelancerId}`);
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error("No active session found");
      toast.error("You must be logged in to submit a proposal");
      return { success: false, error: new Error("No active session") };
    }
    
    // Verify the user is a freelancer and is submitting for themselves
    if (session.user.id !== proposal.freelancerId) {
      console.error("User does not match the freelancer ID");
      toast.error("You can only submit proposals for your own account");
      return { success: false, error: new Error("Invalid freelancer ID") };
    }
    
    // Check if the project exists and is open for bidding
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, available_for_bidding, status, assigned_to')
      .eq('id', proposal.projectId)
      .single();
      
    if (projectError || !project) {
      console.error("Error checking project:", projectError || "Project not found");
      toast.error("Project not found or access denied");
      return { success: false, error: projectError || new Error("Project not found") };
    }
    
    if (!project.available_for_bidding || project.status !== 'open' || project.assigned_to) {
      console.error("Project is not available for bidding");
      toast.error("This project is not open for proposals at this time");
      return { success: false, error: new Error("Project not available for bidding") };
    }
    
    // Check if the freelancer already submitted a proposal for this project
    const { data: existingProposal, error: existingProposalError } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('project_id', proposal.projectId)
      .eq('freelancer_id', proposal.freelancerId)
      .maybeSingle();
    
    if (existingProposal) {
      console.error("Freelancer already submitted a proposal for this project");
      toast.error("You've already submitted a proposal for this project");
      return { success: false, error: new Error("Proposal already exists") };
    }
    
    // Submit the proposal
    const { data: submittedProposal, error: submissionError } = await supabase
      .from('proposals')
      .insert({
        project_id: proposal.projectId,
        freelancer_id: proposal.freelancerId,
        bid_amount: proposal.bidAmount,
        estimated_days: proposal.estimatedDays || null,
        cover_letter: proposal.coverLetter || null,
        status: 'pending'
      })
      .select('*')
      .single();
    
    if (submissionError) {
      console.error("Error submitting proposal:", submissionError);
      toast.error("Failed to submit proposal: " + submissionError.message);
      return { success: false, error: submissionError };
    }
    
    toast.success("Your proposal has been submitted successfully");
    return { 
      success: true, 
      data: submittedProposal,
      message: "Proposal submitted successfully"
    };
  } catch (error: any) {
    console.error("Error in submitProposal:", error);
    toast.error(`Error submitting proposal: ${error.message}`);
    return { success: false, error };
  }
};

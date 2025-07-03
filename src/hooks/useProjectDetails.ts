
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectWithClient, ProposalWithFreelancer } from "@/types/project";
import { useAuth } from "@/contexts/AuthContext";

export function useProjectDetails(projectId: string | undefined) {
  const { user } = useAuth();

  // Fetch project details
  const { 
    data: project, 
    isLoading: projectLoading, 
    refetch: refetchProject 
  } = useQuery<ProjectWithClient | null>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!projectId) return null;
        
        // Modified query to avoid the foreign key relationship error
        const { data, error } = await supabase
          .from('projects')
          .select('*, submission_url, submission_notes, submission_date, submission_status')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        
        // If project exists, fetch client information separately
        if (data && data.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.client_id)
            .single();
          
          if (!clientError && clientData) {
            // Add client profile data to the project object
            return { ...data, profiles: clientData } as ProjectWithClient;
          }
        }
        
        return data as ProjectWithClient;
      } catch (error: any) {
        console.error('Error fetching project:', error);
        toast.error("Could not load project details");
        return null;
      }
    },
    enabled: !!projectId
  });

  // Check if user has submitted a proposal
  const { 
    data: userProposal, 
    isLoading: userProposalLoading 
  } = useQuery({
    queryKey: ['userProposal', projectId, user?.id],
    queryFn: async () => {
      if (!user || !projectId) return null;
      
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('project_id', projectId)
          .eq('freelancer_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error('Error checking user proposal:', error);
        return null;
      }
    },
    enabled: !!projectId && !!user
  });

  // Get all proposals for the project (for project owner or admins)
  const { 
    data: projectProposals, 
    isLoading: projectProposalsLoading, 
    refetch: refetchProposals 
  } = useQuery<ProposalWithFreelancer[]>({
    queryKey: ['projectProposals', projectId],
    queryFn: async () => {
      if (!user || !projectId || !project) return [];
      
      try {
        // Check if the user is the project owner or an admin
        const isOwner = project.client_id === user.id;
        
        if (!isOwner) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (!userProfile || userProfile.role !== 'admin') {
            return [];
          }
        }
        
        // Modified query to avoid the foreign key relationship error
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Fetch freelancer information separately for each proposal
        const proposalsWithFreelancers = await Promise.all(
          (data || []).map(async (proposal) => {
            if (proposal.freelancer_id) {
              const { data: freelancerData } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone_number')
                .eq('id', proposal.freelancer_id)
                .single();
                
              return {
                ...proposal,
                freelancer: freelancerData ? {
                  id: proposal.freelancer_id,
                  profiles: freelancerData
                } : null
              };
            }
            return proposal;
          })
        );
        
        return proposalsWithFreelancers as ProposalWithFreelancer[];
      } catch (error: any) {
        console.error('Error fetching project proposals:', error);
        return [];
      }
    },
    enabled: !!projectId && !!user && !!project
  });

  // Calculate permission flags
  const isProjectOwner = project?.client_id === user?.id;
  const canViewProposals = isProjectOwner || user?.role === 'admin';
  const hasSubmittedProposal = !!userProposal;
  const isAssignedToUser = project?.assigned_to === user?.id;
  const canSubmitProposal = user?.role === 'freelancer' && 
                          project?.available_for_bidding && 
                          project?.status === 'open' &&
                          !project?.assigned_to &&
                          !hasSubmittedProposal;
                          
  // Check if user can submit work
  const canSubmitWork = isAssignedToUser && 
                       project?.status === 'in_progress' &&
                       project?.submission_status !== 'submitted';

  return {
    project,
    projectLoading,
    refetchProject,
    userProposal,
    userProposalLoading,
    projectProposals,
    projectProposalsLoading,
    refetchProposals,
    // Permissions and state
    isProjectOwner,
    canViewProposals,
    hasSubmittedProposal,
    canSubmitProposal,
    isAssignedToUser,
    canSubmitWork
  };
}

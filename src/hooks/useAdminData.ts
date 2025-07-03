import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { AppUser, ProjectWithOwner, ProposalWithDetails } from "../types/admin";
import { UserRole } from "../types/auth";
import { toast } from "sonner";
import { updateProposalStatus } from "@/utils/projects";

export const useAdminData = () => {
  const { user, isAuthenticated } = useAuth();

  // Fetch users
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) throw error;
        
        const usersWithEmails: AppUser[] = await Promise.all(
          profiles.map(async (profile) => {
            const { data: emailData, error: emailError } = await supabase
              .functions.invoke('get_user_email', {
                body: { user_id: profile.id }
              });
            
            let email = null;
            if (!emailError && Array.isArray(emailData) && emailData.length > 0) {
              email = emailData[0].email;
            }

            return {
              id: profile.id,
              name: profile.full_name || '',
              email: email || profile.email || 'Email not available',
              phone: profile.phone_number || 'Not provided',
              role: (profile.role as UserRole) || 'client',
            };
          })
        );
        
        return usersWithEmails;
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });
  
  // Fetch projects with enhanced relations
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    refetch: refetchProjects 
  } = useQuery({
    queryKey: ['adminProjects'],
    queryFn: async () => {
      try {
        // Fix the query to use simpler approach - don't use foreign key hints
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');
          
        if (projectsError) throw projectsError;
        
        // Fetch client names separately
        const clientIds = projectsData
          .map(project => project.client_id)
          .filter(Boolean);
        
        let clientNames: Record<string, string> = {};
        let freelancerNames: Record<string, string> = {};
        
        if (clientIds.length > 0) {
          const { data: clientsData, error: clientsError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
            
          if (!clientsError && clientsData) {
            clientNames = clientsData.reduce((acc: Record<string, string>, client) => {
              acc[client.id] = client.full_name || 'Unknown';
              return acc;
            }, {});
          }
        }
        
        // Fetch freelancer names for assigned projects
        const freelancerIds = projectsData
          .map(project => project.assigned_to)
          .filter(Boolean);
          
        if (freelancerIds.length > 0) {
          const { data: freelancersData, error: freelancersError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', freelancerIds);
            
          if (!freelancersError && freelancersData) {
            freelancerNames = freelancersData.reduce((acc: Record<string, string>, freelancer) => {
              acc[freelancer.id] = freelancer.full_name || 'Unknown';
              return acc;
            }, {});
          }
        }
        
        return projectsData.map((project: any) => ({
          ...project,
          ownerName: project.client_id ? clientNames[project.client_id] || 'Unknown' : 'Unknown',
          freelancerName: project.assigned_to ? freelancerNames[project.assigned_to] || null : null
        })) as ProjectWithOwner[];
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to fetch projects');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });
  
  // Fetch proposals with enhanced debugging
  const { 
    data: proposals = [], 
    isLoading: proposalsLoading, 
    refetch: refetchProposals 
  } = useQuery({
    queryKey: ['adminProposals'],
    queryFn: async () => {
      try {
        console.log("Fetching admin proposals...");
        // Get all proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*');
          
        if (proposalsError) {
          console.error("Error fetching proposals:", proposalsError);
          throw proposalsError;
        }
        
        console.log(`Found ${proposalsData ? proposalsData.length : 0} proposals`);
        
        if (!proposalsData || proposalsData.length === 0) {
          return [];
        }
        
        // Get all relevant project IDs
        const projectIds = proposalsData.map(proposal => proposal.project_id).filter(Boolean);
        console.log(`Project IDs to fetch: ${projectIds.length}`);
        
        // Get project titles
        let projectTitles: Record<string, string> = {};
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, title')
            .in('id', projectIds);
            
          if (projectsError) {
            console.error("Error fetching project titles:", projectsError);
          }
          
          if (projectsData) {
            console.log(`Found ${projectsData.length} projects for titles`);
            projectTitles = projectsData.reduce((acc: Record<string, string>, project) => {
              acc[project.id] = project.title;
              return acc;
            }, {});
          }
        }
        
        // Get freelancer information
        const freelancerIds = proposalsData.map(proposal => proposal.freelancer_id).filter(Boolean);
        console.log(`Freelancer IDs to fetch: ${freelancerIds.length}`);
        
        let freelancerInfo: Record<string, { name: string; phone?: string }> = {};
        if (freelancerIds.length > 0) {
          const { data: freelancersData, error: freelancersError } = await supabase
            .from('profiles')
            .select('id, full_name, phone_number')
            .in('id', freelancerIds);
            
          if (freelancersError) {
            console.error("Error fetching freelancer info:", freelancersError);
          }
          
          if (freelancersData) {
            console.log(`Found ${freelancersData.length} freelancers for info`);
            freelancerInfo = freelancersData.reduce((acc: Record<string, { name: string; phone?: string }>, freelancer) => {
              acc[freelancer.id] = {
                name: freelancer.full_name || 'Unknown',
                phone: freelancer.phone_number
              };
              return acc;
            }, {});
          }
        }
        
        const proposalsWithDetails = proposalsData.map((proposal: any) => {
          // Initialize with default values to ensure type safety
          const freelancer = proposal.freelancer_id && freelancerInfo[proposal.freelancer_id] 
            ? freelancerInfo[proposal.freelancer_id] 
            : { name: 'Unknown Freelancer', phone: undefined };
          
          return {
            id: proposal.id,
            projectId: proposal.project_id,
            projectTitle: proposal.project_id ? projectTitles[proposal.project_id] || 'Unknown Project' : 'Unknown Project',
            freelancerId: proposal.freelancer_id,
            freelancerName: freelancer.name,
            freelancerPhone: freelancer.phone,
            bidAmount: proposal.bid_amount,
            estimatedDays: proposal.estimated_days,
            status: proposal.status,
            coverLetter: proposal.cover_letter,
            createdAt: proposal.created_at
          };
        });
        
        console.log(`Processed ${proposalsWithDetails.length} proposals with details`);
        return proposalsWithDetails as ProposalWithDetails[];
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toast.error('Failed to fetch proposals');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });

  // Handle proposal status update
  const handleProposalStatusUpdate = async (proposalId: string, status: 'accepted' | 'rejected') => {
    try {
      console.log(`Updating proposal ${proposalId} to status: ${status}`);
      
      // Use the utility function instead of directly updating the proposal
      const result = await updateProposalStatus(proposalId, status);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update proposal status');
      }

      toast.success(`Proposal ${status} successfully`);
      refetchProposals();
      
      // If accepted, also refetch projects to see assignment changes
      if (status === 'accepted') {
        refetchProjects();
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal status');
    }
  };

  return {
    users,
    projects,
    proposals,
    usersLoading,
    projectsLoading,
    proposalsLoading,
    refetchUsers,
    refetchProjects,
    refetchProposals,
    handleProposalStatusUpdate,
    isLoading: usersLoading || projectsLoading || proposalsLoading
  };
};

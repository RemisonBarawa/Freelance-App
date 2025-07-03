import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Briefcase, 
  Building, 
  ChevronRight, 
  MessageSquare,
  Bell
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProjectCard from "@/components/ProjectCard";
import { ProjectWithClientName } from "@/types/admin";
import AssignmentItem from "@/components/AssignmentItem";
import { useNotifications } from "@/hooks/useNotifications";

interface ProposalWithProject {
  id: string;
  project_id: string;
  freelancer_id: string;
  bid_amount: number;
  estimated_days?: number;
  status: string;
  cover_letter?: string;
  created_at: string;
  updated_at?: string;
  projectDetails?: {
    title: string;
    status: string;
    budget_min?: number;
    budget_max?: number;
    submission_status?: string;
  };
  isAccepted?: boolean;
}

interface AssignmentItemProps {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max?: number;
  client_name?: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  status: string;
  submission_status?: string; // Add this property to match the expected type
}

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access the dashboard");
      navigate("/auth?mode=login");
      return;
    }
    
    // Only freelancers should access this dashboard
    if (user?.role !== "freelancer") {
      toast.error("You don't have access to this dashboard");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch assigned projects - modified to avoid the foreign key error
  const { 
    data: assignedProjects = [], 
    isLoading: assignedProjectsLoading, 
    refetch: refetchAssigned
  } = useQuery({
    queryKey: ['assignedProjects', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        // Debug the user ID to confirm it's correct
        console.log("Current user ID:", user.id);
        
        // Modified query to avoid the join operation that's causing the error
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('assigned_to', user.id);
        
        console.log("Assigned projects query result:", { data: projectsData, error });
        
        if (error) throw error;
        
        // Get client names separately if needed
        const clientIds = projectsData.map(project => project.client_id).filter(Boolean);
        let clientProfiles = {};
        
        if (clientIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
            
          if (profilesData) {
            clientProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile.full_name || 'Unknown Client';
              return acc;
            }, {});
          }
        }
        
        return projectsData.map(project => {
          const clientName = project.client_id ? 
            (clientProfiles[project.client_id] || 'Unknown Client') : 
            'Unknown Client';
          
          return {
            id: project.id,
            title: project.title,
            description: project.description || '',
            budget_min: project.budget_min || 0,
            budget_max: project.budget_max || undefined,
            status: project.status || 'open',
            created_at: project.created_at,
            updated_at: project.updated_at,
            client_id: project.client_id,
            category_id: project.category_id,
            assigned_to: project.assigned_to,
            available_for_bidding: project.available_for_bidding,
            submission_status: project.submission_status || 'pending',
            client_name: clientName
          } as ProjectWithClientName;
        });
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
        toast.error("Failed to load assigned projects");
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'freelancer',
    refetchInterval: 10000 // Refetch every 10 seconds to get updates
  });
  
  // Fetch available projects - modified to avoid the foreign key error
  const { data: availableProjects = [], isLoading: availableProjectsLoading } = useQuery({
    queryKey: ['availableProjects'],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        // Modified query to avoid the join operation
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('available_for_bidding', true)
          .eq('status', 'open')
          .is('assigned_to', null);
        
        console.log("Available projects query result:", { data: projectsData, error });
        
        if (error) throw error;
        
        // Get client names separately if needed
        const clientIds = projectsData.map(project => project.client_id).filter(Boolean);
        let clientProfiles = {};
        
        if (clientIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
            
          if (profilesData) {
            clientProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile.full_name || 'Unknown Client';
              return acc;
            }, {});
          }
        }
        
        return projectsData.map(project => {
          const clientName = project.client_id ? 
            (clientProfiles[project.client_id] || 'Unknown Client') : 
            'Unknown Client';
          
          return {
            id: project.id,
            title: project.title,
            description: project.description || '',
            budget_min: project.budget_min || 0,
            budget_max: project.budget_max || undefined,
            status: project.status || 'open',
            created_at: project.created_at,
            updated_at: project.updated_at,
            client_id: project.client_id,
            category_id: project.category_id,
            assigned_to: project.assigned_to,
            available_for_bidding: project.available_for_bidding,
            client_name: clientName
          } as ProjectWithClientName;
        });
      } catch (error) {
        console.error("Error fetching available projects:", error);
        toast.error("Failed to load available projects");
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'freelancer'
  });
  
  // Fetch proposals submitted by the current freelancer
  const { 
    data: proposals = [], 
    isLoading: proposalsLoading,
    refetch: refetchProposals 
  } = useQuery({
    queryKey: ['freelancerProposals', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        // First, fetch the proposals
        const { data: proposalsData, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('freelancer_id', user.id);
        
        if (error) throw error;
        
        console.log("Freelancer proposals:", proposalsData);
        
        // If there are proposals, fetch the related projects
        if (proposalsData.length > 0) {
          const projectIds = proposalsData.map(proposal => proposal.project_id).filter(Boolean);
          
          if (projectIds.length > 0) {
            const { data: projectsData } = await supabase
              .from('projects')
              .select('id, title, status, budget_min, budget_max, assigned_to, submission_status')
              .in('id', projectIds);
              
            // Create a lookup map for projects
            const projectsMap = {};
            if (projectsData) {
              projectsData.forEach(project => {
                projectsMap[project.id] = project;
              });
            }
            
            // Attach project data to each proposal
            return proposalsData.map(proposal => {
              const projectDetails = projectsMap[proposal.project_id] || null;
              // Check if this proposal was accepted (project is assigned to this freelancer)
              const isAccepted = projectDetails && projectDetails.assigned_to === user.id;
              
              return {
                ...proposal,
                projectDetails,
                isAccepted
              } as ProposalWithProject;
            });
          }
        }
        
        return proposalsData || [];
      } catch (error) {
        console.error("Error fetching proposals:", error);
        toast.error("Failed to load proposals");
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'freelancer',
    refetchInterval: 10000 // Refetch every 10 seconds to get updates
  });
  
  // Effect to check for accepted proposals and refresh assigned projects
  useEffect(() => {
    if (proposals.some(p => p.status === 'accepted')) {
      console.log("Found accepted proposals, refreshing assigned projects");
      refetchAssigned();
    }
  }, [proposals, refetchAssigned]);
  
  // Setup real-time subscription for project updates
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('project-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'projects',
        filter: `assigned_to=eq.${user.id}` 
      }, (payload) => {
        console.log('Project updated:', payload);
        refetchAssigned();
        toast.info("A project has been updated!");
      })
      .subscribe();
      
    // Also subscribe to proposal updates
    const proposalChannel = supabase
      .channel('proposal-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'proposals',
        filter: `freelancer_id=eq.${user.id}` 
      }, (payload) => {
        console.log('Proposal updated:', payload);
        refetchProposals();
        if (payload.new?.status === 'accepted') {
          toast.success("Your proposal has been accepted!");
          refetchAssigned();
        } else if (payload.new?.status === 'rejected') {
          toast.error("Your proposal has been rejected.");
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(proposalChannel);
    };
  }, [user?.id, refetchAssigned, refetchProposals]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Freelancer Dashboard</h1>
            <p className="text-muted-foreground">
              Explore available projects and manage your proposals
            </p>
          </div>
          
          <div className="relative">
            <Button
              variant="outline" 
              size="icon"
              className="relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="available">
          <TabsList className="mb-6">
            <TabsTrigger value="available">
              <Briefcase className="mr-2 h-4 w-4" />
              Available Projects
            </TabsTrigger>
            <TabsTrigger value="assigned">
              <Building className="mr-2 h-4 w-4" />
              Assigned Projects 
              {assignedProjects.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                  {assignedProjects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proposals">
              <MessageSquare className="mr-2 h-4 w-4" />
              My Proposals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available">
            {availableProjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-secondary animate-pulse rounded-lg h-[280px]"></div>
                ))}
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <Briefcase size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Available Projects</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  There are currently no projects available for bidding. Check back later for new opportunities.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    clientName={project.client_name} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assigned">
            {assignedProjectsLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-secondary animate-pulse rounded-lg h-[200px]"></div>
                ))}
              </div>
            ) : assignedProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <Building size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Assigned Projects</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't been assigned to any projects yet. Keep an eye out for new opportunities.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {assignedProjects.map((project) => (
                  <AssignmentItem
                    key={project.id}
                    project={{
                      id: project.id,
                      title: project.title,
                      description: project.description,
                      budget_min: project.budget_min,
                      budget_max: project.budget_max,
                      client_name: project.client_name,
                      created_at: project.created_at,
                      updated_at: project.updated_at || project.created_at,
                      deadline: project.deadline,
                      status: project.status,
                      submission_status: project.submission_status
                    }}
                    onStatusChange={() => {
                      refetchAssigned();
                      refetchProposals();
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="proposals">
            {proposalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-secondary animate-pulse rounded-lg h-24"></div>
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <MessageSquare size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Proposals Submitted</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't submitted any proposals yet. Explore available projects and submit your proposal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => {
                  // Check if the proposal is accepted and assigned to this freelancer
                  const isAssigned = proposal.projectDetails?.assigned_to === user.id;
                  
                  return (
                    <Card key={proposal.id}>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{proposal.projectDetails?.title || 'Untitled Project'}</h3>
                          <p className="text-muted-foreground text-sm">
                            Bid Amount: ${proposal.bid_amount}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Estimated Days: {proposal.estimated_days}
                          </p>
                        </div>
                        
                        <div className="flex flex-col justify-between items-start md:items-end">
                          <div className="flex items-center">
                            <Badge className={`inline-flex items-center rounded-full font-semibold px-2.5 py-0.5 text-xs
                              ${isAssigned ? 'bg-green-100 text-green-800' :
                                proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                              {isAssigned ? 'Assigned' : proposal.status}
                            </Badge>
                            
                            {isAssigned && (
                              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800">
                                Work Required
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2 space-x-2">
                            <Button 
                              variant="link" 
                              size="sm"
                              onClick={() => navigate(`/project/${proposal.project_id}`)}
                            >
                              View Project
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                            
                            {isAssigned && (
                              <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white mt-2 md:mt-0"
                                onClick={() => navigate(`/project/${proposal.project_id}`)}
                              >
                                Submit Work
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FreelancerDashboard;

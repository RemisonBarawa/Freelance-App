
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { 
  BarChartHorizontalBig, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Plus, 
  Users, 
  XCircle 
} from "lucide-react";
import { Separator } from "../components/ui/separator";
import ProjectCard from "../components/ProjectCard";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import { ProjectWithOwner } from "@/types/admin";
import { updateProposalStatus } from "@/utils/projects/proposalStatusUtils"; 

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    pendingProposals: 0
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access the dashboard");
      navigate("/auth?mode=login");
      return;
    }
    
    // Only clients should access this dashboard
    if (user?.role !== "client" && user?.role !== "admin") {
      toast.error("You don't have access to this dashboard");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['ownerProjects', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', user.id);
        
        if (error) throw error;
        
        // Transform project data to include proposal count
        const projectIds = data.map(project => project.id);
        
        // Get proposal counts for each project
        let proposalCounts = [];
        if (projectIds.length > 0) {
          const { data: proposalData, error: countError } = await supabase
            .from('proposals')
            .select('project_id, id')
            .in('project_id', projectIds);
          
          if (!countError && proposalData) {
            // Process counts manually since group() is not available
            const countMap = new Map();
            proposalData.forEach((row: any) => {
              const projectId = row.project_id;
              if (countMap.has(projectId)) {
                countMap.set(projectId, countMap.get(projectId) + 1);
              } else {
                countMap.set(projectId, 1);
              }
            });
            
            proposalCounts = Array.from(countMap.entries()).map(
              ([project_id, count]) => ({ project_id, count })
            );
          }
        }
        
        // Create a map of project_id to proposal count
        const countMap = new Map();
        proposalCounts.forEach((item: any) => {
          countMap.set(item.project_id, item.count);
        });
        
        return data.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description || '',
          budget_min: project.budget_min || 0,
          budget_max: project.budget_max || project.budget_min || 0,
          status: project.status || 'open',
          createdAt: project.created_at,
          created_at: project.created_at,
          client_id: project.client_id,
          ownerId: project.client_id,
          ownerName: user.name,
          proposalsCount: countMap.get(project.id) || 0,
          updated_at: project.updated_at,
          assigned_to: project.assigned_to,
          available_for_bidding: project.available_for_bidding
        })) as ProjectWithOwner[];
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
        return [];
      }
    },
    enabled: !!user && isAuthenticated && (user.role === 'client' || user.role === 'admin')
  });
  
  // Fetch proposals for owner's projects
  const { data: proposals = [], isLoading: proposalsLoading, refetch: refetchProposals } = useQuery({
    queryKey: ['ownerProposals', user?.id, projects],
    queryFn: async () => {
      try {
        if (!user || projects.length === 0) return [];
        
        // Get all proposal IDs for the owner's projects
        const projectIds = projects.map(p => p.id);
        
        if (projectIds.length === 0) {
          return [];
        }
        
        // Fetch proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select('*')
          .in('project_id', projectIds);
          
        if (proposalsError) {
          console.error("Error fetching proposals:", proposalsError);
          throw proposalsError;
        }
        
        // For each proposal, fetch the related project and freelancer data separately
        const enhancedProposals = await Promise.all(
          (proposalsData || []).map(async (proposal) => {
            // Get project info
            const { data: projectData } = await supabase
              .from('projects')
              .select('title, client_id')
              .eq('id', proposal.project_id)
              .single();
              
            // Get freelancer info
            const { data: freelancerData } = await supabase
              .from('profiles')
              .select('full_name, phone_number')
              .eq('id', proposal.freelancer_id)
              .single();
              
            return {
              ...proposal,
              project: projectData || { title: 'Unknown', client_id: user.id },
              freelancer: freelancerData ? {
                id: proposal.freelancer_id,
                profiles: freelancerData
              } : null
            };
          })
        );
        
        // Filter to ensure projects belong to current user
        return enhancedProposals.filter(proposal => {
          return proposal.project?.client_id === user.id;
        });
      } catch (error) {
        console.error("Error fetching proposals:", error);
        toast.error("Failed to load proposals");
        return [];
      }
    },
    enabled: !!user && isAuthenticated && projects.length > 0 && 
             (user.role === 'client' || user.role === 'admin')
  });
  
  // Calculate stats
  useEffect(() => {
    if (projects && proposals) {
      setStats({
        totalProjects: projects.length,
        totalProposals: proposals.length,
        acceptedProposals: proposals.filter(p => p.status === 'accepted').length,
        pendingProposals: proposals.filter(p => p.status === 'pending').length
      });
    }
  }, [projects, proposals]);
  
  // Handle proposal status update
  const handleProposalStatusUpdate = async (proposalId: string, status: 'accepted' | 'rejected') => {
    try {
      console.log(`Updating proposal ${proposalId} status to ${status}`);
      
      const result = await updateProposalStatus(proposalId, status);
      
      if (result.success) {
        toast.success(`Proposal ${status} successfully`);
        // Refetch proposals to update the UI
        refetchProposals();
      } else {
        console.error(`Error ${status === 'accepted' ? 'accepting' : 'rejecting'} proposal:`, result.error);
        toast.error(`Failed to ${status} proposal. Please try again.`);
      }
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast.error("Failed to update proposal");
    }
  };
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your projects and proposals
            </p>
          </div>
          
          <Button 
            className="mt-4 sm:mt-0"
            onClick={() => navigate("/project-create")}
          >
            <Plus size={16} className="mr-2" />
            Post New Project
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-primary/10 rounded-full p-3 mr-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <h3 className="text-2xl font-bold">{stats.totalProjects}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-primary/10 rounded-full p-3 mr-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
                <h3 className="text-2xl font-bold">{stats.totalProposals}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <h3 className="text-2xl font-bold">{stats.acceptedProposals}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-yellow-100 rounded-full p-3 mr-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold">{stats.pendingProposals}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="projects" className="bg-white border rounded-lg p-6 shadow-sm">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">
              <Briefcase className="mr-2 h-4 w-4" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="proposals">
              <BarChartHorizontalBig className="mr-2 h-4 w-4" />
              Proposals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-secondary animate-pulse rounded-lg h-[280px]"></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <Briefcase size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Projects Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't created any projects yet. Get started by creating your first project listing.
                </p>
                <Button onClick={() => navigate("/project-create")}>
                  <Plus size={16} className="mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="relative">
                    <div className="absolute right-2 top-2 z-10 space-y-1">
                      {project.proposalsCount > 0 && (
                        <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                          {project.proposalsCount} proposal{project.proposalsCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {project.status === 'pending_approval' && (
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Awaiting Approval
                        </div>
                      )}
                      
                      {project.assigned_to && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Assigned
                        </div>
                      )}
                      
                      {project.available_for_bidding && (
                        <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Open for Bids
                        </div>
                      )}
                    </div>
                    <ProjectCard 
                      project={{
                        id: project.id,
                        title: project.title,
                        description: project.description || '',
                        budget_min: project.budget_min || 0,
                        budget_max: project.budget_max,
                        status: project.status || 'open',
                        created_at: project.created_at,
                        client_id: project.client_id,
                        assigned_to: project.assigned_to,
                        available_for_bidding: project.available_for_bidding,
                        client_name: user.name
                      }}
                      clientName={user.name}
                    />
                  </div>
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
                  <BarChartHorizontalBig size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Proposals Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You haven't received any proposals for your projects yet. 
                  Make sure your project descriptions are detailed and clear.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => {
                  // Handle potentially missing data safely
                  const freelancerName = proposal.freelancer?.profiles?.full_name || 'Unknown Freelancer';
                  
                  return (
                    <Card key={proposal.id}>
                      <CardHeader className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {proposal.project?.title || 'Untitled Project'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              From: {freelancerName}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 flex items-center">
                            <div className="bg-secondary/50 px-3 py-1 rounded-md text-sm mr-2">
                              <DollarSign className="inline-block h-3 w-3" />{proposal.bid_amount}
                            </div>
                            <div className={`px-3 py-1 rounded-md text-xs font-medium
                              ${proposal.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              proposal.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`
                            }>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="py-0">
                        {proposal.cover_letter && (
                          <>
                            <p className="text-sm mb-4">{proposal.cover_letter}</p>
                            <Separator className="my-4" />
                          </>
                        )}
                        
                        {proposal.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProposalStatusUpdate(proposal.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleProposalStatusUpdate(proposal.id, 'accepted')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        )}
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

export default ClientDashboard;

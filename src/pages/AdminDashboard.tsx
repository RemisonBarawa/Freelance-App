
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import AdminStats from "../components/admin/AdminStats";
import UsersList from "../components/admin/UsersList";
import ProjectsList from "../components/admin/ProjectsList";
import ProposalsList from "../components/admin/ProposalsList";
import DeleteConfirmDialog from "../components/admin/DeleteConfirmDialog";
import AssignProjectDialog from "../components/admin/AssignProjectDialog";
import ProjectApprovalDialog from "../components/admin/ProjectApprovalDialog";
import { useAdminData } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "project"; id: string } | null>(null);
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [projectToAssign, setProjectToAssign] = useState<string | null>(null);
  
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [projectToApprove, setProjectToApprove] = useState<string | null>(null);
  
  // Use the custom hook to fetch all admin data
  const { 
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
    isLoading 
  } = useAdminData();
  
  // Access control check
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "admin") {
      // Redirect to appropriate dashboard based on role
      const redirectPath = user?.role === "client" ? "/client-dashboard" : "/freelancer-dashboard";
      toast.error("You don't have admin privileges. Redirecting...");
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  const openDeleteDialog = (type: "user" | "project", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === "user") {
        if (itemToDelete.id === user?.id) {
          toast.error("You cannot delete your own account");
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          return;
        }
        
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast.success("User deleted successfully");
        refetchUsers();
      } else if (itemToDelete.type === "project") {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast.success("Project deleted successfully");
        refetchProjects();
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${itemToDelete.type}: ${error.message}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  const handleAssignProject = (projectId: string) => {
    setProjectToAssign(projectId);
    setAssignDialogOpen(true);
  };

  const handleApproveProject = (projectId: string) => {
    setProjectToApprove(projectId);
    setApprovalDialogOpen(true);
  };
  
  const handleMakeAvailableForBidding = async () => {
    refetchProjects();
  };

  // Stats calculation
  const clientCount = users.filter((appUser) => appUser.role === "client").length;
  const freelancerCount = users.filter((appUser) => appUser.role === "freelancer").length;
  const adminCount = users.filter((appUser) => appUser.role === "admin").length;
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Manage users, projects and system settings
        </p>
        
        <AdminStats 
          totalUsers={users.length} 
          projectsCount={projects.length} 
          studentsCount={freelancerCount} 
          contractsCount={proposals.length}
        />
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Dashboard Management</h2>
            <p className="text-muted-foreground">Manage system users and projects</p>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-secondary rounded-md"></div>
                <div className="h-64 bg-secondary rounded-md"></div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Tabs defaultValue="users">
                <TabsList className="mb-6">
                  <TabsTrigger value="users">
                    Users ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="projects">
                    Projects ({projects.length})
                  </TabsTrigger>
                  <TabsTrigger value="proposals">
                    Proposals ({proposals.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="users">
                  <UsersList 
                    users={users} 
                    currentUser={user!} 
                    onDeleteUser={(id) => openDeleteDialog("user", id)}
                  />
                </TabsContent>
                
                <TabsContent value="projects">
                  <ProjectsList 
                    projects={projects} 
                    onDeleteProject={(id) => openDeleteDialog("project", id)}
                    onAssignProject={handleAssignProject}
                    onMakeAvailableForBidding={handleMakeAvailableForBidding}
                    onApproveProject={handleApproveProject}
                  />
                </TabsContent>
                
                <TabsContent value="proposals">
                  <ProposalsList 
                    proposals={proposals} 
                    onUpdateProposalStatus={handleProposalStatusUpdate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType={itemToDelete?.type || "user"}
        onConfirm={handleDelete}
      />
      
      <AssignProjectDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        projectId={projectToAssign}
        onAssign={() => refetchProjects()}
      />

      <ProjectApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        projectId={projectToApprove}
        onApprove={() => refetchProjects()}
      />
    </div>
  );
};

export default AdminDashboard;

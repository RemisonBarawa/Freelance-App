
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectDescription } from "@/components/project/ProjectDescription";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { TabContent } from "@/components/project/TabContent";
import { updateProposalStatus } from "@/utils/projects";
import { useAuth } from "@/contexts/AuthContext";
import PaymentStatusCard from "@/components/payment/PaymentStatusCard";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("details");
  const { user } = useAuth();
  
  const {
    project,
    projectLoading,
    refetchProject,
    userProposal,
    projectProposals,
    projectProposalsLoading,
    refetchProposals,
    // Permissions
    canViewProposals,
    hasSubmittedProposal,
    canSubmitProposal,
    canSubmitWork
  } = useProjectDetails(id);

  const {
    latestTransaction,
    hasCompletedPayment,
    hasPendingPayment,
    refreshPaymentStatus,
    isRefreshing
  } = usePaymentStatus(id);

  // Set active tab based on permissions
  useEffect(() => {
    if (canSubmitProposal) {
      setActiveTab("submit-proposal");
    } else if (canSubmitWork) {
      setActiveTab("submit-work");
    } else {
      setActiveTab("details");
    }
  }, [canSubmitProposal, canSubmitWork]);

  // Update hasSubmittedProposal when userProposal changes
  useEffect(() => {
    if (userProposal) {
      setActiveTab("my-proposal");
    }
  }, [userProposal]);

  const handleProposalSuccess = () => {
    toast.success("Proposal submitted successfully!");
    setActiveTab("my-proposal");
    refetchProject();
    refetchProposals();
  };

  const handleSubmissionSuccess = () => {
    toast.success("Work submitted successfully!");
    setActiveTab("details");
    refetchProject();
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      const result = await updateProposalStatus(proposalId, 'accepted');
      
      if (result.success) {
        toast.success("Proposal accepted successfully!");
        refetchProposals();
        refetchProject(); // Also refresh the project data since the status may have changed
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal");
    }
  };
  
  const handleRejectProposal = async (proposalId: string) => {
    try {
      const result = await updateProposalStatus(proposalId, 'rejected');
      
      if (result.success) {
        toast.success("Proposal rejected");
        refetchProposals();
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal");
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Using document.querySelector and HTMLElement check for browser compatibility
    const tabElement = document.querySelector(`[data-value="${value}"]`);
    if (tabElement instanceof HTMLElement) {
      tabElement.click();
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 mt-16">
          <div className="animate-pulse">
            <div className="h-10 w-3/4 bg-secondary rounded mb-4"></div>
            <div className="h-6 w-1/2 bg-secondary rounded mb-8"></div>
            <div className="h-40 bg-secondary rounded mb-4"></div>
            <div className="h-20 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 mt-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/projects')}>Browse Projects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 mt-16">
        <ProjectHeader
          project={project}
          onBack={() => navigate(-1)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProjectDescription project={project} />
            
            <div className="mt-6">
              <Tabs 
                defaultValue={activeTab} 
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Project Details</TabsTrigger>
                  {canSubmitProposal && (
                    <TabsTrigger value="submit-proposal">Submit Proposal</TabsTrigger>
                  )}
                  {canSubmitWork && (
                    <TabsTrigger value="submit-work">Submit Work</TabsTrigger>
                  )}
                  {canViewProposals && (
                    <TabsTrigger value="proposals">Proposals ({projectProposals?.length || 0})</TabsTrigger>
                  )}
                  {hasSubmittedProposal && (
                    <TabsTrigger value="my-proposal">My Proposal</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value={activeTab}>
                  <TabContent
                    activeTab={activeTab}
                    project={project}
                    canSubmitProposal={canSubmitProposal}
                    hasSubmittedProposal={hasSubmittedProposal}
                    canSubmitWork={canSubmitWork}
                    userProposal={userProposal}
                    projectProposals={projectProposals || []}
                    projectProposalsLoading={projectProposalsLoading}
                    onTabChange={handleTabChange}
                    onProposalSuccess={handleProposalSuccess}
                    onSubmissionSuccess={handleSubmissionSuccess}
                    onAcceptProposal={handleAcceptProposal}
                    onRejectProposal={handleRejectProposal}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="space-y-6">
            <ProjectSidebar
              project={project}
              canSubmitProposal={canSubmitProposal}
              onSubmitProposal={() => handleTabChange("submit-proposal")}
            />
            
            {/* Payment Status - Show to project owner */}
            {user?.id === project.client_id && latestTransaction && (
              <PaymentStatusCard
                transaction={latestTransaction}
                onRefresh={refreshPaymentStatus}
                isRefreshing={isRefreshing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

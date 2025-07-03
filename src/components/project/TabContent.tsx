import { Card } from "@/components/ui/card";
import { ProposalsList } from "./ProposalsList";
import { UserProposalView } from "./UserProposalView";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectSubmissionForm } from "./ProjectSubmissionForm";
import ProposalForm from "@/components/ProposalForm";
import { ProjectWithClient, ProposalWithFreelancer, UserProposal } from "@/types/project";

interface TabContentProps {
  activeTab: string;
  project: ProjectWithClient;
  canSubmitProposal: boolean;
  hasSubmittedProposal: boolean;
  canSubmitWork?: boolean;
  userProposal: UserProposal | null;
  projectProposals: ProposalWithFreelancer[];
  projectProposalsLoading: boolean;
  onTabChange: (value: string) => void;
  onProposalSuccess: () => void;
  onSubmissionSuccess?: () => void;
  onAcceptProposal: (proposalId: string) => Promise<void>;
  onRejectProposal: (proposalId: string) => Promise<void>;
}

export const TabContent = ({
  activeTab,
  project,
  canSubmitProposal,
  hasSubmittedProposal,
  canSubmitWork,
  userProposal,
  projectProposals,
  projectProposalsLoading,
  onTabChange,
  onProposalSuccess,
  onSubmissionSuccess,
  onAcceptProposal,
  onRejectProposal
}: TabContentProps) => {
  
  const handleSubmitProposal = () => {
    onTabChange("submit-proposal");
  };

  const handleSubmitWork = () => {
    onTabChange("submit-work");
  };
  
  switch (activeTab) {
    case "details":
      return (
        <ProjectDetails 
          project={project}
          hasSubmittedProposal={hasSubmittedProposal}
          canSubmitProposal={canSubmitProposal}
          onSubmitProposal={handleSubmitProposal}
          onSubmitWork={canSubmitWork ? handleSubmitWork : undefined}
        />
      );
      
    case "submit-proposal":
      return (
        <ProposalForm
          project={project}
          onSuccess={onProposalSuccess}
        />
      );

    case "submit-work":
      return (
        <ProjectSubmissionForm
          projectId={project.id}
          onSuccess={onSubmissionSuccess}
        />
      );
      
    case "my-proposal":
      if (!userProposal) return null;
      return (
        <UserProposalView userProposal={userProposal} />
      );
      
    case "proposals":
      return (
        <Card>
          <ProposalsList 
            proposals={projectProposals} 
            isLoading={projectProposalsLoading}
            onAcceptProposal={onAcceptProposal}
            onRejectProposal={onRejectProposal}
          />
        </Card>
      );
      
    default:
      return null;
  }
};

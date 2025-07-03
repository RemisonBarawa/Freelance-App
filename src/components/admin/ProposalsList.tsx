
import { Button } from "@/components/ui/button";
import { Check, Phone, Trash } from "lucide-react";
import { ProposalWithDetails } from "@/types/admin";
import { toast } from "@/components/ui/use-toast";

interface ProposalsListProps {
  proposals: ProposalWithDetails[];
  onUpdateProposalStatus: (id: string, status: 'accepted' | 'rejected') => Promise<void>;
}

const ProposalsList = ({ proposals, onUpdateProposalStatus }: ProposalsListProps) => {
  console.log("Proposals in ProposalsList:", proposals);
  
  const handleStatusUpdate = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await onUpdateProposalStatus(id, status);
      toast({
        title: `Proposal ${status} successfully`,
        description: status === 'accepted' 
          ? "The project has been assigned to the freelancer" 
          : "The proposal has been rejected",
      });
    } catch (error) {
      console.error(`Error ${status === 'accepted' ? 'accepting' : 'rejecting'} proposal:`, error);
      toast({
        title: `Failed to ${status} proposal`,
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Project</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Freelancer</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Bid</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
            <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id} className="border-b border-border hover:bg-secondary/5">
              <td className="py-4 px-4">
                <div className="font-medium">{proposal.projectTitle}</div>
                <div className="text-sm text-muted-foreground">{proposal.estimatedDays} days</div>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="font-medium">{proposal.freelancerName}</div>
                  {proposal.freelancerPhone && (
                    <div className="flex items-center text-sm">
                      <Phone size={14} className="mr-1.5 text-muted-foreground" />
                      {proposal.freelancerPhone || 'Not provided'}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                  ${proposal.status === "accepted" 
                    ? "bg-green-100 text-green-800" 
                    : proposal.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {proposal.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm font-medium">
                  ${proposal.bidAmount}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-muted-foreground">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                {proposal.status === 'pending' && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(proposal.id, 'accepted')}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Check size={14} className="mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(proposal.id, 'rejected')}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash size={14} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {proposals.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                No proposals found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProposalsList;

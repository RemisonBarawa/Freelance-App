
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ProposalWithFreelancer } from "@/types/project";

interface ProposalsListProps {
  proposals: ProposalWithFreelancer[];
  isLoading: boolean;
  onAcceptProposal?: (proposalId: string) => Promise<void>;
  onRejectProposal?: (proposalId: string) => Promise<void>;
}

export const ProposalsList = ({ 
  proposals,
  isLoading,
  onAcceptProposal,
  onRejectProposal
}: ProposalsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 animate-pulse bg-secondary rounded"></div>
        ))}
      </div>
    );
  }
  
  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No proposals have been submitted for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">
                    {proposal.freelancer?.profiles?.full_name || 'Anonymous Freelancer'}
                  </h3>
                  <Badge className={
                    proposal.status === 'accepted' ? "bg-green-100 text-green-800" :
                    proposal.status === 'rejected' ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }>
                    {proposal.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Bid: ${proposal.bid_amount} • 
                  {proposal.estimated_days ? ` ${proposal.estimated_days} days • ` : ' '}
                  Submitted {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                </p>
                
                {proposal.cover_letter && (
                  <p className="text-sm mt-2">{proposal.cover_letter}</p>
                )}
                
                {proposal.freelancer?.profiles?.email && (
                  <div className="flex items-center text-sm text-muted-foreground pt-2">
                    <Mail size={14} className="mr-1" />
                    {proposal.freelancer.profiles.email}
                  </div>
                )}
              </div>
              
              {proposal.status === 'pending' && onAcceptProposal && onRejectProposal && (
                <div className="flex mt-4 md:mt-0 space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => onAcceptProposal(proposal.id)}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onRejectProposal(proposal.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

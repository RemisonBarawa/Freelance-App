
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { UserProposal } from "@/types/project";

interface UserProposalViewProps {
  userProposal: UserProposal;
}

export const UserProposalView = ({ userProposal }: UserProposalViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Proposal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
            <Badge className={
              userProposal.status === 'accepted' ? "bg-green-100 text-green-800" :
              userProposal.status === 'rejected' ? "bg-red-100 text-red-800" :
              "bg-amber-100 text-amber-800"
            }>
              {userProposal.status}
            </Badge>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Bid Amount</h3>
            <p>${userProposal.bid_amount}</p>
          </div>
          
          {userProposal.estimated_days && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Estimated Days</h3>
              <p>{userProposal.estimated_days} days</p>
            </div>
          )}
          
          {userProposal.cover_letter && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cover Letter</h3>
              <p className="whitespace-pre-line">{userProposal.cover_letter}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Submitted</h3>
            <p>{formatDistanceToNow(new Date(userProposal.created_at), { addSuffix: true })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

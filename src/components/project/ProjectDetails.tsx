
import { CalendarIcon, DollarSign, MapPin, UserIcon, CheckCircle, XCircle, Upload } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectWithClient } from "@/types/project";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { respondToAssignment } from "@/utils/projects/assignmentUtils";
import { toast } from "sonner";

interface ProjectDetailsProps {
  project: ProjectWithClient;
  hasSubmittedProposal: boolean;
  canSubmitProposal: boolean;
  onSubmitProposal: () => void;
  onSubmitWork?: () => void;
}

export const ProjectDetails = ({ 
  project, 
  hasSubmittedProposal, 
  canSubmitProposal,
  onSubmitProposal,
  onSubmitWork
}: ProjectDetailsProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const isAssignedToCurrentUser = user?.id === project.assigned_to;
  const canRespondToAssignment = isAssignedToCurrentUser && project.status === 'in_progress';
  const canSubmitWork = isAssignedToCurrentUser && project.status === 'in_progress' && 
                        project.submission_status !== 'submitted';

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const response = await respondToAssignment(project.id, true);
      if (response.success) {
        toast.success("Project accepted successfully");
        // Reload the page to update the project status
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to accept project");
      }
    } catch (error: any) {
      console.error("Error accepting project:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const response = await respondToAssignment(project.id, false);
      if (response.success) {
        toast.success("Project rejected successfully");
        // Reload the page to update the project status
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to reject project");
      }
    } catch (error: any) {
      console.error("Error rejecting project:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Budget Range</h3>
              <div className="flex items-center">
                <DollarSign size={18} className="mr-2 text-primary" />
                <span>
                  ${project.budget_min} - ${project.budget_max || 'Open'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Client</h3>
              <div className="flex items-center">
                <UserIcon size={18} className="mr-2 text-primary" />
                <span>
                  {project.profiles?.full_name || 'Anonymous Client'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Deadline</h3>
              <div className="flex items-center">
                <CalendarIcon size={18} className="mr-2 text-primary" />
                <span>
                  {formatDate(project.deadline)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
              <div className="flex items-center">
                <MapPin size={18} className="mr-2 text-primary" />
                <span className="capitalize">
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Submission details if available */}
          {project.submission_url && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-sm mb-2">Submission Details</h3>
              <p className="text-sm mb-2">
                <span className="font-medium">URL: </span>
                <a 
                  href={project.submission_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  {project.submission_url}
                </a>
              </p>
              {project.submission_notes && (
                <p className="text-sm">
                  <span className="font-medium">Notes: </span>
                  {project.submission_notes}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Submitted on: {formatDate(project.submission_date)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Action buttons for assignment response */}
      {canRespondToAssignment && (
        <CardFooter className="bg-secondary/10 flex justify-between">
          <div>
            <span className="font-medium">Project Assignment</span>
            <span className="text-sm text-muted-foreground ml-2">
              Please accept or reject this project
            </span>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting}
              className="bg-white hover:bg-red-50 border-red-200 text-red-600"
            >
              <XCircle size={16} className="mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle size={16} className="mr-1" /> Accept
            </Button>
          </div>
        </CardFooter>
      )}
      
      {/* Submit work button for accepted projects */}
      {canSubmitWork && onSubmitWork && (
        <CardFooter className="bg-secondary/10 flex justify-between border-t">
          <div>
            <span className="font-medium">Project Work</span>
            <span className="text-sm text-muted-foreground ml-2">
              Submit your work for this project
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={onSubmitWork}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload size={16} className="mr-1" /> Submit Work
          </Button>
        </CardFooter>
      )}
      
      {/* Open for bidding section */}
      {project.available_for_bidding && project.status === 'open' && (
        <CardFooter className="bg-secondary/10 flex justify-between">
          <div>
            <span className="font-medium">Open for proposals</span>
            {hasSubmittedProposal && (
              <span className="text-sm text-muted-foreground ml-2">
                (You've already submitted a proposal)
              </span>
            )}
          </div>
          {canSubmitProposal && (
            <Button
              onClick={onSubmitProposal}
              size="sm"
            >
              Submit Proposal
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

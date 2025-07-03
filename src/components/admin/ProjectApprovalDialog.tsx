
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { approveProject } from "@/utils/projects";

interface ProjectApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onApprove: () => void;
}

const ProjectApprovalDialog = ({ open, onOpenChange, projectId, onApprove }: ProjectApprovalDialogProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  // Fetch project details when the dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails(projectId);
    } else {
      setProjectDetails(null);
    }
  }, [open, projectId]);

  const fetchProjectDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      console.log("Fetched project details:", data);
      setProjectDetails(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProject = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsLoading(true);
    try {
      const result = await approveProject(projectId);
      
      if (!result.success) {
        throw new Error(result.message || result.error?.message || "Failed to approve project");
      }

      toast.success(result.message || 'Project approved successfully');
      onApprove(); // Call the callback to refresh the parent component
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast.error(`Failed to approve project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Project</DialogTitle>
          <DialogDescription>
            Approving a project will make it available for bidding or assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {projectDetails && (
            <div className="space-y-2">
              <h3 className="font-medium">Project Details</h3>
              <p className="font-medium">{projectDetails.title}</p>
              <p className="text-sm text-muted-foreground">{projectDetails.description}</p>
              <div className="text-sm">
                <span className="font-medium">Budget:</span> ${projectDetails.budget_min} - ${projectDetails.budget_max || 'Open'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Status:</span> {projectDetails.status?.replace('_', ' ')}
              </div>
              {projectId ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Project ID: {projectId}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-2">
                  No project selected
                </p>
              )}
            </div>
          )}

          {isLoading && !projectDetails && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Loading project details...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApproveProject} 
            disabled={isLoading || !projectDetails}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Approving..." : "Approve Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectApprovalDialog;

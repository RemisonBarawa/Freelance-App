import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppUser } from "@/types/admin";
import { assignProject } from "@/utils/projects/assignmentUtils";

interface AssignProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onAssign: () => void;
}

const AssignProjectDialog = ({ open, onOpenChange, projectId, onAssign }: AssignProjectDialogProps) => {
  const [freelancers, setFreelancers] = useState<AppUser[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  // Fetch freelancers and project details when dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchFreelancers();
      fetchProjectDetails(projectId);
    } else {
      // Reset state when dialog closes
      setSelectedFreelancerId("");
      setProjectDetails(null);
    }
  }, [open, projectId]);

  const fetchProjectDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProjectDetails(data);
      console.log("Fetched project details:", data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    }
  };

  const fetchFreelancers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'freelancer');

      if (error) throw error;

      console.log("Available freelancers:", data);

      const freelancersList = data.map(freelancer => ({
        id: freelancer.id,
        name: freelancer.full_name || 'Unknown',
        email: freelancer.email,
        phone: freelancer.phone_number || '',
        role: freelancer.role as any
      }));

      setFreelancers(freelancersList);
    } catch (error: any) {
      console.error('Error fetching freelancers:', error);
      toast.error(`Failed to load freelancers: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!selectedFreelancerId || !projectId) {
      toast.error('Please select a freelancer');
      return;
    }

    setIsLoading(true);
    try {
      console.log("Assigning project:", projectId, "to freelancer:", selectedFreelancerId);
      
      const result = await assignProject(projectId, selectedFreelancerId);
      
      if (!result.success) {
        throw new Error(result.message || "Failed to assign project");
      }

      toast.success(result.message || 'Project assigned successfully');
      onAssign(); // Call the callback to refresh the parent component
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning project:', error);
      toast.error(`Failed to assign project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Project to Freelancer</DialogTitle>
          <DialogDescription>
            Select a freelancer to work on this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Freelancer</label>
            <Select
              value={selectedFreelancerId}
              onValueChange={setSelectedFreelancerId}
              disabled={isLoading || freelancers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a freelancer" />
              </SelectTrigger>
              <SelectContent>
                {freelancers.map((freelancer) => (
                  <SelectItem key={freelancer.id} value={freelancer.id}>
                    {freelancer.name} {freelancer.email ? `(${freelancer.email})` : ''}
                  </SelectItem>
                ))}
                
                {freelancers.length === 0 && (
                  <SelectItem value="none" disabled>
                    No freelancers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {projectDetails && (
            <div className="mt-4 text-sm">
              <p className="font-medium">Project: {projectDetails.title}</p>
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {projectDetails.description}
              </p>
              <div className="text-muted-foreground mt-1">
                Budget: ${projectDetails.budget_min} - ${projectDetails.budget_max || 'Open'}
              </div>
              <div className="text-muted-foreground mt-1">
                Status: {projectDetails.status?.replace('_', ' ')}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignProject} 
            disabled={isLoading || !selectedFreelancerId || !projectId}
          >
            {isLoading ? "Assigning..." : "Assign Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignProjectDialog;

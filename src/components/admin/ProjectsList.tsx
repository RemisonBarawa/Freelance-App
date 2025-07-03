
import { Button } from "@/components/ui/button";
import { Edit, Eye, Check, Trash, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectWithOwner } from "@/types/admin";
import { makeProjectAvailableForBidding } from "@/utils/projects";
import { toast } from "sonner";

interface ProjectsListProps {
  projects: ProjectWithOwner[];
  onDeleteProject: (id: string) => void;
  onAssignProject: (id: string) => void;
  onMakeAvailableForBidding: (id: string) => void;
  onApproveProject: (id: string) => void;
}

const ProjectsList = ({ 
  projects, 
  onDeleteProject, 
  onAssignProject, 
  onMakeAvailableForBidding,
  onApproveProject 
}: ProjectsListProps) => {
  const navigate = useNavigate();
  
  const handleMakeAvailableForBidding = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!id) {
      console.error("No project ID provided for making available for bidding");
      toast.error("Invalid project ID");
      return;
    }
    
    console.log("Making project available for bidding:", id);
    const result = await makeProjectAvailableForBidding(id);
    
    if (result.success) {
      // Call the parent handler to refresh the list
      onMakeAvailableForBidding(id);
    }
  };

  const handleViewProject = (id: string) => {
    if (!id) {
      console.error("No project ID provided for viewing");
      toast.error("Invalid project ID");
      return;
    }
    console.log("Navigating to project:", id);
    navigate(`/project/${id}`);
  };

  const handleEditProject = (id: string) => {
    if (!id) {
      console.error("No project ID provided for editing");
      toast.error("Invalid project ID");
      return;
    }
    console.log("Editing project with ID:", id);
    navigate(`/project-edit/${id}`);
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Project Name</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Description</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Budget</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Client</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Assignment</th>
            <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-border hover:bg-secondary/5">
              <td className="py-4 px-4">
                <div className="font-medium">{project.title}</div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-muted-foreground max-w-xs truncate">{project.description}</div>
              </td>
              <td className="py-4 px-4">
                ${project.budget_min} - ${project.budget_max || 'Open'}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                  ${project.status === "open" 
                    ? "bg-green-100 text-green-800" 
                    : project.status === "in_progress"
                    ? "bg-amber-100 text-amber-800"
                    : project.status === "pending_approval"
                    ? "bg-blue-100 text-blue-800"
                    : project.status === "completed"
                    ? "bg-purple-100 text-purple-800" 
                    : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status.replace('_', ' ')}
                </span>
              </td>
              <td className="py-4 px-4">{project.ownerName || "Unknown"}</td>
              <td className="py-4 px-4">
                {project.assigned_to ? (
                  <span className="text-green-600 text-sm">Assigned</span>
                ) : project.available_for_bidding ? (
                  <span className="text-blue-600 text-sm">Open for bids</span>
                ) : (
                  <span className="text-gray-500 text-sm">Not assigned</span>
                )}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProject(project.id)}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  
                  {project.status === "pending_approval" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApproveProject(project.id);
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Check size={14} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssignProject(project.id);
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <UserPlus size={14} className="mr-1" />
                        Assign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleMakeAvailableForBidding(project.id, e)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Users size={14} className="mr-1" />
                        Open Bidding
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProject(project.id)}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-muted-foreground">
                No projects found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsList;


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ProjectWithClient } from "@/types/project";

interface ProjectHeaderProps {
  project: ProjectWithClient;
  onBack: () => void;
}

export const ProjectHeader = ({ project, onBack }: ProjectHeaderProps) => {
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      open: "bg-green-100 text-green-800",
      in_progress: "bg-amber-100 text-amber-800",
      pending_approval: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
      canceled: "bg-gray-100 text-gray-800"
    };
    
    const statusKey = status as keyof typeof statusClasses;
    const className = statusClasses[statusKey] || statusClasses.open;
    
    return (
      <Badge className={className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge(project.status)}
          
          <span className="text-sm text-muted-foreground flex items-center">
            <ClockIcon size={14} className="mr-1" />
            Posted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
          </span>
          
          {project.deadline && (
            <span className="text-sm text-muted-foreground flex items-center">
              <CalendarIcon size={14} className="mr-1" />
              Due {formatDate(project.deadline)}
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-4 md:mt-0">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
      </div>
    </div>
  );
};

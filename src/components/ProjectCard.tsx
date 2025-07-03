
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin, Calendar, DollarSign, User, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Project } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
  compact?: boolean;
  clientName?: string;
  isAdmin?: boolean;
  onApproveProject?: (id: string) => void;
}

const ProjectCard = ({ 
  project, 
  compact = false, 
  clientName,
  isAdmin = false,
  onApproveProject
}: ProjectCardProps) => {
  const { id, title, description, budget_min, budget_max, status, deadline, created_at } = project;
  
  const formatBudget = () => {
    if (budget_min && budget_max) {
      return `$${budget_min} - $${budget_max}`;
    } else if (budget_min) {
      return `From $${budget_min}`;
    } else if (budget_max) {
      return `Up to $${budget_max}`;
    }
    return "Budget not specified";
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'open': return "default";
      case 'in_progress': return "secondary";
      case 'completed': return "outline";
      case 'pending_approval': return "outline";
      case 'canceled': return "destructive";
      default: return "default";
    }
  };

  const handleApproveProject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onApproveProject && id) {
      onApproveProject(id);
    }
  };

  const getStatusDisplay = (status: string) => {
    // Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className={`overflow-hidden ${compact ? '' : 'card-hover'}`}>
      <CardContent className={`${compact ? 'p-3' : 'p-5'}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-xl'}`}>{title}</h3>
            <Badge variant={getBadgeVariant()}>
              {getStatusDisplay(status)}
            </Badge>
          </div>
          
          <p className={`text-muted-foreground ${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}>
            {description}
          </p>
          
          <div className="flex flex-wrap gap-3 mt-3">
            <div className={`flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
              <DollarSign size={compact ? 14 : 16} className="mr-1 text-primary" />
              <span>{formatBudget()}</span>
            </div>
            
            {deadline && (
              <div className={`flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                <Calendar size={compact ? 14 : 16} className="mr-1 text-primary" />
                <span>Due: {new Date(deadline).toLocaleDateString()}</span>
              </div>
            )}
            
            {clientName && (
              <div className={`flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                <User size={compact ? 14 : 16} className="mr-1 text-primary" />
                <span>{clientName}</span>
              </div>
            )}
          </div>
          
          <div className={`flex items-center text-xs text-muted-foreground ${compact ? 'mt-1' : 'mt-3'}`}>
            <MapPin size={compact ? 12 : 14} className="mr-1" />
            <span>Posted {formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={`${compact ? 'px-3 py-2' : 'px-5 py-3'} border-t bg-secondary/20`}>
        <div className="w-full flex justify-between gap-2">
          <Link to={`/project/${id}`} className="flex-1">
            <Button 
              variant={compact ? "ghost" : "default"} 
              className={`w-full justify-between ${compact ? 'h-8 text-xs' : ''}`}
            >
              <span>View Details</span>
              <ArrowRight size={compact ? 14 : 16} />
            </Button>
          </Link>

          {isAdmin && status === 'pending_approval' && onApproveProject && (
            <Button 
              onClick={handleApproveProject}
              variant="outline"
              className={`${compact ? 'h-8 text-xs' : ''} bg-green-50 text-green-700 hover:bg-green-100 border-green-200`}
            >
              Approve
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;

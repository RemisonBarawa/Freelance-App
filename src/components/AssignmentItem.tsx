
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { respondToAssignment } from "../utils/projects/assignmentUtils";
import { formatDistanceToNow, isAfter, subHours } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface AssignmentItemProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max?: number;
    client_name: string;
    created_at: string;
    updated_at: string;
    deadline?: string;
    status: string;
    submission_status?: string; // Added submission_status property
  };
  onStatusChange: () => void;
}

const AssignmentItem = ({ project, onStatusChange }: AssignmentItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiring, setIsExpiring] = useState(false);

  // Calculate time remaining for assignment response
  useEffect(() => {
    if (project.status === 'assigned') {
      const calculateTimeRemaining = () => {
        const updatedDate = new Date(project.updated_at);
        const expiryDate = addHours(updatedDate, 24);
        const now = new Date();
        
        // If current time is after expiry, the assignment would be auto-rejected
        if (isAfter(now, expiryDate)) {
          return 'Expired';
        }
        
        // Display remaining time
        const remaining = formatDistanceToNow(expiryDate, { addSuffix: false });
        
        // Check if less than 6 hours are remaining
        const sixHoursBeforeExpiry = subHours(expiryDate, 6);
        setIsExpiring(isAfter(now, sixHoursBeforeExpiry));
        
        return remaining;
      };

      // Initial calculation
      setTimeRemaining(calculateTimeRemaining());
      
      // Update every minute
      const interval = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining());
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [project.status, project.updated_at]);

  const handleAccept = async () => {
    if (!user) {
      toast.error("You need to be logged in");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Fixed: removed the third parameter
      const response = await respondToAssignment(project.id, true);
      if (response.success) {
        toast.success(response.message || "Project accepted successfully");
        onStatusChange();
      } else {
        toast.error(response.message || "Failed to accept project");
      }
    } catch (error: any) {
      console.error("Error accepting project:", error);
      toast.error(`Failed to accept project: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!user) {
      toast.error("You need to be logged in");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Fixed: removed the third parameter
      const response = await respondToAssignment(project.id, false);
      if (response.success) {
        toast.success(response.message || "Project rejected successfully");
        onStatusChange();
      } else {
        toast.error(response.message || "Failed to reject project");
      }
    } catch (error: any) {
      console.error("Error rejecting project:", error);
      toast.error(`Failed to reject project: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  function addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <p className="text-sm text-muted-foreground">by {project.client_name}</p>
          </div>
          <Badge 
            variant="outline"
            className={
              project.status === 'assigned' 
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : project.status === 'in_progress'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
            }
          >
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-3 line-clamp-3">{project.description}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-secondary/50 px-2 py-1 rounded">
            Budget: ${project.budget_min} - ${project.budget_max || 'Open'}
          </span>
          {project.deadline && (
            <span className="bg-secondary/50 px-2 py-1 rounded">
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
          {project.status === 'assigned' && timeRemaining && (
            <span className={`px-2 py-1 rounded flex items-center gap-1 ${
              isExpiring ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Clock size={12} />
              Respond within: {timeRemaining}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/project/${project.id}`)}
        >
          <ExternalLink size={14} className="mr-1" /> View Details
        </Button>
        
        {project.status === 'assigned' && (
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle size={14} className="mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={14} className="mr-1" /> Accept
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default AssignmentItem;

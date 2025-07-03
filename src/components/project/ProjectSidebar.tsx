
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectWithClient } from "@/types/project";

interface ProjectSidebarProps {
  project: ProjectWithClient;
  canSubmitProposal: boolean;
  onSubmitProposal: () => void;
}

export const ProjectSidebar = ({ 
  project, 
  canSubmitProposal, 
  onSubmitProposal 
}: ProjectSidebarProps) => {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold flex items-center">
            <DollarSign className="text-primary" />
            <span>{project.budget_min}</span>
            {project.budget_max && (
              <>
                <span className="mx-2 text-muted-foreground">-</span>
                <span>{project.budget_max}</span>
              </>
            )}
          </div>
        </CardContent>
        {canSubmitProposal && (
          <CardFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              onClick={onSubmitProposal}
            >
              Submit Proposal
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {project.profiles && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About the Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p>{project.profiles.full_name || 'Anonymous Client'}</p>
              </div>
              
              {project.profiles.email && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-primary" />
                    <a href={`mailto:${project.profiles.email}`} className="hover:underline">
                      {project.profiles.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

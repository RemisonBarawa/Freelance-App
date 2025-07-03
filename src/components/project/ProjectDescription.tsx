
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectWithClient } from "@/types/project";

interface ProjectDescriptionProps {
  project: ProjectWithClient;
}

export const ProjectDescription = ({ project }: ProjectDescriptionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="whitespace-pre-line">{project.description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

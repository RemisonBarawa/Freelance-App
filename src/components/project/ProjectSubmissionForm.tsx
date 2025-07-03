
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { submitProjectWork } from "@/utils/projects/assignmentUtils";
import { Loader2 } from "lucide-react";

interface ProjectSubmissionFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export const ProjectSubmissionForm = ({ projectId, onSuccess }: ProjectSubmissionFormProps) => {
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionUrl.trim()) {
      toast.error("Please provide a submission URL or link");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitProjectWork(projectId, submissionUrl.trim(), submissionNotes.trim());
      
      if (result.success) {
        toast.success("Project work submitted successfully");
        if (onSuccess) onSuccess();
        
        // Reset form
        setSubmissionUrl("");
        setSubmissionNotes("");
      } else {
        toast.error(result.message || "Failed to submit project work");
      }
    } catch (error: any) {
      console.error("Error submitting project work:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Project Work</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="submissionUrl" className="text-sm font-medium block mb-1">
              Submission URL/Link <span className="text-red-500">*</span>
            </label>
            <Input
              id="submissionUrl"
              placeholder="https://github.com/your-project or link to deliverable"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Provide a link to your work (GitHub repository, Google Drive folder, etc.)
            </p>
          </div>
          
          <div>
            <label htmlFor="submissionNotes" className="text-sm font-medium block mb-1">
              Submission Notes
            </label>
            <Textarea
              id="submissionNotes"
              placeholder="Add notes about your submission, instructions, or any information for the client..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t bg-secondary/10">
          <Button type="submit" disabled={isSubmitting || !submissionUrl.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Project Work"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

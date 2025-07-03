
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { submitProposal } from "@/utils/projects";
import { Project } from "@/types/admin";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const proposalSchema = z.object({
  bidAmount: z.coerce.number().positive("Bid amount must be positive"),
  estimatedDays: z.coerce.number().int().positive("Days must be a positive integer").optional(),
  coverLetter: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  project: Project;
  onSuccess?: () => void;
}

const ProposalForm = ({ project, onSuccess }: ProposalFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      bidAmount: project.budget_min || 0,
      estimatedDays: undefined,
      coverLetter: "",
    },
  });

  const onSubmit = async (data: ProposalFormData) => {
    if (!user) {
      toast.error("You must be logged in to submit a proposal");
      return;
    }

    setIsSubmitting(true);

    const result = await submitProposal({
      projectId: project.id,
      freelancerId: user.id,
      bidAmount: data.bidAmount,
      estimatedDays: data.estimatedDays,
      coverLetter: data.coverLetter,
    });

    setIsSubmitting(false);

    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const minimumBid = project.budget_min || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Proposal</CardTitle>
        <CardDescription>
          Provide your bid details for "{project.title}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bidAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Bid Amount ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter your bid amount" 
                      min={minimumBid}
                      step="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Days to Complete</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Number of days" 
                      min={1}
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell the client why you're the best fit for this project"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProposalForm;

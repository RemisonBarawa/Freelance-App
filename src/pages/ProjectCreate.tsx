
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import PaymentDialog from "../components/payment/PaymentDialog";

const ProjectCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget_min: 0,
    budget_max: 0,
    deadline: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string>("");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a project");
      navigate("/auth?mode=login");
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Please enter a project description");
      return;
    }
    
    if (formData.budget_min <= 0) {
      toast.error("Minimum budget must be greater than zero");
      return;
    }
    
    if (formData.budget_max > 0 && formData.budget_max < formData.budget_min) {
      toast.error("Maximum budget cannot be less than minimum budget");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          title: formData.title,
          description: formData.description,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max || null,
          deadline: formData.deadline || null,
          client_id: user.id,
          status: "pending_approval", // Requires payment and admin approval
          available_for_bidding: false,
          assigned_to: null
        })
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        setCreatedProjectId(data[0].id);
        setShowPaymentDialog(true);
        toast.success("Project created! Please complete payment to proceed.");
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(`Failed to create project: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground mb-8">
          Enter the details of your project to get started
        </p>
        
        <Card className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear, concise title for your project"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your project requirements in detail"
                rows={6}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Minimum Budget ($)</Label>
                <Input
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  min={0}
                  step={10}
                  value={formData.budget_min || ""}
                  onChange={handleNumberInput}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget_max">Maximum Budget ($) (Optional)</Label>
                <Input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  min={0}
                  step={10}
                  value={formData.budget_max || ""}
                  onChange={handleNumberInput}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/owner-dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        projectId={createdProjectId}
        projectTitle={formData.title}
        amount={formData.budget_min}
        onSuccess={() => {
          toast.success("Payment completed! Your project is being reviewed.");
          navigate("/client-dashboard");
        }}
      />
    </div>
  );
};

export default ProjectCreate;


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Make a project available for bidding with improved error handling
export const makeProjectAvailableForBidding = async (projectId: string) => {
  try {
    if (!projectId) {
      toast.error("No project ID provided");
      return { success: false, error: new Error("No project ID provided") };
    }
    
    const toastId = toast.loading("Making project available for bidding...");
    
    // First check if the project exists and is in the right state
    const { data: projectData, error: checkError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (checkError) {
      toast.dismiss(toastId);
      console.error("Error checking project:", checkError);
      toast.error(`Failed to verify project: ${checkError.message}`);
      return { success: false, error: checkError };
    }
    
    if (projectData.available_for_bidding) {
      toast.dismiss(toastId);
      toast.info("Project is already available for bidding");
      return { success: true, data: projectData };
    }
    
    // Update the project directly
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'open',
        available_for_bidding: true,
        assigned_to: null
      })
      .eq('id', projectId)
      .select();
    
    if (error) {
      console.error("Error making project available:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to update project: ${error.message}`);
      return { success: false, error };
    }
    
    // Handle the case where update succeeded but no data returned
    if (!data || data.length === 0) {
      toast.dismiss(toastId);
      toast.success("Project is now available for bidding", {
        description: "Database updated but refresh may be needed to see changes"
      });
      return { 
        success: true, 
        data: projectData, 
        message: "Project updated, but data couldn't be retrieved due to permissions" 
      };
    }
    
    toast.dismiss(toastId);
    toast.success("Project is now available for bidding");
    
    return { success: true, data: data[0] };
  } catch (error: any) {
    console.error("Error making project available for bidding:", error);
    toast.error(`Failed to update project: ${error.message}`);
    return { success: false, error };
  }
};

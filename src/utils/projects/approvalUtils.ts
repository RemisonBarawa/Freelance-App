
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Approve a project with improved error handling and validation
export const approveProject = async (projectId: string) => {
  try {
    if (!projectId) {
      console.error("No project ID provided for approval");
      return { success: false, error: new Error("No project ID provided") };
    }
    
    console.log("Checking project existence before approval:", projectId);
    
    // First, check if the project exists and is accessible
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id, status, client_id')
      .eq('id', projectId)
      .single();
    
    if (checkError) {
      console.error("Error checking project:", checkError);
      return { 
        success: false, 
        error: new Error(`Project verification failed: ${checkError.message}`) 
      };
    }
    
    if (!existingProject) {
      console.error("Project not found or you don't have permission to update it");
      return { 
        success: false, 
        error: new Error("Project not found or you don't have permission to update it") 
      };
    }
    
    if (existingProject.status === 'open') {
      console.log("Project is already approved");
      return { 
        success: true, 
        data: existingProject,
        message: "Project is already approved" 
      };
    }
    
    console.log("Approving project with ID:", projectId);
    
    // Call our secure database function directly via RPC
    const { data, error } = await supabase.rpc(
      'handle_admin_approve_project', 
      { project_id: projectId }
    );
    
    if (error) {
      console.error("Error calling admin approval function:", error);
      
      // Fall back to direct update (which may or may not work depending on RLS)
      const { data: updateData, error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: 'open',
          available_for_bidding: true
        })
        .eq('id', projectId)
        .select();
      
      if (updateError) {
        console.error("Error updating project status (fallback):", updateError);
        return { 
          success: false, 
          error: updateError,
          message: `Failed to update project: ${updateError.message}` 
        };
      }
      
      if (!updateData || updateData.length === 0) {
        console.error("No rows affected by update. Check permissions and project state.");
        return { 
          success: false, 
          error: new Error("No changes were made. This could be due to permissions or the project is already in the requested state."),
          message: "Update failed: This could be due to permissions. Admin approval may be required."
        };
      }
      
      console.log("Project approved via fallback method:", updateData);
      return { 
        success: true, 
        data: updateData[0],
        message: "Project successfully approved" 
      };
    }
    
    console.log("Project approval result via database function:", data);
    
    // The data structure should match what we defined in the database function
    // { success: boolean, message: string, data: json }
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: new Error("Database function did not return any results"),
        message: "Update failed: Admin approval procedure may have encountered an error."
      };
    }
    
    // Important fix: The database function returns an array of records
    // We need to access the first element of the array
    const resultRow = data[0];
    
    // Now properly type and access the returned data
    if (!resultRow.success) {
      return {
        success: false,
        error: new Error(resultRow.message || "Database function did not return a success status"),
        message: resultRow.message || "Update failed: Admin approval procedure may have encountered an error."
      };
    }
    
    return { 
      success: true, 
      data: resultRow.data,
      message: resultRow.message || "Project successfully approved" 
    };
  } catch (error: any) {
    console.error('Error approving project:', error);
    return { 
      success: false, 
      error,
      message: `Exception occurred: ${error.message}` 
    };
  }
};

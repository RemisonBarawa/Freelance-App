
import { supabase } from "@/integrations/supabase/client";

// Handles verifying project updates in the database
export const verifyProjectUpdate = async (projectId: string) => {
  try {
    if (!projectId) {
      console.error("No project ID provided for verification");
      return null;
    }

    // First fetch the project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      console.error("Error verifying project details:", projectError);
      return null;
    }

    // Then fetch client and freelancer information separately
    let clientData = null;
    let freelancerData = null;

    if (project.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', project.client_id)
        .single();
        
      if (!clientError && client) {
        clientData = client;
      }
    }

    if (project.assigned_to) {
      const { data: freelancer, error: freelancerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', project.assigned_to)
        .single();
        
      if (!freelancerError && freelancer) {
        freelancerData = freelancer;
      }
    }

    // Combine the data
    const fullProjectData = {
      ...project,
      client: clientData,
      freelancer: freelancerData
    };

    console.log("Verified project state:", fullProjectData);
    return fullProjectData;
  } catch (error) {
    console.error("Error in verifyProjectUpdate:", error);
    return null;
  }
};


import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { LoginCredentials, SignupData } from "../types/auth";
import { getDashboardLink } from "../utils/auth-utils";

export const useAuthActions = () => {
  const navigate = useNavigate();

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) throw error;
      
      toast.success("Logged in successfully");
      
      // Redirect will happen automatically due to auth state change
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
      throw error;
    }
  };

  // Signup function
  const signup = async (data: SignupData): Promise<void> => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
            phone_number: data.phone
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        toast.success("Account created successfully");
        
        // Redirect based on role
        redirectBasedOnRole(data.role);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: SignupData["role"]) => {
    navigate(getDashboardLink(role));
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
      throw error;
    }
  };

  return {
    login,
    signup,
    logout
  };
};

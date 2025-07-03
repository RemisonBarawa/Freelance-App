
import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { User, AuthState } from "../types/auth";
import { validateUserRole } from "../utils/auth-utils";
import { Session } from "@supabase/supabase-js";

export const useAuthState = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (currentSession && currentSession.user) {
          // If we have a session, get user profile data from the database
          // Use setTimeout to defer Supabase calls and prevent deadlocks
          setSession(currentSession);
          
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentSession.user.id)
                .single();
  
              if (error) throw error;
  
              if (profile) {
                // Ensure we always have the email from the auth user
                const userData: User = {
                  id: currentSession.user.id,
                  name: profile.full_name || '',
                  email: currentSession.user.email || '',
                  phone: profile.phone_number || '',
                  role: validateUserRole(profile.role),
                };
                setUser(userData);
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          // Clear user data when logged out
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (currentSession && currentSession.user) {
          // Fetch profile data for the user
          setSession(currentSession);
          
          return supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .single();
        }
        setIsLoading(false);
        return { data: null, error: null };
      })
      .then(({ data: profile, error }) => {
        if (error) {
          console.error("Error fetching user profile:", error);
          setIsLoading(false);
          return;
        }

        if (profile && session) {
          // Ensure we always have the email from the auth user
          const userData: User = {
            id: session.user.id,
            name: profile.full_name || '',
            email: session.user.email || '',
            phone: profile.phone_number || '',
            role: validateUserRole(profile.role),
          };
          setUser(userData);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error getting session:", error);
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading
  };
};

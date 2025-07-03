
import { createContext, useContext, ReactNode } from "react";
import { useAuthState } from "../hooks/use-auth-state";
import { useAuthActions } from "../hooks/use-auth-actions";
import { AuthContextType } from "../types/auth";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Combine auth state and actions
  const authState = useAuthState();
  const authActions = useAuthActions();

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        ...authActions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Re-export types for easier access
export type { UserRole } from "../types/auth";

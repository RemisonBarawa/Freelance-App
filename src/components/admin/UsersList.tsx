
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, LogIn, Mail, Phone, Trash } from "lucide-react";
import { AppUser } from "@/types/admin";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UsersListProps {
  users: AppUser[];
  currentUser?: AppUser | null;
  onDeleteUser: (userId: string) => void;
}

const UsersList = ({ users, currentUser, onDeleteUser }: UsersListProps) => {
  const navigate = useNavigate();
  
  const loginAsUser = async (userId: string) => {
    try {
      const { data: targetUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        toast.error("User not found");
        return;
      }
      
      if (targetUser && targetUser.role === 'client') {
        navigate('/student-dashboard');
        toast.success(`Viewing as client: ${targetUser.full_name}`);
      } else if (targetUser && targetUser.role === 'freelancer') {
        navigate('/owner-dashboard');
        toast.success(`Viewing as freelancer: ${targetUser.full_name}`);
      } else {
        toast.error("Cannot impersonate this user type");
      }
    } catch (error: any) {
      console.error("Error logging in as user:", error);
      toast.error(`Failed to login as user: ${error.message}`);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === 'Not provided') return 'Not provided';
    return phone;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contact</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Role</th>
            <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((appUser) => (
            <tr key={appUser.id} className="border-b border-border hover:bg-secondary/5">
              <td className="py-4 px-4">
                <div className="font-medium">{appUser.name}</div>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail size={14} className="mr-1.5 text-muted-foreground" />
                    {appUser.email || 'Not available'}
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone size={14} className="mr-1.5 text-muted-foreground" />
                    {formatPhoneNumber(appUser.phone)}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                  ${appUser.role === "admin" 
                    ? "bg-primary/10 text-primary" 
                    : appUser.role === "freelancer" 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-green-100 text-green-800"
                  }`}
                >
                  {appUser.role}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loginAsUser(appUser.id)}
                    className="text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <LogIn size={14} className="mr-1" />
                    Log In As
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteUser(appUser.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={appUser.id === currentUser?.id}
                  >
                    <Trash size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;

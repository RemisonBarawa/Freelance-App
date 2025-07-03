
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access the dashboard");
      navigate("/auth?mode=login");
      return;
    }
    
    // Only students should access this dashboard
    if (user?.role !== "student") {
      toast.error("You don't have access to this dashboard");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your student profile and activities
            </p>
          </div>
          
          <div className="relative">
            <Button
              variant="outline" 
              size="icon"
              className="relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="courses">
          <TabsList className="mb-6">
            <TabsTrigger value="courses">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="assignments">
              Assignments
            </TabsTrigger>
            <TabsTrigger value="grades">
              Grades
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">
                    You haven't enrolled in any courses yet.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="assignments">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-1">No Assignments</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You don't have any assignments yet.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="grades">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-1">No Grades</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You don't have any grades yet.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;

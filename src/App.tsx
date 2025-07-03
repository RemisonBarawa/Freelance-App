
import React from "react"; // Add explicit React import for hooks
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import HostelSearch from "./pages/HostelSearch";
import ProjectSearch from "./pages/ProjectSearch";
import ProjectCreate from "./pages/ProjectCreate";
import Notifications from "./pages/Notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import AuthLayout from "./components/layouts/AuthLayout";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Define the router with the AuthLayout wrapper
const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        element: <Index />,
        errorElement: <NotFound />,
      },
      {
        path: "/project/:id",
        element: <ProjectDetail />,
        errorElement: <NotFound />,
      },
      {
        path: "/auth",
        element: <Auth />,
        errorElement: <NotFound />,
      },
      {
        path: "/freelancer-dashboard",
        element: <FreelancerDashboard />,
        errorElement: <NotFound />,
      },
      {
        path: "/admin-dashboard",
        element: <AdminDashboard />,
        errorElement: <NotFound />,
      },
      {
        path: "/student-dashboard",
        element: <StudentDashboard />,
        errorElement: <NotFound />,
      },
      {
        path: "/client-dashboard", 
        element: <ClientDashboard />,
        errorElement: <NotFound />,
      },
      {
        path: "/notifications",
        element: <Notifications />
      },
      {
        path: "/hostel-search",
        element: <HostelSearch />,
        errorElement: <NotFound />,
      },
      {
        path: "/project-search",
        element: <ProjectSearch />,
        errorElement: <NotFound />,
      },
      {
        path: "/project-create",
        element: <ProjectCreate />,
        errorElement: <NotFound />,
      },
      {
        path: "/project-create/:id",
        element: <ProjectCreate />,
        errorElement: <NotFound />,
      }
    ]
  }
]);

// Fix the App component with proper React imports
function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <SonnerToaster />
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;

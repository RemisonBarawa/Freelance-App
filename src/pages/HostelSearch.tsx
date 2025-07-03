
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import HostelCard, { Hostel } from "../components/HostelCard";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

// Redirecting component for legacy URLs
const HostelSearch = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get the current URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const queryString = searchParams.toString();
    
    // Redirect to the new URL, preserving any query parameters
    const newPath = `/project-search${queryString ? `?${queryString}` : ''}`;
    navigate(newPath, { replace: true });
  }, [navigate]);
  
  return null; // This component will redirect, so it doesn't need to render anything
};

export default HostelSearch;

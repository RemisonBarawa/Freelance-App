
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import { Search, Filter, X, Briefcase } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { ProjectWithOwner } from "@/types/admin";

// Mock categories since we don't have a categories table yet
const MOCK_CATEGORIES = [
  { id: "1", name: "Web Development" },
  { id: "2", name: "Mobile Development" },
  { id: "3", name: "UI/UX Design" },
  { id: "4", name: "Content Writing" },
  { id: "5", name: "Digital Marketing" },
  { id: "6", name: "Data Analysis" }
];

const ProjectSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Extract search parameters from URL
  const initialKeyword = searchParams.get("keyword") || "";
  
  // State for search form and filters visibility
  const [showFilters, setShowFilters] = useState(false);
  const [searchForm, setSearchForm] = useState({
    keyword: initialKeyword,
    minBudget: 0,
    maxBudget: 10000,
    categories: [] as string[],
    status: "open",
  });
  
  // Fetch projects from Supabase - modified to avoid the foreign key error
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        console.log("Fetching projects from Supabase");
        
        // Modified query to avoid the join operation
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*');
        
        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }
        
        console.log("Fetched projects data:", projectsData);
        
        // Get client profiles separately if needed
        const clientIds = projectsData.map(project => project.client_id).filter(Boolean);
        let clientProfiles = {};
        
        if (clientIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
            
          if (profilesData) {
            clientProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile.full_name || 'Unknown';
              return acc;
            }, {});
          }
        }
        
        // Transform Supabase data to match ProjectWithOwner type
        return projectsData.map(project => {
          const clientName = project.client_id ? 
            (clientProfiles[project.client_id] || 'Unknown') : 
            'Unknown';
          
          return {
            id: project.id,
            title: project.title,
            description: project.description || '',
            budget_min: project.budget_min || 0,
            budget_max: project.budget_max || project.budget_min || 0,
            status: project.status || 'open',
            createdAt: project.created_at,
            created_at: project.created_at,
            client_id: project.client_id,
            ownerName: clientName,
            ownerId: project.client_id,
            updated_at: project.updated_at
          };
        }) as ProjectWithOwner[];
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
        return [];
      }
    }
  });

  // Use mock categories instead of fetching from database
  const categories = MOCK_CATEGORIES;
  
  // Apply filters
  const filteredProjects = projects.filter((project) => {
    // Filter by keyword (in title or description)
    if (
      searchForm.keyword &&
      !project.title.toLowerCase().includes(searchForm.keyword.toLowerCase()) &&
      !project.description.toLowerCase().includes(searchForm.keyword.toLowerCase())
    ) {
      return false;
    }
    
    // Filter by budget range
    const projectMinBudget = project.budget_min || 0;
    if (projectMinBudget < searchForm.minBudget) {
      return false;
    }
    
    const projectMaxBudget = project.budget_max || 999999;
    if (projectMaxBudget > searchForm.maxBudget) {
      return false;
    }
    
    // Filter by status
    if (searchForm.status && searchForm.status !== "all" && project.status !== searchForm.status) {
      return false;
    }
    
    // Filter by categories (if implemented in future)
    if (searchForm.categories.length > 0) {
      // This is a placeholder for future category filtering
      // Currently there's no category_id in our projects
      return true;
    }
    
    return true;
  });
  
  // Update search params in URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchForm.keyword) {
      newParams.set("keyword", searchForm.keyword);
    }
    
    const newSearch = newParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    // Replace state instead of push to avoid adding to history
    window.history.replaceState({}, "", newUrl);
  }, [searchForm.keyword, location.pathname]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm({
      ...searchForm,
      [name]: value,
    });
  };
  
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSearchForm({
      ...searchForm,
      categories: checked
        ? [...searchForm.categories, categoryId]
        : searchForm.categories.filter(id => id !== categoryId)
    });
  };
  
  const handleStatusChange = (status: string) => {
    setSearchForm({
      ...searchForm,
      status
    });
  };
  
  const handleBudgetChange = (value: number[]) => {
    setSearchForm({
      ...searchForm,
      minBudget: value[0],
      maxBudget: value[1],
    });
  };
  
  const clearFilters = () => {
    setSearchForm({
      keyword: "",
      minBudget: 0,
      maxBudget: 10000,
      categories: [],
      status: "all",
    });
  };
  
  // Function to determine if any filters are active
  const hasActiveFilters = () => {
    return (
      searchForm.keyword !== "" ||
      searchForm.minBudget !== 0 ||
      searchForm.maxBudget !== 10000 ||
      searchForm.categories.length > 0 ||
      searchForm.status !== "all"
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="bg-gradient-to-b from-secondary/30 to-transparent pt-28 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Find Your Next Project
          </h1>
          <p className="text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
            Browse through available projects and find freelance work that matches your skills and interests
          </p>
          
          {/* Main search bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  name="keyword"
                  value={searchForm.keyword}
                  onChange={handleInputChange}
                  placeholder="Search projects by keyword..."
                  className="pl-10 h-12 bg-white"
                />
              </div>
              <Button 
                className="h-12 px-5"
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "default" : "outline"}
              >
                <Filter size={18} className="mr-2" />
                Filters
              </Button>
            </div>
            
            {/* Advanced filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-lg border border-border p-5 mt-2 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-muted-foreground"
                  >
                    <X size={14} className="mr-1" />
                    Clear all
                  </Button>
                </div>
                
                <div className="space-y-5">
                  {/* Budget range */}
                  <div>
                    <Label className="mb-2 block">Budget Range ($)</Label>
                    <div className="pt-4 px-2">
                      <Slider
                        defaultValue={[searchForm.minBudget, searchForm.maxBudget]}
                        min={0}
                        max={10000}
                        step={100}
                        value={[searchForm.minBudget, searchForm.maxBudget]}
                        onValueChange={handleBudgetChange}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>${searchForm.minBudget}</span>
                      <span>${searchForm.maxBudget}+</span>
                    </div>
                  </div>
                  
                  {/* Project Status */}
                  <div>
                    <Label className="mb-3 block">Project Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {["all", "open", "in_progress", "completed"].map((status) => (
                        <Button
                          key={status}
                          variant={searchForm.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStatusChange(status)}
                          className="capitalize"
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div>
                      <Label className="mb-3 block">Categories</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={category.id}
                              checked={searchForm.categories.includes(category.id)}
                              onCheckedChange={(checked) => 
                                handleCategoryChange(category.id, checked === true)
                              }
                            />
                            <Label htmlFor={category.id} className="cursor-pointer text-sm">
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Results summary */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-medium">
              {isLoading
                ? "Loading projects..."
                : filteredProjects.length === 0
                ? "No projects found"
                : `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""} found`}
            </h2>
            
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X size={14} className="mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          
          {isLoading ? (
            // Loading state
            <div>Loading...</div>
          ) : filteredProjects.length === 0 ? (
            // Empty state
            <div>No projects found</div>
          ) : (
            // Results grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project as any} 
                  clientName={project.ownerName || "Unknown"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSearch;

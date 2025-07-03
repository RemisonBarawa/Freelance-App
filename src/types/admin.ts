
import { UserRole } from "./auth";

export interface AppUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
}

export interface ProjectWithOwner {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max?: number;
  status: string;
  createdAt: string;
  ownerName?: string;
  ownerId?: string;
  proposalsCount?: number;
  client_id: string;
  created_at: string;
  updated_at?: string;
  assigned_to?: string | null;
  available_for_bidding?: boolean;
  deadline?: string;  // Added deadline property
}

export interface ProposalWithDetails {
  id: string;
  projectId: string;
  projectTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhone?: string;
  bidAmount: number;
  estimatedDays?: number;
  status: 'pending' | 'accepted' | 'rejected';
  coverLetter?: string;
  createdAt: string;
}

export interface Hostel {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  rooms: number;
  ownerId: string;
  amenities: {
    wifi: boolean;
    water: boolean;
    electricity: boolean;
    security: boolean;
    furniture: boolean;
    kitchen: boolean;
    bathroom: boolean;
  };
  images: string[];
  createdAt: string;
}

// Needed for HostelCreate.tsx
export interface Amenity {
  id: string;
  name: string;
  hostel_id: string;
}

export interface HostelImage {
  id: string;
  url: string;
  hostel_id: string;
}

// New interfaces for the freelancing platform
export interface FreelancerProfile {
  id: string;
  title?: string;
  hourly_rate?: number;
  experience_years?: number;
  education?: string;
  availability?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  category_id?: string;
}

export interface FreelancerSkill {
  id: string;
  freelancer_id: string;
  skill_id: string;
  proficiency_level?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  status: string;
  budget_min: number;
  budget_max?: number;
  deadline?: string;
  created_at: string;
  updated_at?: string;
  category_id?: string;
  assigned_to?: string | null;
  available_for_bidding?: boolean;
  client_name?: string;  // Added client_name property
}

export interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  bid_amount: number;
  estimated_days?: number;
  status: string;
  cover_letter?: string;
  created_at: string;
  updated_at?: string;
}

export interface Contract {
  id: string;
  project_id?: string;
  freelancer_id?: string;
  client_id?: string;
  proposal_id?: string;
  payment_amount: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface OwnerProposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  bid_amount: number;
  estimated_days?: number;
  status: string;
  cover_letter?: string;
  created_at: string;
  updated_at?: string;
  project?: {
    title: string;
    client_id: string;
  };
  freelancer?: {
    id: string;
    profiles?: {
      full_name?: string;
      phone_number?: string;
    } | null;
  } | null;
}

export interface ProjectWithClientName extends Project {
  client_name?: string;
  submission_status?: string; // Add the missing submission_status property
}

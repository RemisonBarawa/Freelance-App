
// Types for projects, proposals and related data
export interface ProjectWithClient {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min: number;
  budget_max?: number;
  client_id: string;
  created_at: string;
  updated_at?: string;
  assigned_to?: string | null;
  available_for_bidding?: boolean;
  deadline?: string;
  submission_url?: string;
  submission_notes?: string;
  submission_date?: string;
  submission_status?: string;
  profiles?: {
    full_name?: string;
    email?: string;
    phone_number?: string;
  } | null;
}

export interface ProposalWithFreelancer {
  id: string;
  project_id: string;
  freelancer_id: string;
  bid_amount: number;
  estimated_days?: number;
  status: string;
  cover_letter?: string;
  created_at: string;
  updated_at?: string;
  freelancer?: {
    id: string;
    profiles?: {
      full_name?: string;
      email?: string;
      phone_number?: string;
    } | null;
  } | null;
}

export interface UserProposal {
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

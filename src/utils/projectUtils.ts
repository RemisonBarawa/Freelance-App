
// This file is maintained for backward compatibility
// Consider importing directly from the specific utility files or from the index

import { 
  verifyProjectUpdate, 
  makeProjectAvailableForBidding, 
  approveProject, 
  assignProject,
  submitProposal,
  updateProposalStatus
} from "./projects/index";

// Re-export all functions
export {
  verifyProjectUpdate,
  makeProjectAvailableForBidding,
  approveProject,
  assignProject,
  submitProposal,
  updateProposalStatus
};

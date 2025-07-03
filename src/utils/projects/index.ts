
// Re-export all project-related utilities
export { verifyProjectUpdate } from "./verifyUtils";
export { makeProjectAvailableForBidding } from "./biddingUtils";
export { approveProject } from "./approvalUtils";
export { assignProject, respondToAssignment, checkExpiredAssignments, submitProjectWork } from "./assignmentUtils";
export { submitProposal } from "./proposalSubmissionUtils";
export { updateProposalStatus } from "./proposalStatusUtils";
export type { ProjectStatus } from "./assignmentUtils";

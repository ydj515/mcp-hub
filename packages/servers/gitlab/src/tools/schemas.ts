import { z } from "zod";

export const projectIdSchema = z.union([z.string().min(1), z.number().int()]);

export const paginationParameters = {
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional()
};

export const getProjectParameters = z.object({
  project_id: projectIdSchema
});

export const searchProjectsParameters = z.object({
  search: z.string().min(1).optional(),
  membership: z.boolean().optional(),
  owned: z.boolean().optional(),
  simple: z.boolean().optional(),
  order_by: z
    .enum(["id", "name", "path", "created_at", "updated_at", "last_activity_at"])
    .optional(),
  sort: z.enum(["asc", "desc"]).optional(),
  ...paginationParameters
});

export const listIssuesParameters = z.object({
  project_id: projectIdSchema,
  state: z.enum(["opened", "closed", "all"]).optional(),
  search: z.string().min(1).optional(),
  labels: z.string().min(1).optional(),
  scope: z.enum(["created_by_me", "assigned_to_me", "all"]).optional(),
  assignee_username: z.string().min(1).optional(),
  author_username: z.string().min(1).optional(),
  ...paginationParameters
});

export const getIssueParameters = z.object({
  project_id: projectIdSchema,
  issue_iid: z.number().int().positive()
});

export const listMergeRequestsParameters = z.object({
  project_id: projectIdSchema,
  state: z.enum(["opened", "closed", "locked", "merged", "all"]).optional(),
  search: z.string().min(1).optional(),
  labels: z.string().min(1).optional(),
  scope: z
    .enum(["created_by_me", "assigned_to_me", "reviews_for_me", "all"])
    .optional(),
  author_username: z.string().min(1).optional(),
  reviewer_username: z.string().min(1).optional(),
  source_branch: z.string().min(1).optional(),
  target_branch: z.string().min(1).optional(),
  ...paginationParameters
});

export const getMergeRequestParameters = z.object({
  project_id: projectIdSchema,
  merge_request_iid: z.number().int().positive()
});

export const listProjectBranchesParameters = z.object({
  project_id: projectIdSchema,
  search: z.string().min(1).optional(),
  regex: z.string().min(1).optional(),
  ...paginationParameters
});

export const listCommitsParameters = z.object({
  project_id: projectIdSchema,
  ref_name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  since: z.string().min(1).optional(),
  until: z.string().min(1).optional(),
  all: z.boolean().optional(),
  first_parent: z.boolean().optional(),
  trailers: z.boolean().optional(),
  with_stats: z.boolean().optional(),
  order: z.enum(["default", "topo"]).optional(),
  ...paginationParameters
});

export const getFileParameters = z.object({
  project_id: projectIdSchema,
  file_path: z.string().min(1),
  ref: z.string().min(1).default("HEAD"),
  include_base64: z.boolean().optional()
});

export const listPipelinesParameters = z.object({
  project_id: projectIdSchema,
  ref: z.string().min(1).optional(),
  sha: z.string().min(1).optional(),
  status: z
    .enum([
      "created",
      "waiting_for_resource",
      "preparing",
      "pending",
      "running",
      "success",
      "failed",
      "canceled",
      "skipped",
      "manual",
      "scheduled"
    ])
    .optional(),
  source: z.string().min(1).optional(),
  scope: z
    .enum(["running", "pending", "finished", "branches", "tags"])
    .optional(),
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  updated_after: z.string().min(1).optional(),
  updated_before: z.string().min(1).optional(),
  order_by: z.enum(["id", "status", "ref", "updated_at", "user_id"]).optional(),
  sort: z.enum(["asc", "desc"]).optional(),
  ...paginationParameters
});

const jobStatusSchema = z.enum([
  "created",
  "pending",
  "running",
  "failed",
  "success",
  "canceled",
  "canceling",
  "skipped",
  "waiting_for_resource",
  "manual",
  "scheduled"
]);

export const getPipelineJobsParameters = z.object({
  project_id: projectIdSchema,
  pipeline_id: z.number().int().positive(),
  include_retried: z.boolean().optional(),
  scope: z.array(jobStatusSchema).optional(),
  ...paginationParameters
});

export const createIssueParameters = z.object({
  project_id: projectIdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_ids: z.array(z.number().int()).optional(),
  confidential: z.boolean().optional(),
  due_date: z.string().min(1).optional(),
  issue_type: z.enum(["issue", "incident", "test_case", "task"]).optional(),
  labels: z.string().min(1).optional(),
  milestone_id: z.number().int().positive().optional(),
  weight: z.number().int().nonnegative().optional()
});

export const createMergeRequestParameters = z.object({
  project_id: projectIdSchema,
  source_branch: z.string().min(1),
  target_branch: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_ids: z.array(z.number().int()).optional(),
  reviewer_ids: z.array(z.number().int()).optional(),
  labels: z.string().min(1).optional(),
  milestone_id: z.number().int().positive().optional(),
  remove_source_branch: z.boolean().optional(),
  squash: z.boolean().optional(),
  allow_collaboration: z.boolean().optional(),
  target_project_id: z.number().int().positive().optional()
});

export const createIssueNoteParameters = z.object({
  project_id: projectIdSchema,
  issue_iid: z.number().int().positive(),
  body: z.string().min(1),
  internal: z.boolean().optional()
});

export const createMergeRequestNoteParameters = z.object({
  project_id: projectIdSchema,
  merge_request_iid: z.number().int().positive(),
  body: z.string().min(1),
  internal: z.boolean().optional(),
  merge_request_diff_head_sha: z.string().min(1).optional()
});

export const approveMergeRequestParameters = z.object({
  project_id: projectIdSchema,
  merge_request_iid: z.number().int().positive(),
  sha: z.string().min(1).optional(),
  approval_password: z.string().min(1).optional()
});

export const mergeMergeRequestParameters = z.object({
  project_id: projectIdSchema,
  merge_request_iid: z.number().int().positive(),
  sha: z.string().min(1).optional(),
  auto_merge: z.boolean().optional(),
  merge_commit_message: z.string().min(1).optional(),
  squash_commit_message: z.string().min(1).optional(),
  should_remove_source_branch: z.boolean().optional(),
  squash: z.boolean().optional()
});

export type GetProjectParameters = z.infer<typeof getProjectParameters>;
export type SearchProjectsParameters = z.infer<typeof searchProjectsParameters>;
export type ListIssuesParameters = z.infer<typeof listIssuesParameters>;
export type GetIssueParameters = z.infer<typeof getIssueParameters>;
export type ListMergeRequestsParameters = z.infer<
  typeof listMergeRequestsParameters
>;
export type GetMergeRequestParameters = z.infer<
  typeof getMergeRequestParameters
>;
export type ListProjectBranchesParameters = z.infer<
  typeof listProjectBranchesParameters
>;
export type ListCommitsParameters = z.infer<typeof listCommitsParameters>;
export type GetFileParameters = z.infer<typeof getFileParameters>;
export type ListPipelinesParameters = z.infer<typeof listPipelinesParameters>;
export type GetPipelineJobsParameters = z.infer<
  typeof getPipelineJobsParameters
>;
export type CreateIssueParameters = z.infer<typeof createIssueParameters>;
export type CreateMergeRequestParameters = z.infer<
  typeof createMergeRequestParameters
>;
export type CreateIssueNoteParameters = z.infer<
  typeof createIssueNoteParameters
>;
export type CreateMergeRequestNoteParameters = z.infer<
  typeof createMergeRequestNoteParameters
>;
export type ApproveMergeRequestParameters = z.infer<
  typeof approveMergeRequestParameters
>;
export type MergeMergeRequestParameters = z.infer<
  typeof mergeMergeRequestParameters
>;

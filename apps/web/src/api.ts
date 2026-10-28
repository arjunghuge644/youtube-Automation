import type {
  Project,
  ProjectInput,
  PublicAuth,
  ProjectScript,
  UpdateScriptInput,
  ProjectScenePlan,
  UpdateScenePlanInput,
  ProjectStoryboard,
  UpdateStoryboardInput,
  ProductionTask,
  Asset,
  QaResult,
  ProductionJob,
  ProductionState,
} from '@creatorflow/shared';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let csrfToken: string | undefined;

export function setCsrfToken(token: string | undefined) {
  csrfToken = token;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (csrfToken && options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrfToken);
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { ...options, credentials: 'include', headers, signal: options.signal ?? AbortSignal.timeout(15_000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'CONNECTION_ERROR', 'We could not reach the studio. Check that the API is running, then try again.');
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, payload?.error?.code ?? 'REQUEST_FAILED', payload?.error?.message ?? 'Something went wrong. Please try again.');
  }
  if (!payload) throw new ApiError(0, 'INVALID_RESPONSE', 'The studio returned an unexpected response. Please try again.');
  return payload as T;
}

export type ProjectList = { data: Project[]; pagination: { page: number; pageSize: number; total: number } };

export const api = {
  me: () => request<{ data: PublicAuth }>('/auth/me'),
  login: (email: string, password: string) => request<{ data: PublicAuth }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ data: PublicAuth }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  projects: (page = 1) => request<ProjectList>(`/projects?page=${page}&pageSize=50`),
  project: (id: string) => request<{ data: Project }>(`/projects/${encodeURIComponent(id)}`),
  createProject: (input: ProjectInput) => request<{ data: Project }>('/projects', { method: 'POST', body: JSON.stringify(input) }),
  updateProject: (id: string, expectedVersion: number, input: Partial<ProjectInput>) => request<{ data: Project }>(`/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ ...input, expectedVersion }) }),
  deleteProject: (id: string) => request<void>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Phase 2: Production Pipeline
  productionState: (id: string) => request<{ data: ProductionState }>(`/projects/${encodeURIComponent(id)}/production`),
  generateScript: (id: string) => request<{ data: ProductionJob }>(`/projects/${encodeURIComponent(id)}/script/generate`, { method: 'POST' }),
  getScript: (id: string) => request<{ data: ProjectScript }>(`/projects/${encodeURIComponent(id)}/script`),
  updateScript: (id: string, input: UpdateScriptInput) => request<{ data: ProjectScript }>(`/projects/${encodeURIComponent(id)}/script`, { method: 'PATCH', body: JSON.stringify(input) }),
  approveScript: (id: string) => request<{ data: ProjectScript }>(`/projects/${encodeURIComponent(id)}/script/approve`, { method: 'POST' }),
  generateScenePlan: (id: string) => request<{ data: ProductionJob }>(`/projects/${encodeURIComponent(id)}/scenes/generate`, { method: 'POST' }),
  getScenePlan: (id: string) => request<{ data: ProjectScenePlan }>(`/projects/${encodeURIComponent(id)}/scenes`),
  updateScenePlan: (id: string, input: UpdateScenePlanInput) => request<{ data: ProjectScenePlan }>(`/projects/${encodeURIComponent(id)}/scenes`, { method: 'PATCH', body: JSON.stringify(input) }),
  approveScenePlan: (id: string) => request<{ data: ProjectScenePlan }>(`/projects/${encodeURIComponent(id)}/scenes/approve`, { method: 'POST' }),

  // Orchestration & Manual Handoff Workflow
  generateStoryboard: (id: string) => request<{ data: ProjectStoryboard }>(`/projects/${encodeURIComponent(id)}/storyboard/generate`, { method: 'POST' }),
  getStoryboard: (id: string) => request<{ data: ProjectStoryboard }>(`/projects/${encodeURIComponent(id)}/storyboard`),
  updateStoryboard: (id: string, input: UpdateStoryboardInput) => request<{ data: ProjectStoryboard }>(`/projects/${encodeURIComponent(id)}/storyboard`, { method: 'PATCH', body: JSON.stringify(input) }),
  approveStoryboard: (id: string) => request<{ data: ProjectStoryboard }>(`/projects/${encodeURIComponent(id)}/storyboard/approve`, { method: 'POST' }),
  compileDag: (id: string) => request<{ data: ProductionTask[] }>(`/projects/${encodeURIComponent(id)}/dag`, { method: 'POST' }),
  getTasks: (id: string) => request<{ data: ProductionTask[] }>(`/projects/${encodeURIComponent(id)}/tasks`),
  approveTask: (id: string, taskId: string) => request<{ data: ProductionTask }>(`/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}/approve`, { method: 'POST' }),
  completeHandoff: (id: string, taskId: string, filePath: string) => request<{ data: any }>(`/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}/handoff-complete`, { method: 'POST', body: JSON.stringify({ filePath }) }),
  regenerateScene: (id: string, sceneId: string) => request<{ data: ProductionTask[] }>(`/projects/${encodeURIComponent(id)}/regenerate-scene`, { method: 'POST', body: JSON.stringify({ sceneId }) }),
  getQaReport: (id: string) => request<{ data: QaResult | null }>(`/projects/${encodeURIComponent(id)}/qa`),
  getAssets: (id: string) => request<{ data: Asset[] }>(`/projects/${encodeURIComponent(id)}/assets`),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

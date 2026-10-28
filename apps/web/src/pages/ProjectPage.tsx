import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ProjectInput,
  ProjectScript,
  ProjectScenePlan,
  UpdateScriptInput,
  UpdateScenePlanInput,
  UniversalScene,
} from '@creatorflow/shared';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Camera,
  Car,
  Check,
  CheckCircle2,
  Clapperboard,
  Clock,
  FileText,
  Image,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Move,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../api';
import { ErrorNotice, Loading, Modal, ProjectArtwork, StatusBadge } from '../components';
import { ProjectForm } from '../ProjectForm';
import { StoryboardWorkspace } from '../StoryboardWorkspace';
import { WorkflowDashboard } from '../WorkflowDashboard';

export function NewProjectPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const create = useMutation({
    mutationFn: api.createProject,
    onSuccess: async ({ data }) => {
      await client.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${data.id}`);
    },
  });

  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> All projects
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-label">THE START OF SOMETHING</span>
          <h1>Create a project<span className="heading-dot">.</span></h1>
          <p>Tell us about your next video. You can refine everything later.</p>
        </div>
        <span className="phase-pill"><span className="tiny-dot" /> Project brief</span>
      </div>
      <div className="editor-grid">
        <ProjectForm
          onSubmit={async (input) => {
            try {
              await create.mutateAsync(input);
            } catch {
              /* Mutation error is rendered below. */
            }
          }}
          pending={create.isPending}
          error={create.error ? errorMessage(create.error) : undefined}
        />
        <aside className="editor-aside">
          <div className="aside-card">
            <div className="aside-icon"><FileText size={21} /></div>
            <h3>A clear brief is a good beginning.</h3>
            <p>Think about the one thing your audience should take away. Add a few visual ideas and a tone that feels right.</p>
            <div className="aside-divider" />
            <span className="section-label">TRY THIS FOR YOUR FIRST PROJECT</span>
            <blockquote>“Explain why traffic congestion happens, using stylized 3D cars, moving cameras, and Hindi narration.”</blockquote>
            <p className="aside-small">An example brief for the first planned animation template.</p>
          </div>
          <div className="small-info-card">
            <LockKeyhole size={17} />
            <p>Projects belong to your account. Your brief is saved when you create the project.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export function ProjectPage() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'brief' | 'script' | 'scenes' | 'storyboard' | 'workflow'>('brief');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const projectQuery = useQuery({ queryKey: ['project', id], queryFn: () => api.project(id) });
  const productionQuery = useQuery({ queryKey: ['production', id], queryFn: () => api.productionState(id) });
  const scriptQuery = useQuery({
    queryKey: ['script', id],
    queryFn: () => api.getScript(id),
    enabled: activeTab === 'script' || Boolean(productionQuery.data?.data.hasScript),
    retry: false,
  });
  const scenesQuery = useQuery({
    queryKey: ['scenes', id],
    queryFn: () => api.getScenePlan(id),
    enabled: activeTab === 'scenes' || Boolean(productionQuery.data?.data.hasScenePlan),
    retry: false,
  });
  const storyboardQuery = useQuery({
    queryKey: ['storyboard', id],
    queryFn: () => api.getStoryboard(id),
    enabled: activeTab === 'storyboard' || Boolean(productionQuery.data?.data.hasStoryboard),
    retry: false,
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.getTasks(id),
    enabled: activeTab === 'storyboard' || activeTab === 'workflow',
    refetchInterval: activeTab === 'workflow' ? 3000 : false,
  });
  const qaQuery = useQuery({
    queryKey: ['qa', id],
    queryFn: () => api.getQaReport(id),
    enabled: activeTab === 'workflow',
  });
  const assetsQuery = useQuery({
    queryKey: ['assets', id],
    queryFn: () => api.getAssets(id),
    enabled: activeTab === 'workflow',
  });

  const update = useMutation({
    mutationFn: ({ input, version }: { input: ProjectInput; version: number }) => api.updateProject(id, version, input),
    onSuccess: async (result) => {
      client.setQueryData(['project', id], result);
      await client.invalidateQueries({ queryKey: ['projects'] });
      setSavedNotice(`Brief saved as version ${result.data.version}.`);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteProject(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] });
      client.removeQueries({ queryKey: ['project', id] });
      navigate('/');
    },
  });

  const generateScript = useMutation({
    mutationFn: () => api.generateScript(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['production', id] });
      await client.invalidateQueries({ queryKey: ['script', id] });
      setActiveTab('script');
    },
  });

  const generateScenePlan = useMutation({
    mutationFn: () => api.generateScenePlan(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['production', id] });
      await client.invalidateQueries({ queryKey: ['scenes', id] });
      setActiveTab('scenes');
    },
  });

  const generateStoryboard = useMutation({
    mutationFn: () => api.generateStoryboard(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['production', id] });
      await client.invalidateQueries({ queryKey: ['storyboard', id] });
      await client.invalidateQueries({ queryKey: ['tasks', id] });
      setActiveTab('storyboard');
    },
  });

  const completeHandoff = useMutation({
    mutationFn: ({ taskId, filePath }: { taskId: string; filePath: string }) => api.completeHandoff(id, taskId, filePath),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['tasks', id] });
      await client.invalidateQueries({ queryKey: ['qa', id] });
      await client.invalidateQueries({ queryKey: ['assets', id] });
    },
  });

  const regenerateScene = useMutation({
    mutationFn: (sceneId: string) => api.regenerateScene(id, sceneId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['tasks', id] });
      await client.invalidateQueries({ queryKey: ['qa', id] });
    },
  });

  if (projectQuery.isPending) return <Loading label="Opening your project…" />;
  if (projectQuery.isError) {
    return (
      <>
        <Link to="/" className="back-link"><ArrowLeft size={15} /> All projects</Link>
        <ErrorNotice retry={() => void projectQuery.refetch()}>{errorMessage(projectQuery.error)}</ErrorNotice>
      </>
    );
  }

  const project = projectQuery.data.data;
  const prodState = productionQuery.data?.data;
  const script = scriptQuery.data?.data;
  const scenePlan = scenesQuery.data?.data;
  const storyboard = storyboardQuery.data?.data;
  const tasks = tasksQuery.data?.data || [];
  const qaResult = qaQuery.data?.data;
  const assets = assetsQuery.data?.data || [];
  const editableBrief = project.status === 'DRAFT';
  const conflict = update.error instanceof ApiError && update.error.status === 409;

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={15} /> All projects</Link>
      <div className="page-heading project-heading">
        <div>
          <span className="section-label">PROJECT WORKSPACE</span>
          <h1>{project.title}</h1>
          <p>Shape the creative brief, refine the script, and configure universal scene strategies.</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="project-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'brief' ? 'active' : ''}`}
          onClick={() => setActiveTab('brief')}
        >
          <FileText size={16} /> Creative brief
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'script' ? 'active' : ''}`}
          onClick={() => setActiveTab('script')}
        >
          <Sparkles size={16} /> Script planning {prodState?.scriptApproved && <Check size={14} className="tab-check" />}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenes')}
        >
          <Box size={16} /> Scene layout {prodState?.scenePlanApproved && <Check size={14} className="tab-check" />}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'storyboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('storyboard')}
        >
          <Clapperboard size={16} /> Storyboard & Handoff {prodState?.storyboardApproved && <Check size={14} className="tab-check" />}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          <Layers3 size={16} /> Automated Pipeline
        </button>
        <span className="tab-version"><Save size={14} /> Version {project.version}</span>
      </div>

      {savedNotice && (
        <div className="success-notice" role="status">
          <Check size={17} /> {savedNotice}
        </div>
      )}

      {conflict && (
        <ErrorNotice retry={() => { update.reset(); void projectQuery.refetch(); }}>
          This project has changed since you opened it. Reload the latest version before saving again.
        </ErrorNotice>
      )}

      {activeTab === 'brief' && (
        <div className="editor-grid">
          <ProjectForm
            key={project.version}
            initial={project}
            onSubmit={async (input) => {
              setSavedNotice('');
              try {
                await update.mutateAsync({ input, version: project.version });
              } catch {
                /* Mutation error is rendered in the form. */
              }
            }}
            pending={update.isPending}
            error={update.error && !conflict ? errorMessage(update.error) : undefined}
            submitLabel="Save changes"
            disabled={!editableBrief}
          />
          <aside className="editor-aside">
            <div className="aside-card preview-card">
              <ProjectArtwork aspectRatio={project.aspectRatio} large />
              <div className="preview-card-body">
                <span className="section-label">PROJECT FORMAT</span>
                <h3>
                  {project.aspectRatio === '9:16'
                    ? 'Vertical story'
                    : project.aspectRatio === '1:1'
                    ? 'Square story'
                    : 'Landscape story'}
                </h3>
                <p>
                  {project.aspectRatio} <span className="meta-dot">·</span> {project.durationSeconds} seconds <span className="meta-dot">·</span> {project.resolution === 'preview' ? 'Preview resolution' : project.resolution}
                </p>
                <small>Format illustration · No video rendered</small>
              </div>
            </div>

            <div className="aside-card next-step-card">
              <Sparkles size={20} />
              <h3>Script generation</h3>
              <p>Turn this brief into structured scenes with narration and timing.</p>
              <button
                type="button"
                className="button primary small"
                disabled={generateScript.isPending}
                onClick={() => generateScript.mutate()}
              >
                {generateScript.isPending ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}
                Generate script
              </button>
            </div>

            <div className="project-details">
              <span>Created<strong>{new Date(project.createdAt).toLocaleDateString()}</strong></span>
              <span>Last updated<strong>{new Date(project.updatedAt).toLocaleDateString()}</strong></span>
              <span>Project version<strong>{project.version}</strong></span>
            </div>

            {editableBrief && (
              <button className="delete-project" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={15} /> Delete project
              </button>
            )}
          </aside>
        </div>
      )}

      {activeTab === 'script' && (
        <ScriptPlanningView
          projectId={project.id}
          script={script}
          loading={scriptQuery.isPending}
          error={scriptQuery.error ? errorMessage(scriptQuery.error) : undefined}
          onGenerate={() => generateScript.mutate()}
          generating={generateScript.isPending}
          targetDuration={project.durationSeconds}
          onProceedToScenes={() => setActiveTab('scenes')}
        />
      )}

      {activeTab === 'scenes' && (
        <ScenePlanningView
          projectId={project.id}
          scriptApproved={Boolean(prodState?.scriptApproved)}
          scenePlan={scenePlan}
          loading={scenesQuery.isPending}
          error={scenesQuery.error ? errorMessage(scenesQuery.error) : undefined}
          onGenerate={() => generateScenePlan.mutate()}
          generating={generateScenePlan.isPending}
          onSwitchToScript={() => setActiveTab('script')}
        />
      )}

      {activeTab === 'storyboard' && (
        <div className="storyboard-view-container">
          {!storyboard ? (
            <div className="empty-planning-card">
              <Clapperboard size={36} strokeWidth={1.5} />
              <h3>No storyboard planned yet</h3>
              <p>Generate Google Flow scene prompts, camera motion, and shot timing from your script.</p>
              <button
                type="button"
                className="button primary"
                disabled={!prodState?.scriptApproved || generateStoryboard.isPending}
                onClick={() => generateStoryboard.mutate()}
              >
                {generateStoryboard.isPending ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                Generate Storyboard & Prompts
              </button>
              {!prodState?.scriptApproved && (
                <p className="hint-muted">The script must be approved before planning a storyboard.</p>
              )}
            </div>
          ) : (
            <StoryboardWorkspace
              projectId={project.id}
              storyboard={storyboard}
              tasks={tasks}
              onHandoffComplete={async (taskId, filePath) => {
                await completeHandoff.mutateAsync({ taskId, filePath });
              }}
              isSubmitting={completeHandoff.isPending}
            />
          )}
        </div>
      )}

      {activeTab === 'workflow' && (
        <WorkflowDashboard
          project={project}
          tasks={tasks}
          qaResult={qaResult}
          assets={assets}
          onRegenerateScene={async (sceneId) => {
            await regenerateScene.mutateAsync(sceneId);
          }}
          isRegenerating={regenerateScene.isPending}
        />
      )}

      {deleteOpen && (
        <Modal title="Delete this project?" onClose={() => { if (!remove.isPending) setDeleteOpen(false); }}>
          <p className="modal-description">
            “{project.title}” will be removed from your project library. Its version history will be retained in storage.
          </p>
          {remove.error && <ErrorNotice>{errorMessage(remove.error)}</ErrorNotice>}
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Keep project
            </button>
            <button className="button danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Delete project
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ScriptPlanningView({
  projectId,
  script,
  loading,
  error,
  onGenerate,
  generating,
  targetDuration,
  onProceedToScenes,
}: {
  projectId: string;
  script?: ProjectScript;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
  generating: boolean;
  targetDuration: number;
  onProceedToScenes: () => void;
}) {
  const client = useQueryClient();
  const [scenes, setScenes] = useState(script?.scenes ?? []);
  const [title, setTitle] = useState(script?.title ?? '');
  const [hook, setHook] = useState(script?.hook ?? '');
  const [saveNotice, setSaveNotice] = useState('');

  const updateMutation = useMutation({
    mutationFn: (input: UpdateScriptInput) => api.updateScript(projectId, input),
    onSuccess: (res) => {
      client.setQueryData(['script', projectId], res);
      setSaveNotice(`Script saved as version ${res.data.version}.`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => api.approveScript(projectId),
    onSuccess: async (res) => {
      client.setQueryData(['script', projectId], res);
      await client.invalidateQueries({ queryKey: ['production', projectId] });
      await client.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  if (loading) return <Loading label="Loading script plan…" />;

  if (!script) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Sparkles size={27} strokeWidth={1.5} /></span>
        <h3>No script generated yet</h3>
        <p>Generate a structured script with scene breakdowns, narration text, and timed visual directions.</p>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <button type="button" className="button primary" disabled={generating} onClick={onGenerate}>
          {generating ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />} Generate structured script
        </button>
      </div>
    );
  }

  const currentDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const isApproved = script.approved;

  function updateScene(index: number, field: string, val: any) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  async function handleSave() {
    setSaveNotice('');
    await updateMutation.mutateAsync({
      expectedVersion: script!.version,
      title: title || script!.title,
      hook: hook || script!.hook,
      scenes,
      totalDurationSeconds: currentDuration,
    });
  }

  return (
    <div className="script-workspace">
      <div className="script-header-bar">
        <div>
          <h2>{script.title}</h2>
          <p className="hook-text">“{script.hook}”</p>
        </div>
        <div className="script-badges">
          <span className="phase-pill"><Save size={13} /> Version {script.version}</span>
          <span className={`status-badge ${isApproved ? 'status-completed' : 'status-draft'}`}>
            <span /> {isApproved ? 'Approved' : 'In Review'}
          </span>
          <span className={`duration-badge ${currentDuration === targetDuration ? 'matched' : 'mismatched'}`}>
            <Clock size={14} /> {currentDuration}s / {targetDuration}s
          </span>
        </div>
      </div>

      {saveNotice && <div className="success-notice" role="status"><Check size={17} /> {saveNotice}</div>}
      {updateMutation.error && <ErrorNotice>{errorMessage(updateMutation.error)}</ErrorNotice>}
      {approveMutation.error && <ErrorNotice>{errorMessage(approveMutation.error)}</ErrorNotice>}

      <div className="scenes-container">
        {scenes.map((scene, idx) => (
          <div key={scene.sceneNumber} className="scene-card">
            <div className="scene-card-header">
              <span className="scene-number-pill">Scene {scene.sceneNumber}</span>
              <input
                className="scene-title-input"
                value={scene.title}
                disabled={isApproved}
                onChange={(e) => updateScene(idx, 'title', e.target.value)}
                placeholder="Scene title"
              />
              <span className="scene-duration-pill">
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={scene.durationSeconds}
                  disabled={isApproved}
                  onChange={(e) => updateScene(idx, 'durationSeconds', Number(e.target.value))}
                />
                s
              </span>
            </div>
            <div className="field">
              <label>Narration (Voiceover)</label>
              <textarea
                rows={3}
                value={scene.narration}
                disabled={isApproved}
                onChange={(e) => updateScene(idx, 'narration', e.target.value)}
                placeholder="Narration script text in Hindi or English"
              />
            </div>
            <div className="field">
              <label>Visual Description (Procedural 3D direction)</label>
              <textarea
                rows={2}
                value={scene.visualDescription}
                disabled={isApproved}
                onChange={(e) => updateScene(idx, 'visualDescription', e.target.value)}
                placeholder="Camera and vehicle motion direction"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="script-actions-bar">
        {!isApproved ? (
          <>
            <button
              type="button"
              className="button secondary"
              disabled={updateMutation.isPending || generating}
              onClick={handleSave}
            >
              {updateMutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />} Save changes
            </button>
            <button
              type="button"
              className="button primary"
              disabled={approveMutation.isPending || currentDuration !== targetDuration}
              onClick={() => approveMutation.mutate()}
            >
              {approveMutation.isPending ? <LoaderCircle size={16} className="spin" /> : <CheckCircle2 size={16} />} Approve script
            </button>
          </>
        ) : (
          <div className="approval-status-banner">
            <CheckCircle2 size={18} className="approved-icon" />
            <span>Script is approved and locked. Proceed to procedural scene layout.</span>
            <button type="button" className="button primary small" onClick={onProceedToScenes}>
              Configure scene layout <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenePlanningView({
  projectId,
  scriptApproved,
  scenePlan,
  loading,
  error,
  onGenerate,
  generating,
  onSwitchToScript,
}: {
  projectId: string;
  scriptApproved: boolean;
  scenePlan?: ProjectScenePlan;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
  generating: boolean;
  onSwitchToScript: () => void;
}) {
  const client = useQueryClient();
  const [scenes, setScenes] = useState<UniversalScene[]>(scenePlan?.scenes ?? []);
  const [saveNotice, setSaveNotice] = useState('');

  const updateMutation = useMutation({
    mutationFn: (input: UpdateScenePlanInput) => api.updateScenePlan(projectId, input),
    onSuccess: (res) => {
      client.setQueryData(['scenes', projectId], res);
      setSaveNotice(`Scene plan saved as version ${res.data.version}.`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => api.approveScenePlan(projectId),
    onSuccess: async (res) => {
      client.setQueryData(['scenes', projectId], res);
      await client.invalidateQueries({ queryKey: ['production', projectId] });
      await client.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  if (!scriptApproved) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><FileText size={27} strokeWidth={1.5} /></span>
        <h3>Script approval required</h3>
        <p>Before configuring scenes and media strategies, review and explicitly approve your video script.</p>
        <button type="button" className="button secondary" onClick={onSwitchToScript}>
          Go to script planning <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  if (loading) return <Loading label="Loading scene plan…" />;

  if (!scenePlan) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Box size={27} strokeWidth={1.5} /></span>
        <h3>No scene layout generated yet</h3>
        <p>Plan multi-engine scenes, visual layouts, and rendering strategies based on your approved script.</p>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <button type="button" className="button primary" disabled={generating} onClick={onGenerate}>
          {generating ? <LoaderCircle size={17} className="spin" /> : <Box size={17} />} Generate scene plan
        </button>
      </div>
    );
  }

  const isApproved = scenePlan.approved;

  function updateSceneField<K extends keyof UniversalScene>(index: number, field: K, val: UniversalScene[K]) {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  function updateProceduralCamera(index: number, field: string, val: any) {
    setScenes((prev) => {
      const copy = [...prev];
      const s = copy[index].renderStrategy;
      if (s.type === 'procedural_3d') {
        copy[index] = {
          ...copy[index],
          renderStrategy: {
            ...s,
            camera: { ...s.camera, [field]: val },
          },
        };
      }
      return copy;
    });
  }

  function updateProceduralParam(index: number, field: string, val: any) {
    setScenes((prev) => {
      const copy = [...prev];
      const s = copy[index].renderStrategy;
      if (s.type === 'procedural_3d') {
        copy[index] = {
          ...copy[index],
          renderStrategy: {
            ...s,
            parameters: { ...s.parameters, [field]: val },
          },
        };
      }
      return copy;
    });
  }

  function updateMotionGraphics(index: number, field: string, val: any) {
    setScenes((prev) => {
      const copy = [...prev];
      const s = copy[index].renderStrategy;
      if (s.type === 'motion_graphics') {
        copy[index] = {
          ...copy[index],
          renderStrategy: {
            ...s,
            [field]: val,
          },
        };
      }
      return copy;
    });
  }

  function updateUploadedMedia(index: number, field: string, val: any) {
    setScenes((prev) => {
      const copy = [...prev];
      const s = copy[index].renderStrategy;
      if (s.type === 'uploaded_media') {
        copy[index] = {
          ...copy[index],
          renderStrategy: {
            ...s,
            [field]: val,
          },
        };
      }
      return copy;
    });
  }

  const currentDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  async function handleSave() {
    setSaveNotice('');
    await updateMutation.mutateAsync({
      expectedVersion: scenePlan!.version,
      scenes,
      totalDurationSeconds: currentDuration,
    });
  }

  return (
    <div className="scene-workspace">
      <div className="script-header-bar">
        <div>
          <h2>Universal Scene Layout & Strategies</h2>
          <p className="hook-text">
            {scenePlan.scenes.length} Scenes · Multi-engine composition · {currentDuration}s total duration
          </p>
        </div>
        <div className="script-badges">
          <span className="phase-pill"><Save size={13} /> Version {scenePlan.version}</span>
          <span className={`status-badge ${isApproved ? 'status-completed' : 'status-draft'}`}>
            <span /> {isApproved ? 'Ready to Render' : 'In Review'}
          </span>
        </div>
      </div>

      {saveNotice && <div className="success-notice" role="status"><Check size={17} /> {saveNotice}</div>}
      {updateMutation.error && <ErrorNotice>{errorMessage(updateMutation.error)}</ErrorNotice>}
      {approveMutation.error && <ErrorNotice>{errorMessage(approveMutation.error)}</ErrorNotice>}

      <div className="scenes-container">
        {scenes.map((scene, idx) => {
          const strategy = scene.renderStrategy;
          const hasNarration = scene.audio?.narrationEnabled && scene.audio?.text;

          return (
            <div key={scene.id} className="scene-card">
              <div className="scene-card-header">
                <span className="scene-number-pill">Scene {scene.sceneNumber}</span>
                <span className="strategy-tag">{strategy.type.replaceAll('_', ' ')}</span>
                <span className="transition-tag">Transition: {scene.transition}</span>
                <span className="scene-duration-pill">
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={scene.durationSeconds}
                    disabled={isApproved}
                    onChange={(e) => updateSceneField(idx, 'durationSeconds', Number(e.target.value))}
                  />
                  s
                </span>
              </div>

              <div className="scene-visual-desc">
                <strong>Visual direction:</strong> {scene.visualDescription}
              </div>

              {hasNarration ? (
                <div className="scene-narration-preview">
                  <p>“{scene.audio.text}”</p>
                  <small>Subtitles: {scene.subtitles.length} synchronized phrase{scene.subtitles.length === 1 ? '' : 's'}</small>
                </div>
              ) : (
                <div className="scene-narration-preview" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  <p>No narration · Music and visual presentation</p>
                  {scene.textOverlays.length > 0 && (
                    <small style={{ fontStyle: 'normal' }}>
                      {scene.textOverlays.length} text overlay{scene.textOverlays.length === 1 ? '' : 's'} configured
                    </small>
                  )}
                </div>
              )}

              {scene.textOverlays.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.25rem 0' }}>
                  {scene.textOverlays.map((overlay, oIdx) => (
                    <span key={oIdx} className="overlay-tag">
                      <Type size={12} /> {overlay.text} ({overlay.position})
                    </span>
                  ))}
                </div>
              )}

              {/* Strategy Specific Controls */}
              <div className="scene-controls-grid">
                {strategy.type === 'procedural_3d' && (
                  <>
                    <div className="control-card">
                      <div className="control-header"><Camera size={16} /> <strong>Camera Configuration</strong></div>
                      <label className="field">
                        Type
                        <select
                          value={strategy.camera.type}
                          disabled={isApproved}
                          onChange={(e) => updateProceduralCamera(idx, 'type', e.target.value)}
                        >
                          <option value="cinematic">Cinematic</option>
                          <option value="top_down">Top-down (Birds eye)</option>
                          <option value="orbit">Orbit</option>
                          <option value="driver_view">Driver view</option>
                          <option value="static">Static</option>
                        </select>
                      </label>
                      <div className="field-grid">
                        <label className="field">
                          Zoom: {strategy.camera.zoom}x
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={strategy.camera.zoom}
                            disabled={isApproved}
                            onChange={(e) => updateProceduralCamera(idx, 'zoom', Number(e.target.value))}
                          />
                        </label>
                        <label className="field">
                          Angle: {strategy.camera.angleDegrees}°
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={strategy.camera.angleDegrees}
                            disabled={isApproved}
                            onChange={(e) => updateProceduralCamera(idx, 'angleDegrees', Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="control-card">
                      <div className="control-header">
                        <Box size={16} /> <strong>Procedural 3D: {strategy.template}</strong>
                      </div>
                      {strategy.template === 'traffic_intersection' && strategy.parameters ? (
                        <>
                          <div className="field-grid">
                            <label className="field">
                              Density
                              <select
                                value={strategy.parameters.density ?? 'moderate'}
                                disabled={isApproved}
                                onChange={(e) => updateProceduralParam(idx, 'density', e.target.value)}
                              >
                                <option value="light">Light</option>
                                <option value="moderate">Moderate</option>
                                <option value="congested">Congested</option>
                                <option value="gridlock">Gridlock</option>
                              </select>
                            </label>
                            <label className="field">
                              Signal State
                              <select
                                value={strategy.parameters.trafficSignalState ?? 'green'}
                                disabled={isApproved}
                                onChange={(e) => updateProceduralParam(idx, 'trafficSignalState', e.target.value)}
                              >
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="red">Red</option>
                                <option value="all_red">All Red</option>
                              </select>
                            </label>
                          </div>
                          <div className="field-grid">
                            <label className="field">
                              Vehicle Count: {strategy.parameters.vehicleCount ?? 25}
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={strategy.parameters.vehicleCount ?? 25}
                                disabled={isApproved}
                                onChange={(e) => updateProceduralParam(idx, 'vehicleCount', Number(e.target.value))}
                              />
                            </label>
                            <label className="field">
                              Average Speed: {strategy.parameters.averageSpeed ?? 40} km/h
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={strategy.parameters.averageSpeed ?? 40}
                                disabled={isApproved}
                                onChange={(e) => updateProceduralParam(idx, 'averageSpeed', Number(e.target.value))}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <div>
                          <small>Deterministic Seed: #{strategy.deterministicSeed}</small>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {strategy.type === 'motion_graphics' && (
                  <>
                    <div className="control-card">
                      <div className="control-header"><Type size={16} /> <strong>Typography & Style</strong></div>
                      <label className="field">
                        Headline
                        <input
                          value={strategy.headline}
                          disabled={isApproved}
                          onChange={(e) => updateMotionGraphics(idx, 'headline', e.target.value)}
                          placeholder="Main scene text"
                        />
                      </label>
                      <label className="field">
                        Subheadline
                        <input
                          value={strategy.subheadline ?? ''}
                          disabled={isApproved}
                          onChange={(e) => updateMotionGraphics(idx, 'subheadline', e.target.value)}
                          placeholder="Supporting caption (optional)"
                        />
                      </label>
                      <label className="field">
                        Preset
                        <select
                          value={strategy.style}
                          disabled={isApproved}
                          onChange={(e) => updateMotionGraphics(idx, 'style', e.target.value)}
                        >
                          <option value="bold_minimal">Bold Minimal</option>
                          <option value="kinetic_typography">Kinetic Typography</option>
                          <option value="infographic">Infographic</option>
                          <option value="product_card">Product Card</option>
                        </select>
                      </label>
                    </div>

                    <div className="control-card">
                      <div className="control-header"><SlidersHorizontal size={16} /> <strong>Backdrop & Palette</strong></div>
                      <label className="field">
                        Background Animation
                        <select
                          value={strategy.backgroundAnimation}
                          disabled={isApproved}
                          onChange={(e) => updateMotionGraphics(idx, 'backgroundAnimation', e.target.value)}
                        >
                          <option value="particles">Floating Particles</option>
                          <option value="geometric_pulse">Geometric Pulse</option>
                          <option value="subtle_grid">Subtle Grid</option>
                          <option value="solid">Solid Background</option>
                        </select>
                      </label>
                      <div className="field-grid">
                        <label className="field">
                          Primary Color
                          <input
                            type="text"
                            value={strategy.primaryColor ?? '#0b0c10'}
                            disabled={isApproved}
                            onChange={(e) => updateMotionGraphics(idx, 'primaryColor', e.target.value)}
                          />
                        </label>
                        <label className="field">
                          Accent Color
                          <input
                            type="text"
                            value={strategy.accentColor ?? '#6366f1'}
                            disabled={isApproved}
                            onChange={(e) => updateMotionGraphics(idx, 'accentColor', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {strategy.type === 'uploaded_media' && (
                  <>
                    <div className="control-card">
                      <div className="control-header"><Image size={16} /> <strong>Media Asset</strong></div>
                      <label className="field">
                        Asset Reference
                        <input
                          value={strategy.assetId}
                          disabled={isApproved}
                          onChange={(e) => updateUploadedMedia(idx, 'assetId', e.target.value)}
                          placeholder="Asset identifier"
                        />
                      </label>
                      <div className="field-grid">
                        <label className="field">
                          Media Type
                          <select
                            value={strategy.mediaType}
                            disabled={isApproved}
                            onChange={(e) => updateUploadedMedia(idx, 'mediaType', e.target.value)}
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </label>
                        <label className="field">
                          Fit Mode
                          <select
                            value={strategy.fit}
                            disabled={isApproved}
                            onChange={(e) => updateUploadedMedia(idx, 'fit', e.target.value)}
                          >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="crop">Crop</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="control-card">
                      <div className="control-header"><Move size={16} /> <strong>Motion & Framing</strong></div>
                      <label className="field">
                        Camera Motion
                        <select
                          value={strategy.motion}
                          disabled={isApproved}
                          onChange={(e) => updateUploadedMedia(idx, 'motion', e.target.value)}
                        >
                          <option value="static">Static</option>
                          <option value="ken_burns">Ken Burns (Slow pan & zoom)</option>
                          <option value="zoom_in">Slow Zoom In</option>
                          <option value="zoom_out">Slow Zoom Out</option>
                          <option value="pan_left">Pan Left</option>
                          <option value="pan_right">Pan Right</option>
                        </select>
                      </label>
                      <p className="field-note" style={{ marginTop: '0.5rem' }}>
                        Asset will be composed onto the timeline with non-destructive timing.
                      </p>
                    </div>
                  </>
                )}

                {['ai_image', 'ai_video', 'stock_footage', 'composited_scene'].includes(strategy.type) && (
                  <div className="control-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="control-header"><Sparkles size={16} /> <strong>Render Strategy: {strategy.type}</strong></div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      Strategy configured for engine execution. Preview adapter active.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="script-actions-bar">
        {!isApproved ? (
          <>
            <button
              type="button"
              className="button secondary"
              disabled={updateMutation.isPending || generating}
              onClick={handleSave}
            >
              {updateMutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />} Save scene plan
            </button>
            <button
              type="button"
              className="button primary"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              {approveMutation.isPending ? <LoaderCircle size={16} className="spin" /> : <CheckCircle2 size={16} />} Approve scene plan
            </button>
          </>
        ) : (
          <div className="approval-status-banner">
            <CheckCircle2 size={18} className="approved-icon" />
            <span>Scene plan is approved! Ready for media rendering pipeline.</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Project, ProductionTask, Asset, QaResult } from '@creatorflow/shared';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Download,
  Film,
  Music,
  FileCheck,
  Sparkles,
  Layers,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface WorkflowDashboardProps {
  project: Project;
  tasks: ProductionTask[];
  qaResult?: QaResult | null;
  assets: Asset[];
  onRegenerateScene: (sceneId: string) => Promise<void>;
  isRegenerating?: boolean;
}

export function WorkflowDashboard({
  project,
  tasks,
  qaResult,
  assets,
  onRegenerateScene,
  isRegenerating = false,
}: WorkflowDashboardProps) {
  const [selectedSceneForRegen, setSelectedSceneForRegen] = useState<string>('scene_1');
  const [regenSuccessNotice, setRegenSuccessNotice] = useState<string>('');

  const exportTask = tasks.find((t) => t.id === 'task_export');
  const assemblyTask = tasks.find((t) => t.id === 'task_assembly');
  const qaTask = tasks.find((t) => t.id === 'task_qa');
  const exportPath = exportTask?.outputPayload?.exportPath || assemblyTask?.outputPayload?.outputPath;

  const handleRegenSubmit = async () => {
    setRegenSuccessNotice('');
    await onRegenerateScene(selectedSceneForRegen);
    setRegenSuccessNotice(`Scene ${selectedSceneForRegen.replace('scene_', '')} invalidated and ready for re-upload. Other scenes preserved!`);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_GENERATION': return <Film size={16} />;
      case 'AUDIO_NARRATION': return <Music size={16} />;
      case 'TIMELINE_ASSEMBLY': return <Layers size={16} />;
      case 'QUALITY_ASSURANCE': return <FileCheck size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  const isCompleted = project.status === 'COMPLETED' || exportTask?.state === 'completed';

  return (
    <div className="workflow-dashboard">
      <div className="dashboard-banner">
        <div>
          <h2>Automated Production Pipeline</h2>
          <p>
            CreatorFlow AI monitors all asynchronous production tasks. Once manual video handoff is completed,
            the system coordinates narration, alignment, subtitles, FFmpeg assembly, and technical QA automatically.
          </p>
        </div>
        <div className={`status-pill ${project.status.toLowerCase()}`}>
          Status: {project.status}
        </div>
      </div>

      {isCompleted && exportPath && (
        <div className="final-delivery-card">
          <div className="delivery-header">
            <div>
              <span className="section-label">PRODUCTION COMPLETE</span>
              <h3>Master Video Ready for Download</h3>
              <p>Generated at {project.resolution || '1080p'} ({project.aspectRatio})</p>
            </div>
            <a
              href={`/api/v1/projects/${project.id}/export/download`}
              download
              className="download-btn"
            >
              <Download size={16} /> Download MP4
            </a>
          </div>

          <div className="video-preview-box">
            <div className="preview-placeholder">
              <Film size={42} strokeWidth={1.5} />
              <p><strong>{project.title}</strong> — Assembled Production</p>
              <code>{exportPath}</code>
            </div>
          </div>
        </div>
      )}

      {/* Quality Assurance Report */}
      {qaResult && (
        <div className="qa-report-card">
          <div className="qa-header">
            <div>
              <span className="section-label">DETERMINISTIC VERIFICATION</span>
              <h3>Technical Quality Assurance Report</h3>
            </div>
            <span className={`qa-badge ${qaResult.outcome.toLowerCase()}`}>
              {qaResult.outcome.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="qa-checks-list">
            {qaResult.checks.map((check, idx) => (
              <div key={idx} className={`qa-check-row ${check.passed ? 'passed' : 'failed'}`}>
                <div className="check-icon">
                  {check.passed ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="check-info">
                  <strong>{check.name}</strong>
                  <p>{check.details}</p>
                </div>
              </div>
            ))}
          </div>

          {qaResult.warnings && qaResult.warnings.length > 0 && (
            <div className="qa-warnings-box">
              <span className="label"><AlertTriangle size={14} /> Review Warnings:</span>
              <ul>
                {qaResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* DAG Task Matrix */}
      <div className="dag-tasks-matrix">
        <div className="matrix-header">
          <h3>Workflow DAG Tasks ({tasks.length})</h3>
          <span className="subtitle">Real-time persistent state tracking</span>
        </div>

        <div className="tasks-grid">
          {tasks.map((task) => (
            <div key={task.id} className={`task-card state-${task.state}`}>
              <div className="task-type-badge">
                {getTaskIcon(task.type)}
                <span>{task.type.replaceAll('_', ' ')}</span>
              </div>
              <h4>{task.name}</h4>
              <div className="task-bottom">
                <span className="task-mode">{task.mode}</span>
                <span className={`task-state-pill ${task.state}`}>
                  {task.state === 'awaiting_external_action' ? 'Awaiting Upload' : task.state}
                </span>
              </div>
              {task.error && <p className="task-error-hint">{task.error}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Partial Scene Regeneration Control */}
      <div className="partial-regen-card">
        <div className="regen-header">
          <div>
            <h3>Partial Scene Invalidation</h3>
            <p>Regenerate a single scene without affecting approved audio or other completed scenes.</p>
          </div>
        </div>

        <div className="regen-controls">
          <select
            value={selectedSceneForRegen}
            onChange={(e) => setSelectedSceneForRegen(e.target.value)}
            disabled={isRegenerating}
          >
            <option value="scene_1">Scene 1</option>
            <option value="scene_2">Scene 2</option>
            <option value="scene_3">Scene 3</option>
            <option value="scene_4">Scene 4</option>
          </select>

          <button
            type="button"
            className="regen-btn"
            onClick={handleRegenSubmit}
            disabled={isRegenerating}
          >
            <RotateCcw size={14} /> Invalidate & Regenerate Scene
          </button>
        </div>

        {regenSuccessNotice && (
          <p className="regen-success"><Check size={14} /> {regenSuccessNotice}</p>
        )}
      </div>
    </div>
  );
}


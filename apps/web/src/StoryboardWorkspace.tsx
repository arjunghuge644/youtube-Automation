import { useState } from 'react';
import type { ProjectStoryboard, ProductionTask } from '@creatorflow/shared';
import {
  ExternalLink,
  Copy,
  Check,
  Video,
  AlertTriangle,
  Upload,
  Clock,
  Sparkles,
  Camera,
  Sun,
  ShieldCheck,
} from 'lucide-react';

interface StoryboardWorkspaceProps {
  projectId: string;
  storyboard: ProjectStoryboard;
  tasks: ProductionTask[];
  onHandoffComplete: (taskId: string, filePath: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function StoryboardWorkspace({
  storyboard,
  tasks,
  onHandoffComplete,
  isSubmitting = false,
}: StoryboardWorkspaceProps) {
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [filePaths, setFilePaths] = useState<Record<number, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, sceneNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScene(sceneNum);
    setTimeout(() => setCopiedScene(null), 2500);
  };

  const handleAttachClip = async (taskId: string, sceneNum: number) => {
    const filePath = filePaths[sceneNum]?.trim();
    if (!filePath) {
      setErrorMessages((prev) => ({ ...prev, [sceneNum]: 'Please enter the absolute file path of the downloaded clip.' }));
      return;
    }

    setErrorMessages((prev) => ({ ...prev, [sceneNum]: '' }));
    setLoadingTasks((prev) => ({ ...prev, [taskId]: true }));

    try {
      await onHandoffComplete(taskId, filePath);
    } catch (err: any) {
      setErrorMessages((prev) => ({ ...prev, [sceneNum]: err?.message || 'Failed to validate and ingest clip.' }));
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  return (
    <div className="storyboard-workspace">
      <div className="storyboard-header-banner">
        <div>
          <h2>Google Flow Storyboard & Manual Handoff</h2>
          <p>
            Copy the production-ready prompt, render your clip in Google Flow, and attach the downloaded MP4.
            Once all scene clips are uploaded, <strong>post-production runs completely automatically!</strong>
          </p>
        </div>
        <a
          href="https://labs.google/flow"
          target="_blank"
          rel="noopener noreferrer"
          className="external-flow-btn"
        >
          Open Google Flow <ExternalLink size={16} />
        </a>
      </div>

      <div className="storyboard-scenes-grid">
        {storyboard.scenes.map((scene) => {
          const videoTask = tasks.find((t) => t.id === `task_video_scene_${scene.sceneNumber}`);
          const isTaskCompleted = videoTask?.state === 'completed';
          const isTaskFailed = videoTask?.state === 'failed';
          const isTaskLoading = videoTask ? loadingTasks[videoTask.id] : false;

          return (
            <div key={scene.sceneNumber} className={`storyboard-card ${isTaskCompleted ? 'completed' : ''}`}>
              <div className="card-top-bar">
                <span className="scene-chip">Scene {scene.sceneNumber}</span>
                <span className="duration-chip"><Clock size={13} /> {scene.durationSeconds}s</span>
                <span className="aspect-chip">{scene.aspectRatio}</span>
                <span className={`status-pill ${videoTask?.state || 'pending'}`}>
                  {isTaskCompleted ? 'Validated (H.264)' : isTaskFailed ? 'Validation Failed' : 'Awaiting Clip'}
                </span>
              </div>

              <h3 className="scene-card-title">{scene.title}</h3>
              <p className="scene-description">{scene.visualDescription}</p>

              <div className="meta-details-row">
                <span><Camera size={13} /> {scene.cameraMotion}</span>
                <span><Sun size={13} /> {scene.lighting}</span>
              </div>

              {scene.narrationText && (
                <div className="narration-box">
                  <span className="label">Narration:</span>
                  <p>"{scene.narrationText}"</p>
                </div>
              )}

              <div className="prompt-container">
                <div className="prompt-header">
                  <span>Google Flow Prompt</span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyToClipboard(scene.providerPrompt, scene.sceneNumber)}
                  >
                    {copiedScene === scene.sceneNumber ? (
                      <><Check size={14} /> Copied!</>
                    ) : (
                      <><Copy size={14} /> Copy Prompt</>
                    )}
                  </button>
                </div>
                <div className="prompt-text">{scene.providerPrompt}</div>
              </div>

              <div className="clip-attachment-section">
                {isTaskCompleted ? (
                  <div className="asset-success-badge">
                    <ShieldCheck size={18} /> Clip verified with FFprobe & ingested
                  </div>
                ) : (
                  <div className="upload-controls">
                    <label htmlFor={`file-input-${scene.sceneNumber}`}>Attach Generated MP4 File Path:</label>
                    <div className="input-group">
                      <input
                        id={`file-input-${scene.sceneNumber}`}
                        type="text"
                        placeholder="/absolute/path/to/downloaded_clip.mp4"
                        value={filePaths[scene.sceneNumber] || ''}
                        onChange={(e) => setFilePaths((prev) => ({ ...prev, [scene.sceneNumber]: e.target.value }))}
                        disabled={isTaskLoading || isSubmitting}
                      />
                      <button
                        type="button"
                        className="attach-btn"
                        disabled={isTaskLoading || isSubmitting || !videoTask}
                        onClick={() => videoTask && handleAttachClip(videoTask.id, scene.sceneNumber)}
                      >
                        {isTaskLoading ? 'Verifying FFprobe…' : <><Upload size={14} /> Validate & Ingest</>}
                      </button>
                    </div>
                    {errorMessages[scene.sceneNumber] && (
                      <p className="field-error"><AlertTriangle size={13} /> {errorMessages[scene.sceneNumber]}</p>
                    )}
                    {isTaskFailed && videoTask?.error && (
                      <p className="task-error-text"><AlertTriangle size={13} /> {videoTask.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


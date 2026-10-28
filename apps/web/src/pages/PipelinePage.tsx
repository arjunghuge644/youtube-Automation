import { ArrowRight, AudioLines, Box, Check, FileText, Film, FolderOpen, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const milestones = [
  { number: '01', icon: FolderOpen, title: 'A home for your ideas', description: 'Create an account, save project briefs, choose video settings, and keep every edit versioned.', status: 'Available', ready: true },
  { number: '02', icon: FileText, title: 'From prompt to script', description: 'Generate and edit a structured script, approve narration, and plan validated scenes.', status: 'Available', ready: true },
  { number: '03', icon: Box, title: 'Scenes that move', description: 'Preview deterministic 3D traffic scenes with moving cars, signals, and camera controls.', status: 'Planned' },
  { number: '04', icon: AudioLines, title: 'A voice for your story', description: 'Create scene narration, measure audio timing, and build synchronized subtitles.', status: 'Planned' },
  { number: '05', icon: Film, title: 'A video you can share', description: 'Render real MP4 files, verify audio and video, then preview and download your output.', status: 'Planned' },
  { number: '06', icon: Layers3, title: 'Refine, regenerate, repeat', description: 'Edit individual scenes, reuse existing assets, and manage production jobs reliably.', status: 'Planned' },
];

export function PipelinePage() {
  return <><div className="page-heading"><div><span className="section-label">BUILDING THE STUDIO</span><h1>One milestone at a time<span className="heading-dot">.</span></h1><p>A clear path from a video idea to an animated, narrated MP4.</p></div></div><div className="roadmap-intro"><div><span className="phase-pill"><span className="tiny-dot" /> Phase 1 · Foundation</span><h2>Start with a strong foundation.</h2><p>This release is ready for project planning. Video generation, AI providers, and rendering are not connected yet. The next milestone builds on your saved briefs.</p></div><Link to="/projects/new" className="button primary">Create a project <ArrowRight size={17} /></Link></div><div className="milestone-list">{milestones.map((milestone) => <article key={milestone.number} className={`milestone ${milestone.ready ? 'ready' : ''}`}><span className="milestone-number">{milestone.number}</span><span className="milestone-icon"><milestone.icon size={22} /></span><div><h2>{milestone.title}</h2><p>{milestone.description}</p></div><span className="milestone-status">{milestone.ready && <Check size={14} />}{milestone.status}</span></article>)}</div><p className="roadmap-footnote">This is a development roadmap. It does not represent active generation jobs or completed media.</p></>;
}

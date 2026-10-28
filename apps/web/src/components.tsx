import { AlertCircle, ArrowUpRight, Clapperboard, LoaderCircle, Play, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className="brand" aria-label="CreatorFlow AI Studio home"><span className="brand-symbol"><Play size={18} fill="currentColor" strokeWidth={0} /><span /></span>{!compact && <span>CreatorFlow<small>AI STUDIO</small></span>}</Link>;
}

export function Loading({ label = 'Loading your workspace…' }: { label?: string }) {
  return <div className="loading-state" role="status"><LoaderCircle size={23} className="spin" /><span>{label}</span></div>;
}

export function ErrorNotice({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return <div className="error-notice" role="alert"><AlertCircle size={18} /><div>{children}{retry && <button type="button" className="text-button" onClick={retry}>Try again <ArrowUpRight size={14} /></button>}</div></div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{status.toLowerCase().replaceAll('_', ' ')}</span>;
}

export function ProjectArtwork({ aspectRatio, large = false }: { aspectRatio: string; large?: boolean }) {
  const frameClass = aspectRatio === '16:9' ? 'landscape' : aspectRatio === '1:1' ? 'square' : '';
  return <div className={`project-artwork ${large ? 'large' : ''}`} aria-label="Project format illustration. No video has been rendered."><div className="art-grid" /><div className={`art-frame ${frameClass}`}><Clapperboard size={large ? 36 : 24} strokeWidth={1.2} /><span>{aspectRatio}</span></div><span className="art-label">PROJECT BRIEF</span></div>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog className="modal" ref={dialog} aria-labelledby="dialog-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-title"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>{children}</dialog>;
}

import { FolderOpen, GitBranch, LogOut, Menu, Plus, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { errorMessage } from './api';
import { Brand, ErrorNotice } from './components';

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const pageName = location.pathname === '/' ? 'Projects' : location.pathname === '/pipeline' ? 'Production roadmap' : location.pathname === '/projects/new' ? 'New project' : 'Project settings';

  async function onLogout() {
    setLoggingOut(true);
    try { await logout(); } catch (error) { setError(errorMessage(error)); } finally { setLoggingOut(false); }
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <Link to="/projects/new" className="button primary sidebar-create" onClick={() => setMenuOpen(false)}><Plus size={17} /> New project</Link>
      <div className="nav-heading">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <NavLink to="/" end onClick={() => setMenuOpen(false)}><FolderOpen size={18} /> All projects</NavLink>
        <NavLink to="/pipeline" onClick={() => setMenuOpen(false)}><GitBranch size={18} /> Production roadmap</NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="foundation-note"><span className="tiny-dot" /> Foundation release<p>Plan your next video.<br />Build a brief worth creating.</p><Link to="/pipeline" onClick={() => setMenuOpen(false)}>What’s next <span>↗</span></Link></div>
        <div className="account"><div className="avatar">{user?.name.slice(0, 1).toUpperCase()}</div><div className="account-name"><strong>{user?.name}</strong><span>Personal workspace</span></div><button className="icon-button" onClick={() => void onLogout()} disabled={loggingOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div><button className="icon-button mobile-only" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} /></button><span className="breadcrumb-root">Workspace</span><span className="breadcrumb-slash">/</span><span>{pageName}</span></div><span className="private-badge"><ShieldCheck size={14} /> Personal workspace</span></header>
      <main id="main-content" className="main-content">{error && <ErrorNotice>{error}</ErrorNotice>}<Outlet /></main>
      <footer className="workspace-footer"><span>CreatorFlow AI Studio</span><span>From a first thought to a clear creative brief.</span><span>v0.1 · Foundation</span></footer>
    </div>
  </div>;
}

import { useQuery } from '@tanstack/react-query';
import { ArrowDownWideNarrow, ArrowRight, ArrowUpRight, CheckCheck, CircleDashed, Clock3, FolderOpen, LayoutGrid, Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { ErrorNotice, Loading, ProjectArtwork, StatusBadge } from '../components';

const languageLabels: Record<string, string> = { hi: 'Hindi', en: 'English', hinglish: 'Hinglish' };

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const query = useQuery({ queryKey: ['projects', page], queryFn: () => api.projects(page) });
  const projects = query.data?.data ?? [];
  const total = query.data?.pagination.total ?? 0;
  const visible = projects.filter((project) => (filter === 'all' || project.status === filter) && `${project.title} ${project.prompt}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const drafts = projects.filter((project) => project.status === 'DRAFT').length;
  const complete = projects.filter((project) => project.status === 'COMPLETED').length;
  const active = projects.filter((project) => ['SCRIPT_GENERATING', 'SCENES_GENERATING', 'ASSETS_GENERATING', 'RENDERING', 'QUALITY_CHECK'].includes(project.status)).length;

  return <>
    <div className="page-heading"><div><span className="section-label">YOUR CREATIVE SPACE</span><h1>All projects<span className="heading-dot">.</span></h1><p>Every great video starts with an idea. Keep yours moving.</p></div><Link to="/projects/new" className="button primary"><Plus size={18} /> Create project</Link></div>
    <section className="welcome-card" aria-labelledby="welcome-title"><div className="welcome-content"><span className="eyebrow"><Sparkles size={14} /> FROM THOUGHT TO STORY</span><h2 id="welcome-title">What will you create next?</h2><p>A traffic explainer. A fresh perspective. Your next big idea.<br />Give it a title, a direction, and a place to start.</p><Link to="/projects/new" className="button welcome-button">Start with an idea <ArrowUpRight size={17} /></Link></div><div className="welcome-visual" aria-hidden="true"><div className="welcome-grid" /><div className="film-outline film-outline-back" /><div className="film-outline"><span className="frame-corner" /><div className="film-play">▶</div><div className="film-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><span className="visual-caption">A LITTLE IDEATION. A LOT OF POSSIBILITY.</span></div></section>
    <section className="stats-grid" aria-label="Project summary"><Stat label="Total projects" value={query.isSuccess ? total : '—'} icon={<FolderOpen size={17} />} /><Stat label={total > 50 ? 'Drafts on this page' : 'Draft projects'} value={query.isSuccess ? drafts : '—'} icon={<CircleDashed size={17} />} /><Stat label={total > 50 ? 'In production on this page' : 'In production'} value={query.isSuccess ? active : '—'} icon={<Clock3 size={17} />} /><Stat label={total > 50 ? 'Completed on this page' : 'Completed videos'} value={query.isSuccess ? complete : '—'} icon={<CheckCheck size={17} />} /></section>
    <section className="project-library" aria-labelledby="library-heading"><div className="library-title"><h2 id="library-heading">Project library <span>{query.isSuccess ? total : '—'}</span></h2><span className="library-view"><LayoutGrid size={15} /> Grid view</span></div><div className="library-toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">{total > 50 ? 'Search projects on this page' : 'Search projects'}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={total > 50 ? 'Search this page…' : 'Search your projects…'} /></label><div className="toolbar-filters"><label className="select-control"><SlidersHorizontal size={14} /><span className="sr-only">Filter by status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="DRAFT">Draft</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option></select></label><label className="select-control"><ArrowDownWideNarrow size={15} /><span className="sr-only">Sort projects</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Last updated</option><option value="title">Title A–Z</option></select></label></div></div>
      {query.isPending ? <Loading label="Loading your projects…" /> : query.isError ? <ErrorNotice retry={() => void query.refetch()}>{errorMessage(query.error)}</ErrorNotice> : visible.length > 0 ? <div className="project-grid">{visible.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="project-card"><ProjectArtwork aspectRatio={project.aspectRatio} /><div className="project-card-body"><div className="project-card-status"><StatusBadge status={project.status} /><span>{project.durationSeconds}s</span></div><h3>{project.title}</h3><p>{project.prompt}</p><div className="project-meta"><span>{languageLabels[project.language]}<span className="meta-dot">·</span>{project.aspectRatio}</span><span>Edited {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(project.updatedAt))}</span></div></div><span className="project-open"><ArrowUpRight size={17} /></span></Link>)}</div> : <div className="empty-state"><span className="empty-icon"><FolderOpen size={27} strokeWidth={1.5} /></span><h3>{projects.length > 0 ? 'No projects match your search.' : 'A blank canvas. Your next big idea.'}</h3><p>{projects.length > 0 ? 'Try another title or change the status filter.' : 'Create your first project to save a video brief, choose a format, and set the creative direction.'}</p>{projects.length > 0 ? <button type="button" className="button secondary" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button> : <Link to="/projects/new" className="button secondary"><Plus size={16} /> Create your first project</Link>}</div>}
      {total > 50 && <div className="pagination"><span>Page {page} of {Math.ceil(total / 50)}</span><button className="button secondary small" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="button secondary small" disabled={page * 50 >= total} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>
    <Link to="/pipeline" className="roadmap-link"><div><span className="roadmap-icon"><Sparkles size={18} /></span><span><strong>A studio taking shape</strong><small>Project planning is ready. Script generation, 3D scenes, narration, and MP4 export are next.</small></span></div><span>View roadmap <ArrowRight size={16} /></span></Link>
  </>;
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return <div className="stat-card"><div><span>{label}</span>{icon}</div><strong>{value}</strong></div>;
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Loading } from './components';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProjectPage, NewProjectPage } from './pages/ProjectPage';
import { PipelinePage } from './pages/PipelinePage';
import { Layout } from './Layout';

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <main className="startup"><Loading /></main>;
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
    <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
    <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects/new" element={<NewProjectPage />} />
      <Route path="/projects/:id" element={<ProjectPage />} />
      <Route path="/pipeline" element={<PipelinePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

import { ArrowRight, Check, Clapperboard, Layers3, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Brand, ErrorNotice } from '../components';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { authenticate, error: sessionError, retry } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const registering = mode === 'register';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(''); setPending(true);
    try {
      const result = registering
        ? await api.register(String(data.get('name')), String(data.get('email')), String(data.get('password')))
        : await api.login(String(data.get('email')), String(data.get('password')));
      authenticate(result.data);
    } catch (error) { setError(errorMessage(error)); } finally { setPending(false); }
  }

  return <main className="auth-page">
    <section className="auth-story"><Brand /><div className="auth-story-main"><span className="eyebrow"><span className="tiny-dot" /> YOUR NEXT STORY STARTS HERE</span><h1>Big ideas.<br />A place to<br /><em>bring them to life.</em></h1><p>A creative workspace for the animated videos you want to make. Start with an idea. Give it a direction.</p><div className="story-visual" aria-hidden="true"><div className="story-orbit" /><div className="story-frame story-frame-back"><Layers3 size={45} /></div><div className="story-frame"><Clapperboard size={50} strokeWidth={1} /><span>AN IDEA IN MOTION</span></div><div className="story-accent">01 <span>THE BEGINNING</span></div></div></div><span className="auth-copyright">CREATORFLOW AI STUDIO <span>·</span> FOUNDATION RELEASE</span></section>
    <section className="auth-form-panel"><div className="auth-form-wrap"><span className="section-label">YOUR CREATIVE WORKSPACE</span><h2>{registering ? 'Start something great.' : 'Welcome back.'}</h2><p className="muted">{registering ? 'Create your account and make room for your next idea.' : 'Sign in to pick up where your ideas left off.'}</p>
      {sessionError ? <ErrorNotice retry={retry}>{errorMessage(sessionError)}</ErrorNotice> : null}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <form onSubmit={(event) => void submit(event)} className="auth-form" key={mode}>
        {registering && <label className="field">Your name<input name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="What should we call you?" required disabled={pending} /></label>}
        <label className="field">Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required disabled={pending} /></label>
        <label className="field">Password<input type="password" name="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : 1} maxLength={128} placeholder={registering ? 'At least 12 characters' : 'Enter your password'} required disabled={pending} />{registering && <small>Use at least 12 characters. A memorable phrase works well.</small>}</label>
        <button type="submit" className="button primary auth-submit" disabled={pending}>{pending ? <><LoaderCircle size={17} className="spin" /> {registering ? 'Creating account…' : 'Signing in…'}</> : <>{registering ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></>}</button>
      </form>
      <p className="auth-switch">{registering ? 'Already have an account?' : 'New to CreatorFlow?'} <Link to={registering ? '/login' : '/register'} onClick={() => setError('')}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
      <div className="auth-footnote"><Check size={15} /><span>Project planning is available now. AI generation and rendering are being built in the next milestones.</span></div>
    </div></section>
  </main>;
}

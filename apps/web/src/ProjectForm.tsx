import type { ProjectInput } from '@creatorflow/shared';
import { createProjectSchema, videoCategories, visualStyles } from '@creatorflow/shared';
import {
  ArrowRight,
  Check,
  Film,
  LoaderCircle,
  Monitor,
  Smartphone,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ErrorNotice } from './components';

const defaults: ProjectInput = {
  title: '',
  prompt: '',
  category: 'educational',
  language: 'hi',
  durationSeconds: 60,
  aspectRatio: '9:16',
  visualStyle: 'stylized_3d',
  narrationStyle: 'documentary',
  narrationEnabled: true,
  audience: 'General audience',
  resolution: '720p',
};

const categoryLabels: Record<ProjectInput['category'], string> = {
  educational: 'Educational explainer',
  documentary: 'Documentary & nature',
  product_promo: 'Product promotion & commercial',
  storytelling: 'Storytelling & animation',
  social_short: 'YouTube Short & Reel',
  tutorial: 'How-to & tutorial',
  motivational: 'Motivational & inspirational',
  custom: 'Custom format',
};

const visualStyleLabels: Record<ProjectInput['visualStyle'], { name: string; desc: string }> = {
  stylized_3d: { name: 'Stylized 3D', desc: 'Procedural models, expressive motion, bounded simulations.' },
  motion_graphics: { name: 'Motion Graphics', desc: 'Kinetic typography, bold shapes, animated infographics.' },
  documentary_footage: { name: 'Documentary Media', desc: 'Curated media, ken burns motion, panoramic framing.' },
  minimal: { name: 'Minimalist', desc: 'Clean compositions, restrained colors, strong typography.' },
  cinematic: { name: 'Cinematic', desc: 'High dynamic contrast, letterboxed depth, atmospheric lighting.' },
};

export function ProjectForm({
  initial,
  onSubmit,
  pending,
  error,
  submitLabel = 'Create project',
  disabled = false,
}: {
  initial?: ProjectInput;
  onSubmit: (input: ProjectInput) => Promise<void>;
  pending: boolean;
  error?: string;
  submitLabel?: string;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<ProjectInput>(
    initial
      ? (Object.fromEntries(
          Object.keys(defaults).map((key) => [key, initial[key as keyof ProjectInput] ?? defaults[key as keyof ProjectInput]]),
        ) as ProjectInput)
      : defaults,
  );
  const [validation, setValidation] = useState('');

  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createProjectSchema.safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' '));
      return;
    }
    setValidation('');
    await onSubmit(parsed.data);
  }

  return (
    <form className="project-form" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={pending || disabled}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="section-number">01</span>
            <div>
              <h2>The idea</h2>
              <p>Set the creative intent and purpose for your video project.</p>
            </div>
          </div>

          <label className="field">
            Project title
            <input
              value={values.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="e.g. Why do traffic jams happen?"
              maxLength={120}
              required
            />
            <small>A working title to identify this project.</small>
          </label>

          <label className="field">
            Video category
            <select
              value={values.category}
              onChange={(event) => update('category', event.target.value as ProjectInput['category'])}
            >
              {videoCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
            <small>Guides the AI Creative Director in narrative structure and media strategy.</small>
          </label>

          <label className="field">
            Video brief
            <textarea
              value={values.prompt}
              onChange={(event) => update('prompt', event.target.value)}
              placeholder="Describe the story you want to tell, what viewers should learn, and the visuals you have in mind…"
              minLength={10}
              maxLength={5000}
              rows={5}
              required
            />
            <small className="field-hint">
              <span>The more direction you give, the clearer your creative brief.</span>
              <span>{values.prompt.length.toLocaleString()} / 5,000</span>
            </small>
          </label>

          <label className="field">
            Target audience
            <input
              value={values.audience}
              onChange={(event) => update('audience', event.target.value)}
              maxLength={200}
              placeholder="Who is this video for?"
              required
            />
          </label>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="section-number">02</span>
            <div>
              <h2>The format</h2>
              <p>Choose your canvas aspect ratio, duration, and export quality.</p>
            </div>
          </div>

          <fieldset className="format-fieldset">
            <legend>Aspect ratio</legend>
            <div className="format-options">
              {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                <label key={ratio} className={`format-option ${values.aspectRatio === ratio ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="aspectRatio"
                    value={ratio}
                    checked={values.aspectRatio === ratio}
                    onChange={() => update('aspectRatio', ratio)}
                  />
                  {ratio === '9:16' ? (
                    <Smartphone size={24} strokeWidth={1.5} />
                  ) : ratio === '16:9' ? (
                    <Monitor size={24} strokeWidth={1.5} />
                  ) : (
                    <Square size={24} strokeWidth={1.5} />
                  )}
                  <span>
                    <strong>
                      {ratio === '9:16' ? 'Vertical' : ratio === '16:9' ? 'Landscape' : 'Square'}{' '}
                      <small>{ratio}</small>
                    </strong>
                    <small>
                      {ratio === '9:16'
                        ? 'Shorts, Reels, mobile'
                        : ratio === '16:9'
                        ? 'YouTube, TV, desktop'
                        : 'Instagram feed, square'}
                    </small>
                  </span>
                  {values.aspectRatio === ratio && <Check size={16} className="selected-check" />}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field-grid">
            <label className="field">
              Target duration
              <select
                value={values.durationSeconds}
                onChange={(event) => update('durationSeconds', Number(event.target.value))}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
                {![15, 30, 60, 90, 120, 180].includes(values.durationSeconds) && (
                  <option value={values.durationSeconds}>{values.durationSeconds} seconds</option>
                )}
              </select>
            </label>

            <label className="field">
              Output resolution
              <select
                value={values.resolution}
                onChange={(event) => update('resolution', event.target.value as ProjectInput['resolution'])}
              >
                <option value="preview">Low-resolution preview</option>
                <option value="720p">720p · HD</option>
                <option value="1080p">1080p · Full HD</option>
              </select>
            </label>
          </div>
          <p className="field-note">
            These settings are saved with your brief. Final duration adapts to scene timing.
          </p>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="section-number">03</span>
            <div>
              <h2>The creative direction</h2>
              <p>Give your video its voice, language, and visual identity.</p>
            </div>
          </div>

          <div className="field-grid">
            <label className="field">
              Language
              <select
                value={values.language}
                onChange={(event) => update('language', event.target.value as ProjectInput['language'])}
              >
                <option value="hi">Hindi · हिन्दी</option>
                <option value="en">English</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </label>

            <label className="field">
              Visual style
              <select
                value={values.visualStyle}
                onChange={(event) => update('visualStyle', event.target.value as ProjectInput['visualStyle'])}
              >
                {visualStyles.map((style) => (
                  <option key={style} value={style}>
                    {visualStyleLabels[style].name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field" style={{ marginTop: '0.5rem' }}>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={values.narrationEnabled}
                onChange={(event) => update('narrationEnabled', event.target.checked)}
              />
              <span>
                {values.narrationEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}{' '}
                Enable voiceover narration
              </span>
            </label>
            <small>
              {values.narrationEnabled
                ? 'Voice narration will be generated and synchronized with scenes.'
                : 'Narration disabled. Scenes will rely on visual storytelling, motion graphics, and text overlays.'}
            </small>
          </div>

          {values.narrationEnabled && (
            <div className="field-grid" style={{ marginTop: '0.5rem' }}>
              <label className="field">
                Narration style
                <select
                  value={values.narrationStyle}
                  onChange={(event) => update('narrationStyle', event.target.value as ProjectInput['narrationStyle'])}
                >
                  <option value="documentary">Documentary</option>
                  <option value="calm">Calm & clear</option>
                  <option value="energetic">Energetic</option>
                </select>
              </label>
            </div>
          )}

          <div className="style-setting" style={{ marginTop: '1rem' }}>
            <span className="style-icon"><Film size={23} /></span>
            <div>
              <strong>{visualStyleLabels[values.visualStyle].name}</strong>
              <p>{visualStyleLabels[values.visualStyle].desc}</p>
            </div>
            <span className="tag">Creative Preset</span>
          </div>

          <p className="field-note">
            Engines will be selected automatically by the AI Creative Director according to your category and scenes.
          </p>
        </section>
      </fieldset>

      {(validation || error) && <ErrorNotice>{validation || error}</ErrorNotice>}

      <div className="form-submit-row">
        <span>
          <Sparkles size={15} /> {initial ? 'Changes create a new project version.' : 'Your idea, saved as a draft.'}
        </span>
        <button type="submit" className="button primary" disabled={pending || disabled}>
          {pending ? (
            <>
              <LoaderCircle size={17} className="spin" /> Saving…
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { uploadPDF, uploadURL, getLanguages } from '@/lib/api'
import { useScrollReveal } from '@/lib/useScrollReveal'

const LENGTHS = [
  { key: 'brief',    label: 'Brief',    hint: '~5 min' },
  { key: 'standard', label: 'Standard', hint: '~15 min' },
  { key: 'full',     label: 'Full',     hint: 'Complete' },
]

const DIFFS = [
  { key: 'beginner',     label: 'Intro',    hint: 'Plain' },
  { key: 'intermediate', label: 'Standard', hint: 'Balanced' },
  { key: 'advanced',     label: 'Expert',   hint: 'Deep' },
]

const FEATURES = [
  { icon: '📍', label: 'Chapter markers',  desc: 'AI-generated titles from your content. Navigate the episode like a book.' },
  { icon: '📋', label: 'Show notes',       desc: 'Key terms defined. Main findings summarised. Ready to share.' },
  { icon: '📝', label: 'Full transcript',  desc: 'Every word, speaker-labelled and downloadable as plain text.' },
  { icon: '🌐', label: '8 languages',      desc: 'Tamil, Hindi, Spanish, French, German, Arabic, Telugu, English.' },
  { icon: '🎯', label: 'Difficulty dial',  desc: 'Plain introductions to expert-level technical discussions.' },
  { icon: '⚡', label: 'Debate mode',      desc: 'Host challenges the expert, probes limitations, plays devil\'s advocate.' },
]

const STATS = [
  { val: '8',      unit: 'Languages',       icon: '🌐', color: '#10b981' },
  { val: '3',      unit: 'Length modes',    icon: '⏱',  color: '#3b82f6' },
  { val: '~2 min', unit: 'Avg generation',  icon: '⚡', color: '#f59e0b' },
]

export default function Home() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file,       setFile]      = useState<File | null>(null)
  const [length,     setLength]    = useState('standard')
  const [language,   setLanguage]  = useState('english')
  const [difficulty, setDiff]      = useState('intermediate')
  const [debate,     setDebate]    = useState(false)
  const [languages,  setLangs]     = useState<string[]>(['english'])
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [dragging,   setDragging]  = useState(false)
  const [inputTab,   setInputTab]  = useState<'pdf' | 'url'>('pdf')
  const [urlInput,   setUrlInput]  = useState('')

  const formRef    = useScrollReveal({ delay: 0 })
  const featRef    = useScrollReveal({ delay: 0 })
  const feat0      = useScrollReveal({ delay: 0 })
  const feat1      = useScrollReveal({ delay: 60 })
  const feat2      = useScrollReveal({ delay: 120 })
  const feat3      = useScrollReveal({ delay: 40 })
  const feat4      = useScrollReveal({ delay: 100 })
  const feat5      = useScrollReveal({ delay: 160 })
  const featRefs   = [feat0, feat1, feat2, feat3, feat4, feat5]

  useEffect(() => {
    getLanguages().then(d => setLangs(d.supported_languages))
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') { setFile(f); setError('') }
    else setError('Only PDF files are supported.')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const opts = { length, language, difficulty, debate }
      let job_id: string
      if (inputTab === 'url') {
        if (!urlInput.trim()) { setError('Please enter a URL.'); setLoading(false); return }
        const res = await uploadURL(urlInput.trim(), opts)
        job_id = res.job_id
      } else {
        if (!file) { setError('Please select a PDF file.'); setLoading(false); return }
        const res = await uploadPDF(file, opts)
        job_id = res.job_id
      }
      router.push(`/job/${job_id}`)
    } catch (err: any) {
      setError(err.message || 'Upload failed.')
      setLoading(false)
    }
  }

  return (
    <div>

      {/* ── Hero — LEFT aligned, asymmetric, not centered ── */}
      <div className="hero">
        <Nav />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 760, margin: '0 auto',
          padding: '68px 24px 80px',
          /* Intentionally left-aligned — breaks symmetry */
        }}>

          <div className="anim-fade-up" style={{ marginBottom: 20 }}>
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              PDF → Podcast · Research made audible
            </span>
          </div>

          {/* Headline — left aligned, max 520px so it doesn't stretch */}
          <h1 className="display anim-fade-up-2" style={{ marginBottom: 18, maxWidth: 520 }}>
            Turn any paper into a<br />
            <em>podcast worth hearing.</em>
          </h1>

          <p className="anim-fade-up-3" style={{
            fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.75,
            color: 'var(--hero-text-2)', maxWidth: 420, marginBottom: 36,
          }}>
            Upload a research paper, thesis, or report.
            Get a structured host-and-expert conversation
            with chapters, transcript, and show notes.
          </p>

          {/* CTAs — left-heavy, different padding intentionally */}
          <div className="anim-fade-up-3" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <a
              href="#upload"
              className="btn btn-primary btn-lg"
              onClick={e => { e.preventDefault(); document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' }) }}
              style={{ paddingLeft: 28, paddingRight: 28 }}  /* wider than ghost — asymmetric */
            >
              Start converting
            </a>
            <a href="/about" className="btn btn-ghost-dark" style={{ fontSize: 14 }}>
              See all features →
            </a>
          </div>

          {/* Stats — icon + number + label, left-aligned cards */}
          <div className="anim-fade-up-3" style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            paddingTop: 32, borderTop: '1px solid var(--hero-border)',
          }}>
            {STATS.map(s => (
              <div key={s.unit} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--hero-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>{s.unit}</span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 700,
                  fontSize: 26, color: s.color,
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-fade" />

      {/* ── Upload form ── */}
      <div id="upload" style={{ background: 'var(--body-bg)' }}>
        <div ref={formRef} className="reveal" style={{ maxWidth: 600, margin: '0 auto', padding: '52px 24px' }}>

          <div style={{ marginBottom: 28 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Upload</p>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400,
              color: 'var(--body-text)', letterSpacing: '-0.015em',
            }}>
              Convert your document
            </h2>
          </div>

          <form onSubmit={submit}>
            {/* Tab switcher */}
            <div style={{
              display: 'flex', marginBottom: 16,
              border: '1px solid var(--body-border)',
              borderRadius: 'var(--r-md)', overflow: 'hidden',
              background: 'var(--body-bg)',
            }}>
              {(['pdf', 'url'] as const).map(tab => (
                <button key={tab} type="button"
                  onClick={() => { setInputTab(tab); setError('') }}
                  style={{
                    flex: 1, padding: '8px 12px',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                    border: 'none', cursor: 'pointer',
                    borderRight: tab === 'pdf' ? '1px solid var(--body-border)' : 'none',
                    background: inputTab === tab ? 'var(--body-surface)' : 'transparent',
                    color: inputTab === tab ? 'var(--body-text)' : 'var(--body-text-3)',
                    transition: 'all 120ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  {tab === 'pdf' ? (
                    <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="0.5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 0.5v4h6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> PDF file</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6h10M6 1c-1.5 2-1.5 8 0 10M6 1c1.5 2 1.5 8 0 10" stroke="currentColor" strokeWidth="1.2"/></svg> URL</>
                  )}
                </button>
              ))}
            </div>

            {/* PDF dropzone */}
            {inputTab === 'pdf' && (
              <div
                className={`dropzone ${dragging ? 'drag' : ''} ${file ? 'has-file' : ''}`}
                style={{ marginBottom: 20 }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />
                {file ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 5 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M12 4L5.5 11L2 7.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--body-text)' }}>{file.name}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body-text-3)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                        style={{ background: 'none', border: 'none', color: 'var(--body-text-3)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>
                        remove
                      </button>
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ margin: '0 auto 10px', display: 'block' }}>
                      <rect x="4" y="2" width="17" height="24" rx="2" stroke="var(--body-border-2)" strokeWidth="1.4"/>
                      <path d="M10 2v7h11" stroke="var(--body-border-2)" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M21 20v7M18 24l3 3 3-3" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: 'var(--body-text)', marginBottom: 3 }}>
                      Drop a PDF, or <span style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>browse files</span>
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--body-text-3)' }}>
                      Research papers, theses, reports, whitepapers
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* URL input */}
            {inputTab === 'url' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setError('') }}
                    placeholder="https://arxiv.org/abs/2301.07041 or any article URL"
                    className="input"
                    style={{ paddingLeft: 36 }}
                  />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--body-text-3)', pointerEvents: 'none' }}
                    width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 6.5h11M6.5 1c-1.5 2-1.5 8 0 10M6.5 1c1.5 2 1.5 8 0 10" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['arxiv.org/abs/...', 'Wikipedia', 'Blog post'].map(hint => (
                    <span key={hint} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      padding: '2px 7px', borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--body-border)',
                      color: 'var(--body-text-3)', background: 'var(--body-bg)',
                    }}>{hint}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <p className="section-label" style={{ marginBottom: 7 }}>Episode length</p>
                <div className="segment">
                  {LENGTHS.map(l => (
                    <button key={l.key} type="button"
                      className={`seg-btn ${length === l.key ? 'active' : ''}`}
                      onClick={() => setLength(l.key)}>
                      <span>{l.label}</span>
                      <span className="seg-hint">{l.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 7 }}>Depth</p>
                <div className="segment">
                  {DIFFS.map(d => (
                    <button key={d.key} type="button"
                      className={`seg-btn ${difficulty === d.key ? 'active' : ''}`}
                      onClick={() => setDiff(d.key)}>
                      <span>{d.label}</span>
                      <span className="seg-hint">{d.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 7 }}>Language</p>
                <div style={{ position: 'relative' }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="input" style={{ paddingRight: 28, cursor: 'pointer' }}>
                    {languages.map(l => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--body-text-3)' }}
                    width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 3.5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 7 }}>Debate mode</p>
                <button type="button" className={`toggle ${debate ? 'on' : ''}`} onClick={() => setDebate(!debate)}>
                  <span style={{ fontSize: 13 }}>{debate ? 'Host challenges expert' : 'Collaborative tone'}</span>
                  <div className="toggle-track"><div className="toggle-knob" /></div>
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 12px', borderRadius: 'var(--r-md)',
                background: 'var(--error-bg)', border: '1px solid var(--error-border)',
                color: 'var(--error)', fontSize: 13, fontFamily: 'var(--font-sans)', marginBottom: 12,
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6.5 4v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading ||
              (inputTab === 'pdf' && !file) ||
              (inputTab === 'url' && !urlInput.trim())
              }
              className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? (
                <>
                  <span style={{ width:14, height:14, border:'1.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.65s linear infinite' }} />
                  Uploading…
                </>
              ) : inputTab === 'url' ? 'Convert URL to podcast' : 'Generate podcast'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Features — 2-col card grid with hover, not a flat table ── */}
      <div style={{ background: 'var(--body-bg)', borderTop: '1px solid var(--body-border)' }}>
        <div ref={featRef} className="reveal" style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>

          <div style={{ marginBottom: 28 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>What you get</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: 'var(--body-text)', letterSpacing: '-0.015em' }}>
              More than just audio
            </h2>
          </div>

          {/* 2-column card grid — breaks symmetry vs table layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div key={f.label} ref={featRefs[i]} className="reveal feature-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  {/* Feature title — larger + bolder than before */}
                  <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--body-text)' }}>
                    {f.label}
                  </p>
                </div>
                {/* Description — smaller + lighter than title */}
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--body-text-3)', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: 'var(--body-surface)', borderTop: '1px solid var(--body-border)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Listenify · FastAPI · Groq · Edge TTS · Next.js
        </p>
      </div>
    </div>
  )
}
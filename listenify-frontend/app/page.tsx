'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { uploadPDF, getLanguages } from '@/lib/api'
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
  { icon: '📍', label: 'Chapter markers',  desc: 'AI-generated titles from your content. Navigate the episode like a book.', featured: true },
  { icon: '📋', label: 'Show notes',       desc: 'Key terms defined. Main findings summarised. Ready to share.' },
  { icon: '📝', label: 'Full transcript',  desc: 'Every word, speaker-labelled and downloadable as plain text.' },
  { icon: '🌐', label: '8 languages',      desc: 'Tamil, Hindi, Spanish, French, German, Arabic, Telugu, English.' },
  { icon: '🎯', label: 'Difficulty dial',  desc: 'Plain introductions to expert-level technical discussions.' },
  { icon: '⚡', label: 'Debate mode',      desc: 'Host challenges the expert, probes limitations, plays devil\'s advocate.' },
]

const STATS = [
  { val: '8',      unit: 'Languages',      color: '#10b981' },
  { val: '3',      unit: 'Length modes',   color: '#3b82f6' },
  { val: '~2 min', unit: 'Avg generation', color: '#a78bfa' },
]

// Cycles loading message every 2.5s during generation
const LOADING_MESSAGES = ['Transcribing…', 'Structuring chapters…', 'Rendering audio…']

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
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error,      setError]     = useState('')
  const [dragging,   setDragging]  = useState(false)

  // Scroll-based nav shadow
  useEffect(() => {
    const nav = document.querySelector('.nav') as HTMLElement | null
    const handler = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Cycle loading messages
  useEffect(() => {
    if (!loading) { setLoadingMsg(0); return }
    const id = setInterval(() => {
      setLoadingMsg(m => (m + 1) % LOADING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(id)
  }, [loading])

  const formRef  = useScrollReveal({ delay: 0 })
  const featRef  = useScrollReveal({ delay: 0 })
  const feat0    = useScrollReveal({ delay: 0 })
  const feat1    = useScrollReveal({ delay: 60 })
  const feat2    = useScrollReveal({ delay: 120 })
  const feat3    = useScrollReveal({ delay: 40 })
  const feat4    = useScrollReveal({ delay: 100 })
  const feat5    = useScrollReveal({ delay: 160 })
  const featRefs = [feat0, feat1, feat2, feat3, feat4, feat5]

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
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError('')
    try {
      const { job_id } = await uploadPDF(file, { length, language, difficulty, debate })
      router.push(`/job/${job_id}`)
    } catch (err: any) {
      setError(err.message || 'Upload failed.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>

      {/* ── Hero ── */}
      <div className="hero">
        <Nav />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 900,
          /* Left-weighted — not centered */
          padding: '80px 32px 100px 8%',
        }}>

          <div className="anim-fade-up" style={{ marginBottom: 24 }}>
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              PDF → Podcast · Research made audible
            </span>
          </div>

          <h1 className="display anim-fade-up-2" style={{ marginBottom: 22, maxWidth: 560 }}>
            Turn any paper<br />
            into a <em>podcast<br />worth hearing.</em>
          </h1>

          <p className="anim-fade-up-3" style={{
            fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.8,
            color: 'var(--text-2)', maxWidth: 400, marginBottom: 40,
            fontWeight: 400,
          }}>
            Upload a research paper, thesis, or report.
            Get a structured host-and-expert conversation
            with chapters, transcript, and show notes.
          </p>

          {/* CTAs — left-heavy, primary wider than ghost */}
          <div className="anim-fade-up-3" style={{
            display: 'flex', gap: 10, alignItems: 'center',
            flexWrap: 'wrap', marginBottom: 64,
          }}>
            <a
              href="#upload"
              className="btn btn-primary btn-lg"
              onClick={e => {
                e.preventDefault()
                document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{ paddingLeft: 32, paddingRight: 32 }}
            >
              Start converting
            </a>
            <a href="/about" className="btn btn-ghost-dark" style={{ fontSize: 13 }}>
              See all features →
            </a>
          </div>

          {/* Stats row — left-aligned, tight */}
          <div className="anim-fade-up-3" style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            paddingTop: 28, borderTop: '1px solid var(--border)',
          }}>
            {STATS.map(s => (
              <div key={s.unit} className="stat-card">
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-3)', textTransform: 'uppercase',
                  letterSpacing: '0.09em', marginBottom: 8,
                }}>{s.unit}</p>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 28, color: s.color,
                  letterSpacing: '-0.04em', lineHeight: 1,
                }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upload form ── */}
      <div id="upload" style={{
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border)',
      }}>
        <div ref={formRef} className="reveal" style={{
          maxWidth: 580,
          /* Slightly left-offset from center — asymmetric */
          margin: '0 auto 0 max(32px, 8%)',
          padding: '60px 32px 60px 0',
        }}>

          <div style={{ marginBottom: 32 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Upload</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
              color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              Convert your document
            </h2>
          </div>

          <form onSubmit={submit}>

            {/* Dropzone */}
            <div
              className={`dropzone${dragging ? ' drag' : ''}${file ? ' has-file' : ''}`}
              style={{ marginBottom: 18 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />

              {file ? (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, marginBottom: 6,
                  }}>
                    {/* Draw-in checkmark */}
                    <svg className="check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13 4.5L6 12L3 9"
                        stroke="var(--success)" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          strokeDasharray: 20, strokeDashoffset: 0,
                          animation: 'draw-check 250ms ease 50ms both',
                        }}
                      />
                    </svg>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontWeight: 600,
                      fontSize: 14, color: 'var(--text-1)',
                    }}>
                      {file.name}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-3)',
                  }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null) }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-3)', cursor: 'pointer',
                        fontSize: 10, textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      remove
                    </button>
                  </p>
                </div>
              ) : (
                <div>
                  {/* Upload icon */}
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
                    style={{ margin: '0 auto 12px', display: 'block' }}>
                    <rect x="3" y="2" width="16" height="22" rx="2"
                      stroke="var(--border-2)" strokeWidth="1.2"/>
                    <path d="M9 2v6.5h10" stroke="var(--border-2)"
                      strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M19 18.5v8M16.5 22.5l2.5 2.5 2.5-2.5"
                      stroke="var(--accent)" strokeWidth="1.3"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontWeight: 500,
                    fontSize: 13, color: 'var(--text-1)', marginBottom: 4,
                  }}>
                    Drop a PDF, or{' '}
                    <span style={{
                      color: 'var(--accent-text)',
                      textDecoration: 'underline', textUnderlineOffset: 2,
                    }}>browse files</span>
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-3)', letterSpacing: '0.01em',
                  }}>
                    Research papers · theses · reports · whitepapers
                  </p>
                </div>
              )}
            </div>

            {/* Options — 2-col fixed grid, not auto-fit */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 12,
            }}>
              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Episode length</p>
                <div className="segment">
                  {LENGTHS.map(l => (
                    <button key={l.key} type="button"
                      className={`seg-btn${length === l.key ? ' active' : ''}`}
                      onClick={() => setLength(l.key)}>
                      <span>{l.label}</span>
                      <span className="seg-hint">{l.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Depth</p>
                <div className="segment">
                  {DIFFS.map(d => (
                    <button key={d.key} type="button"
                      className={`seg-btn${difficulty === d.key ? ' active' : ''}`}
                      onClick={() => setDiff(d.key)}>
                      <span>{d.label}</span>
                      <span className="seg-hint">{d.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Language</p>
                <div style={{ position: 'relative' }}>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="input"
                    style={{ paddingRight: 28, cursor: 'pointer' }}
                  >
                    {languages.map(l => (
                      <option key={l} value={l}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                  <svg style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: 'var(--text-3)',
                  }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 3l3.5 4 3.5-4" stroke="currentColor"
                      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Debate mode</p>
                <button
                  type="button"
                  className={`toggle${debate ? ' on' : ''}`}
                  onClick={() => setDebate(!debate)}
                >
                  <span style={{ fontSize: 12 }}>
                    {debate ? 'Host challenges expert' : 'Collaborative tone'}
                  </span>
                  <div className="toggle-track">
                    <div className="toggle-knob" />
                  </div>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px',
                borderRadius: 'var(--r-md)',
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error)',
                fontSize: 12, fontFamily: 'var(--font-sans)',
                marginBottom: 12,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6 3.5v3M6 8v.5" stroke="currentColor"
                    strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !file}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="wave-loader">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </span>
                  {LOADING_MESSAGES[loadingMsg]}
                </>
              ) : 'Generate podcast'}
            </button>

          </form>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div ref={featRef} className="reveal" style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '64px 8% 64px',
        }}>

          <div style={{ marginBottom: 36 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>What you get</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
              color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              More than just audio
            </h2>
          </div>

          {/* 3-col grid — first card spans 2 (breaks symmetry) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                ref={featRefs[i]}
                className={`reveal feature-card${f.featured ? ' feature-card-featured' : ''}`}
                style={f.featured ? { gridColumn: 'span 2' } : {}}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, marginBottom: 10,
                }}>
                  <span style={{ fontSize: 15 }}>{f.icon}</span>
                  <p style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: 14, color: 'var(--text-1)',
                    letterSpacing: '-0.01em',
                  }}>
                    {f.label}
                  </p>
                </div>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                  color: 'var(--text-2)', lineHeight: 1.7,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          Listenify
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          FastAPI · Groq · Edge TTS · Next.js
        </p>
      </div>

    </div>
  )
}
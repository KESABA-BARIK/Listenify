'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { uploadPDF, getLanguages } from '@/lib/api'

const LENGTHS = [
  { key: 'brief',    label: 'Brief',    desc: '~5 min' },
  { key: 'standard', label: 'Standard', desc: '~15 min' },
  { key: 'full',     label: 'Full',     desc: 'Complete' },
]

const DIFFS = [
  { key: 'beginner',     label: 'Beginner',     desc: 'Plain language' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Balanced depth' },
  { key: 'advanced',     label: 'Advanced',     desc: 'Expert level' },
]

export default function Home() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]         = useState<File | null>(null)
  const [length, setLength]     = useState('standard')
  const [language, setLanguage] = useState('english')
  const [difficulty, setDiff]   = useState('intermediate')
  const [debate, setDebate]     = useState(false)
  const [languages, setLangs]   = useState<string[]>(['english'])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    getLanguages().then(d => setLangs(d.supported_languages))
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
    else setError('Please drop a PDF file.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Select a PDF first.'); return }
    setLoading(true); setError('')
    try {
      const { job_id } = await uploadPDF(file, { length, language, difficulty, debate })
      router.push(`/job/${job_id}`)
    } catch (e: any) {
      setError(e.message || 'Upload failed.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)',
          animation: 'glowPulse 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(165,148,255,0.1) 0%, transparent 70%)',
          animation: 'glowPulse 8s ease-in-out infinite 2s',
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(10,10,15,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🎙</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            Listenify
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Link href="/" style={{
            color: 'var(--text)', textDecoration: 'none', fontSize: '0.85rem',
            padding: '0.4rem 0.9rem', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            fontWeight: 500,
          }}>Upload</Link>
          <Link href="/about" style={{
            color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.85rem',
            padding: '0.4rem 0.9rem', borderRadius: 6,
            transition: 'color 0.2s',
            fontWeight: 500,
          }}>About</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 760, margin: '0 auto',
        padding: '4rem 1.5rem 2rem',
        animation: 'fadeUp 0.7s ease forwards',
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <span className="pill">✦ AI-Powered Podcast Generator</span>
        </div>
        <h1 style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem',
        }}>
          Turn any PDF into a{' '}
          <span className="gradient-text">podcast</span>{' '}
          worth listening to.
        </h1>
        <p style={{
          color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.7,
          maxWidth: 540, marginBottom: '3rem',
        }}>
          Upload a research paper. Choose your language, depth, and style.
          Get a host-and-expert conversation with chapters, transcript, and show notes.
        </p>

        {/* Upload form card */}
        <form onSubmit={handleSubmit}>
          <div className="glass" style={{ borderRadius: 16, padding: '2rem', marginBottom: '1rem' }}>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'rgba(124,106,247,0.4)' : 'var(--border)'}`,
                borderRadius: 12, padding: '2.5rem 1rem',
                textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(124,106,247,0.05)' : file ? 'rgba(124,106,247,0.03)' : 'transparent',
                transition: 'all 0.2s ease',
                marginBottom: '1.75rem',
              }}
            >
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} />
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {file ? '✅' : '📄'}
              </div>
              {file ? (
                <>
                  <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Syne', fontWeight: 600 }}>Drop your PDF here</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: 4 }}>
                    or click to browse
                  </p>
                </>
              )}
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

              {/* Length */}
              <div>
                <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Episode Length</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {LENGTHS.map(l => (
                    <button key={l.key} type="button" onClick={() => setLength(l.key)} style={{
                      flex: 1, padding: '0.5rem 0.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: length === l.key ? 'var(--accent)' : 'var(--bg3)',
                      color: length === l.key ? 'white' : 'var(--text-2)',
                      transition: 'all 0.15s',
                      boxShadow: length === l.key ? '0 0 16px var(--accent-glow)' : 'none',
                    }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.75rem' }}>{l.label}</p>
                      <p style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 1 }}>{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Difficulty</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {DIFFS.map(d => (
                    <button key={d.key} type="button" onClick={() => setDiff(d.key)} style={{
                      flex: 1, padding: '0.5rem 0.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: difficulty === d.key ? 'var(--accent)' : 'var(--bg3)',
                      color: difficulty === d.key ? 'white' : 'var(--text-2)',
                      transition: 'all 0.15s',
                      boxShadow: difficulty === d.key ? '0 0 16px var(--accent-glow)' : 'none',
                    }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.75rem' }}>{d.label}</p>
                      <p style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 1 }}>{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Language</p>
                <div style={{ position: 'relative' }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="input" style={{ paddingRight: '2rem' }}>
                    {languages.map(l => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>▾</span>
                </div>
              </div>

              {/* Debate */}
              <div>
                <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Debate Mode</p>
                <button type="button" onClick={() => setDebate(!debate)} style={{
                  width: '100%', padding: '0.65rem 1rem', borderRadius: 8,
                  border: `1px solid ${debate ? 'var(--accent)' : 'var(--border)'}`,
                  background: debate ? 'rgba(124,106,247,0.15)' : 'var(--bg3)',
                  color: debate ? 'var(--accent-2)' : 'var(--text-2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: debate ? '0 0 16px var(--accent-glow)' : 'none',
                }}>
                  <span>{debate ? '⚡' : '💬'}</span>
                  {debate ? 'Debate: On' : 'Debate: Off'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(247,79,106,0.1)', border: '1px solid rgba(247,79,106,0.3)',
                borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
                color: 'var(--red)', fontSize: '0.85rem', fontFamily: 'Inter',
              }}>{error}</div>
            )}

            <button type="submit" className="btn-accent" disabled={loading || !file}
              style={{ width: '100%', fontSize: '0.95rem', padding: '0.9rem' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Uploading…
                </span>
              ) : 'Generate Podcast →'}
            </button>
          </div>
        </form>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {['8 languages', 'Chapter markers', 'Show notes', 'Full transcript', 'Debate mode'].map(f => (
            <span key={f} className="pill" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
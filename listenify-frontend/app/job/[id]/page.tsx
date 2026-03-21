'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getStatus, getChapters, getShowNotes, getTranscript } from '@/lib/api'
import AudioPlayer from '@/components/AudioPlayer'
import ShowNotes from '@/components/ShowNotes'
import TranscriptViewer from '@/components/TranscriptViewer'

type Tab = 'player' | 'shownotes' | 'transcript'

const STEPS = [
  { key: 'uploading',   label: 'Uploading PDF',          icon: '📤' },
  { key: 'processing',  label: 'Generating podcast',      icon: '🧠' },
  { key: 'ready',       label: 'Ready',                   icon: '✅' },
]

export default function JobPage() {
  const { id } = useParams<{ id: string }>()
  const [status, setStatus]     = useState('uploading')
  const [meta, setMeta]         = useState<Record<string,string>>({})
  const [error, setError]       = useState('')
  const [chapters, setChapters] = useState<any[]>([])
  const [notes, setNotes]       = useState<any>(null)
  const [transcript, setTr]     = useState<string|null>(null)
  const [tab, setTab]           = useState<Tab>('player')

  useEffect(() => {
    let interval: NodeJS.Timeout
    async function poll() {
      try {
        const job = await getStatus(id)
        setStatus(job.status); setMeta(job)
        if (job.status === 'ready') {
          clearInterval(interval)
          const [ch, sn, tr] = await Promise.all([getChapters(id), getShowNotes(id), getTranscript(id)])
          setChapters(ch); setNotes(sn); setTr(tr)
        }
        if (job.status === 'failed') { clearInterval(interval); setError(job.error || 'Unknown error') }
      } catch(e: any) { setError(e.message); clearInterval(interval) }
    }
    poll()
    interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [id])

  const TABS: {key: Tab; label: string; icon: string}[] = [
    { key: 'player',     label: 'Player',      icon: '▶' },
    { key: 'shownotes',  label: 'Show Notes',  icon: '📋' },
    { key: 'transcript', label: 'Transcript',  icon: '📝' },
  ]

  const stepIndex = STEPS.findIndex(s => s.key === status)

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* Background orb */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(10,10,15,0.8)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>🎙</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Listenify
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" className="btn-ghost">← New Upload</Link>
          <Link href="/about" className="btn-ghost">About</Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem', animation: 'fadeUp 0.6s ease forwards' }}>

        {/* Meta tags */}
        {status === 'ready' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
            {meta.language   && <span className="pill">🌐 {meta.language}</span>}
            {meta.length     && <span className="pill">⏱ {meta.length}</span>}
            {meta.difficulty && <span className="pill">🎯 {meta.difficulty}</span>}
            {meta.debate === 'True' && <span className="pill" style={{ background: 'rgba(247,79,106,0.12)', borderColor: 'rgba(247,79,106,0.3)', color: 'var(--red)' }}>⚡ Debate</span>}
          </div>
        )}

        {/* Processing state */}
        {status !== 'ready' && status !== 'failed' && (
          <div className="glass" style={{ borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>

            {/* Steps */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {STEPS.filter(s => s.key !== 'ready').map((step, i) => {
                const done    = stepIndex > i
                const active  = stepIndex === i
                return (
                  <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      height: 3, borderRadius: 2,
                      background: done || active ? 'var(--accent)' : 'var(--bg3)',
                      boxShadow: active ? '0 0 8px var(--accent-glow)' : 'none',
                      transition: 'all 0.4s ease',
                    }} />
                    <p style={{
                      fontSize: '0.72rem', fontFamily: 'Inter', fontWeight: 500,
                      color: done || active ? 'var(--text)' : 'var(--text-3)',
                    }}>{step.icon} {step.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Waveform loading */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40, marginBottom: '1.25rem' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="wave-bar" style={{
                  flex: 1, borderRadius: 2,
                  background: `rgba(124,106,247,${0.3 + (i % 3) * 0.2})`,
                  height: `${30 + Math.sin(i * 0.8) * 20}%`,
                  animationDelay: `${i * 0.07}s`,
                }} />
              ))}
            </div>

            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.3rem', marginBottom: 6 }}>
              {status === 'uploading' ? 'Uploading your document…' : 'Crafting your podcast…'}
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', fontFamily: 'Inter', marginBottom: '1.25rem' }}>
              {status === 'processing'
                ? 'Summarising, scripting, and generating audio. This takes 1–3 minutes.'
                : 'Sending your PDF to the server…'}
            </p>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-3)' }}>
              job: {id}
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'failed' && (
          <div className="glass" style={{ borderRadius: 16, padding: '2rem', borderColor: 'rgba(247,79,106,0.3)' }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.3rem', color: 'var(--red)', marginBottom: 8 }}>
              Generation failed
            </p>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.25rem', wordBreak: 'break-all' }}>
              {error}
            </p>
            <Link href="/" className="btn-ghost">← Try again</Link>
          </div>
        )}

        {/* Ready — tabs */}
        {status === 'ready' && (
          <div>
            {/* Tab bar */}
            <div style={{
              display: 'flex', gap: 4, padding: 4,
              background: 'var(--bg3)', borderRadius: 10, marginBottom: '1.5rem',
            }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: tab === t.key ? 'var(--accent)' : 'transparent',
                  color: tab === t.key ? 'white' : 'var(--text-2)',
                  fontFamily: 'Syne', fontWeight: 600, fontSize: '0.82rem',
                  transition: 'all 0.15s',
                  boxShadow: tab === t.key ? '0 0 16px var(--accent-glow)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {tab === 'player'     && <AudioPlayer jobId={id} chapters={chapters} />}
              {tab === 'shownotes'  && <ShowNotes notes={notes} />}
              {tab === 'transcript' && <TranscriptViewer jobId={id} transcript={transcript} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

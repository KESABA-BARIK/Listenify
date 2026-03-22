'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Nav from '@/components/Nav'
import AudioPlayer from '@/components/AudioPlayer'
import ShowNotes from '@/components/ShowNotes'
import TranscriptViewer from '@/components/TranscriptViewer'
import { getStatus, getChapters, getShowNotes, getTranscript } from '@/lib/api'

type Tab = 'player' | 'shownotes' | 'transcript'

const STEPS = [
  { key: 'uploading',  label: 'Uploading',  pct: 12 },
  { key: 'processing', label: 'Generating', pct: 55 },
  { key: 'ready',      label: 'Complete',   pct: 100 },
]

export default function JobPage() {
  const { id } = useParams<{ id: string }>()

  const [status,     setStatus]  = useState('uploading')
  const [meta,       setMeta]    = useState<Record<string,string>>({})
  const [error,      setError]   = useState('')
  const [chapters,   setChap]    = useState<any[]>([])
  const [notes,      setNotes]   = useState<any>(null)
  const [transcript, setTr]      = useState<string|null>(null)
  const [tab,        setTab]     = useState<Tab>('player')

  useEffect(() => {
    let iv: NodeJS.Timeout
    const poll = async () => {
      try {
        const job = await getStatus(id)
        setStatus(job.status); setMeta(job)
        if (job.status === 'ready') {
          clearInterval(iv)
          const [ch, sn, tr] = await Promise.all([getChapters(id), getShowNotes(id), getTranscript(id)])
          setChap(ch); setNotes(sn); setTr(tr)
        }
        if (job.status === 'failed') { clearInterval(iv); setError(job.error || 'Unknown error') }
      } catch (e: any) { setError(e.message); clearInterval(iv) }
    }
    poll(); iv = setInterval(poll, 3000)
    return () => clearInterval(iv)
  }, [id])

  const stepIdx  = STEPS.findIndex(s => s.key === status)
  const stepPct  = STEPS[stepIdx]?.pct ?? 12
  const stepLabel = STEPS[stepIdx]?.label ?? 'Working'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--body-bg)' }}>
      <Nav light />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Processing ── */}
        {status !== 'ready' && status !== 'failed' && (
          <div className="anim-fade-up">
            <div className="card" style={{ padding: '24px 24px 20px', marginBottom: 16 }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--body-text)', marginBottom: 4 }}>
                    {status === 'uploading' ? 'Uploading your document…' : 'Generating your podcast…'}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--body-text-3)', lineHeight: 1.5 }}>
                    {status === 'processing'
                      ? 'Summarising, scripting, and synthesising audio. Usually 1–3 minutes.'
                      : 'Receiving your PDF…'}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: 'var(--accent-text)', background: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  padding: '3px 8px', borderRadius: 'var(--r-sm)',
                  flexShrink: 0, marginLeft: 16,
                }}>{stepPct}%</span>
              </div>

              {/* Progress */}
              <div className="progress-track" style={{ marginBottom: 16 }}>
                <div className="progress-fill" style={{ width: `${stepPct}%` }} />
              </div>

              {/* Step indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {STEPS.map((step, i) => {
                  const done   = i < stepIdx
                  const active = i === stepIdx
                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? 'var(--success-bg)' : active ? 'var(--accent-light)' : 'var(--body-bg)',
                          border: `1px solid ${done ? 'var(--success-border)' : active ? 'var(--accent-border)' : 'var(--body-border)'}`,
                          flexShrink: 0,
                        }}>
                          {done
                            ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="var(--success)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            : <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--body-border-2)' }} />
                          }
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-sans)', fontSize: 12,
                          color: done ? 'var(--success)' : active ? 'var(--body-text)' : 'var(--body-text-3)',
                          fontWeight: active ? 500 : 400,
                        }}>{step.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: done ? 'var(--success-border)' : 'var(--body-border)', margin: '0 8px' }} />
                      )}
                    </div>
                  )
                })}
              </div>

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--body-text-3)', marginTop: 16 }}>
                {id}
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'failed' && (
          <div className="card anim-fade-up" style={{ padding: 24, borderColor: 'var(--error-border)' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 6 }}>
              Generation failed
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--body-text-3)', marginBottom: 16, wordBreak: 'break-all', lineHeight: 1.6 }}>
              {error}
            </p>
            <a href="/" className="btn btn-secondary btn-sm">← Try again</a>
          </div>
        )}

        {/* ── Ready ── */}
        {status === 'ready' && (
          <div className="anim-fade-up">

            {/* Meta badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
              {meta.language   && <span className="badge">{meta.language}</span>}
              {meta.length     && <span className="badge">{meta.length}</span>}
              {meta.difficulty && <span className="badge">{meta.difficulty}</span>}
              {meta.debate === 'True' && (
                <span className="badge" style={{ color: 'var(--accent-text)', background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
                  debate
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="tab-bar">
              {([
                { key: 'player',     label: 'Player' },
                { key: 'shownotes',  label: 'Show Notes' },
                { key: 'transcript', label: 'Transcript' },
              ] as { key: Tab; label: string }[]).map(t => (
                <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="anim-fade-in">
              {tab === 'player'     && <AudioPlayer jobId={id} chapters={chapters} />}
              {tab === 'shownotes'  && <ShowNotes notes={notes} />}
              {tab === 'transcript' && <TranscriptViewer jobId={id} transcript={transcript} />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

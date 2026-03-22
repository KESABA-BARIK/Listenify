'use client'
import { useEffect, useRef, useState } from 'react'
import { streamUrl, downloadUrl } from '@/lib/api'

interface Chapter { index: number; title: string; timestamp: string; start_seconds: number }
interface Props { jobId: string; chapters: Chapter[] }

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function AudioPlayer({ jobId, chapters }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing,  setPlaying]  = useState(false)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [activeChap, setActive] = useState(0)

  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onTime  = () => {
      setCurrent(a.currentTime)
      const idx = [...chapters].reverse().findIndex(c => a.currentTime >= c.start_seconds)
      if (idx !== -1) setActive(chapters.length - 1 - idx)
    }
    const onMeta  = () => setDuration(a.duration)
    const onEnded = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
    }
  }, [chapters])

  const toggle = () => { const a = audioRef.current!; playing ? a.pause() : a.play(); setPlaying(!playing) }
  const skip   = (s: number) => { audioRef.current!.currentTime = Math.max(0, Math.min(duration, audioRef.current!.currentTime + s)) }
  const seek   = (e: React.ChangeEvent<HTMLInputElement>) => { audioRef.current!.currentTime = +e.target.value }
  const jumpTo = (sec: number) => { audioRef.current!.currentTime = sec; audioRef.current!.play(); setPlaying(true) }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <audio ref={audioRef} src={streamUrl(jobId)} preload="metadata" />

      {/* ── Player ── */}
      <div className="card" style={{ padding: '20px' }}>

        {/* Now playing */}
        {chapters.length > 0 && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--body-border)' }}>
            <p className="section-label" style={{ marginBottom: 3 }}>Now playing</p>
            <p style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 16, color: 'var(--body-text)', lineHeight: 1.4,
            }}>
              {chapters[activeChap]?.title ?? 'Episode'}
            </p>
          </div>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div className="progress-track" style={{ marginBottom: 8, cursor: 'pointer', height: 3, position: 'relative' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct  = (e.clientX - rect.left) / rect.width
              if (audioRef.current) audioRef.current.currentTime = pct * duration
            }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body-text-3)' }}>{fmt(current)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body-text-3)' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Scrubber */}
        <input type="range" min={0} max={duration || 100} value={current} step={1}
          onChange={seek} style={{ marginBottom: 16 }} />

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => skip(-15)} className="btn btn-ghost btn-sm"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--body-text-3)' }}>
            −15s
          </button>

          <button onClick={toggle} className="btn btn-primary"
            style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', flexShrink: 0 }}>
            {playing
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1.5" y="1" width="3.5" height="10" rx="1"/><rect x="7" y="1" width="3.5" height="10" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: 1 }}><path d="M2.5 1.5l8 4.5-8 4.5V1.5z"/></svg>
            }
          </button>

          <button onClick={() => skip(15)} className="btn btn-ghost btn-sm"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--body-text-3)' }}>
            +15s
          </button>

          <div style={{ flex: 1 }} />

          <a href={downloadUrl(jobId)} download className="btn btn-secondary btn-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7.5M3.5 6.5L6 9l2.5-2.5M1.5 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* ── Chapters ── */}
      {chapters.length > 0 && (
        <div className="card-flat" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--body-border)', background: 'var(--body-bg)' }}>
            <p className="section-label">Chapters · {chapters.length}</p>
          </div>
          {chapters.map((ch, i) => (
            <button key={ch.index} onClick={() => jumpTo(ch.start_seconds)}
              className={`chapter-row ${i === activeChap ? 'active' : ''}`}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: i === activeChap ? 'var(--accent)' : 'var(--body-text-3)',
                minWidth: 34, flexShrink: 0,
              }}>{ch.timestamp}</span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 13.5,
                fontWeight: i === activeChap ? 500 : 400,
                color: i === activeChap ? 'var(--accent-text)' : 'var(--body-text-2)',
                lineHeight: 1.4,
              }}>{ch.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

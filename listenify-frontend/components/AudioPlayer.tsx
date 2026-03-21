'use client'
import { useEffect, useRef, useState } from 'react'
import { streamUrl, downloadUrl } from '@/lib/api'

interface Chapter { index: number; title: string; timestamp: string; start_seconds: number }
interface Props { jobId: string; chapters: Chapter[] }

export default function AudioPlayer({ jobId, chapters }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]   = useState(false)
  const [current, setCurrent]   = useState(0)
  const [duration, setDuration] = useState(0)
  const [activeChapter, setActive] = useState(0)
  const [volume, setVolume]     = useState(1)

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

  function toggle() {
    const a = audioRef.current; if (!a) return
    playing ? a.pause() : a.play(); setPlaying(!playing)
  }

  function skip(sec: number) {
    const a = audioRef.current; if (!a) return
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + sec))
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current; if (!a) return
    a.currentTime = Number(e.target.value)
  }

  function seekToChapter(sec: number) {
    const a = audioRef.current; if (!a) return
    a.currentTime = sec; a.play(); setPlaying(true)
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <audio ref={audioRef} src={streamUrl(jobId)} preload="metadata" />

      {/* Main player card */}
      <div className="glass" style={{ borderRadius: 16, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Now playing label */}
        {chapters.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Now Playing
            </p>
            <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '1rem', color: 'var(--accent-2)' }}>
              {chapters[activeChapter]?.title ?? 'Episode'}
            </p>
          </div>
        )}

        {/* Waveform */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48, marginBottom: '1.25rem' }}>
          {Array.from({ length: 52 }).map((_, i) => {
            const h = 20 + Math.abs(Math.sin(i * 0.5 + 1) * 22 + Math.cos(i * 0.3) * 14)
            const isPlayed = (i / 52) * 100 < progress
            return (
              <div key={i} className="wave-bar" style={{
                flex: 1, borderRadius: 2,
                height: `${h}%`,
                background: isPlayed ? 'var(--accent)' : 'var(--bg3)',
                transition: 'background 0.1s',
                animationDelay: `${i * 0.03}s`,
                animationPlayState: playing ? 'running' : 'paused',
                boxShadow: isPlayed ? '0 0 4px var(--accent-glow)' : 'none',
              }} />
            )
          })}
        </div>

        {/* Scrubber */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input type="range" min={0} max={duration || 100} value={current} step={1} onChange={seek} style={{ marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)' }}>
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Playback row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Skip back */}
              <button onClick={() => skip(-15)} style={{
                background: 'var(--bg3)', border: 'none', color: 'var(--text-2)',
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', transition: 'all 0.15s',
              }} title="Back 15s">⏮ 15</button>

              {/* Play/Pause */}
              <button onClick={toggle} style={{
                background: 'var(--accent)', border: 'none', color: 'white',
                width: 48, height: 48, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.15s',
                boxShadow: '0 0 20px var(--accent-glow)',
              }}>
                {playing ? '⏸' : '▶'}
              </button>

              {/* Skip forward */}
              <button onClick={() => skip(15)} style={{
                background: 'var(--bg3)', border: 'none', color: 'var(--text-2)',
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', transition: 'all 0.15s',
              }} title="Forward 15s">15 ⏭</button>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.85rem' }}>{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={changeVolume} style={{ width: 72 }} />
            </div>
          </div>

          {/* Download row — full width, clearly visible */}
          <a href={downloadUrl(jobId)} download style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10,
            background: 'var(--accent-subtle)', border: '1px solid rgba(124,106,247,0.3)',
            color: 'var(--accent-2)', textDecoration: 'none',
            fontSize: '0.875rem', fontFamily: 'Inter', fontWeight: 500,
            transition: 'all 0.15s',
          }}>
            ↓ Download MP3
          </a>
        </div>
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Chapters — {chapters.length}
            </p>
          </div>
          {chapters.map((ch, i) => (
            <button key={ch.index} onClick={() => seekToChapter(ch.start_seconds)} style={{
              width: '100%', textAlign: 'left', padding: '0.85rem 1.25rem',
              background: i === activeChapter ? 'rgba(124,106,247,0.08)' : 'transparent',
              border: 'none', borderBottom: i < chapters.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
              transition: 'background 0.15s',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: 'var(--text-3)', minWidth: 36 }}>
                {ch.timestamp}
              </span>
              <span style={{
                fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 500,
                color: i === activeChapter ? 'var(--accent-2)' : 'var(--text)',
              }}>
                {i === activeChapter && <span style={{ marginRight: 6, fontSize: '0.6rem' }}>▶</span>}
                {ch.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
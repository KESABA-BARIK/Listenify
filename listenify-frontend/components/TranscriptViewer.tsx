'use client'
import { transcriptDlUrl } from '@/lib/api'

interface Props { jobId: string; transcript: string | null }

export default function TranscriptViewer({ jobId, transcript }: Props) {
  if (!transcript) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'Inter', fontSize: '0.9rem' }}>
      Transcript not available.
    </div>
  )

  const lines = transcript.split('\n').filter(Boolean)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <a href={transcriptDlUrl(jobId)} download className="btn-ghost">↓ Download .txt</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
        {lines.map((line, i) => {
          if (line.startsWith('===')) return (
            <p key={i} style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
              {line.replace(/=/g, '').trim()}
            </p>
          )
          if (line.startsWith('Host:')) return (
            <div key={i} className="glass" style={{ borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: '3px solid var(--accent)' }}>
              <span style={{
                minWidth: 44, fontSize: '0.65rem', fontFamily: 'JetBrains Mono',
                color: 'var(--accent-2)', background: 'rgba(124,106,247,0.12)',
                padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Host</span>
              <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text)' }}>
                {line.replace('Host:', '').trim()}
              </p>
            </div>
          )
          if (line.startsWith('Expert:')) return (
            <div key={i} className="glass" style={{ borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                minWidth: 44, fontSize: '0.65rem', fontFamily: 'JetBrains Mono',
                color: 'var(--green)', background: 'rgba(79,247,160,0.1)',
                padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Expert</span>
              <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--text)' }}>
                {line.replace('Expert:', '').trim()}
              </p>
            </div>
          )
          return (
            <p key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-3)', paddingLeft: 4 }}>{line}</p>
          )
        })}
      </div>
    </div>
  )
}

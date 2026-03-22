'use client'
import { transcriptDlUrl } from '@/lib/api'

interface Props { jobId: string; transcript: string | null }

export default function TranscriptViewer({ jobId, transcript }: Props) {
  if (!transcript) return (
    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text-3)', padding: '40px 0', textAlign: 'center' }}>
      Transcript not available.
    </p>
  )

  const lines = transcript.split('\n').filter(Boolean)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <a href={transcriptDlUrl(jobId)} download className="btn btn-secondary btn-sm">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7.5M3.5 6.5L6 9l2.5-2.5M1.5 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download .txt
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: '60vh', overflowY: 'auto' }}>
        {lines.map((line, i) => {
          if (line.startsWith('===') || line.match(/^-{3,}/)) return (
            <div key={i} style={{ padding: '10px 0 6px', marginTop: i > 0 ? 8 : 0 }}>
              <p className="section-label">{line.replace(/[=\-]/g,'').trim()}</p>
            </div>
          )
          if (line.startsWith('Host:')) return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--body-border)', alignItems: 'flex-start' }}>
              <span className="speaker-tag speaker-host">Host</span>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text)', lineHeight: 1.7 }}>
                {line.replace('Host:', '').trim()}
              </p>
            </div>
          )
          if (line.startsWith('Expert:')) return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--body-border)', alignItems: 'flex-start' }}>
              <span className="speaker-tag speaker-expert">Expert</span>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text)', lineHeight: 1.7 }}>
                {line.replace('Expert:', '').trim()}
              </p>
            </div>
          )
          return (
            <p key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body-text-3)', padding: '4px 0' }}>{line}</p>
          )
        })}
      </div>
    </div>
  )
}

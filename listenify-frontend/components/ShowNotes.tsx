'use client'
interface Term { term: string; definition: string }
interface Props { notes: { key_terms: Term[]; findings: string[] } | null }

export default function ShowNotes({ notes }: Props) {
  if (!notes || (!notes.findings?.length && !notes.key_terms?.length)) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'Inter', fontSize: '0.9rem' }}>
      No show notes available.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {notes.findings?.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <div style={{ width: 3, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
            <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Main Findings
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.findings.map((f, i) => (
              <div key={i} className="glass" style={{ borderRadius: 10, padding: '0.9rem 1.1rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 24, height: 24, background: 'rgba(124,106,247,0.15)',
                  border: '1px solid rgba(124,106,247,0.3)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--accent-2)',
                }}>{i + 1}</span>
                <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.key_terms?.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <div style={{ width: 3, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
            <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Key Terms
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.key_terms.map((t, i) => (
              <div key={i} className="glass" style={{ borderRadius: 10, padding: '0.9rem 1.1rem' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-2)', marginBottom: 4 }}>{t.term}</p>
                <p style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{t.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

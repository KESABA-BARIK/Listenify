'use client'
interface Term { term: string; definition: string }
interface Props { notes: { key_terms: Term[]; findings: string[] } | null }

export default function ShowNotes({ notes }: Props) {
  if (!notes || (!notes.findings?.length && !notes.key_terms?.length)) return (
    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text-3)', padding: '40px 0', textAlign: 'center' }}>
      No show notes available.
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {notes.findings?.length > 0 && (
        <section>
          <p className="section-label" style={{ marginBottom: 10 }}>Key findings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes.findings.map((f, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px',
                background: 'var(--body-surface)',
                border: '1px solid var(--body-border)',
                borderLeft: '3px solid var(--accent-border)',
                borderRadius: 'var(--r-md)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--accent)', minWidth: 16, flexShrink: 0, marginTop: 1,
                }}>{i + 1}</span>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text-2)', lineHeight: 1.65 }}>{f}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {notes.key_terms?.length > 0 && (
        <section>
          <p className="section-label" style={{ marginBottom: 10 }}>Glossary</p>
          <div style={{ border: '1px solid var(--body-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            {notes.key_terms.map((t, i) => (
              <div key={i} style={{
                padding: '11px 14px',
                background: i % 2 === 0 ? 'var(--body-surface)' : 'var(--body-bg)',
                borderBottom: i < notes.key_terms.length - 1 ? '1px solid var(--body-border)' : 'none',
              }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--body-text)', marginBottom: 2 }}>{t.term}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--body-text-3)', lineHeight: 1.6 }}>{t.definition}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

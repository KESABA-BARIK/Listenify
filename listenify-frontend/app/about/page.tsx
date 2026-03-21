import Link from 'next/link'

const FEATURES = [
  { icon: '🌐', title: '8 Languages',       desc: 'Tamil, Hindi, Spanish, French, German, Arabic, Telugu, English.' },
  { icon: '⚡', title: 'Debate Mode',        desc: 'Host challenges the expert — probes weaknesses, plays devil\'s advocate.' },
  { icon: '🎯', title: 'Difficulty Dial',    desc: 'Beginner to advanced. Same paper, totally different depth and vocabulary.' },
  { icon: '📍', title: 'Chapter Markers',    desc: 'Navigate the episode like a book. Jump to any section instantly.' },
  { icon: '📋', title: 'Show Notes',         desc: 'Key terms defined. Main findings summarised. Ready to share.' },
  { icon: '📝', title: 'Full Transcript',    desc: 'Every word, colour-coded by speaker. Downloadable as plain text.' },
]

const STACK = ['FastAPI', 'Groq / LLaMA 3.1', 'Edge TTS', 'PyMuPDF', 'Redis', 'Next.js', 'Tailwind CSS']

export default function About() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* BG orb */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-10%', width: 500, height: 500,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(124,106,247,0.1) 0%, transparent 70%)',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)', background: 'rgba(10,10,15,0.8)',
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
        <div style={{ display: 'flex', gap: 4 }}>
          <Link href="/" style={{
            color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.85rem',
            padding: '0.4rem 0.9rem', borderRadius: 6, transition: 'color 0.2s', fontWeight: 500,
          }}>Upload</Link>
          <Link href="/about" style={{
            color: 'var(--text)', textDecoration: 'none', fontSize: '0.85rem',
            padding: '0.4rem 0.9rem', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', fontWeight: 500,
          }}>About</Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '4rem 1.5rem', animation: 'fadeUp 0.7s ease forwards' }}>

        {/* Hero */}
        <div style={{ marginBottom: '4rem' }}>
          <span className="pill" style={{ marginBottom: '1.25rem', display: 'inline-block' }}>✦ About</span>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem',
          }}>
            Research, made{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--text) 0%, var(--accent-2) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>listenable.</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 520 }}>
            Listenify converts dense PDF documents — research papers, whitepapers, textbooks —
            into engaging podcast-style conversations between a host and a domain expert.
            Real dialogue. Real depth. Audio you can actually learn from.
          </p>
        </div>

        {/* Features grid */}
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.5rem' }}>
            Features
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="glass" style={{ borderRadius: 12, padding: '1.25rem', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{f.icon}</div>
                <p style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{f.title}</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Built with
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STACK.map(t => (
              <span key={t} className="pill">{t}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <Link href="/" className="btn-accent" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Try Listenify →
          </Link>
        </div>
      </div>
    </div>
  )
}

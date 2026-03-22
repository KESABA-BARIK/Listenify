'use client'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { useScrollReveal } from '@/lib/useScrollReveal'

const FEATURES = [
  { icon: '📍', title: '8 languages',      desc: 'Tamil, Hindi, Spanish, French, German, Arabic, Telugu, English.' },
  { icon: '⚡', title: 'Debate mode',       desc: 'Host probes limitations, challenges assumptions, plays devil\'s advocate.' },
  { icon: '🎯', title: 'Difficulty dial',   desc: 'Plain introductions to expert-level technical discussions.' },
  { icon: '🗂', title: 'Chapter markers',   desc: 'AI-generated titles from your content. Jump to any section.' },
  { icon: '📋', title: 'Show notes',        desc: 'Key terms defined. Main findings summarised.' },
  { icon: '📝', title: 'Full transcript',   desc: 'Speaker-labelled, downloadable as plain text.' },
]

export default function About() {
  const heroRef    = useScrollReveal({ delay: 0 })
  const storyRef   = useScrollReveal({ delay: 0 })
  const featRef    = useScrollReveal({ delay: 0 })
  const stackRef   = useScrollReveal({ delay: 0 })
  const ctaRef     = useScrollReveal({ delay: 0 })
  const feat0      = useScrollReveal({ delay: 0 })
  const feat1      = useScrollReveal({ delay: 50 })
  const feat2      = useScrollReveal({ delay: 100 })
  const feat3      = useScrollReveal({ delay: 30 })
  const feat4      = useScrollReveal({ delay: 80 })
  const feat5      = useScrollReveal({ delay: 130 })
  const featRefs   = [feat0, feat1, feat2, feat3, feat4, feat5]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--body-bg)' }}>

      <div className="hero">
        <Nav />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '60px 24px 72px' }}>
          <p className="section-label" style={{ color: 'var(--hero-text-3)', marginBottom: 14 }}>About</p>
          <h1 className="display" style={{ maxWidth: 480, marginBottom: 16 }}>
            Research,<br /><em>made listenable.</em>
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--hero-text-2)', lineHeight: 1.75, maxWidth: 420 }}>
            Listenify converts dense PDFs into structured podcast conversations.
            Not text-to-speech — a host who asks questions and an expert who explains.
          </p>
        </div>
      </div>

      <div className="section-fade" />

      <div style={{ background: 'var(--body-bg)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px', display: 'flex', flexDirection: 'column', gap: 56 }}>

          {/* Founder note — human touch */}
          <div ref={storyRef} className="reveal" style={{
            borderLeft: '3px solid var(--accent-border)',
            paddingLeft: 20,
          }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Why this exists</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--body-text)', lineHeight: 1.7, marginBottom: 12 }}>
              "I kept skimming papers instead of actually reading them. I wanted to understand research — not just extract quotes from it."
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--body-text-2)', lineHeight: 1.7 }}>
              Listenify started as a side project to make research more accessible.
              The goal isn't to replace reading — it's to give you a first pass that actually sticks.
              A 15-minute podcast conversation before you dive into the full paper changes how much you retain.
            </p>
          </div>

          {/* Features grid */}
          <div ref={featRef} className="reveal">
            <p className="section-label" style={{ marginBottom: 12 }}>Features</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} ref={featRefs[i]} className="reveal feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 15 }}>{f.icon}</span>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--body-text)' }}>{f.title}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--body-text-3)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div ref={stackRef} className="reveal">
            <p className="section-label" style={{ marginBottom: 12 }}>Built with</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['FastAPI', 'Groq / LLaMA 3.1', 'Edge TTS', 'PyMuPDF', 'Redis', 'Next.js'].map(t => (
                <span key={t} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, padding: '3px 8px',
                  border: '1px solid var(--body-border)', borderRadius: 'var(--r-sm)',
                  color: 'var(--body-text-2)', background: 'var(--body-surface)',
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div ref={ctaRef} className="reveal" style={{ borderTop: '1px solid var(--body-border)', paddingTop: 28 }}>
            <Link href="/" className="btn btn-primary">Start converting →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

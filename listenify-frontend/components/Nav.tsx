'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Nav is always dark — no light prop, no dual personality.
// Scroll-shadow is handled by page.tsx adding .scrolled via JS.
export default function Nav() {
  const path = usePathname()

  return (
    <header className="nav">
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
        {/* Logo mark — play button in a warm-dark square */}
        <div style={{
          width: 28, height: 28,
          background: 'rgba(37,99,235,0.12)',
          border: '1px solid rgba(37,99,235,0.28)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 3L9 6L4.5 9V3Z" fill="var(--accent)" />
          </svg>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 15, color: 'var(--text-1)',
          letterSpacing: '-0.02em',
        }}>
          Listenify
        </span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {[
          { href: '/',      label: 'Upload' },
          { href: '/about', label: 'About' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
            padding: '5px 10px', borderRadius: 5,
            textDecoration: 'none',
            color: path === href ? 'var(--text-1)' : 'var(--text-3)',
            background: path === href ? 'rgba(255,255,255,0.07)' : 'transparent',
            transition: 'all 120ms',
            letterSpacing: '-0.01em',
          }}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav({ light = false }: { light?: boolean }) {
  const path = usePathname()
  const textColor  = light ? 'var(--body-text)'   : 'var(--hero-text)'
  const mutedColor = light ? 'var(--body-text-3)'  : 'var(--hero-text-3)'
  const hoverBg    = light ? 'var(--body-border)'  : 'rgba(255,255,255,0.07)'

  return (
    <header className={light ? 'nav nav-light' : 'nav'}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26,
          background: light ? 'var(--accent-light)' : 'rgba(37,99,235,0.15)',
          border: `1px solid ${light ? 'var(--accent-border)' : 'rgba(37,99,235,0.3)'}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="var(--accent)" strokeWidth="1.2"/>
            <path d="M5 4.5L9 6.5L5 8.5V4.5Z" fill="var(--accent)"/>
          </svg>
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600,
          fontSize: 15, color: textColor, letterSpacing: '-0.01em',
        }}>Listenify</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {[{ href: '/', label: 'Upload' }, { href: '/about', label: 'About' }].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            padding: '5px 10px', borderRadius: 6,
            textDecoration: 'none',
            color: path === href ? textColor : mutedColor,
            background: path === href ? hoverBg : 'transparent',
            transition: 'all 120ms',
          }}>{label}</Link>
        ))}
      </div>
    </header>
  )
}

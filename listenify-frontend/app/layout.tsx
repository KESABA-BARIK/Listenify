import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Listenify — PDFs as Podcasts',
  description: 'Turn any research paper or document into an engaging podcast conversation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}

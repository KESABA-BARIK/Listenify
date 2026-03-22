import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Listenify — Research papers as podcasts',
  description: 'Upload any PDF. Get a structured podcast conversation with chapters, show notes, and transcript.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}

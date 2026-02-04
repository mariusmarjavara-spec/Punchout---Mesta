import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Punchout - Feltlogg',
  description: 'Voice-first dagslogg for feltarbeidere',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="no">
      <body className={`font-sans antialiased`}>
        {/* Motor må lastes FØR React UI */}
        <Script src="/motor.js" strategy="beforeInteractive" />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

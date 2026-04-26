import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Fraunces, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const _fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const _notoSansKR = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto-sans-kr" });

export const metadata: Metadata = {
  title: 'KFinLegal - AI Legal Guard',
  description: '한국 금융계약 약관의 AI 기반 취약점 분석 시스템',
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
    <html lang="ko" className="bg-background">
      <body className={`${_geist.variable} ${_fraunces.variable} ${_notoSansKR.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

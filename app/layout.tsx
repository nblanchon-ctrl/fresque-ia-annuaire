'use client'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Annuaire â€” Fresque de l&apos;IA</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#534AB7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Fresque IA" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }` }} />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

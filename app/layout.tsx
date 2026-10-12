'use client'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'
import { PWARegister, PWAInstallBanner } from '@/app/components/PWARegister'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Fresque de l&apos;IA — Animateurs</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#534AB7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fresque IA" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#534AB7" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96.png" />
        <meta name="description" content="Espace animateurs de la Fresque de l'IA" />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <PWARegister />
          <PWAInstallBanner />
        </LanguageProvider>
      </body>
    </html>
  )
}

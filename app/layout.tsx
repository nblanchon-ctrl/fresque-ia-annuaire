'use client'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'
import { PWAInstallBanner } from '@/app/components/PWARegister'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Fresque de l&apos;IA — Animateurs</title>

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#534AB7" />

        {/* iOS / Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fresque IA" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />

        {/* Android / Windows */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#534AB7" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96.png" />

        {/* OG */}
        <meta name="description" content="Espace animateurs de la Fresque de l'IA — formations, annuaire, CRM" />
        <meta property="og:title" content="Fresque de l'IA — Animateurs" />
        <meta property="og:description" content="Espace animateurs de la Fresque de l'IA" />
        <meta property="og:image" content="/icons/icon-512.png" />
        <meta property="og:type" content="website" />
      </head>
      <body>
        {/* Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('SW enregistré:', reg.scope) })
                .catch(function(err) { console.warn('SW echec:', err) })
            })
          }
        `}} />
        <LanguageProvider>
          {children}
          <PWAInstallBanner />
        </LanguageProvider>
      </body>
    </html>
  )
}

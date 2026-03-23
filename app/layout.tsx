'use client'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Annuaire — Fresque de l&apos;IA</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

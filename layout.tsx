'use client'
import './globals.css'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Annuaire — Fresque de l&apos;IA</title>
      </head>
      <body>
        <nav>
          <Link href="/" className="nav-logo">Fresque de l&apos;IA</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Annuaire</Link>
            {user && <Link href="/dashboard" className="nav-link">Mon profil</Link>}
          </div>
          <div className="nav-right">
            {user ? (
              <button className="btn btn-sm" onClick={handleLogout}>Se déconnecter</button>
            ) : (
              <>
                <Link href="/login" className="btn btn-sm">Se connecter</Link>
                <Link href="/register" className="btn btn-sm btn-primary">S&apos;inscrire</Link>
              </>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

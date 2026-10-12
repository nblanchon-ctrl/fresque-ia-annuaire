'use client'
import { useEffect, useState } from 'react'

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('SW registered:', reg.scope))
          .catch((err) => console.warn('SW registration failed:', err))
      })
    }
  }, [])
  return null
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 999,
      background: 'white', borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(83,74,183,0.25)',
      border: '1.5px solid #EEEDFE',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <img src="/icons/icon-72.png" alt="Fresque IA" width={44} height={44} style={{ borderRadius: 10 }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>Installer l'application</div>
        <div style={{ fontSize: 12, color: '#888' }}>Accès rapide depuis votre écran d'accueil</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setShow(false)} style={{ padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: 8, background: 'white', color: '#888', fontSize: 12, cursor: 'pointer' }}>Plus tard</button>
        <button onClick={install} style={{ padding: '8px 14px', border: 'none', borderRadius: 8, background: '#534AB7', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Installer</button>
      </div>
    </div>
  )
}

'use client'

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F7F7', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Pas de connexion</h1>
      <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, maxWidth: 320, marginBottom: 24 }}>
        Vous êtes hors ligne. Les pages que vous avez visitées récemment sont disponibles en cache.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '12px 24px', background: '#534AB7', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
      >
        Réessayer
      </button>
    </div>
  )
}

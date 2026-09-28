// lib/sendNotification.ts
// Appelez cette fonction après chaque création (veille, agenda, CRM)

export async function sendNotification({
  type,
  titre,
  contenu,
  lien,
}: {
  type: 'veille' | 'agenda' | 'crm'
  titre: string
  contenu?: string
  lien?: string
}) {
  try {
    // 1. Enregistrer en base
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, titre, contenu, lien }),
    })

    // 2. Notification navigateur (si permission accordée)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const icon = type === 'veille' ? '📡' : type === 'agenda' ? '📅' : '🤝'
      const section = type === 'veille' ? 'Veille IA' : type === 'agenda' ? 'Agenda' : 'CRM'
      new Notification(`${icon} ${section} — ${titre}`, {
        body: contenu || '',
        icon: '/favicon.ico',
      })
    }
  } catch (e) {
    console.error('Notification error:', e)
  }
}

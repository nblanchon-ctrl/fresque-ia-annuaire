import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
}

// POST — créer une notification + notification navigateur via Notification API
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { type, titre, contenu, lien } = await req.json()
    if (!type || !titre) return NextResponse.json({ error: 'type et titre requis' }, { status: 400 })

    const { data: notif, error } = await supabase
      .from('notifications')
      .insert({ type, titre, contenu: contenu || null, lien: lien || null, created_by: user.id })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, notif })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

// GET — compteurs de notifications non lues par type
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ veille: 0, agenda: 0, crm: 0 })

    const [{ data: all }, { data: lues }] = await Promise.all([
      supabase.from('notifications').select('id, type'),
      supabase.from('notification_lectures').select('notification_id').eq('animateur_id', user.id),
    ])

    const luesIds = new Set((lues || []).map(l => l.notification_id))
    const nonLues = (all || []).filter(n => !luesIds.has(n.id))

    return NextResponse.json({
      veille: nonLues.filter(n => n.type === 'veille').length,
      agenda: nonLues.filter(n => n.type === 'agenda').length,
      crm:    nonLues.filter(n => n.type === 'crm').length,
    })
  } catch {
    return NextResponse.json({ veille: 0, agenda: 0, crm: 0 })
  }
}

// PATCH — marquer un type comme lu
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { type } = await req.json()
    const { data: lues } = await supabase.from('notification_lectures').select('notification_id').eq('animateur_id', user.id)
    const luesIds = new Set((lues || []).map(l => l.notification_id))
    const { data: notifs } = await supabase.from('notifications').select('id').eq('type', type)
    const nonLues = (notifs || []).filter(n => !luesIds.has(n.id))

    if (nonLues.length > 0) {
      await supabase.from('notification_lectures').insert(
        nonLues.map(n => ({ notification_id: n.id, animateur_id: user.id }))
      )
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

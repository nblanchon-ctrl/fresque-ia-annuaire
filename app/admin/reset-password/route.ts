import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json()

    if (typeof userId !== 'string' || typeof newPassword !== 'string' || !userId) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min.).' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Session requise.' }, { status: 401 })
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Configuration serveur incomplète : clé service_role manquante.' }, { status: 503 })
    // Client avec la clé service_role (côté serveur uniquement)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Session invalide ou expirée.' }, { status: 401 })
    // Vérifier que le demandeur est bien admin
    const { data: requester } = await supabaseAdmin
      .from('animateurs')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!requester?.is_admin) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    // Mettre à jour le mot de passe
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

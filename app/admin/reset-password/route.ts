import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword, requesterId } = await req.json()

    if (!userId || !newPassword || !requesterId) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min.).' }, { status: 400 })
    }

    // Client avec la clé service_role (côté serveur uniquement)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que le demandeur est bien admin
    const { data: requester } = await supabaseAdmin
      .from('animateurs')
      .select('is_admin')
      .eq('id', requesterId)
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

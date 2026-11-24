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

    // Vérifier le JWT utilisateur avec la clé publique du même projet.
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      const code = authError?.code || 'unknown'
      console.error('Password reset: auth verification failed', { code, status: authError?.status })
      return NextResponse.json({ error: `Vérification de session impossible (${code}, HTTP ${authError?.status || 401}).` }, { status: 401 })
    }
    // Vérifier que le demandeur est bien admin
    const { data: requester, error: roleError } = await supabaseAdmin
      .from('animateurs')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (roleError) {
      console.error('Password reset: role lookup failed', { code: roleError.code })
      return NextResponse.json({ error: `Vérification des droits impossible (${roleError.code}).` }, { status: 503 })
    }
    if (requester?.is_admin !== true) {
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

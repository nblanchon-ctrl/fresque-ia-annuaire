export interface Animateur {
  id: string
  nom: string
  titre?: string
  email?: string
  telephone?: string
  region?: string
  ville?: string
  bio?: string
  photo_url?: string
  competences: string[]
  badge_observateur: boolean
  badge_coanimateur: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

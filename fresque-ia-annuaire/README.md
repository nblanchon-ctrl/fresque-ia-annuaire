# Annuaire — Fresque de l'IA

Application web pour l'annuaire des animateurs de la Fresque de l'IA.

## Stack technique

- **Next.js 14** — framework web React
- **Supabase** — base de données PostgreSQL + authentification + stockage de fichiers
- **Vercel** — hébergement et déploiement automatique

---

## Déploiement pas-à-pas

### Étape 1 — Créer un compte Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un compte gratuit
2. Cliquer **New project** → donner un nom (ex: `fresque-ia-annuaire`)
3. Choisir un mot de passe de base de données (le conserver précieusement)
4. Choisir la région **West EU (Ireland)** ou **West EU (Frankfurt)** pour la proximité France
5. Attendre 2 minutes que le projet se crée

### Étape 2 — Initialiser la base de données

1. Dans Supabase, aller dans **SQL Editor** (menu de gauche)
2. Cliquer **New query**
3. Copier-coller tout le contenu du fichier `supabase/migrations/001_init.sql`
4. Cliquer **Run** (bouton vert)
5. Vérifier que le message "Success. No rows returned" apparaît

### Étape 3 — Récupérer les clés Supabase

1. Aller dans **Project Settings** → **API** (menu de gauche)
2. Copier les deux valeurs :
   - **Project URL** → ressemble à `https://abcdefgh.supabase.co`
   - **anon / public key** → longue chaîne de caractères

### Étape 4 — Mettre le code sur GitHub

1. Créer un compte sur [github.com](https://github.com) si ce n'est pas fait
2. Créer un **New repository** (bouton vert), le nommer `fresque-ia-annuaire`
3. Depuis votre terminal, dans le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE_NOM/fresque-ia-annuaire.git
   git push -u origin main
   ```

### Étape 5 — Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) et créer un compte (avec GitHub)
2. Cliquer **Add New Project**
3. Importer le repository `fresque-ia-annuaire`
4. Dans **Environment Variables**, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL` → votre URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → votre clé anon Supabase
5. Cliquer **Deploy** — l'app sera en ligne en 2 minutes
6. Vercel vous donne une URL comme `fresque-ia-annuaire.vercel.app`

### Étape 6 — Configurer l'URL dans Supabase

1. Dans Supabase → **Authentication** → **URL Configuration**
2. Ajouter votre URL Vercel dans **Site URL** : `https://fresque-ia-annuaire.vercel.app`
3. Ajouter dans **Redirect URLs** : `https://fresque-ia-annuaire.vercel.app/**`

### Étape 7 — Créer le premier compte admin

1. S'inscrire sur votre app via `/register`
2. Dans Supabase → **Table Editor** → table `animateurs`
3. Trouver votre ligne → mettre `is_admin` à `true`
4. Vous avez maintenant accès à la page `/admin`

---

## Développement local

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# Lancer en mode développement
npm run dev
# → http://localhost:3000
```

---

## Fonctionnalités

- **Annuaire public** — recherche par nom, région, compétence
- **Inscription / connexion** — chaque animateur crée son compte
- **Profil personnel** — modification du nom, titre, email, téléphone, région, ville, bio, photo, compétences
- **Page profil publique** — visible par tous
- **Administration** — gestion des comptes, attribution des droits admin

---

## Structure des fichiers

```
app/
  page.tsx          → Annuaire public
  layout.tsx        → Navigation globale
  login/page.tsx    → Connexion
  register/page.tsx → Inscription
  dashboard/page.tsx → Édition de son profil
  profile/[id]/page.tsx → Profil public d'un animateur
  admin/page.tsx    → Administration (admins uniquement)
lib/
  supabase.ts       → Client Supabase
  types.ts          → Types TypeScript
supabase/
  migrations/001_init.sql → Script SQL à exécuter dans Supabase
```

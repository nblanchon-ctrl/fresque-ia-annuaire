'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'fr' | 'en'

type Dict = { [key: string]: string }

export const translations: Record<Lang, Dict> = {
  fr: {
    // Commun
    'nav.directory': 'Annuaire',
    'nav.myProfile': 'Mon profil',
    'nav.admin': 'Admin',
    'nav.logout': 'Déconnexion',
    'nav.back': '←',
    'common.loading': 'Chargement…',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.saving': 'Sauvegarde…',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.confirm': 'Confirmer',
    'common.required': 'obligatoire',

    // Connexion / inscription
    'auth.brand': "Fresque de l'IA",
    'auth.login': 'Se connecter',
    'auth.register': 'Créer un compte',
    'auth.loginTab': 'Connexion',
    'auth.registerTab': 'Inscription',
    'auth.loginSubtitle': "Accédez à l'annuaire des animateurs.",
    'auth.registerSubtitle': "Rejoignez l'annuaire des animateurs.",
    'auth.fullName': 'Prénom et nom *',
    'auth.email': 'Email *',
    'auth.password': 'Mot de passe *',
    'auth.passwordMin': ' (8 car. min.)',
    'auth.submitLogin': 'Se connecter',
    'auth.submitRegister': 'Créer mon compte',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.loginError': 'Email ou mot de passe incorrect.',
    'auth.passwordTooShort': 'Mot de passe trop court (8 caractères min.).',
    'auth.checkEmail': 'Vérifiez votre email',
    'auth.confirmationSent': 'Un lien de confirmation a été envoyé à',
    'auth.backToLogin': 'Retour à la connexion',
    'auth.loginEspace': 'Se connecter à mon espace animateur',
    'auth.loginEspaceSubtitle': 'Accédez à votre espace personnel.',

    // Espace animateur (home)
    'espace.title': 'Mon espace animateur',
    'espace.welcome': 'Bonjour',
    'espace.subtitle': 'Que souhaitez-vous faire ?',
    'espace.directory': 'Annuaire des fresqueurs',
    'espace.directoryDesc': 'Retrouvez tous les animateurs, leurs profils et compétences.',
    'espace.agenda': 'Agenda de la communauté',
    'espace.agendaDesc': 'Événements, interventions et rencontres à venir.',
    'espace.mattermostDesc': "Chat de la communauté Fresque de l'IA.",
    'espace.drive': 'Drive partagé',
    'espace.driveDesc': 'Ressources documentaires et outils de la communauté.',
    'espace.cards': 'Référentiel des cartes',
    'espace.cardsDesc': 'Accédez au référentiel complet des cartes.',

    // Mot de passe oublié
    'forgot.title': 'Mot de passe oublié',
    'forgot.subtitle': 'Entrez votre email pour recevoir un lien de réinitialisation.',
    'forgot.send': 'Envoyer le lien',
    'forgot.sending': 'Envoi…',
    'forgot.sentTitle': 'Email envoyé',
    'forgot.sentBody': 'Un lien de réinitialisation a été envoyé à',
    'forgot.sentNote': 'Vérifiez vos spams si vous ne le recevez pas.',

    // Réinitialisation
    'reset.title': 'Nouveau mot de passe',
    'reset.subtitle': 'Choisissez un nouveau mot de passe.',
    'reset.newPassword': 'Nouveau mot de passe * (8 car. min.)',
    'reset.confirmPassword': 'Confirmer le mot de passe *',
    'reset.submit': 'Mettre à jour',
    'reset.mismatch': 'Les mots de passe ne correspondent pas.',
    'reset.tooShort': 'Le mot de passe doit faire au moins 8 caractères.',
    'reset.successTitle': 'Mot de passe mis à jour',
    'reset.successBody': 'Votre mot de passe a été modifié avec succès.',
    'reset.checking': 'Vérification du lien en cours…',

    // Annuaire
    'directory.title': 'Annuaire des animateurs',
    'directory.connectedAs': 'Connecté en tant que',
    'directory.resources': 'Ressources de la communauté',
    'directory.agendaLink': 'Agenda des interventions',
    'directory.mattermost': 'Mattermost',
    'directory.drive': 'Drive partagé',
    'directory.cardsRef': 'Référentiel des cartes',
    'directory.installApp': "Installer l'app",
    'directory.appInstalled': 'App installée',
    'directory.addAnimator': 'Ajouter un animateur',
    'directory.newAnimator': 'Nouvel animateur',
    'directory.searchPlaceholder': 'Rechercher par nom, ville, compétence…',
    'directory.allRegions': 'Toutes les régions',
    'directory.allSkills': 'Toutes les compétences',
    'directory.animatorCount': 'animateur',
    'directory.animatorCountPlural': 'animateurs',
    'directory.regions': 'régions',
    'directory.skills': 'compétences',
    'directory.noResults': 'Aucun animateur trouvé.',
    'directory.confirmDelete': 'Supprimer {name} de l\'annuaire ?',
    'directory.name': 'Nom *',
    'directory.title2': 'Titre',
    'directory.email': 'Email',
    'directory.phone': 'Téléphone',
    'directory.region': 'Région',
    'directory.city': 'Ville',
    'directory.skillsLabel': 'Compétences (séparées par des virgules)',
    'directory.bio': 'Bio',

    // Dashboard
    'dashboard.title': 'Mon profil',
    'dashboard.updateSuccess': 'Profil mis à jour avec succès.',
    'dashboard.updateError': 'Erreur lors de la sauvegarde.',
    'dashboard.photo': 'Photo de profil',
    'dashboard.photoHint': 'JPG ou PNG, 2 Mo max.',
    'dashboard.changePhoto': 'Changer la photo',
    'dashboard.uploading': 'Envoi…',
    'dashboard.fullName': 'Prénom et nom *',
    'dashboard.titleRole': 'Titre / rôle',
    'dashboard.publicEmail': 'Email public',
    'dashboard.phone': 'Téléphone',
    'dashboard.region': 'Région',
    'dashboard.select': 'Sélectionner…',
    'dashboard.city': 'Ville',
    'dashboard.bio': 'Bio',
    'dashboard.bioPlaceholder': 'Quelques mots sur vous, votre expérience, vos disponibilités…',
    'dashboard.myLevels': 'Mes niveaux',
    'dashboard.levelsHint': 'Cochez les étapes que vous avez franchies.',
    'dashboard.skills': 'Compétences',
    'dashboard.addSkill': 'Ajouter une compétence…',
    'dashboard.suggestions': 'Suggestions :',
    'dashboard.viewPublicProfile': 'Voir mon profil public',

    // Badges
    'badge.observer': 'Observateur',
    'badge.observerDesc': 'A observé une fresque',
    'badge.coanimator': 'Co-animateur',
    'badge.coanimatorDesc': 'A co-animé une fresque',

    // Profil public
    'profile.notFound': 'Animateur introuvable.',
    'profile.backToDirectory': "Retour à l'annuaire",
    'profile.editMyProfile': 'Modifier mon profil',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.location': 'Localisation',
    'profile.memberSince': 'Membre depuis',
    'profile.levels': 'Niveaux',
    'profile.skills': 'Compétences',
    'profile.admin': 'Admin',

    // Admin
    'admin.title': 'Administration',
    'admin.animators': 'animateurs',
    'admin.admins': 'admins',
    'admin.emailsAvailable': 'emails renseignés',
    'admin.exports': 'Exports',
    'admin.exportsHint': 'Téléchargez les données au format CSV, lisible dans Excel ou Google Sheets.',
    'admin.downloadEmails': 'Télécharger les emails',
    'admin.downloadAll': 'Télécharger toutes les fiches',
    'admin.colName': 'Nom',
    'admin.colEmail': 'Email',
    'admin.colRegion': 'Région',
    'admin.colJoined': 'Inscription',
    'admin.colAdmin': 'Admin',
    'admin.editingTitle': 'Modifier la fiche de',
    'admin.confirmDelete': 'Supprimer cet animateur ? Cette action est irréversible.',

    // Agenda
    'agenda.title': 'Agenda des interventions',
    'agenda.subtitle': "Fresques de l'IA planifiées par la communauté",
    'agenda.declare': 'Déclarer une intervention',
    'agenda.editIntervention': "Modifier l'intervention",
    'agenda.available': 'Places disponibles',
    'agenda.full': 'Complet',
    'agenda.today': "Aujourd'hui",
    'agenda.thisDay': '+ Intervention ce jour',
    'agenda.noIntervention': 'Aucune intervention prévue ce jour.',
    'agenda.by': 'Par',
    'agenda.candidate': 'Candidater',
    'agenda.candidateSent': 'Candidature envoyée',
    'agenda.organizedBy': 'Organisé par',
    'agenda.search': 'Recherche',
    'agenda.observer': 'observateur',
    'agenda.observerPlural': 'observateurs',
    'agenda.coanimator': 'co-animateur',
    'agenda.coanimatorPlural': 'co-animateurs',
    'agenda.noNeedDeclared': 'Aucun besoin déclaré',
    'agenda.participants': 'Participants',
    'agenda.addManually': '+ Ajouter manuellement',
    'agenda.manualName': 'Prénom et nom',
    'agenda.role': 'Rôle',
    'agenda.noParticipants': "Aucun participant pour l'instant.",
    'agenda.accept': 'Accepter',
    'agenda.reject': 'Refuser',
    'agenda.pending': 'En attente',
    'agenda.accepted': 'Accepté',
    'agenda.rejected': 'Refusé',
    'agenda.addedManually': '(ajouté manuellement)',
    'agenda.candidateModalTitle': 'Candidater à cette intervention',
    'agenda.candidateAs': 'Je souhaite participer en tant que :',
    'agenda.confirmCandidacy': 'Confirmer ma candidature',
    'agenda.place': 'Lieu *',
    'agenda.placePlaceholder': 'Ex: Paris 8e, Salle de conf. A',
    'agenda.date': 'Date *',
    'agenda.time': 'Heure *',
    'agenda.company': 'Entreprise / Organisation',
    'agenda.companyPlaceholder': "Nom de l'entreprise",
    'agenda.nbParticipants': 'Nb de participants',
    'agenda.iSearch': 'Je recherche',
    'agenda.observersNeeded': 'Des observateurs',
    'agenda.nbObservers': "Nombre d'observateurs souhaités",
    'agenda.coanimatorsNeeded': 'Un ou des co-animateurs',
    'agenda.nbCoanimators': 'Nombre de co-animateurs souhaités',
    'agenda.declareSubmit': 'Déclarer',
    'agenda.editSubmit': 'Modifier',
    'agenda.saving': 'Enregistrement…',
    'agenda.confirmDeleteIntervention': 'Supprimer cette intervention ?',
  },
  en: {
    'nav.directory': 'Directory',
    'nav.myProfile': 'My profile',
    'nav.admin': 'Admin',
    'nav.logout': 'Log out',
    'nav.back': '←',
    'common.loading': 'Loading…',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.confirm': 'Confirm',
    'common.required': 'required',

    'auth.brand': "Fresque de l'IA",
    'auth.login': 'Log in',
    'auth.register': 'Create an account',
    'auth.loginTab': 'Log in',
    'auth.registerTab': 'Sign up',
    'auth.loginSubtitle': 'Access the facilitators directory.',
    'auth.registerSubtitle': 'Join the facilitators directory.',
    'auth.fullName': 'First and last name *',
    'auth.email': 'Email *',
    'auth.password': 'Password *',
    'auth.passwordMin': ' (min. 8 characters)',
    'auth.submitLogin': 'Log in',
    'auth.submitRegister': 'Create my account',
    'auth.forgotPassword': 'Forgot password?',
    'auth.loginError': 'Incorrect email or password.',
    'auth.passwordTooShort': 'Password too short (min. 8 characters).',
    'auth.checkEmail': 'Check your email',
    'auth.confirmationSent': 'A confirmation link has been sent to',
    'auth.backToLogin': 'Back to login',
    'auth.loginEspace': 'Log in to my facilitator space',
    'auth.loginEspaceSubtitle': 'Access your personal space.',

    'espace.title': 'My facilitator space',
    'espace.welcome': 'Hello',
    'espace.subtitle': 'What would you like to do?',
    'espace.directory': 'Facilitators directory',
    'espace.directoryDesc': 'Find all facilitators, their profiles and skills.',
    'espace.agenda': 'Community calendar',
    'espace.agendaDesc': 'Upcoming events, workshops and meetups.',
    'espace.mattermostDesc': 'Fresque de l'IA community chat.',
    'espace.drive': 'Shared drive',
    'espace.driveDesc': 'Community resources and tools.',
    'espace.cards': 'Card reference',
    'espace.cardsDesc': 'Access the complete card reference.',

    'forgot.title': 'Forgot password',
    'forgot.subtitle': 'Enter your email to receive a reset link.',
    'forgot.send': 'Send link',
    'forgot.sending': 'Sending…',
    'forgot.sentTitle': 'Email sent',
    'forgot.sentBody': 'A reset link has been sent to',
    'forgot.sentNote': "Check your spam folder if you don't receive it.",

    'reset.title': 'New password',
    'reset.subtitle': 'Choose a new password.',
    'reset.newPassword': 'New password * (min. 8 characters)',
    'reset.confirmPassword': 'Confirm password *',
    'reset.submit': 'Update',
    'reset.mismatch': 'Passwords do not match.',
    'reset.tooShort': 'Password must be at least 8 characters.',
    'reset.successTitle': 'Password updated',
    'reset.successBody': 'Your password has been successfully changed.',
    'reset.checking': 'Verifying link…',

    'directory.title': 'Facilitators directory',
    'directory.connectedAs': 'Connected as',
    'directory.resources': 'Community resources',
    'directory.agendaLink': 'Events calendar',
    'directory.mattermost': 'Mattermost',
    'directory.drive': 'Shared drive',
    'directory.cardsRef': 'Card reference',
    'directory.installApp': 'Install app',
    'directory.appInstalled': 'App installed',
    'directory.addAnimator': 'Add a facilitator',
    'directory.newAnimator': 'New facilitator',
    'directory.searchPlaceholder': 'Search by name, city, skill…',
    'directory.allRegions': 'All regions',
    'directory.allSkills': 'All skills',
    'directory.animatorCount': 'facilitator',
    'directory.animatorCountPlural': 'facilitators',
    'directory.regions': 'regions',
    'directory.skills': 'skills',
    'directory.noResults': 'No facilitator found.',
    'directory.confirmDelete': 'Remove {name} from the directory?',
    'directory.name': 'Name *',
    'directory.title2': 'Title',
    'directory.email': 'Email',
    'directory.phone': 'Phone',
    'directory.region': 'Region',
    'directory.city': 'City',
    'directory.skillsLabel': 'Skills (comma separated)',
    'directory.bio': 'Bio',

    'dashboard.title': 'My profile',
    'dashboard.updateSuccess': 'Profile updated successfully.',
    'dashboard.updateError': 'Error while saving.',
    'dashboard.photo': 'Profile photo',
    'dashboard.photoHint': 'JPG or PNG, max 2 MB.',
    'dashboard.changePhoto': 'Change photo',
    'dashboard.uploading': 'Uploading…',
    'dashboard.fullName': 'First and last name *',
    'dashboard.titleRole': 'Title / role',
    'dashboard.publicEmail': 'Public email',
    'dashboard.phone': 'Phone',
    'dashboard.region': 'Region',
    'dashboard.select': 'Select…',
    'dashboard.city': 'City',
    'dashboard.bio': 'Bio',
    'dashboard.bioPlaceholder': 'A few words about you, your experience, your availability…',
    'dashboard.myLevels': 'My levels',
    'dashboard.levelsHint': 'Check the steps you have completed.',
    'dashboard.skills': 'Skills',
    'dashboard.addSkill': 'Add a skill…',
    'dashboard.suggestions': 'Suggestions:',
    'dashboard.viewPublicProfile': 'View my public profile',

    'badge.observer': 'Observer',
    'badge.observerDesc': 'Has observed a workshop',
    'badge.coanimator': 'Co-facilitator',
    'badge.coanimatorDesc': 'Has co-facilitated a workshop',

    'profile.notFound': 'Facilitator not found.',
    'profile.backToDirectory': 'Back to directory',
    'profile.editMyProfile': 'Edit my profile',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.location': 'Location',
    'profile.memberSince': 'Member since',
    'profile.levels': 'Levels',
    'profile.skills': 'Skills',
    'profile.admin': 'Admin',

    'admin.title': 'Administration',
    'admin.animators': 'facilitators',
    'admin.admins': 'admins',
    'admin.emailsAvailable': 'emails available',
    'admin.exports': 'Exports',
    'admin.exportsHint': 'Download data as CSV, readable in Excel or Google Sheets.',
    'admin.downloadEmails': 'Download emails',
    'admin.downloadAll': 'Download all profiles',
    'admin.colName': 'Name',
    'admin.colEmail': 'Email',
    'admin.colRegion': 'Region',
    'admin.colJoined': 'Joined',
    'admin.colAdmin': 'Admin',
    'admin.editingTitle': 'Edit profile of',
    'admin.confirmDelete': 'Delete this facilitator? This action cannot be undone.',

    'agenda.title': 'Events calendar',
    'agenda.subtitle': "AI workshops planned by the community",
    'agenda.declare': 'Declare an event',
    'agenda.editIntervention': 'Edit event',
    'agenda.available': 'Spots available',
    'agenda.full': 'Full',
    'agenda.today': 'Today',
    'agenda.thisDay': '+ Event this day',
    'agenda.noIntervention': 'No event scheduled this day.',
    'agenda.by': 'By',
    'agenda.candidate': 'Apply',
    'agenda.candidateSent': 'Application sent',
    'agenda.organizedBy': 'Organized by',
    'agenda.search': 'Looking for',
    'agenda.observer': 'observer',
    'agenda.observerPlural': 'observers',
    'agenda.coanimator': 'co-facilitator',
    'agenda.coanimatorPlural': 'co-facilitators',
    'agenda.noNeedDeclared': 'No need declared',
    'agenda.participants': 'Participants',
    'agenda.addManually': '+ Add manually',
    'agenda.manualName': 'First and last name',
    'agenda.role': 'Role',
    'agenda.noParticipants': 'No participants yet.',
    'agenda.accept': 'Accept',
    'agenda.reject': 'Reject',
    'agenda.pending': 'Pending',
    'agenda.accepted': 'Accepted',
    'agenda.rejected': 'Rejected',
    'agenda.addedManually': '(added manually)',
    'agenda.candidateModalTitle': 'Apply for this event',
    'agenda.candidateAs': 'I would like to participate as:',
    'agenda.confirmCandidacy': 'Confirm my application',
    'agenda.place': 'Location *',
    'agenda.placePlaceholder': 'E.g. Paris 8th, Meeting room A',
    'agenda.date': 'Date *',
    'agenda.time': 'Time *',
    'agenda.company': 'Company / Organization',
    'agenda.companyPlaceholder': 'Company name',
    'agenda.nbParticipants': 'Number of participants',
    'agenda.iSearch': 'Looking for',
    'agenda.observersNeeded': 'Observers',
    'agenda.nbObservers': 'Number of observers wanted',
    'agenda.coanimatorsNeeded': 'One or more co-facilitators',
    'agenda.nbCoanimators': 'Number of co-facilitators wanted',
    'agenda.declareSubmit': 'Declare',
    'agenda.editSubmit': 'Update',
    'agenda.saving': 'Saving…',
    'agenda.confirmDeleteIntervention': 'Delete this event?',
  },
}

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string>) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null
    if (stored === 'fr' || stored === 'en') setLangState(stored)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== 'undefined') window.localStorage.setItem('lang', l)
  }

  const t = (key: string, vars?: Record<string, string>) => {
    let str = translations[lang][key] ?? translations.fr[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    }
    return str
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LangContext)
}

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage()
  return (
    <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 20, padding: 2, gap: 2 }}>
      {(['fr', 'en'] as const).map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            padding: '4px 10px', borderRadius: 18, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: lang === l ? 'var(--accent)' : 'transparent',
            color: lang === l ? 'white' : 'var(--text2)',
            transition: 'all .15s'
          }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

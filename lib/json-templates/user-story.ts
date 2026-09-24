/*
path :           lib/json-templates/user-story.ts
tag :            ["user-story", "import", "template", "json"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de user stories.
                 Utilisé par ImportJsonDialog pour pré-remplir la textarea. Le format
                 est EXACTEMENT celui attendu par bulkImportUserStoriesSchema
                 (projectId est fourni par le contexte de la page).

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       UserStory = [
                   "@/app/actions/user-story/bulkImportUserStories.ts",
                   "@/app/actions/user-story/createUserStory.ts",
                   "@/app/actions/user-story/hardDeleteUserStory.ts",
                   "@/app/actions/user-story/restoreUserStory.ts",
                   "@/app/actions/user-story/softDeleteUserStory.ts",
                   "@/app/actions/user-story/updateUserStory.ts",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/trash/page.tsx",
                   "@/components/user-story/DeleteUserStoryButton.tsx",
                   "@/components/user-story/HardDeleteUserStoryButton.tsx",
                   "@/components/user-story/RestoreUserStoryButton.tsx",
                   "@/components/user-story/UserStoryCard.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                   "@/components/user-story/UserStoryMiniCard.tsx",
                   "@/components/user-story/UserStoryPriorityBadge.tsx",
                   "@/components/user-story/UserStoryStatusBadge.tsx",
                   "@/components/user-story/UserStoryTree.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/user-story.ts",
                   "@/lib/user-story/json.ts",
                   "@/lib/validations/user-story.ts",
                 ]
relatedFiles:    ["@/lib/validations/user-story.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["USER_STORY_JSON_TEMPLATE"]
useBy:           ["@/app/back-studio/scrum/[slug]/backlog/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des user stories en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const USER_STORY_JSON_TEMPLATE = `[
  {
    "title": "Authentification",
    "slug": "auth",
    "asA": "visiteur",
    "iWant": "un système d'authentification complet",
    "soThat": "protéger l'accès à l'atelier",
    "status": "backlog",
    "priority": 2,
    "accent": "violet",
    "acceptanceInput": "L'inscription crée un compte en base\\nLe login génère une session valide\\nLa déconnexion détruit la session"
  },
  {
    "title": "Gestion du backlog",
    "slug": "backlog",
    "asA": "développeur",
    "iWant": "structurer mes idées en Epics et Stories",
    "soThat": "garder une vue claire du travail",
    "status": "backlog",
    "priority": 3,
    "accent": "amber"
  },
  {
    "parentSlug": "auth",
    "title": "Login par email / mot de passe",
    "slug": "auth-login-email",
    "asA": "visiteur",
    "iWant": "me connecter avec mon email et un mot de passe",
    "soThat": "accéder à mon espace personnel",
    "status": "ready",
    "priority": 1,
    "storyPoints": 3,
    "accent": "violet",
    "acceptanceInput": "Un email valide est requis\\nLe mot de passe fait 8 caractères minimum\\nUn message d'erreur clair s'affiche en cas d'échec",
    "dodInput": "Tests unitaires\\nGestion des erreurs réseau\\nAccessibilité clavier"
  },
  {
    "parentSlug": "auth",
    "title": "Inscription avec photo de profil",
    "slug": "auth-register-avatar",
    "asA": "visiteur",
    "iWant": "créer un compte avec une photo",
    "soThat": "personnaliser mon profil dès l'inscription",
    "status": "backlog",
    "priority": 3,
    "storyPoints": 5,
    "accent": "cyan",
    "acceptanceInput": "L'image est optionnelle (2 Mo max)\\nUn aperçu s'affiche avant validation\\nLes initiales servent de fallback"
  },
  {
    "parentSlug": "backlog",
    "title": "Création d'un Epic",
    "slug": "backlog-create-epic",
    "asA": "développeur",
    "iWant": "créer un Epic racine",
    "soThat": "regrouper des stories autour d'un thème",
    "status": "done",
    "priority": 4,
    "storyPoints": 2,
    "accent": "emerald"
  },
  {
    "parentSlug": "backlog",
    "title": "Réordonnancement par glisser-déposer",
    "slug": "backlog-drag-drop-reorder",
    "asA": "développeur",
    "iWant": "réordonner les stories par glisser-déposer",
    "soThat": "ajuster la priorité sans tout recréer",
    "status": "backlog",
    "priority": 5,
    "storyPoints": 8,
    "accent": "rose",
    "dodInput": "Optimistic UI\\nRollback en cas d'échec\\nSupport clavier"
  }
]`;
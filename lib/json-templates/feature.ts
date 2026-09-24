/*
path :           lib/json-templates/feature.ts
tag :            ["feature", "import", "template", "json"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de
                 features. Utilisé par ImportJsonDialog pour pré-remplir la
                 textarea. Le format est EXACTEMENT celui attendu par
                 bulkImportFeaturesSchema (sans projectId — fourni par
                 le contexte de la page).

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Feature = [
                   "@/app/actions/feature/bulkImportFeatures.ts",
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/lib/json-templates/feature.ts",
                   "@/lib/validations/feature.ts",
                 ]
relatedFiles:    ["@/lib/validations/feature.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["FEATURE_JSON_TEMPLATE"]
useBy:           ["@/app/back-studio/scrum/[slug]/features/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des features en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const FEATURE_JSON_TEMPLATE = `[
  {
    "name": "Authentification email / mot de passe",
    "slug": "auth-email-password",
    "description": "Permettre à un visiteur de créer un compte et de se connecter avec email + mot de passe.",
    "module": "securite",
    "icon": "ShieldCheck",
    "accent": "violet"
  },
  {
    "name": "Gestion du backlog",
    "slug": "backlog-management",
    "description": "Créer, éditer, réordonner et hiérarchiser les user stories (Epics + Stories).",
    "module": "backlog",
    "icon": "ListChecks",
    "accent": "cyan"
  },
  {
    "name": "Export du contexte projet",
    "slug": "project-context-export",
    "description": "Générer un document JSON ou Markdown ré-importable de tout le projet.",
    "module": "dev",
    "icon": "FileJson",
    "accent": "emerald"
  }
]`;
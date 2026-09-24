/*
path :           lib/json-templates/project.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de
                 projets. Utilisé par ImportJsonDialog pour pré-remplir
                 la textarea. Le format est EXACTEMENT celui attendu par
                 bulkImportProjectsSchema.

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Dev = [
                   "@/lib/json-templates/project.ts",
                   "@/app/back-studio/scrum/page.tsx",
                 ]
relatedFiles:    ["@/lib/validations/project.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["PROJECT_JSON_TEMPLATE"]

userStories:     ["*auto-import-project-template"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const PROJECT_JSON_TEMPLATE = `[
  {
    "name": "Genesis",
    "slug": "genesis",
    "tagline": "L'atelier qui structure vos projets.",
    "description": "Plateforme de conception et de développement pour toute l'équipe projet.",
    "status": "wip"
  },
  {
    "name": "Site vitrine",
    "slug": "site-vitrine",
    "tagline": "Présenter l'entreprise en ligne.",
    "description": "Site vitrine 5 pages avec formulaire de contact et blog léger.",
    "status": "planned"
  }
]`;
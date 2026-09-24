/*
path :           lib/json-templates/persona.ts
tag :            ["persona", "import", "template", "json"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de personas.
                 Utilisé par ImportJsonDialog pour pré-remplir la textarea. Le
                 format est EXACTEMENT celui attendu par bulkImportPersonasSchema
                 (sans projectId — fourni par le contexte de la page).

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Persona = [
                   "@/app/actions/persona/bulkImportPersonas.ts",
                   "@/app/actions/persona/createPersona.ts",
                   "@/app/actions/persona/hardDeletePersona.ts",
                   "@/app/actions/persona/restorePersona.ts",
                   "@/app/actions/persona/softDeletePersona.ts",
                   "@/app/actions/persona/updatePersona.ts",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/trash/page.tsx",
                   "@/components/persona/DeletePersonaButton.tsx",
                   "@/components/persona/HardDeletePersonaButton.tsx",
                   "@/components/persona/PersonaCard.tsx",
                   "@/components/persona/PersonaForm.tsx",
                   "@/components/persona/RestorePersonaButton.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/persona.ts",
                   "@/lib/validations/persona.ts",
                 ]
relatedFiles:    ["@/lib/validations/persona.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["PERSONA_JSON_TEMPLATE"]
useBy:           ["@/app/back-studio/scrum/[slug]/personas/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des personas en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const PERSONA_JSON_TEMPLATE = `[
  {
    "name": "Chef de produit",
    "slug": "chef-de-produit",
    "value": "Décide vite, veut des résultats concrets mesurables.",
    "keywordsInput": "ROI, priorisation, roadmap, décision, clients",
    "icon": "Target",
    "accent": "violet"
  },
  {
    "name": "Développeur senior",
    "slug": "developpeur-senior",
    "value": "Autonome, veut du contexte clair avant de coder.",
    "keywordsInput": "autonomie, code, architecture, revue, dette",
    "icon": "Code",
    "accent": "cyan"
  },
  {
    "name": "Designer UX",
    "slug": "designer-ux",
    "value": "Pense parcours et émotion avant l'interface.",
    "keywordsInput": "parcours, accessibilité, prototypes, feedback",
    "icon": "Palette",
    "accent": "amber"
  },
  {
    "name": "Scrum Master",
    "slug": "scrum-master",
    "value": "Rythme l'équipe et lève les blocages avant qu'ils ne bloquent.",
    "keywordsInput": "rituels, facilitation, blocages, vélocité, coaching",
    "icon": "Compass",
    "accent": "emerald"
  },
  {
    "name": "QA / Testeur",
    "slug": "qa-testeur",
    "value": "Traque les angles morts que personne n'a vus venir.",
    "keywordsInput": "rigueur, edge cases, régression, automatisation",
    "icon": "Bug",
    "accent": "rose"
  },
  {
    "name": "CTO / Tech Lead",
    "slug": "cto-tech-lead",
    "value": "Décide technique, veut la vue d'ensemble sans le bruit.",
    "keywordsInput": "scalabilité, dette technique, mentorat, vision",
    "icon": "Briefcase",
    "accent": "blue"
  }
]`;
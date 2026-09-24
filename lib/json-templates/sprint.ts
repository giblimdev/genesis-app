/*
path :           lib/json-templates/sprint.ts
tag :            ["sprint", "import", "template", "json"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de sprints.
                 Utilisé par ImportJsonDialog pour pré-remplir la textarea. Le
                 format est EXACTEMENT celui attendu par bulkImportSprintsSchema
                 (projectId est fourni par le contexte de la page).

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Sprint = [
                   "@/app/actions/sprint/assignStoryToSprint.ts",
                   "@/app/actions/sprint/bulkImportSprints.ts",
                   "@/app/actions/sprint/changeSprintStatus.ts",
                   "@/app/actions/sprint/createSprint.ts",
                   "@/app/actions/sprint/hardDeleteSprint.ts",
                   "@/app/actions/sprint/reorderSprintStories.ts",
                   "@/app/actions/sprint/restoreSprint.ts",
                   "@/app/actions/sprint/softDeleteSprint.ts",
                   "@/app/actions/sprint/unassignStoryFromSprint.ts",
                   "@/app/actions/sprint/updateSprint.ts",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/[sprintSlug]/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/page.tsx",
                   "@/app/back-studio/scrum/[slug]/sprints/trash/page.tsx",
                   "@/components/sprint/DeleteSprintButton.tsx",
                   "@/components/sprint/HardDeleteSprintButton.tsx",
                   "@/components/sprint/RestoreSprintButton.tsx",
                   "@/components/sprint/SprintBoard.tsx",
                   "@/components/sprint/SprintCard.tsx",
                   "@/components/sprint/SprintForm.tsx",
                   "@/components/sprint/SprintStatusBadge.tsx",
                   "@/components/sprint/SprintStatusSelect.tsx",
                   "@/lib/design/accents.ts",
                   "@/lib/json-templates/sprint.ts",
                   "@/lib/sprint/lock.ts",
                   "@/lib/sprint/transitions.ts",
                   "@/lib/validations/sprint.ts",
                 ]
relatedFiles:    ["@/lib/validations/sprint.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["SPRINT_JSON_TEMPLATE"]
useBy:           ["@/app/back-studio/scrum/[slug]/sprints/new/page.tsx"]

userStories:     ["*en tant que développeur je veux importer des sprints en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const SPRINT_JSON_TEMPLATE = `[
  {
    "name": "Sprint 1 — Fondations",
    "slug": "sprint-1-fondations",
    "goal": "Poser les bases du projet : authentification, schéma de données, structure de l'app.",
    "startDate": "2026-10-01",
    "endDate": "2026-10-14",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 40,
    "velocity": 35,
    "notes": "Priorité absolue : authentification fonctionnelle en fin de sprint.",
    "accent": "violet"
  },
  {
    "name": "Sprint 2 — Conception & Backlog",
    "slug": "sprint-2-conception",
    "goal": "Livrer la gestion des personas, des features et le CRUD complet du backlog hiérarchique.",
    "startDate": "2026-10-15",
    "endDate": "2026-10-28",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 42,
    "velocity": 38,
    "accent": "cyan"
  },
  {
    "name": "Sprint 3 — Sprints & Composition",
    "slug": "sprint-3-sprints",
    "goal": "Permettre la composition de sprints par glisser-déposer et le suivi du statut.",
    "startDate": "2026-10-29",
    "endDate": "2026-11-11",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 40,
    "accent": "amber"
  },
  {
    "name": "Sprint 4 — Export & Import",
    "slug": "sprint-4-export-import",
    "goal": "Export JSON/MD du contexte projet et import en lot pour toutes les entités.",
    "startDate": "2026-11-12",
    "endDate": "2026-11-25",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 38,
    "accent": "emerald"
  },
  {
    "name": "Sprint 5 — Polish & QA",
    "slug": "sprint-5-polish-qa",
    "goal": "Corriger les bugs, améliorer l'accessibilité et la couverture de tests.",
    "startDate": "2026-11-26",
    "endDate": "2026-12-09",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 36,
    "accent": "rose"
  },
  {
    "name": "Sprint 6 — Documentation",
    "slug": "sprint-6-documentation",
    "goal": "Documenter l'architecture, les conventions et préparer l'onboarding.",
    "startDate": "2026-12-10",
    "endDate": "2026-12-23",
    "durationWeeks": 2,
    "status": "planned",
    "capacityPoints": 30,
    "notes": "Sprint plus léger : période de fin d'année.",
    "accent": "blue"
  }
]`;
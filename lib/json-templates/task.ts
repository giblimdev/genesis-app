/*
path :           lib/json-templates/task.ts
tag :            ["task", "import", "template", "json"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Template JSON prêt à l'emploi pour l'import en lot de tâches.
                 Utilisé par ImportJsonDialog pour pré-remplir la textarea. Le
                 format est EXACTEMENT celui attendu par bulkImportTasksSchema
                 (userStoryId est fourni par le contexte de la page).

flow:            Constante string → pas de runtime, pas d'effet.

ecosystem:       Task = [
                   "@/app/actions/task/bulkImportTasks.ts",
                   "@/app/actions/task/createTask.ts",
                   "@/app/actions/task/deleteTask.ts",
                   "@/app/actions/task/reorderTasks.ts",
                   "@/app/actions/task/updateTask.ts",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/[taskId]/edit/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx",
                   "@/components/task/DeleteTaskButton.tsx",
                   "@/components/task/TaskForm.tsx",
                   "@/components/task/TaskList.tsx",
                   "@/components/task/TaskRow.tsx",
                   "@/components/task/TaskStatusBadge.tsx",
                   "@/lib/json-templates/task.ts",
                   "@/lib/validations/task.ts",
                 ]
relatedFiles:    ["@/lib/validations/task.ts",
                  "@/components/common/ImportJsonDialog.tsx"]
imports:         []
exports:         ["TASK_JSON_TEMPLATE"]
useBy:           ["@/app/back-studio/scrum/[slug]/backlog/[storySlug]/tasks/new/page.tsx",
                  "@/components/task/TaskList.tsx"]

userStories:     ["*en tant que développeur je veux importer des tâches en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export const TASK_JSON_TEMPLATE = `[
  {
    "title": "Créer la route POST /auth/login",
    "description": "Valider le body avec Zod, vérifier les credentials en base, créer une session Better Auth, retourner le cookie de session.",
    "estimateHours": 4,
    "status": "todo",
    "notes": "Utiliser le helper existant getSession côté serveur."
  },
  {
    "title": "Écrire les tests du login",
    "description": "Tests unitaires sur la validation du body + tests d'intégration sur les réponses (200, 401, 429).",
    "estimateHours": 3,
    "status": "todo",
    "blockedByInput": "Créer la route POST /auth/login"
  },
  {
    "title": "Gérer le rate limiting",
    "description": "Limiter à 5 tentatives par IP et par minute. Retour 429 avec un message adapté.",
    "estimateHours": 2,
    "status": "todo"
  },
  {
    "title": "Accessibilité clavier du formulaire",
    "description": "Focus visible sur tous les champs, ordre de tabulation respecté, aria-invalid sur les erreurs.",
    "estimateHours": 2,
    "status": "review"
  },
  {
    "title": "Documenter le flux d'authentification",
    "description": "Diagramme de séquence + description des cookies de session + gestion des erreurs.",
    "estimateHours": 1,
    "status": "todo"
  }
]`;
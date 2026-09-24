/*
path :           lib/validations/task.ts
tag :            ["task", "validation"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du CRUD Task + import en lot. Une Task est toujours
                 rattachée à une UserStory. blockedBy est reçu sous forme de texte
                 multiligne (une ligne = un id) et sérialisé côté action.

flow:            createTaskSchema.safeParse → CreateTaskInput
                 updateTaskSchema.safeParse → UpdateTaskInput
                 taskIdSchema / reorderTasksSchema / bulkImportTasksSchema.

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
relatedFiles:    ["@/lib/json-templates/task.ts",
                  "@/components/task/TaskForm.tsx"]
imports:         ["zod"]
exports:         ["TASK_STATUSES", "TaskStatus", "TASK_STATUS_LABELS",
                  "createTaskSchema", "CreateTaskInput",
                  "updateTaskSchema", "UpdateTaskInput",
                  "taskIdSchema", "TaskIdInput",
                  "reorderTasksSchema", "ReorderTasksInput",
                  "bulkImportTasksSchema", "BulkImportTaskInput"]

userStories:     ["*en tant que développeur je veux valider les données d'une tâche",
                  "*en tant que développeur je veux importer des tâches en lot"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Statuts (miroir de la colonne String du schéma Prisma)             */
/* ------------------------------------------------------------------ */

export const TASK_STATUSES = [
  "todo",
  "in-progress",
  "review",
  "done",
  "blocked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  "in-progress": "En cours",
  review: "En revue",
  done: "Terminée",
  blocked: "Bloquée",
};

/* ------------------------------------------------------------------ */
/*  Champs partagés                                                    */
/* ------------------------------------------------------------------ */

const titleField = z
  .string()
  .trim()
  .min(1, "Titre requis.")
  .max(200, "Titre trop long (200 caractères maximum).");

const descriptionField = z
  .string()
  .trim()
  .min(1, "Description requise.")
  .max(5000, "Description trop longue (5000 caractères maximum).");

const assigneeIdField = z.string().trim().optional().or(z.literal(""));

const estimateHoursField = z.coerce
  .number()
  .int("Nombre entier requis.")
  .min(0, "Estimation positive requise.")
  .max(9999, "Estimation trop élevée.")
  .default(0);

const statusField = z.enum(TASK_STATUSES).default("todo");

/**
 * blockedBy : saisi côté formulaire comme une liste multiligne
 * (une ligne = un identifiant de tâche bloquante). Sérialisé côté action.
 */
const blockedByInputField = z
  .string()
  .max(2000, "Liste de blocages trop longue.")
  .optional()
  .or(z.literal(""));

const notesField = z
  .string()
  .trim()
  .max(3000, "Notes trop longues.")
  .optional()
  .or(z.literal(""));

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export const createTaskSchema = z.object({
  userStoryId: z.string().min(1, "User story requise."),
  title: titleField,
  description: descriptionField,
  assigneeId: assigneeIdField,
  estimateHours: estimateHoursField,
  status: statusField,
  blockedByInput: blockedByInputField,
  notes: notesField,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string().min(1, "Identifiant requis."),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/* ------------------------------------------------------------------ */
/*  Identifiant                                                        */
/* ------------------------------------------------------------------ */

export const taskIdSchema = z.object({
  id: z.string().min(1, "Identifiant requis."),
});
export type TaskIdInput = z.infer<typeof taskIdSchema>;

/* ------------------------------------------------------------------ */
/*  Réordonnancement                                                   */
/* ------------------------------------------------------------------ */

export const reorderTasksSchema = z.object({
  userStoryId: z.string().min(1, "User story requise."),
  orderedIds: z
    .array(z.string().min(1))
    .min(1, "Aucune tâche.")
    .max(500, "500 tâches maximum."),
});
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

/* ------------------------------------------------------------------ */
/*  Import en lot                                                      */
/* ------------------------------------------------------------------ */

/**
 * Item de bulk import — identique à createTaskSchema SAUF que
 * `userStoryId` est fourni par la page via `.bind()`, pas par le JSON.
 */
const bulkTaskItemSchema = z.object({
  title: titleField,
  description: descriptionField,
  assigneeId: assigneeIdField,
  estimateHours: estimateHoursField,
  status: statusField,
  blockedByInput: blockedByInputField,
  notes: notesField,
});

export const bulkImportTasksSchema = z
  .array(bulkTaskItemSchema)
  .min(1, "Le tableau doit contenir au moins une tâche.")
  .max(500, "500 tâches maximum par import.");

export type BulkImportTaskInput = z.infer<typeof bulkImportTasksSchema>;

/*
path :           lib/validations/save-prog.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schémas Zod du payload de la route /api/back-studio/
                 save-prog. Valide l'identifiant du projet cible et les
                 options de l'export disque (inclure ou non les dépendances
                 : features, personas, user stories, sprints).

flow:            saveProgPayloadSchema.safeParse(body) → SaveProgPayload.

ecosystem:       Dev = [
                   "@/app/api/back-studio/save-prog/route.ts",
                   "@/lib/validations/save-prog.ts",
                 ]
relatedFiles:    ["@/app/api/back-studio/save-prog/route.ts",
                  "@/components/project/SaveProjectToDiskButton.tsx"]
imports:         ["zod"]
exports:         ["saveProgPayloadSchema", "SaveProgPayload"]

userStories:     ["*en tant que développeur je veux sauvegarder un projet sur disque"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

export const saveProgPayloadSchema = z.object({
  projectId: z.string().min(1, "Identifiant projet requis."),
  includeChildren: z.boolean().default(true),
});

export type SaveProgPayload = z.infer<typeof saveProgPayloadSchema>;
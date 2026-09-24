/*
path :           lib/validations/prompt.ts
tag :            ["prompt", "validation"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Schéma Zod du payload de la route
                 /api/back-studio/help-dev/prompt/save. Valide le contenu
                 textuel de CONTRIBUTING.md avant écriture.

flow:            promptSaveSchema.safeParse(body) → PromptSavePayload.

ecosystem:       Prompts = [
                   "@/lib/validations/prompt.ts",
                   "@/app/api/back-studio/help-dev/prompt/save/route.ts",
                 ]
relatedFiles:    ["@/app/api/back-studio/help-dev/prompt/save/route.ts"]
imports:         ["zod"]
exports:         ["promptSaveSchema", "PromptSavePayload"]
useBy:           ["@/app/api/back-studio/help-dev/prompt/save/route.ts"]

userStories:     ["*en tant que développeur je veux valider le contenu du CONTRIBUTING"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { z } from "zod";

export const promptSaveSchema = z.object({
  content: z
    .string()
    .max(500_000, "Contenu trop volumineux (500 000 caractères maximum)."),
});

export type PromptSavePayload = z.infer<typeof promptSaveSchema>;
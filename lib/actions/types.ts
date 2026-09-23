/*
path :           lib/actions/types.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Type ActionResult partagé par toutes les Server Actions du CRUD.
                 Discriminé sur `success` pour forcer la gestion d'erreur côté client.
flow:            importé par les actions et les composants client. Aucun runtime.
ecosystem:       Dev = [
                   "@/lib/actions/types.ts",
                 ]
relatedFiles:    ["@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/app/actions/project/softDeleteProject.ts",
                  "@/app/actions/project/restoreProject.ts"]
imports:         []
exports:         ["ActionResult"]

userStories:     ["*en tant que développeur je veux un retour typé de mes actions"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export type ActionResult<T = void> =
  | { readonly success: true; readonly data: T }
  | {
      readonly success: false;
      readonly error: string;
      readonly fieldErrors?: Record<string, readonly string[]>;
    };
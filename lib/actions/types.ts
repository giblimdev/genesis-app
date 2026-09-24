/*
path :           lib/actions/types.ts
tag :            ["actions", "types"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Types partagés par toutes les Server Actions du CRUD :
                 ActionResult<T> (création / mise à jour / suppression),
                 BulkImportResult (import en lot + upsert) et ImportMode.

flow:            Module TypeScript pur → export de types. Aucun runtime.

ecosystem:       Dev = [
                   "@/lib/actions/types.ts",
                   "@/app/actions/project/bulkImportProjects.ts",
                 ]
relatedFiles:    ["@/lib/validations/project.ts",
                  "@/app/actions/project/createProject.ts"]
imports:         []
exports:         ["ActionResult", "BulkImportResult", "ImportMode"]
useBy:           ["@/app/actions/**"]

userStories:     ["*en tant que développeur je veux un retour typé de mes actions",
                  "*en tant que développeur je veux importer ou mettre à jour en masse"]
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

/** Mode d'import : création seule ou création + mise à jour. */
export type ImportMode = "create" | "upsert";

/**
 * Résultat d'un import en lot.
 * `imported` = total affecté (created + updated).
 * `created` et `updated` sont optionnels (renseignés en mode upsert).
 */
export type BulkImportResult =
  | {
      readonly success: true;
      readonly imported: number;
      readonly created?: number;
      readonly updated?: number;
    }
  | { readonly success: false; readonly error: string };
/*
path :           app/back-studio/saveApp/readAppFiles.ts
projectId:       <à fournir>
type:            helper
generic:         false

role:            Orchestrateur du scan : lit la configuration d'exclusion, parcourt le disque,
                 parse l'en-tête de chaque fichier découvert, retourne la liste complète des
                 AppFile + statistiques (ignorés, tronqué).
flow:            readAppFiles() → readExcludes() → walkApp() → Promise.all(files.map(parseFile))
                 → retourne { files, stats }. Aucune écriture disque.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/lib/dev/fs-walker.ts",
                  "@/lib/dev/header-parser.ts",
                  "@/app/back-studio/saveApp/excludes.ts"]
imports:         ["server-only",
                  "@/app/back-studio/saveApp/excludes",
                  "@/lib/dev/fs-walker",
                  "@/lib/dev/header-parser",
                  "@/lib/dev/types"]
exports:         ["readAppFiles", "ReadAppFilesResult", "ReadAppFilesStats"]
useBy:           ["@/app/back-studio/saveApp/page.tsx"]

userStories:     ["*en tant que développeur je veux récupérer tous les fichiers de l'app"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { readExcludes } from "./excludes";
import { walkApp } from "@/lib/dev/fs-walker";
import { parseFile } from "@/lib/dev/header-parser";
import type { AppFile, ExcludesConfig } from "@/lib/dev/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReadAppFilesStats = {
  readonly total: number;
  readonly withHeader: number;
  readonly withoutHeader: number;
  readonly skippedDirs: number;
  readonly skippedFiles: number;
  readonly truncated: boolean;
  readonly totalBytes: number;
};

export type ReadAppFilesResult = {
  readonly files: readonly AppFile[];
  readonly config: ExcludesConfig;
  readonly stats: ReadAppFilesStats;
};

/* ------------------------------------------------------------------ */
/*  Orchestration                                                      */
/* ------------------------------------------------------------------ */

export async function readAppFiles(): Promise<ReadAppFilesResult> {
  const config = await readExcludes();
  const walk = await walkApp(config);

  const files = await Promise.all(
    walk.files.map((f) => parseFile(f.absolutePath)),
  );

  const withHeader = files.filter((f) => f.hasHeader).length;
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  return {
    files,
    config,
    stats: {
      total: files.length,
      withHeader,
      withoutHeader: files.length - withHeader,
      skippedDirs: walk.skippedDirs.length,
      skippedFiles: walk.skippedFiles.length,
      truncated: walk.truncated,
      totalBytes,
    },
  };
}

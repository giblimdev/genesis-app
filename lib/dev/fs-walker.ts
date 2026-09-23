/*
path :           lib/dev/fs-walker.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Parcours récursif du disque. Prend une ExcludesConfig (roots + excludes +
                 extensions) et retourne tous les ScannedFile correspondants, triés, avec
                 un compteur de fichiers ignorés. Aucune lecture de contenu ici.
flow:            walkApp(config) → pour chaque root, récursion réaddir → ignore les dossiers
                 exclus → filtre les extensions autorisées et les motifs exclus → accumule
                 les ScannedFile. S'arrête proprement si maxFiles est atteint.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts"]
imports:         ["node:fs/promises", "node:path",
                  "@/lib/dev/types"]
exports:         ["walkApp", "WalkResult"]
useBy:           ["@/app/back-studio/saveApp/readAppFiles.ts"]

userStories:     ["*en tant que développeur je veux scanner les fichiers de l'app"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import type { ExcludesConfig, ScannedFile } from "@/lib/dev/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WalkResult = {
  readonly files: readonly ScannedFile[];
  readonly skippedDirs: readonly string[];
  readonly skippedFiles: readonly string[];
  readonly truncated: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeRel(p: string): string {
  return p.split(path.sep).join("/");
}

function isDirExcluded(rel: string, excludes: readonly string[]): boolean {
  const normalized = normalizeRel(rel);
  return excludes.some(
    (ex) => normalized === ex || normalized.startsWith(`${ex}/`),
  );
}

function isFileExcludedByName(
  name: string,
  patterns: readonly string[],
): boolean {
  return patterns.some((p) => name.endsWith(p));
}

function hasAllowedExtension(
  name: string,
  extensions: readonly string[],
): boolean {
  return extensions.some((ext) => name.endsWith(ext));
}

/* ------------------------------------------------------------------ */
/*  Walker                                                             */
/* ------------------------------------------------------------------ */

export async function walkApp(config: ExcludesConfig): Promise<WalkResult> {
  const files: ScannedFile[] = [];
  const skippedDirs: string[] = [];
  const skippedFiles: string[] = [];
  let truncated = false;

  async function recurse(absoluteDir: string): Promise<void> {
    if (truncated) return;

    let entries;
    try {
      entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (truncated) return;

      const abs = path.join(absoluteDir, entry.name);
      const rel = normalizeRel(path.relative(process.cwd(), abs));

      if (entry.isDirectory()) {
        if (isDirExcluded(rel, config.excludes)) {
          skippedDirs.push(rel);
          continue;
        }
        await recurse(abs);
        continue;
      }

      if (!entry.isFile()) continue;

      if (!hasAllowedExtension(entry.name, config.includeExtensions)) {
        skippedFiles.push(rel);
        continue;
      }

      if (isFileExcludedByName(entry.name, config.excludePatterns)) {
        skippedFiles.push(rel);
        continue;
      }

      let size = 0;
      try {
        const stat = await fs.stat(abs);
        size = stat.size;
      } catch {
        // fichier disparu entre readdir et stat → on ignore
        continue;
      }

      if (files.length >= config.maxFiles) {
        truncated = true;
        return;
      }

      files.push({ absolutePath: abs, relativePath: rel, size });
    }
  }

  for (const root of config.roots) {
    if (truncated) break;
    const absRoot = path.join(process.cwd(), root);
    try {
      const stat = await fs.stat(absRoot);
      if (stat.isDirectory()) {
        await recurse(absRoot);
      }
    } catch {
      // racine absente → on ignore silencieusement
    }
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return { files, skippedDirs, skippedFiles, truncated };
}

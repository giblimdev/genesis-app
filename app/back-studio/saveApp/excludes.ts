/*
path :           app/back-studio/saveApp/excludes.ts
projectId:       <à fournir>
type:            helper
generic:         false

role:            Lecture et écriture de la configuration d'exclusion stockée dans
                 public/save-app/excludes.json. Fournit DEFAULT_EXCLUDES et gère le cas
                 où le fichier n'existe pas encore (retourne les valeurs par défaut sans
                 créer le fichier).
flow:            readExcludes() → fs.readFile public/save-app/excludes.json → JSON.parse
                 + merge avec DEFAULT_EXCLUDES → ExcludesConfig. Si absent ou invalide :
                 retourne DEFAULT_EXCLUDES. writeExcludes(config) → mkdir + writeFile.
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                 ]
relatedFiles:    ["@/lib/dev/types.ts",
                  "@/app/back-studio/saveApp/readAppFiles.ts"]
imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/lib/dev/types"]
exports:         ["DEFAULT_EXCLUDES", "EXCLUDES_PATH", "readExcludes", "writeExcludes"]
useBy:           ["@/app/back-studio/saveApp/readAppFiles.ts",
                  "@/app/api/back-studio/save-app/excludes/route.ts"]

userStories:     ["*en tant que développeur je veux éditer les règles d'exclusion"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { ExcludesConfig } from "@/lib/dev/types";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

export const EXCLUDES_PATH = "public/save-app/excludes.json";

export const DEFAULT_EXCLUDES: ExcludesConfig = {
  roots: ["app", "components", "lib", "utils", "store", "prisma"],
  excludes: [
    "node_modules",
    ".next",
    ".turbo",
    "dist",
    "build",
    "coverage",
    "components/ui",
    "lib/generated",

    "generated",
  ],
  includeExtensions: [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".prisma",
    ".md",
    ".css",
  ],
  excludePatterns: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".d.ts"],
  maxFiles: 999,
  maxBytes: 52_428_800, // 50 Mo
};

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

function mergeWithDefaults(raw: unknown): ExcludesConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_EXCLUDES;
  const obj = raw as Partial<ExcludesConfig>;

  return {
    roots: Array.isArray(obj.roots) ? obj.roots : DEFAULT_EXCLUDES.roots,
    excludes: Array.isArray(obj.excludes)
      ? obj.excludes
      : DEFAULT_EXCLUDES.excludes,
    includeExtensions: Array.isArray(obj.includeExtensions)
      ? obj.includeExtensions
      : DEFAULT_EXCLUDES.includeExtensions,
    excludePatterns: Array.isArray(obj.excludePatterns)
      ? obj.excludePatterns
      : DEFAULT_EXCLUDES.excludePatterns,
    maxFiles:
      typeof obj.maxFiles === "number" && obj.maxFiles > 0
        ? obj.maxFiles
        : DEFAULT_EXCLUDES.maxFiles,
    maxBytes:
      typeof obj.maxBytes === "number" && obj.maxBytes > 0
        ? obj.maxBytes
        : DEFAULT_EXCLUDES.maxBytes,
  };
}

export async function readExcludes(): Promise<ExcludesConfig> {
  const abs = path.join(process.cwd(), EXCLUDES_PATH);
  try {
    const raw = await fs.readFile(abs, "utf8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return DEFAULT_EXCLUDES;
  }
}

/* ------------------------------------------------------------------ */
/*  Écriture                                                           */
/* ------------------------------------------------------------------ */

export async function writeExcludes(config: ExcludesConfig): Promise<void> {
  const abs = path.join(process.cwd(), EXCLUDES_PATH);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, JSON.stringify(config, null, 2), "utf8");
}

/*
path :           lib/dev/assembleDocument.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Lit le contenu réel des fichiers sélectionnés et assemble un document
                 unique au format Option A (MD : "=== chemin ===") ou JSON (objet
                 { path: content }). Refuse tout chemin hors du projet (process.cwd()).
flow:            assembleDocument(paths, format) → pour chaque path : path.resolve +
                 vérification confinement + fs.readFile → accumulation. Retourne
                 { document, fileCount, totalBytes, skipped }.
ecosystem:       Dev = [
                   "@/app/api/back-studio/save-app/preview/route.ts",
                   "@/app/api/back-studio/save-app/save/route.ts",
                   "@/lib/dev/assembleDocument.ts",
                   "@/lib/dev/types.ts",
                 ]
relatedFiles:    ["@/lib/validations/save-app.ts",
                  "@/app/api/back-studio/save-app/preview/route.ts",
                  "@/app/api/back-studio/save-app/save/route.ts"]
imports:         ["server-only", "node:fs/promises", "node:path",
                  "paramètres reçus : assembleDocument(paths: readonly string[], format: AssembleFormat)"]
exports:         ["AssembleFormat", "AssembleResult", "assembleDocument"]
useBy:           ["@/app/api/back-studio/save-app/preview/route.ts",
                  "@/app/api/back-studio/save-app/save/route.ts"]

userStories:     ["*en tant que développeur je veux assembler les fichiers en un document"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AssembleFormat = "md" | "json";

export type AssembleSkipped = {
  readonly path: string;
  readonly reason: string;
};

export type AssembleResult = {
  readonly document: string;
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly skipped: readonly AssembleSkipped[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isInsideProject(abs: string): boolean {
  const cwd = process.cwd();
  const normalized = path.resolve(abs);
  return normalized === cwd || normalized.startsWith(cwd + path.sep);
}

function renderMd(parts: readonly { path: string; content: string }[]): string {
  return parts
    .map((p) => `=== ${p.path} ===\n\n${p.content.trimEnd()}\n`)
    .join("\n");
}

function renderJson(
  parts: readonly { path: string; content: string }[],
): string {
  const obj: Record<string, string> = {};
  for (const p of parts) obj[p.path] = p.content;
  return JSON.stringify(obj, null, 2);
}

/* ------------------------------------------------------------------ */
/*  Assemblage                                                         */
/* ------------------------------------------------------------------ */

export async function assembleDocument(
  paths: readonly string[],
  format: AssembleFormat,
): Promise<AssembleResult> {
  const parts: { path: string; content: string }[] = [];
  const skipped: AssembleSkipped[] = [];
  let totalBytes = 0;

  for (const rel of paths) {
    const abs = path.resolve(process.cwd(), rel);

    if (!isInsideProject(abs)) {
      skipped.push({ path: rel, reason: "Hors du projet." });
      continue;
    }

    try {
      const content = await fs.readFile(abs, "utf8");
      totalBytes += Buffer.byteLength(content, "utf8");
      parts.push({ path: rel, content });
    } catch {
      skipped.push({ path: rel, reason: "Lecture impossible." });
    }
  }

  const document = format === "json" ? renderJson(parts) : renderMd(parts);

  return {
    document,
    fileCount: parts.length,
    totalBytes,
    skipped,
  };
}

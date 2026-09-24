/*
path :           lib/project/disk-fallback.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Lecture READ-ONLY des projets depuis data/save-prog/.
                 Dossier PRIVÉ (hors public/) pour empêcher l'accès HTTP
                 direct. Un projet peut avoir plusieurs fichiers (versions
                 successives) : on prend le plus récent par mtime.

flow:            readProjectFromDisk(slug) → readdir → filtre les fichiers
                 correspondant à `<slug>.json` ou `<slug>-*.json` → trie
                 par mtime décroissant → lit le premier → parse → valide
                 légèrement → retourne ProjectDiskSnapshot | null.

ecosystem:       Dev = [
                   "@/lib/project/disk-fallback.ts",
                   "@/lib/project/load-project.ts",
                 ]
relatedFiles:    ["@/lib/project/serialize-for-disk.ts",
                  "@/lib/project/load-project.ts"]
imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/lib/project/serialize-for-disk"]
exports:         ["SAVE_PROG_DIR",
                  "readProjectFromDisk",
                  "listProjectsFromDisk",
                  "DiskProjectEntry"]

userStories:     ["*en tant que développeur je veux un fallback disque en lecture"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

/* ------------------------------------------------------------------ */
/*  Constante — dossier PRIVÉ (hors public/)                           */
/* ------------------------------------------------------------------ */

export const SAVE_PROG_DIR = path.join(process.cwd(), "data", "save-prog");

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DiskProjectEntry = {
  readonly slug: string;
  readonly name: string;
  readonly status: string;
  readonly tagline: string | null;
  readonly lastSavedAt: Date;
  readonly file: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function listDirSafe(): Promise<string[]> {
  try {
    return await fs.readdir(SAVE_PROG_DIR);
  } catch {
    return [];
  }
}

/** Vrai si `filename` correspond à `slug.json` ou `slug-<suffixe>.json`. */
function matchesSlug(filename: string, slug: string): boolean {
  if (!filename.endsWith(".json")) return false;
  const base = filename.slice(0, -5);
  return base === slug || base.startsWith(`${slug}-`);
}

/** Validation légère d'un objet parsé. */
function isValidSnapshot(value: unknown): value is ProjectDiskSnapshot {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const p = obj.project;
  if (!p || typeof p !== "object") return false;
  const proj = p as Record<string, unknown>;
  return (
    typeof proj.name === "string" &&
    typeof proj.slug === "string" &&
    typeof proj.description === "string" &&
    typeof proj.status === "string"
  );
}

/* ------------------------------------------------------------------ */
/*  Lecture d'un projet par slug                                       */
/* ------------------------------------------------------------------ */

export async function readProjectFromDisk(
  slug: string,
): Promise<ProjectDiskSnapshot | null> {
  const entries = await listDirSafe();
  const candidates = entries.filter((f) => matchesSlug(f, slug));

  if (candidates.length === 0) return null;

  /* Tri par mtime décroissant → le plus récent en premier. */
  const withStats = await Promise.all(
    candidates.map(async (file) => {
      try {
        const stat = await fs.stat(path.join(SAVE_PROG_DIR, file));
        return { file, mtime: stat.mtimeMs };
      } catch {
        return null;
      }
    }),
  );

  const sorted = withStats
    .filter((x): x is { file: string; mtime: number } => x !== null)
    .sort((a, b) => b.mtime - a.mtime);

  for (const { file } of sorted) {
    try {
      const content = await fs.readFile(
        path.join(SAVE_PROG_DIR, file),
        "utf-8",
      );
      const parsed: unknown = JSON.parse(content);
      if (isValidSnapshot(parsed)) return parsed;
    } catch {
      // Fichier suivant
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Liste des projets disponibles sur disque                           */
/* ------------------------------------------------------------------ */

export async function listProjectsFromDisk(): Promise<DiskProjectEntry[]> {
  const entries = await listDirSafe();
  const jsonFiles = entries.filter((f) => f.endsWith(".json"));

  const items = await Promise.all(
    jsonFiles.map(async (file): Promise<DiskProjectEntry | null> => {
      try {
        const full = path.join(SAVE_PROG_DIR, file);
        const [content, stat] = await Promise.all([
          fs.readFile(full, "utf-8"),
          fs.stat(full),
        ]);
        const parsed: unknown = JSON.parse(content);
        if (!isValidSnapshot(parsed)) return null;
        return {
          slug: parsed.project.slug,
          name: parsed.project.name,
          status: parsed.project.status,
          tagline: parsed.project.tagline,
          lastSavedAt: stat.mtime,
          file,
        };
      } catch {
        return null;
      }
    }),
  );

  /* Déduplication par slug → garde le plus récent. */
  const bySlug = new Map<string, DiskProjectEntry>();
  for (const item of items) {
    if (!item) continue;
    const existing = bySlug.get(item.slug);
    if (!existing || item.lastSavedAt > existing.lastSavedAt) {
      bySlug.set(item.slug, item);
    }
  }

  return Array.from(bySlug.values()).sort(
    (a, b) => b.lastSavedAt.getTime() - a.lastSavedAt.getTime(),
  );
}
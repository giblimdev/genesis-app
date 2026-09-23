/*
path :           app/api/back-studio/creat-files/save/route.ts
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint POST pour créer sur disque un lot de fichiers { path?, content }.
                 Si `path` est absent, il est DÉDUIT de l'en-tête Helpdev du contenu
                 (champ `path :` à l'intérieur du premier bloc ).
                 NE JAMAIS écraser par défaut : si au moins un chemin existe déjà et
                 qu'aucune politique de conflit n'est fournie, la route renvoie 409 avec
                 la liste des conflits et n'écrit RIEN.

flow:            POST → parse JSON → creatFilesPayloadSchema.safeParse.
                 · Résolution des chemins : path fourni OU déduit du header.
                 · Refus 400 si un chemin reste introuvable, pointe vers un dossier
                   interdit (node_modules, .next, .git, .turbo, dist, build, .env*),
                   ou ne passe pas safePath.
                 · Détection de conflits (fs.access sur chaque cible).
                 · Si conflits ET onConflict absent → 409 { conflicts, forbidden }.
                 · Sinon applique la politique choisie :
                     skip      → n'écrit pas les fichiers existants
                     overwrite → écrase
                     rename    → ajoute -2, -3, … avant l'extension
                 · mkdir recursive + writeFile pour chaque cible retenue.

ecosystem:       Dev = [
                   "@/app/api/back-studio/creat-files/save/route.ts",
                   "@/lib/validations/creat-files.ts",
                 ]
relatedFiles:    ["@/lib/validations/creat-files.ts",
                  "@/app/back-studio/creatFiles/CreatFilesView.tsx"]
imports:         ["next/server", "node:fs/promises", "node:path",
                  "@/lib/validations/creat-files"]
exports:         ["POST", "runtime"]
useBy:           ["@/app/back-studio/creatFiles/CreatFilesView.tsx"]

userStories:     ["*en tant que développeur je veux créer des fichiers sans risque d'écrasement",
                  "*en tant que développeur je veux que le path soit déduit du contenu"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import {
  creatFilesPayloadSchema,
  safePath,
  type ConflictPolicy,
} from "@/lib/validations/creat-files";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Dossiers / fichiers interdits à l'écriture                         */
/* ------------------------------------------------------------------ */

const FORBIDDEN_TOP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
]);

const FORBIDDEN_EXACT_FILES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
]);

function isForbidden(rel: string): boolean {
  const top = rel.split("/")[0] ?? "";
  if (FORBIDDEN_TOP_DIRS.has(top)) return true;
  if (FORBIDDEN_EXACT_FILES.has(rel)) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Déduction du path depuis l'en-tête Helpdev                         */
/* ------------------------------------------------------------------ */

/**
 * Extrait la valeur du premier `path :` trouvé à l'intérieur du premier
 * bloc commentaire /* … *\/ du contenu. Retourne null si absent.
 * Ne lève jamais.
 */
function extractPathFromContent(content: string): string | null {
  const start = content.indexOf("/*");
  if (start === -1) return null;
  const end = content.indexOf("*/", start + 2);
  if (end === -1) return null;
  const block = content.slice(start + 2, end);

  for (const rawLine of block.split(/\r?\n/)) {
    const m = rawLine.match(/^\s*path\s*:\s*(.+)$/);
    if (m) {
      const v = m[1]!.trim();
      return v.length > 0 ? v : null;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isInsideProject(abs: string): boolean {
  const cwd = process.cwd();
  const normalized = path.resolve(abs);
  return normalized === cwd || normalized.startsWith(cwd + path.sep);
}

function toRel(abs: string): string {
  return path.relative(process.cwd(), abs).split(path.sep).join("/");
}

/** Retourne un chemin libre en ajoutant -2, -3, … avant l'extension. */
async function findUniqueAbs(abs: string): Promise<string> {
  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  const base = path.basename(abs, ext);

  for (let i = 2; i <= 999; i++) {
    const candidate = path.join(dir, `${base}-${i}${ext}`);
    try {
      await fs.access(candidate);
    } catch {
      return candidate;
    }
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`);
}

async function exists(abs: string): Promise<boolean> {
  try {
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  POST                                                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  /* ---------- 0. Parse JSON ---------- */

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide (JSON attendu)." },
      { status: 400 },
    );
  }

  /* ---------- 1. Validation Zod du squelette ---------- */

  const parsed = creatFilesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { onConflict } = parsed.data;

  /* ---------- 2. Résolution des chemins (path ou header) ---------- */

  const unresolved: number[] = [];
  const resolved: { path: string; content: string }[] = [];

  for (let i = 0; i < parsed.data.files.length; i++) {
    const f = parsed.data.files[i]!;
    const explicit = (f.path ?? "").trim();
    const deduced =
      explicit.length > 0 ? explicit : extractPathFromContent(f.content);

    if (!deduced) {
      unresolved.push(i);
      continue;
    }

    /* Validation fine du chemin résolu (traversée, séparateurs, …). */
    const v = safePath.safeParse(deduced);
    if (!v.success) {
      return NextResponse.json(
        {
          error: `Fichier #${i + 1} : chemin invalide.`,
          path: deduced,
          reason: v.error.issues[0]?.message ?? "Inconnu",
        },
        { status: 400 },
      );
    }

    resolved.push({ path: v.data, content: f.content });
  }

  if (unresolved.length > 0) {
    return NextResponse.json(
      {
        error:
          "Certaines entrées n'ont ni `path` ni en-tête Helpdev exploitable.",
        unresolvedIndexes: unresolved,
        hint: "Renseigne le champ `path`, ou colle un contenu contenant un bloc /* path : … */.",
      },
      { status: 400 },
    );
  }

  /* ---------- 3. Filtrage sécurité ---------- */

  const forbidden: string[] = [];
  const safe: typeof resolved = [];

  for (const f of resolved) {
    const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), f.path);
    if (!isInsideProject(abs) || isForbidden(f.path)) {
      forbidden.push(f.path);
    } else {
      safe.push(f);
    }
  }

  if (forbidden.length > 0) {
    return NextResponse.json(
      {
        error: "Chemins interdits dans la sélection.",
        forbidden,
        hint: "Retire ces entrées (node_modules, .next, .git, .env*, etc.) et réessaie.",
      },
      { status: 400 },
    );
  }

  /* ---------- 4. Détection des conflits ---------- */

  const conflicts: string[] = [];
  for (const f of safe) {
    const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), f.path);
    if (await exists(abs)) conflicts.push(f.path);
  }

  if (conflicts.length > 0 && !onConflict) {
    return NextResponse.json(
      {
        error: "Fichiers existants détectés.",
        conflicts,
        hint: "Choisis une politique : skip, overwrite ou rename.",
      },
      { status: 409 },
    );
  }

  /* ---------- 5. Application ---------- */

  const policy: ConflictPolicy = onConflict ?? "skip";

  const written: string[] = [];
  const overwritten: string[] = [];
  const renamed: { from: string; to: string }[] = [];
  const skipped: string[] = [];
  const failed: { path: string; reason: string }[] = [];

  for (const f of safe) {
    const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), f.path);
    const existsAlready = await exists(abs);

    let target = abs;

    if (existsAlready) {
      if (policy === "skip") {
        skipped.push(f.path);
        continue;
      }
      if (policy === "rename") {
        target = await findUniqueAbs(abs);
        renamed.push({ from: f.path, to: toRel(target) });
      }
      if (policy === "overwrite") {
        overwritten.push(f.path);
      }
    }

    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, f.content, "utf8");
      if (!existsAlready || policy === "rename") {
        written.push(toRel(target));
      }
    } catch (err) {
      failed.push({
        path: f.path,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    saved: failed.length === 0,
    written,
    overwritten,
    renamed,
    skipped,
    failed,
    summary: {
      created: written.filter((p) => !overwritten.includes(p)).length,
      overwritten: overwritten.length,
      renamed: renamed.length,
      skipped: skipped.length,
      failed: failed.length,
    },
  });
}

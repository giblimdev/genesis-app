/*
path :           app/api/back-studio/save-prog/route.ts
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint POST qui sérialise un projet (avec ses enfants)
                 et l'écrit dans data/save-prog/<slug>.json. Ce dossier est
                 PRIVÉ (hors public/) : aucun accès HTTP direct. Il sert
                 uniquement de fallback en lecture si la base de données
                 devient inaccessible.

                 Ne JAMAIS écraser : si le fichier existe, un suffixe -2,
                 -3, … est ajouté automatiquement.

flow:            POST → parse JSON → saveProgPayloadSchema.safeParse
                 → serializeProjectForDisk → findUniqueFilename
                 → fs.mkdir + fs.writeFile → NextResponse.json({
                 saved, filename, size, summary }).

ecosystem:       Dev = [
                   "@/app/api/back-studio/save-prog/route.ts",
                   "@/lib/validations/save-prog.ts",
                   "@/lib/project/serialize-for-disk.ts",
                 ]
relatedFiles:    ["@/lib/validations/save-prog.ts",
                  "@/lib/project/serialize-for-disk.ts",
                  "@/lib/project/disk-fallback.ts",
                  "@/components/project/SaveProjectToDiskButton.tsx"]
imports:         ["next/server", "node:fs/promises", "node:path",
                  "@/lib/validations/save-prog",
                  "@/lib/project/serialize-for-disk"]
exports:         ["POST", "runtime"]
useBy:           ["@/components/project/SaveProjectToDiskButton.tsx"]

userStories:     ["*en tant que développeur je veux sauvegarder un projet sur disque"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { saveProgPayloadSchema } from "@/lib/validations/save-prog";
import { serializeProjectForDisk } from "@/lib/project/serialize-for-disk";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Dossier de sauvegarde — PRIVÉ, hors du web root                    */
/* ------------------------------------------------------------------ */

const SAVE_DIR = path.join(process.cwd(), "data", "save-prog");

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function exists(abs: string): Promise<boolean> {
  try {
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retourne un nom de fichier libre dans `dir`. Si `slug.json` existe,
 * essaie `slug-2.json`, `slug-3.json`… jusqu'à 999, puis timestamp.
 */
async function findUniqueFilename(
  dir: string,
  base: string,
): Promise<string> {
  const ext = ".json";
  let candidate = `${base}${ext}`;

  for (let i = 2; i <= 999; i++) {
    if (!(await exists(path.join(dir, candidate)))) return candidate;
    candidate = `${base}-${i}${ext}`;
  }
  return `${base}-${Date.now()}${ext}`;
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

  /* ---------- 1. Validation Zod ---------- */

  const parsed = saveProgPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { projectId, includeChildren } = parsed.data;

  /* ---------- 2. Sérialisation ---------- */

  const snapshot = await serializeProjectForDisk(projectId, {
    includeChildren,
  });

  if (!snapshot) {
    return NextResponse.json(
      { error: "Projet introuvable." },
      { status: 404 },
    );
  }

  /* ---------- 3. Écriture disque ---------- */

  try {
    await fs.mkdir(SAVE_DIR, { recursive: true });

    const filename = await findUniqueFilename(
      SAVE_DIR,
      snapshot.project.slug,
    );
    const target = path.join(SAVE_DIR, filename);

    /* Garde-fou : le chemin résolu doit rester dans SAVE_DIR. */
    if (!target.startsWith(SAVE_DIR + path.sep)) {
      return NextResponse.json(
        { error: "Chemin invalide." },
        { status: 400 },
      );
    }

    const content = JSON.stringify(snapshot, null, 2);
    await fs.writeFile(target, content, "utf-8");

    return NextResponse.json({
      saved: true,
      filename,
      size: content.length,
      summary: {
        features: snapshot.features.length,
        personas: snapshot.personas.length,
        userStories: snapshot.userStories.length,
        sprints: snapshot.sprints.length,
      },
    });
  } catch (err) {
    console.error("[save-prog]", err);
    return NextResponse.json(
      { error: "Écriture impossible.", details: String(err) },
      { status: 500 },
    );
  }
}
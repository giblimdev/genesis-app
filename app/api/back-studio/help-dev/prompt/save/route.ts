/*
path :           app/api/back-studio/help-dev/prompt/save/route.ts
tag :            ["prompt", "api"]
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint POST qui écrit le contenu de l'éditeur dans
                 CONTRIBUTING.md à la racine du projet. Écriture directe,
                 sans sauvegarde .bak préalable. Invalide ensuite le cache
                 tagué "export-to-ia" pour que la page ExportToIA relise
                 le fichier à la prochaine visite.

flow:            POST → parse JSON → promptSaveSchema.safeParse →
                 fs.writeFile(CONTRIBUTING.md) → revalidateTag("export-to-ia", "max")
                 → NextResponse.json({ saved, path, size }).

ecosystem:       Prompts = [
                   "@/app/api/back-studio/help-dev/prompt/save/route.ts",
                   "@/lib/validations/prompt.ts",
                 ]
relatedFiles:    ["@/lib/validations/prompt.ts",
                  "@/app/back-studio/help-dev/prompt/PromptView.tsx",
                  "@/app/back-studio/exportToIA/readProjectFiles.ts"]
imports:         ["next/server", "next/cache",
                  "node:fs/promises", "node:path",
                  "@/lib/validations/prompt"]
exports:         ["POST", "runtime"]
useBy:           ["@/app/back-studio/help-dev/prompt/PromptView.tsx"]

userStories:     ["*en tant que développeur je veux sauvegarder le CONTRIBUTING"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { promptSaveSchema } from "@/lib/validations/prompt";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Chemin statique — pas de segment dynamique                         */
/* ------------------------------------------------------------------ */

const CONTRIBUTING_PATH = path.join(process.cwd(), "CONTRIBUTING.md");

/* ------------------------------------------------------------------ */
/*  Cache tag                                                          */
/* ------------------------------------------------------------------ */

/**
 * Tag partagé avec readProjectFiles (ExportToIA).
 * Toute écriture de CONTRIBUTING.md doit invalider ce tag pour que la
 * page ExportToIA relise le fichier à la prochaine visite.
 */
const EXPORT_TO_IA_TAG = "export-to-ia";

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

  /* ---------- 1. Validation ---------- */

  const parsed = promptSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { content } = parsed.data;

  /* ---------- 2. Écriture ---------- */

  try {
    await fs.writeFile(CONTRIBUTING_PATH, content, "utf-8");
  } catch (err) {
    console.error("[prompt/save]", err);
    return NextResponse.json(
      { error: "Écriture impossible.", details: String(err) },
      { status: 500 },
    );
  }

  /* ---------- 3. Invalidation du cache ExportToIA ---------- */
  /* Next.js 16 exige un 2ᵉ argument "profile" — "max" invalide toutes
     les entrées du tag, quel que soit le profil d'écriture. */

  revalidateTag(EXPORT_TO_IA_TAG, "max");

  /* ---------- 4. Réponse ---------- */

  return NextResponse.json({
    saved: true,
    path: "CONTRIBUTING.md",
    size: content.length,
  });
}
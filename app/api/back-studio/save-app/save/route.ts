/*
path :           app/api/back-studio/save-app/save/route.ts
projectId:       <à fournir>
type :           route
generic:         false

role:            Endpoint POST /api/back-studio/save-app/save. Lit les fichiers
                 sélectionnés, assemble le document (format déduit de l'extension du
                 filename), puis écrit dans public/save-app/<filename>. Si le fichier
                 existe déjà, un suffixe -2, -3, … est ajouté pour ne JAMAIS écraser.
flow:            POST → parse JSON → savePayloadSchema.safeParse → assembleDocument →
                 findUniqueFilename → fs.mkdir + fs.writeFile → NextResponse.json({
                 saved, publicPath, filename, fileCount, totalBytes, skipped }).
                 Erreurs : 400 (payload invalide), 500 (écriture impossible).
ecosystem:       Dev = [
                   "@/app/api/back-studio/save-app/preview/route.ts",
                   "@/app/api/back-studio/save-app/save/route.ts",
                   "@/lib/dev/assembleDocument.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/validations/save-app.ts",
                 ]
relatedFiles:    ["@/lib/dev/assembleDocument.ts",
                  "@/lib/validations/save-app.ts",
                  "@/app/back-studio/saveApp/SaveAppView.tsx"]
imports:         ["server-only", "next/server", "node:fs/promises", "node:path",
                  "@/lib/dev/assembleDocument",
                  "@/lib/validations/save-app"]
exports:         ["POST", "runtime"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux sauvegarder un document dans /public"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import {
  assembleDocument,
  type AssembleFormat,
} from "@/lib/dev/assembleDocument";
import { savePayloadSchema } from "@/lib/validations/save-app";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function detectFormat(filename: string): AssembleFormat {
  return filename.toLowerCase().endsWith(".json") ? "json" : "md";
}

function publicRelativePath(filename: string): string {
  return `public/save-app/${filename}`;
}

/**
 * Retourne un nom de fichier qui n'existe pas encore dans `dir`.
 * Si `save-2026-09-23.md` existe, essaie `save-2026-09-23-2.md`,
 * `save-2026-09-23-3.md`, … jusqu'à 999.
 */
async function findUniqueFilename(
  dir: string,
  filename: string,
): Promise<string> {
  const ext = path.extname(filename);
  const base = filename.slice(0, -ext.length);

  let candidate = filename;
  for (let i = 2; i <= 999; i++) {
    try {
      await fs.access(path.join(dir, candidate));
    } catch {
      return candidate;
    }
    candidate = `${base}-${i}${ext}`;
  }

  // Repli improbable : suffixe temporel pour éviter l'échec.
  return `${base}-${Date.now()}${ext}`;
}

/* ------------------------------------------------------------------ */
/*  POST                                                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide (JSON attendu)." },
      { status: 400 },
    );
  }

  const parsed = savePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { paths, filename } = parsed.data;
  const format = detectFormat(filename);
  const absDir = path.join(process.cwd(), "public", "save-app");

  try {
    const result = await assembleDocument(paths, format);

    if (result.fileCount === 0) {
      return NextResponse.json(
        { error: "Aucun fichier lisible dans la sélection." },
        { status: 400 },
      );
    }

    await fs.mkdir(absDir, { recursive: true });

    // Anti-écrasement : on cherche un nom libre.
    const finalFilename = await findUniqueFilename(absDir, filename);
    const absFile = path.join(absDir, finalFilename);

    await fs.writeFile(absFile, result.document, "utf8");

    return NextResponse.json({
      saved: true,
      filename: finalFilename,
      publicPath: publicRelativePath(finalFilename),
      fileCount: result.fileCount,
      totalBytes: result.totalBytes,
      skipped: result.skipped,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Écriture impossible.", details: String(err) },
      { status: 500 },
    );
  }
}

/*
path :           app/api/back-studio/export/save/route.ts
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint POST qui écrit un document d'export dans
                 public/export-ia/<filename>. Protège contre la traversée de chemin et
                 n'accepte qu'un nom de fichier simple (lettres, chiffres, - _ .).
flow:            POST → parse JSON → docSaveSchema.safeParse → mkdir public/export-ia
                 (recursive) → vérifie que le chemin résolu reste dans PUBLIC_DIR →
                 fs.writeFile → NextResponse.json({ saved, filename, publicPath }).
ecosystem:       Dev = [
                   "@/app/back-studio/ExportToIA/page.tsx",
                   "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                   "@/lib/highlighter.ts",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/ExportView.tsx"]
imports:         ["next/server", "node:fs/promises", "node:path", "zod"]
exports:         ["POST", "runtime"]
useBy:           ["@/app/back-studio/ExportToIA/ExportView.tsx"]

userStories:     ["*en tant que développeur je veux sauvegarder un export dans /public"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const runtime = "nodejs";

const PUBLIC_DIR = path.join(process.cwd(), "public", "export-ia");

const bodySchema = z.object({
  filename: z
    .string()
    .min(1, "Nom de fichier requis.")
    .max(120, "Nom trop long.")
    .regex(
      /^[a-zA-Z0-9_\-.]+\.(md|txt|json)$/,
      "Nom invalide (lettres, chiffres, - _ . ; extension .md/.txt/.json).",
    ),
  content: z.string().min(1, "Contenu vide."),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { filename, content } = parsed.data;
  const target = path.join(PUBLIC_DIR, filename);

  // Garde-fou : le chemin résolu doit rester dans PUBLIC_DIR.
  if (!target.startsWith(PUBLIC_DIR + path.sep)) {
    return NextResponse.json({ error: "Chemin invalide." }, { status: 400 });
  }

  try {
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
    await fs.writeFile(target, content, "utf-8");
  } catch (err) {
    return NextResponse.json(
      { error: "Écriture impossible.", details: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    saved: true,
    filename,
    publicPath: `/export-ia/${filename}`,
  });
}

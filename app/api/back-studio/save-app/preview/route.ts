/*
path :           app/api/back-studio/save-app/preview/route.ts
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint POST /api/back-studio/save-app/preview. Lit les fichiers
                 sélectionnés, assemble le document (md ou json) et le renvoie au client
                 pour la copie. En cas de 400, renvoie la liste des chemins invalides
                 + les issues Zod détaillées, pour faciliter le diagnostic.
flow:            POST → req.json → previewPayloadSchema.safeParse → assembleDocument →
                 NextResponse.json(result). En échec : safeParse → collecte les chemins
                 invalides via safePath.safeParse individuel → 400 enrichi + console.error.
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
imports:         ["next/server",
                  "@/lib/dev/assembleDocument",
                  "@/lib/validations/save-app",
                  "paramètres reçus : req: NextRequest"]
exports:         ["POST", "runtime"]
useBy:           ["@/app/back-studio/saveApp/SaveAppView.tsx"]

userStories:     ["*en tant que développeur je veux copier le contenu réel des fichiers"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { NextResponse, type NextRequest } from "next/server";

import { assembleDocument } from "@/lib/dev/assembleDocument";
import { previewPayloadSchema, safePath } from "@/lib/validations/save-app";

export const runtime = "nodejs";

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

  const parsed = previewPayloadSchema.safeParse(body);
  if (!parsed.success) {
    // ---------- Diagnostic ----------
    const rawPaths = (body as { paths?: unknown })?.paths;
    const badPaths: { path: string; reason: string }[] = [];

    if (Array.isArray(rawPaths)) {
      for (const p of rawPaths) {
        const r = safePath.safeParse(p);
        if (!r.success) {
          badPaths.push({
            path: typeof p === "string" ? p : JSON.stringify(p),
            reason: r.error.issues[0]?.message ?? "Inconnu",
          });
        }
      }
    }

    console.error(
      "[preview] 400 — Body reçu:",
      JSON.stringify(body).slice(0, 800),
    );
    console.error("[preview] 400 — Issues Zod:", parsed.error.issues);
    console.error("[preview] 400 — Chemins invalides:", badPaths);

    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten().fieldErrors,
        badPaths,
      },
      { status: 400 },
    );
  }

  try {
    const result = await assembleDocument(
      parsed.data.paths,
      parsed.data.format,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Assemblage impossible.", details: String(err) },
      { status: 500 },
    );
  }
}

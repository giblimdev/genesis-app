/*
path :           app/api/back-studio/save-app/excludes/route.ts
projectId:       <à fournir>
type:            route
generic:         false

role:            Endpoint GET/PUT pour lire et écrire la configuration d'exclusion de
                 SaveApp (public/save-app/excludes.json). GET retourne la config actuelle
                 (valeurs par défaut si le fichier n'existe pas). PUT valide le payload
                 avec Zod puis écrit le fichier.
flow:            GET → readExcludes() → NextResponse.json({ config, path }).
                 PUT → parse JSON → excludesConfigSchema.safeParse → writeExcludes →
                 NextResponse.json({ saved, path }). Erreurs : 400 (payload invalide),
                 500 (écriture impossible).
ecosystem:       Dev = [
                   "@/app/back-studio/saveApp/page.tsx",
                   "@/app/back-studio/saveApp/excludes.ts",
                   "@/app/back-studio/saveApp/readAppFiles.ts",
                   "@/lib/dev/types.ts",
                   "@/lib/dev/header-parser.ts",
                   "@/lib/dev/fs-walker.ts",
                   "@/lib/validations/excludes.ts",
                 ]
relatedFiles:    ["@/app/back-studio/saveApp/excludes.ts",
                  "@/lib/validations/excludes.ts",
                  "@/lib/dev/types.ts"]
imports:         ["next/server",
                  "@/app/back-studio/saveApp/excludes",
                  "@/lib/validations/excludes",
                  "@/lib/dev/types"]
exports:         ["GET", "PUT", "runtime"]
useBy:           ["@/app/back-studio/saveApp/page.tsx"]

userStories:     ["*en tant que développeur je veux éditer les règles d'exclusion"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { NextResponse, type NextRequest } from "next/server";

import {
  EXCLUDES_PATH,
  readExcludes,
  writeExcludes,
} from "@/app/back-studio/saveApp/excludes";
import { excludesConfigSchema } from "@/lib/validations/excludes";
import type { ExcludesConfig } from "@/lib/dev/types";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  GET — lire la config                                               */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const config = await readExcludes();
    return NextResponse.json({
      config,
      path: EXCLUDES_PATH,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lecture impossible.", details: String(err) },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT — écrire la config                                             */
/* ------------------------------------------------------------------ */

export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide (JSON attendu)." },
      { status: 400 },
    );
  }

  const parsed = excludesConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Configuration invalide.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const config: ExcludesConfig = parsed.data;

  try {
    await writeExcludes(config);
  } catch (err) {
    return NextResponse.json(
      { error: "Écriture impossible.", details: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    saved: true,
    path: EXCLUDES_PATH,
    config,
  });
}

/*
path :           lib/highlighter.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Gestionnaire singleton d'un highlighter Shiki en mode "fine-grained bundle".
                 Supporte prisma, typescript, tsx, json, bash et markdown. Évite le bundle
                 complet (incompatible Turbopack) et met la promesse en cache global.
flow:            highlightCode({ code, lang, theme }) → getHighlighter() (singleton) →
                 codeToHtml → HTML coloré. Retourne null en cas d'échec ; l'appelant affiche
                 alors un fallback <pre> brut.
ecosystem:       Dev = [
                   "@/app/back-studio/ExportToIA/page.tsx",
                   "@/app/back-studio/ExportToIA/readProjectFiles.ts",
                   "@/lib/highlighter.ts",
                 ]
relatedFiles:    ["@/app/back-studio/ExportToIA/page.tsx",
                  "@/app/back-studio/ExportToIA/readProjectFiles.ts"]
imports:         ["shiki/core", "shiki/engine/oniguruma",
                  "@shikijs/langs/bash", "@shikijs/langs/json",
                  "@shikijs/langs/markdown", "@shikijs/langs/prisma",
                  "@shikijs/langs/tsx", "@shikijs/langs/typescript",
                  "@shikijs/themes/github-dark"]
exports:         ["highlightCode", "HighlightOptions", "LoadedLang"]
useBy:           ["@/app/back-studio/ExportToIA/page.tsx"]

userStories:     ["*en tant que développeur je veux colorer du code côté serveur"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";
import markdown from "@shikijs/langs/markdown";
import prisma from "@shikijs/langs/prisma";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";

import githubDark from "@shikijs/themes/github-dark";

const LANGUAGES = [prisma, typescript, tsx, json, bash, markdown] as const;

export type LoadedLang =
  "prisma" | "typescript" | "tsx" | "json" | "bash" | "markdown" | "text";

let highlighterPromise: Promise<HighlighterCore> | null = null;

async function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubDark],
      langs: [...LANGUAGES],
      engine: createOnigurumaEngine(() => import("shiki/wasm")),
    });
  }
  return highlighterPromise;
}

export interface HighlightOptions {
  readonly code: string;
  readonly lang?: string;
  readonly theme?: string;
}

export async function highlightCode({
  code,
  lang = "text",
  theme = "github-dark",
}: HighlightOptions): Promise<string | null> {
  try {
    const highlighter = await getHighlighter();
    const loaded = highlighter.getLoadedLanguages();
    const effectiveLang = loaded.includes(lang) ? lang : "text";
    return highlighter.codeToHtml(code, { lang: effectiveLang, theme });
  } catch (error) {
    console.error("[highlightCode] Shiki error:", error);
    return null;
  }
}

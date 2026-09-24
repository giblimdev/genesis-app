/*
path :           lib/prompts/read-contributing.ts
tag :            ["prompt", "contributing"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Lecture serveur de CONTRIBUTING.md à la racine du projet.
                 Retourne le contenu du fichier s'il existe, sinon le
                 contenu par défaut. Ne lève jamais.

flow:            readContributing() → fs.readFile(CONTRIBUTING.md) →
                 si ENOENT : retourne DEFAULT_CONTRIBUTING_CONTENT
                 → sinon : retourne le contenu lu.

ecosystem:       Prompts = [
                   "@/lib/prompts/default-content.ts",
                   "@/lib/prompts/read-contributing.ts",
                 ]
relatedFiles:    ["@/lib/prompts/default-content.ts",
                  "@/app/back-studio/help-dev/prompt/page.tsx"]
imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/lib/prompts/default-content"]
exports:         ["readContributing", "CONTRIBUTING_PATH"]
useBy:           ["@/app/back-studio/help-dev/prompt/page.tsx"]

userStories:     ["*en tant que développeur je veux lire le CONTRIBUTING actuel"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_CONTRIBUTING_CONTENT } from "@/lib/prompts/default-content";

export const CONTRIBUTING_PATH = path.join(process.cwd(), "CONTRIBUTING.md");

export async function readContributing(): Promise<string> {
  try {
    return await fs.readFile(CONTRIBUTING_PATH, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return DEFAULT_CONTRIBUTING_CONTENT;
    }
    console.error("[readContributing]", err);
    return DEFAULT_CONTRIBUTING_CONTENT;
  }
}
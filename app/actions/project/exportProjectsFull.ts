/*
path :           app/actions/project/exportProjectsFull.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action qui retourne le snapshot complet (avec
                 enfants) de TOUS les projets de l'utilisateur connecté.
                 Utilisée par ExportJsonDialog pour le chargement lazy
                 du payload complet.

flow:            exportProjectsFull() → getSession() → si non connecté :
                 null → sinon serializeAllProjectsForDisk(userId).

ecosystem:       Dev = [
                   "@/app/actions/project/exportProjectsFull.ts",
                   "@/lib/project/serialize-all.ts",
                 ]
relatedFiles:    ["@/lib/project/serialize-all.ts",
                  "@/components/common/ExportJsonDialog.tsx",
                  "@/app/back-studio/scrum/page.tsx"]
imports:         ["server-only",
                  "@/lib/auth/session",
                  "@/lib/project/serialize-all"]
exports:         ["exportProjectsFull"]

userStories:     ["*en tant que développeur je veux exporter tous mes projets avec leurs dépendances"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { getSession } from "@/lib/auth/session";
import { serializeAllProjectsForDisk } from "@/lib/project/serialize-all";
import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

export async function exportProjectsFull(): Promise<
  ProjectDiskSnapshot[] | null
> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return serializeAllProjectsForDisk(session.user.id);
}
/*
path :           app/actions/project/exportProjectFull.ts
tag :            ["project", "export", "action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action qui retourne le snapshot complet (avec enfants)
                 d'UN projet de l'utilisateur connecté. Vérifie la session
                 puis l'accès au projet via assertProjectAccess. Utilisée par
                 ProjectExportDialog pour le chargement lazy.

flow:            exportProjectFull(projectId) → validation id →
                 getSession() → assertProjectAccess → si refusé : null →
                 serializeProjectForDisk({ includeChildren: true }) → retour
                 du snapshot (ou null).

ecosystem:       Project = [
                   "@/app/actions/project/exportProjectFull.ts",
                   "@/app/back-studio/scrum/[slug]/page.tsx",
                   "@/components/project/ProjectExportDialog.tsx",
                   "@/lib/project/serialize-for-disk.ts",
                   "@/lib/project/serialize-to-md.ts",
                 ]
relatedFiles:    ["@/lib/project/serialize-for-disk.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/project-access.ts",
                  "@/components/project/ProjectExportDialog.tsx"]
imports:         ["server-only",
                  "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/project/serialize-for-disk"]
exports:         ["exportProjectFull"]
useBy:           ["@/components/project/ProjectExportDialog.tsx"]

userStories:     ["*en tant que développeur je veux exporter un projet en JSON ou MD"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { getSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/auth/project-access";
import { serializeProjectForDisk } from "@/lib/project/serialize-for-disk";
import type { ProjectDiskSnapshot } from "@/lib/project/serialize-for-disk";

export async function exportProjectFull(
  projectId: string,
): Promise<ProjectDiskSnapshot | null> {
  if (typeof projectId !== "string" || projectId.length === 0) {
    return null;
  }

  const session = await getSession();
  if (!session?.user?.id) return null;

  const hasAccess = await assertProjectAccess(projectId, session.user.id);
  if (!hasAccess) return null;

  return serializeProjectForDisk(projectId, { includeChildren: true });
}
/*
path :           app/actions/sprint/changeSprintStatus.ts
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Action dédiée au CHANGEMENT DE STATUT d'un sprint.
                 Contourne volontairement le verrou d'édition mais applique
                 une matrice de transitions stricte (importée depuis
                 lib/sprint/transitions.ts — pas exportée ici car un
                 fichier "use server" ne peut exporter que des fonctions
                 async).

flow:            changeSprintStatus({ id, status }) → getSession() →
                 changeSprintStatusSchema.safeParse → findFirst sprint →
                 assertProjectAccess → no-op si même statut →
                 isValidTransition(current, next) → refus si interdit →
                 prisma.sprint.update({ status }) → revalidatePath.

ecosystem:       Dev = [
                   "@/app/actions/sprint/changeSprintStatus.ts",
                   "@/lib/sprint/transitions.ts",
                 ]
imports:         ["server-only", "next/cache",
                  "@/lib/prisma", "@/lib/auth/session",
                  "@/lib/auth/project-access",
                  "@/lib/sprint/transitions",
                  "@/lib/validations/sprint",
                  "@/lib/actions/types"]
exports:         ["changeSprintStatus"]
useBy:           ["@/components/sprint/SprintStatusSelect.tsx"]

userStories:     ["*en tant que développeur je veux changer le statut d'un sprint",
                  "*en tant que développeur je veux interdire la réactivation d'un sprint archivé"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/auth/project-access";
import {
  ALLOWED_TRANSITIONS,
  isValidTransition,
} from "@/lib/sprint/transitions";
import {
  changeSprintStatusSchema,
  SPRINT_STATUS_LABELS,
  type SprintStatus,
} from "@/lib/validations/sprint";
import type { ActionResult } from "@/lib/actions/types";

export async function changeSprintStatus(
  input: unknown,
): Promise<
  ActionResult<{
    id: string;
    projectId: string;
    status: SprintStatus;
  }>
> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Authentification requise." };
  }

  const parsed = changeSprintStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, status: nextStatus } = parsed.data;

  const current = await prisma.sprint.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, projectId: true, status: true },
  });
  if (!current) {
    return { success: false, error: "Sprint introuvable." };
  }

  const hasAccess = await assertProjectAccess(
    current.projectId,
    session.user.id,
  );
  if (!hasAccess) {
    return { success: false, error: "Accès refusé." };
  }

  /* ---------- No-op : statut identique ---------- */

  if (current.status === nextStatus) {
    return {
      success: true,
      data: {
        id: current.id,
        projectId: current.projectId,
        status: nextStatus,
      },
    };
  }

  /* ---------- Vérification de la matrice ---------- */

  const currentStatus = (
    current.status in ALLOWED_TRANSITIONS ? current.status : "planned"
  ) as SprintStatus;

  if (!isValidTransition(currentStatus, nextStatus)) {
    if (currentStatus === "completed") {
      return {
        success: false,
        error:
          "Un sprint archivé ne peut plus changer de statut. Son historique est figé.",
      };
    }

    const fromLabel = SPRINT_STATUS_LABELS[currentStatus];
    const toLabel = SPRINT_STATUS_LABELS[nextStatus];

    return {
      success: false,
      error: `Transition interdite : « ${fromLabel} » → « ${toLabel} ».`,
    };
  }

  /* ---------- Mise à jour ---------- */

  try {
    const updated = await prisma.sprint.update({
      where: { id: current.id },
      data: { status: nextStatus },
      select: { id: true, projectId: true, slug: true, status: true },
    });

    revalidatePath(`/back-studio/scrum/${updated.projectId}/sprints`);
    revalidatePath(
      `/back-studio/scrum/${updated.projectId}/sprints/${updated.slug}`,
    );

    return {
      success: true,
      data: {
        id: updated.id,
        projectId: updated.projectId,
        status: updated.status as SprintStatus,
      },
    };
  } catch (err) {
    console.error("[changeSprintStatus]", err);
    return {
      success: false,
      error: `Passage à « ${SPRINT_STATUS_LABELS[nextStatus]} » impossible.`,
    };
  }
}
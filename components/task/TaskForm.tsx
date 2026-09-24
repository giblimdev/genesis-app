/*
path :           components/task/TaskForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'une tâche rattachée à une
                 UserStory. Champs : titre, description, assignee (liste des
                 membres du projet), estimateHours, statut, blockedBy (texte
                 multiligne), notes.

flow:            Client Component → useForm → onSubmit → createTask() ou
                 updateTask() → succès : toast + router.push vers la story.

ecosystem:       Dev = ["@/components/task/TaskForm.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod", "zod",
                  "lucide-react", "sonner",
                  "@/components/ui/alert", "@/components/ui/button",
                  "@/components/ui/field", "@/components/ui/input",
                  "@/app/actions/task/createTask",
                  "@/app/actions/task/updateTask",
                  "@/lib/validations/task",
                  "@/lib/user-story/json"]
exports:         ["TaskForm", "TaskFormProps", "AssigneeOption"]

userStories:     ["*en tant que développeur je veux saisir une tâche dans un formulaire"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTask } from "@/app/actions/task/createTask";
import { updateTask } from "@/app/actions/task/updateTask";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  createTaskSchema,
  type CreateTaskInput,
} from "@/lib/validations/task";
import {
  parseStringList,
  stringifyStringList,
} from "@/lib/user-story/json";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FormValues = z.input<typeof createTaskSchema>;
type FormOutput = CreateTaskInput;

export type AssigneeOption = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type TaskFormProps =
  | {
      readonly mode: "create";
      readonly userStoryId: string;
      readonly projectSlug: string;
      readonly storySlug: string;
      readonly assignees: readonly AssigneeOption[];
    }
  | {
      readonly mode: "edit";
      readonly userStoryId: string;
      readonly projectSlug: string;
      readonly storySlug: string;
      readonly assignees: readonly AssigneeOption[];
      readonly initialData: {
        readonly id: string;
        readonly title: string;
        readonly description: string;
        readonly assigneeId: string | null;
        readonly estimateHours: number;
        readonly status: string;
        readonly blockedBy: string | null;
        readonly notes: string | null;
      };
    };

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskForm(props: TaskFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [formError, setFormError] = useState<string | null>(null);

  const initial = isEdit ? props.initialData : null;

  const initialBlockedByInput = initial
    ? parseStringList(initial.blockedBy).join("\n")
    : "";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      userStoryId: props.userStoryId,
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      assigneeId: initial?.assigneeId ?? "",
      estimateHours: initial?.estimateHours ?? 0,
      status: (initial?.status as FormOutput["status"]) ?? "todo",
      blockedByInput: initialBlockedByInput,
      notes: initial?.notes ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: FormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      assigneeId: values.assigneeId?.trim() || "",
      blockedByInput: values.blockedByInput?.trim() || "",
      notes: values.notes?.trim() || "",
    };

    const result = isEdit
      ? await updateTask({ id: props.initialData.id, ...payload })
      : await createTask(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "Tâche mise à jour." : "Tâche créée.");
    router.push(
      `/back-studio/scrum/${props.projectSlug}/backlog/${props.storySlug}`,
    );
    router.refresh();
  }

  const backHref = `/back-studio/scrum/${props.projectSlug}/backlog/${props.storySlug}`;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      noValidate
    >
      {formError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Titre */}
      <Field data-invalid={errors.title ? "" : undefined}>
        <FieldLabel htmlFor="task-title">Titre</FieldLabel>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              {...field}
              id="task-title"
              autoComplete="off"
              placeholder="Créer la route POST /auth/login"
              className="h-11"
              aria-invalid={errors.title ? true : undefined}
            />
          )}
        />
        {errors.title?.message && (
          <FieldError errors={[{ message: errors.title.message }]} />
        )}
      </Field>

      {/* Description */}
      <Field data-invalid={errors.description ? "" : undefined}>
        <FieldLabel htmlFor="task-description">Description</FieldLabel>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <textarea
              {...field}
              id="task-description"
              rows={4}
              spellCheck={false}
              placeholder="Détail technique, comportement attendu, points d'attention…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.description ? true : undefined}
            />
          )}
        />
        {errors.description?.message && (
          <FieldError errors={[{ message: errors.description.message }]} />
        )}
      </Field>

      {/* Assignee + estimate + statut */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={errors.assigneeId ? "" : undefined}>
          <FieldLabel htmlFor="task-assignee">Assigné à</FieldLabel>
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                id="task-assignee"
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">— Non assigné —</option>
                {props.assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            )}
          />
        </Field>

        <Field data-invalid={errors.estimateHours ? "" : undefined}>
          <FieldLabel htmlFor="task-estimate">Estimation (h)</FieldLabel>
          <Controller
            control={control}
            name="estimateHours"
            render={({ field }) => (
              <Input
                {...field}
                value={String(field.value ?? 0)}
                id="task-estimate"
                type="number"
                min={0}
                className="h-11 font-mono"
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            )}
          />
        </Field>

        <Field data-invalid={errors.status ? "" : undefined}>
          <FieldLabel htmlFor="task-status">Statut</FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? "todo"}
                id="task-status"
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
      </div>

      {/* BlockedBy */}
      <Field data-invalid={errors.blockedByInput ? "" : undefined}>
        <FieldLabel htmlFor="task-blocked-by">
          Bloquée par{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (une ligne = un identifiant ou un titre)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="blockedByInput"
          render={({ field }) => (
            <textarea
              {...field}
              value={field.value ?? ""}
              id="task-blocked-by"
              rows={3}
              spellCheck={false}
              placeholder={"task-abc123\nCréer la table Account"}
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          )}
        />
      </Field>

      {/* Notes */}
      <Field data-invalid={errors.notes ? "" : undefined}>
        <FieldLabel htmlFor="task-notes">
          Notes{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (optionnel)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <textarea
              {...field}
              value={field.value ?? ""}
              id="task-notes"
              rows={3}
              spellCheck={false}
              placeholder="Contraintes, décisions, liens…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          )}
        />
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              {isEdit ? "Enregistrer" : "Créer la tâche"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
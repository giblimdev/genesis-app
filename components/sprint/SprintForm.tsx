/*
path :           components/sprint/SprintForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'un sprint. Auto-suggère
                 le slug depuis le nom (tant que non touché), calcule une
                 durationWeeks indicative à partir des dates, propose un
                 AccentPicker.

flow:            Client Component → useForm → onSubmit → createSprint() ou
                 updateSprint() → succès : toast + router.push vers le sprint.

ecosystem:       Dev = ["@/components/sprint/SprintForm.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod", "zod",
                  "lucide-react", "sonner",
                  "@/components/ui/alert", "@/components/ui/button",
                  "@/components/ui/field", "@/components/ui/input",
                  "@/components/common/AccentPicker",
                  "@/app/actions/sprint/createSprint",
                  "@/app/actions/sprint/updateSprint",
                  "@/lib/validations/sprint",
                  "@/utils/slugify"]
exports:         ["SprintForm", "SprintFormProps"]

userStories:     ["*en tant que développeur je veux saisir un sprint dans un formulaire"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AccentPicker } from "@/components/common/AccentPicker";
import { createSprint } from "@/app/actions/sprint/createSprint";
import { updateSprint } from "@/app/actions/sprint/updateSprint";
import {
  SPRINT_STATUSES,
  SPRINT_STATUS_LABELS,
  SPRINT_ACCENTS,
  createSprintSchema,
  type CreateSprintInput,
  type SprintAccent,
  type SprintStatus,
} from "@/lib/validations/sprint";
import { slugify } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FormValues = z.input<typeof createSprintSchema>;
type FormOutput = CreateSprintInput;
type AccentValue = SprintAccent | "";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toAccentValue(v: string | null | undefined): AccentValue {
  if (!v) return "";
  return (SPRINT_ACCENTS as readonly string[]).includes(v)
    ? (v as SprintAccent)
    : "";
}

/**
 * Convertit une valeur de champ date (potentiellement unknown) en
 * chaîne "YYYY-MM-DD" exploitable par <input type="date">.
 * Accepte : string (ISO ou YYYY-MM-DD), Date, null, undefined, inconnu.
 */
function toDateInput(v: unknown): string {
  if (!v) return "";

  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    return v.toISOString().slice(0, 10);
  }

  return "";
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type SprintFormProps =
  | {
      readonly mode: "create";
      readonly projectId: string;
      readonly projectSlug: string;
    }
  | {
      readonly mode: "edit";
      readonly projectId: string;
      readonly projectSlug: string;
      readonly initialData: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
        readonly goal: string;
        readonly startDate: string;
        readonly endDate: string;
        readonly durationWeeks: number;
        readonly status: string;
        readonly capacityPoints: number;
        readonly velocity: number | null;
        readonly notes: string | null;
        readonly accent: string | null;
      };
    };

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintForm(props: SprintFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const initial = isEdit ? props.initialData : null;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(createSprintSchema),
    defaultValues: {
      projectId: props.projectId,
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      goal: initial?.goal ?? "",
      startDate: initial?.startDate ?? "",
      endDate: initial?.endDate ?? "",
      durationWeeks: initial?.durationWeeks ?? 2,
      status: (initial?.status as SprintStatus) ?? "planned",
      capacityPoints: initial?.capacityPoints ?? 0,
      velocity: initial?.velocity ?? "",
      notes: initial?.notes ?? "",
      accent: toAccentValue(initial?.accent),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedName = useWatch({ control, name: "name" });

  useEffect(() => {
    if (!slugTouched && watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugTouched, setValue]);

  async function onSubmit(values: FormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      slug: values.slug?.trim() || "",
      notes: values.notes?.trim() || "",
      accent: values.accent?.trim() || "",
      velocity: values.velocity === "" ? "" : values.velocity,
    };

    const result = isEdit
      ? await updateSprint({ id: props.initialData.id, ...payload })
      : await createSprint(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "Sprint mis à jour." : "Sprint créé.");
    router.push(
      `/back-studio/scrum/${props.projectSlug}/sprints/${result.data.slug}`,
    );
    router.refresh();
  }

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

      {/* Nom */}
      <Field data-invalid={errors.name ? "" : undefined}>
        <FieldLabel htmlFor="sprint-name">Nom du sprint</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              id="sprint-name"
              autoComplete="off"
              placeholder="Sprint 1 — Fondations"
              className="h-11"
              aria-invalid={errors.name ? true : undefined}
            />
          )}
        />
        {errors.name?.message && (
          <FieldError errors={[{ message: errors.name.message }]} />
        )}
      </Field>

      {/* Slug */}
      <Field data-invalid={errors.slug ? "" : undefined}>
        <FieldLabel htmlFor="sprint-slug">Slug (URL)</FieldLabel>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="sprint-slug"
              autoComplete="off"
              spellCheck={false}
              placeholder="sprint-1-fondations"
              className="h-11 font-mono text-sm"
              onChange={(e) => {
                setSlugTouched(true);
                field.onChange(e);
              }}
              aria-invalid={errors.slug ? true : undefined}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Laissé vide → généré depuis le nom.
        </p>
      </Field>

      {/* Objectif */}
      <Field data-invalid={errors.goal ? "" : undefined}>
        <FieldLabel htmlFor="sprint-goal">Objectif</FieldLabel>
        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <textarea
              {...field}
              id="sprint-goal"
              rows={3}
              spellCheck={false}
              placeholder="Livrer l'authentification email + mot de passe et les pages login/register."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.goal ? true : undefined}
            />
          )}
        />
        {errors.goal?.message && (
          <FieldError errors={[{ message: errors.goal.message }]} />
        )}
      </Field>

      {/* Dates + durée */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={errors.startDate ? "" : undefined}>
          <FieldLabel htmlFor="sprint-start">Début</FieldLabel>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <Input
                id="sprint-start"
                type="date"
                value={toDateInput(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className="h-11"
                aria-invalid={errors.startDate ? true : undefined}
              />
            )}
          />
          {errors.startDate?.message && (
            <FieldError errors={[{ message: errors.startDate.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.endDate ? "" : undefined}>
          <FieldLabel htmlFor="sprint-end">Fin</FieldLabel>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <Input
                id="sprint-end"
                type="date"
                value={toDateInput(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className="h-11"
                aria-invalid={errors.endDate ? true : undefined}
              />
            )}
          />
          {errors.endDate?.message && (
            <FieldError errors={[{ message: errors.endDate.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.durationWeeks ? "" : undefined}>
          <FieldLabel htmlFor="sprint-duration">Durée (sem.)</FieldLabel>
          <Controller
            control={control}
            name="durationWeeks"
            render={({ field }) => (
              <Input
                {...field}
                value={String(field.value ?? 2)}
                id="sprint-duration"
                type="number"
                min={1}
                max={52}
                className="h-11 font-mono"
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                aria-invalid={errors.durationWeeks ? true : undefined}
              />
            )}
          />
        </Field>
      </div>

      {/* Statut + capacité + velocity */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={errors.status ? "" : undefined}>
          <FieldLabel htmlFor="sprint-status">Statut</FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? "planned"}
                id="sprint-status"
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                {SPRINT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SPRINT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Un sprint « en cours », « archivé » ou « annulé » est verrouillé.
          </p>
        </Field>

        <Field data-invalid={errors.capacityPoints ? "" : undefined}>
          <FieldLabel htmlFor="sprint-capacity">Capacité (pts)</FieldLabel>
          <Controller
            control={control}
            name="capacityPoints"
            render={({ field }) => (
              <Input
                {...field}
                value={String(field.value ?? 0)}
                id="sprint-capacity"
                type="number"
                min={0}
                className="h-11 font-mono"
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            )}
          />
        </Field>

        <Field data-invalid={errors.velocity ? "" : undefined}>
          <FieldLabel htmlFor="sprint-velocity">Vélocité (pts)</FieldLabel>
          <Controller
            control={control}
            name="velocity"
            render={({ field }) => (
              <Input
                value={
                  field.value === "" || field.value === undefined
                    ? ""
                    : String(field.value)
                }
                id="sprint-velocity"
                type="number"
                min={0}
                placeholder="—"
                className="h-11 font-mono"
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? "" : e.target.valueAsNumber,
                  )
                }
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field data-invalid={errors.notes ? "" : undefined}>
        <FieldLabel htmlFor="sprint-notes">
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
              id="sprint-notes"
              rows={3}
              spellCheck={false}
              placeholder="Contraintes, décisions, rappels…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          )}
        />
      </Field>

      {/* Accent */}
      <Field data-invalid={errors.accent ? "" : undefined}>
        <FieldLabel>Accent</FieldLabel>
        <Controller
          control={control}
          name="accent"
          render={({ field }) => (
            <AccentPicker
              name="accent"
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              disabled={isSubmitting}
            />
          )}
        />
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={
            isEdit
              ? `/back-studio/scrum/${props.projectSlug}/sprints/${props.initialData.slug}`
              : `/back-studio/scrum/${props.projectSlug}/sprints`
          }
          className={buttonVariants({ variant: "outline" })}
        >
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
              {isEdit ? "Enregistrer" : "Créer le sprint"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
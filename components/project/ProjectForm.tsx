/*
path :           components/project/ProjectForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'un projet. Utilise react-hook-form
                 + zodResolver(createProjectSchema). En mode création, le slug est
                 auto-suggéré depuis le nom tant que l'utilisateur ne l'a pas édité.
flow:            Client Component → useForm → onSubmit → createProject() ou updateProject()
                 → en cas d'échec : setFormError + fieldErrors → en cas de succès :
                 toast + router.push(`/back-studio/scrum/${slug}`) + router.refresh().
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/edit/page.tsx",
                   "@/components/project/ProjectForm.tsx",
                 ]
relatedFiles:    ["@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/lib/validations/project.ts",
                  "@/components/ui/button.tsx",
                  "@/components/ui/field.tsx",
                  "@/components/ui/input.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "zod",
                  "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/app/actions/project/createProject",
                  "@/app/actions/project/updateProject",
                  "@/lib/validations/project",
                  "@/lib/utils/slugify"]
exports:         ["ProjectForm", "ProjectFormProps"]

userStories:     ["*en tant que développeur je veux saisir un projet dans un formulaire"]
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
import { createProject } from "@/app/actions/project/createProject";
import { updateProject } from "@/app/actions/project/updateProject";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  createProjectSchema,
  type CreateProjectInput,
  type ProjectStatus,
} from "@/lib/validations/project";
import { slugify } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Type du formulaire = INPUT du schéma (status optionnel à cause du
 * `.default("planned")`). C'est ce que react-hook-form manipule.
 */
type ProjectFormValues = z.input<typeof createProjectSchema>;

/**
 * Type de sortie = ce que le schéma renvoie après parse (status requis).
 * C'est ce que reçoit onSubmit et ce que les Server Actions attendent.
 */
type ProjectFormOutput = CreateProjectInput;

export type ProjectFormProps =
  | { readonly mode: "create" }
  | {
      readonly mode: "edit";
      readonly initialData: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
        readonly tagline: string | null;
        readonly description: string;
        readonly status: string;
      };
    };

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ProjectForm(props: ProjectFormProps) {
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
  } = useForm<ProjectFormValues, unknown, ProjectFormOutput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      tagline: initial?.tagline ?? "",
      description: initial?.description ?? "",
      status: (initial?.status as ProjectStatus) ?? "planned",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedName = useWatch({ control, name: "name" });

  /* Auto-suggestion du slug tant que l'utilisateur ne l'a pas touché. */
  useEffect(() => {
    if (!slugTouched && watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugTouched, setValue]);

  async function onSubmit(values: ProjectFormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      // Le serveur régénère le slug si vide ; on envoie la valeur courante.
      slug: values.slug?.trim() || "",
    };

    const result = isEdit
      ? await updateProject({ id: props.initialData.id, ...payload })
      : await createProject(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "Projet mis à jour." : "Projet créé.");
    router.push(`/back-studio/scrum/${result.data.slug}`);
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
        <FieldLabel htmlFor="project-name">Nom du projet</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              id="project-name"
              autoComplete="off"
              placeholder="Refonte du site vitrine"
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
        <FieldLabel htmlFor="project-slug">Slug (URL)</FieldLabel>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="project-slug"
              autoComplete="off"
              spellCheck={false}
              placeholder="refonte-site-vitrine"
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
          Laissez vide pour générer automatiquement depuis le nom.
        </p>
        {errors.slug?.message && (
          <FieldError errors={[{ message: errors.slug.message }]} />
        )}
      </Field>

      {/* Accroche */}
      <Field data-invalid={errors.tagline ? "" : undefined}>
        <FieldLabel htmlFor="project-tagline">Accroche</FieldLabel>
        <Controller
          control={control}
          name="tagline"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="project-tagline"
              autoComplete="off"
              placeholder="Une ligne qui résume le projet."
              className="h-11"
              aria-invalid={errors.tagline ? true : undefined}
            />
          )}
        />
        {errors.tagline?.message && (
          <FieldError errors={[{ message: errors.tagline.message }]} />
        )}
      </Field>

      {/* Description */}
      <Field data-invalid={errors.description ? "" : undefined}>
        <FieldLabel htmlFor="project-description">Description</FieldLabel>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <textarea
              {...field}
              id="project-description"
              rows={6}
              spellCheck={false}
              placeholder="Objectifs, périmètre, contraintes…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.description ? true : undefined}
            />
          )}
        />
        {errors.description?.message && (
          <FieldError errors={[{ message: errors.description.message }]} />
        )}
      </Field>

      {/* Statut */}
      <Field data-invalid={errors.status ? "" : undefined}>
        <FieldLabel htmlFor="project-status">Statut</FieldLabel>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? "planned"}
              id="project-status"
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          )}
        />
        {errors.status?.message && (
          <FieldError errors={[{ message: errors.status.message }]} />
        )}
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={
            isEdit
              ? `/back-studio/scrum/${props.initialData.slug}`
              : "/back-studio/scrum"
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
              {isEdit ? "Enregistrer" : "Créer le projet"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

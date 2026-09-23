/*
path :           components/feature/FeatureForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'une feature. Utilise
                 react-hook-form + zodResolver(createFeatureSchema). Le slug est
                 auto-suggéré depuis le nom tant que l'utilisateur ne l'a pas édité.
                 Utilise AccentPicker pour le champ accent.
flow:            Client Component → useForm → onSubmit → createFeature() ou
                 updateFeature() → succès : toast + router.push vers la feature.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/features/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/features/[featureSlug]/edit/page.tsx",
                   "@/components/feature/FeatureForm.tsx",
                 ]
relatedFiles:    ["@/app/actions/feature/createFeature.ts",
                  "@/app/actions/feature/updateFeature.ts",
                  "@/lib/validations/feature.ts",
                  "@/components/common/AccentPicker.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "zod", "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/common/AccentPicker",
                  "@/app/actions/feature/createFeature",
                  "@/app/actions/feature/updateFeature",
                  "@/lib/validations/feature",
                  "@/lib/utils/slugify"]
exports:         ["FeatureForm", "FeatureFormProps"]

userStories:     ["*en tant que développeur je veux saisir une feature dans un formulaire"]
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
import { createFeature } from "@/app/actions/feature/createFeature";
import { updateFeature } from "@/app/actions/feature/updateFeature";
import {
  FEATURE_MODULES,
  FEATURE_MODULE_LABELS,
  createFeatureSchema,
  type CreateFeatureInput,
} from "@/lib/validations/feature";
import { slugify } from "@/lib/utils/slugify";

type FeatureFormValues = z.input<typeof createFeatureSchema>;
type FeatureFormOutput = CreateFeatureInput;

export type FeatureFormProps =
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
        readonly description: string;
        readonly module: string;
        readonly icon: string | null;
        readonly accent: string | null;
      };
    };

export function FeatureForm(props: FeatureFormProps) {
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
  } = useForm<FeatureFormValues, unknown, FeatureFormOutput>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: {
      projectId: props.projectId,
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      module: (initial?.module as FeatureFormOutput["module"]) ?? "conception",
      icon: initial?.icon ?? "",
      accent: initial?.accent ?? "",
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

  async function onSubmit(values: FeatureFormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      slug: values.slug?.trim() || "",
      icon: values.icon?.trim() || "",
      accent: values.accent?.trim() || "",
    };

    const result = isEdit
      ? await updateFeature({ id: props.initialData.id, ...payload })
      : await createFeature(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "Feature mise à jour." : "Feature créée.");
    router.push(
      `/back-studio/scrum/${props.projectSlug}/features/${result.data.slug}`,
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
        <FieldLabel htmlFor="feature-name">Nom de la feature</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              id="feature-name"
              autoComplete="off"
              placeholder="Authentification email / mot de passe"
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
        <FieldLabel htmlFor="feature-slug">Slug (URL)</FieldLabel>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="feature-slug"
              autoComplete="off"
              spellCheck={false}
              placeholder="auth-email-password"
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

      {/* Description */}
      <Field data-invalid={errors.description ? "" : undefined}>
        <FieldLabel htmlFor="feature-description">Description</FieldLabel>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <textarea
              {...field}
              id="feature-description"
              rows={5}
              spellCheck={false}
              placeholder="Objectifs fonctionnels, périmètre, dépendances…"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.description ? true : undefined}
            />
          )}
        />
        {errors.description?.message && (
          <FieldError errors={[{ message: errors.description.message }]} />
        )}
      </Field>

      {/* Module */}
      <Field data-invalid={errors.module ? "" : undefined}>
        <FieldLabel htmlFor="feature-module">Module</FieldLabel>
        <Controller
          control={control}
          name="module"
          render={({ field }) => (
            <select
              {...field}
              id="feature-module"
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            >
              {FEATURE_MODULES.map((m) => (
                <option key={m} value={m}>
                  {FEATURE_MODULE_LABELS[m]}
                </option>
              ))}
            </select>
          )}
        />
        {errors.module?.message && (
          <FieldError errors={[{ message: errors.module.message }]} />
        )}
      </Field>

      {/* Icône */}
      <Field data-invalid={errors.icon ? "" : undefined}>
        <FieldLabel htmlFor="feature-icon">
          Icône{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (nom lucide-react, optionnel)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="feature-icon"
              autoComplete="off"
              spellCheck={false}
              placeholder="ShieldCheck, Sparkles, Database…"
              className="h-11 font-mono text-sm"
              aria-invalid={errors.icon ? true : undefined}
            />
          )}
        />
        {errors.icon?.message && (
          <FieldError errors={[{ message: errors.icon.message }]} />
        )}
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
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.accent?.message && (
          <FieldError errors={[{ message: errors.accent.message }]} />
        )}
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={
            isEdit
              ? `/back-studio/scrum/${props.projectSlug}/features/${props.initialData.slug}`
              : `/back-studio/scrum/${props.projectSlug}/features`
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
              {isEdit ? "Enregistrer" : "Créer la feature"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
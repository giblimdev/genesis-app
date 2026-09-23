/*
path :           components/persona/PersonaForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'un persona. Utilise react-hook-form
                 + zodResolver(createPersonaSchema). Le slug est auto-suggéré depuis le
                 nom tant que l'utilisateur ne l'a pas édité. Les keywords sont saisis
                 sous forme de chaîne séparée par des virgules, puis convertis côté
                 action via parseKeywordsInput + stringifyKeywords.
flow:            Client Component → useForm → onSubmit → createPersona() ou
                 updatePersona() → succès : toast + router.push vers le persona.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/personas/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/personas/[personaSlug]/edit/page.tsx",
                   "@/components/persona/PersonaForm.tsx",
                 ]
relatedFiles:    ["@/app/actions/persona/createPersona.ts",
                  "@/app/actions/persona/updatePersona.ts",
                  "@/lib/validations/persona.ts",
                  "@/components/common/AccentPicker.tsx",
                  "@/utils/keywords"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "zod", "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/common/AccentPicker",
                  "@/app/actions/persona/createPersona",
                  "@/app/actions/persona/updatePersona",
                  "@/lib/validations/persona",
                  "@/utils/slugify", "@/utils/keywords"]
exports:         ["PersonaForm", "PersonaFormProps"]

userStories:     ["*en tant que développeur je veux saisir un persona dans un formulaire"]
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
import { createPersona } from "@/app/actions/persona/createPersona";
import { updatePersona } from "@/app/actions/persona/updatePersona";
import {
  PERSONA_ACCENTS,
  createPersonaSchema,
  type CreatePersonaInput,
  type PersonaAccent,
} from "@/lib/validations/persona";
import { slugify } from "@/utils/slugify";
import { parseKeywordsJson } from "@/utils/keywords";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PersonaFormValues = z.input<typeof createPersonaSchema>;
type PersonaFormOutput = CreatePersonaInput;

type AccentValue = PersonaAccent | "";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toAccentValue(v: string | null | undefined): AccentValue {
  if (!v) return "";
  return (PERSONA_ACCENTS as readonly string[]).includes(v)
    ? (v as PersonaAccent)
    : "";
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type PersonaFormProps =
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
        readonly value: string | null;
        readonly keywords: string | null;
        readonly icon: string | null;
        readonly accent: string | null;
      };
    };

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function PersonaForm(props: PersonaFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const initial = isEdit ? props.initialData : null;

  /* Conversion du JSON keywords en chaîne séparée par des virgules. */
  const initialKeywordsInput = initial
    ? parseKeywordsJson(initial.keywords).join(", ")
    : "";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonaFormValues, unknown, PersonaFormOutput>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: {
      projectId: props.projectId,
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      value: initial?.value ?? "",
      keywordsInput: initialKeywordsInput,
      icon: initial?.icon ?? "",
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

  async function onSubmit(values: PersonaFormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      slug: values.slug?.trim() || "",
      value: values.value?.trim() || "",
      keywordsInput: values.keywordsInput?.trim() || "",
      icon: values.icon?.trim() || "",
      accent: values.accent?.trim() || "",
    };

    const result = isEdit
      ? await updatePersona({ id: props.initialData.id, ...payload })
      : await createPersona(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "Persona mis à jour." : "Persona créé.");
    router.push(
      `/back-studio/scrum/${props.projectSlug}/personas/${result.data.slug}`,
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
        <FieldLabel htmlFor="persona-name">Nom du persona</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              id="persona-name"
              autoComplete="off"
              placeholder="CTO pressé"
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
        <FieldLabel htmlFor="persona-slug">Slug (URL)</FieldLabel>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="persona-slug"
              autoComplete="off"
              spellCheck={false}
              placeholder="cto-presse"
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

      {/* Valeur */}
      <Field data-invalid={errors.value ? "" : undefined}>
        <FieldLabel htmlFor="persona-value">
          Valeur{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (une ligne, optionnel)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="value"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="persona-value"
              autoComplete="off"
              placeholder="Décide vite, veut des résultats concrets"
              className="h-11"
              aria-invalid={errors.value ? true : undefined}
            />
          )}
        />
        {errors.value?.message && (
          <FieldError errors={[{ message: errors.value.message }]} />
        )}
      </Field>

      {/* Keywords */}
      <Field data-invalid={errors.keywordsInput ? "" : undefined}>
        <FieldLabel htmlFor="persona-keywords">
          Mots-clés{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (séparés par des virgules)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="keywordsInput"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="persona-keywords"
              autoComplete="off"
              spellCheck={false}
              placeholder="autonomie, ROI, rapidité"
              className="h-11"
              aria-invalid={errors.keywordsInput ? true : undefined}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Ex.&nbsp;: <code className="font-mono">autonomie, ROI, rapidité</code>.
          Les doublons sont supprimés automatiquement.
        </p>
        {errors.keywordsInput?.message && (
          <FieldError errors={[{ message: errors.keywordsInput.message }]} />
        )}
      </Field>

      {/* Icône */}
      <Field data-invalid={errors.icon ? "" : undefined}>
        <FieldLabel htmlFor="persona-icon">
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
              id="persona-icon"
              autoComplete="off"
              spellCheck={false}
              placeholder="Briefcase, Rocket, Heart…"
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
              onChange={(v) => field.onChange(v)}
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
              ? `/back-studio/scrum/${props.projectSlug}/personas/${props.initialData.slug}`
              : `/back-studio/scrum/${props.projectSlug}/personas`
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
              {isEdit ? "Enregistrer" : "Créer le persona"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
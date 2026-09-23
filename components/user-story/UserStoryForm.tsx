/*
path :           components/user-story/UserStoryForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'une user story. Gère les 2 modes
                 (Epic si aucun parent, Story sinon) via un select de parent optionnel.
                 Les champs JSON (acceptanceCriteria, dodChecked, linkedFiles) sont
                 saisis en texte multiligne (une ligne = un élément).
flow:            Client Component → useForm → onSubmit → createUserStory() ou
                 updateUserStory() → succès : toast + router.push vers la story.
ecosystem:       Dev = [
                   "@/app/back-studio/scrum/[slug]/backlog/new/page.tsx",
                   "@/app/back-studio/scrum/[slug]/backlog/[storySlug]/edit/page.tsx",
                   "@/components/user-story/UserStoryForm.tsx",
                 ]
relatedFiles:    ["@/app/actions/user-story/createUserStory.ts",
                  "@/app/actions/user-story/updateUserStory.ts",
                  "@/lib/validations/user-story.ts",
                  "@/lib/user-story/json.ts",
                  "@/components/common/AccentPicker.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "zod", "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/common/AccentPicker",
                  "@/app/actions/user-story/createUserStory",
                  "@/app/actions/user-story/updateUserStory",
                  "@/lib/validations/user-story",
                  "@/lib/user-story/json",
                  "@/utils/slugify"]
exports:         ["UserStoryForm", "UserStoryFormProps"]

userStories:     ["*en tant que développeur je veux saisir une user story dans un formulaire"]
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
import { createUserStory } from "@/app/actions/user-story/createUserStory";
import { updateUserStory } from "@/app/actions/user-story/updateUserStory";
import {
  STORY_STATUSES,
  STORY_STATUS_LABELS,
  STORY_ACCENTS,
  STORY_PRIORITY_MIN,
  STORY_PRIORITY_MAX,
  createUserStorySchema,
  type CreateUserStoryInput,
  type StoryAccent,
  type StoryStatus,
} from "@/lib/validations/user-story";
import {
  parseAcceptanceCriteria,
  parseStringList,
} from "@/lib/user-story/json";
import { slugify } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type UserStoryFormValues = z.input<typeof createUserStorySchema>;
type UserStoryFormOutput = CreateUserStoryInput;

type AccentValue = StoryAccent | "";

export type EpicOption = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
};

export type SprintOption = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type PersonaOption = {
  readonly slug: string;
  readonly name: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toAccentValue(v: string | null | undefined): AccentValue {
  if (!v) return "";
  return (STORY_ACCENTS as readonly string[]).includes(v)
    ? (v as StoryAccent)
    : "";
}

function toStatusValue(v: string | null | undefined): StoryStatus {
  if (!v) return "backlog";
  return (STORY_STATUSES as readonly string[]).includes(v)
    ? (v as StoryStatus)
    : "backlog";
}

/** Sérialise une liste en texte multiligne pour l'édition. */
function toMultiline(list: readonly string[]): string {
  return list.join("\n");
}

/** Idem pour les critères d'acceptation (on affiche juste le texte). */
function acceptanceToMultiline(raw: string | null): string {
  return parseAcceptanceCriteria(raw)
    .map((ac) => ac.text)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type UserStoryFormProps =
  | {
      readonly mode: "create";
      readonly projectId: string;
      readonly projectSlug: string;
      readonly epics: readonly EpicOption[];
      readonly sprints: readonly SprintOption[];
      readonly personas: readonly PersonaOption[];
      /** Parent pré-sélectionné (cas où l'on crée une Story dans un Epic). */
      readonly initialParentId?: string;
    }
  | {
      readonly mode: "edit";
      readonly projectId: string;
      readonly projectSlug: string;
      readonly epics: readonly EpicOption[];
      readonly sprints: readonly SprintOption[];
      readonly personas: readonly PersonaOption[];
      readonly initialData: {
        readonly id: string;
        readonly parentId: string | null;
        readonly title: string;
        readonly slug: string;
        readonly personaRef: string | null;
        readonly asA: string;
        readonly iWant: string;
        readonly soThat: string;
        readonly status: string;
        readonly priority: number;
        readonly storyPoints: number | null;
        readonly accent: string | null;
        readonly sprintId: string | null;
        readonly acceptanceCriteria: string | null;
        readonly dodChecked: string | null;
        readonly linkedFiles: string | null;
      };
    };

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryForm(props: UserStoryFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const initial = isEdit ? props.initialData : null;
  const defaultParentId = isEdit
    ? initial?.parentId ?? ""
    : props.initialParentId ?? "";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserStoryFormValues, unknown, UserStoryFormOutput>({
    resolver: zodResolver(createUserStorySchema),
    defaultValues: {
      projectId: props.projectId,
      parentId: defaultParentId,
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      personaRef: initial?.personaRef ?? "",
      asA: initial?.asA ?? "",
      iWant: initial?.iWant ?? "",
      soThat: initial?.soThat ?? "",
      status: toStatusValue(initial?.status),
      priority: initial?.priority ?? 5,
      storyPoints: initial?.storyPoints ?? "",
      accent: toAccentValue(initial?.accent),
      sprintId: initial?.sprintId ?? "",
      acceptanceInput: acceptanceToMultiline(initial?.acceptanceCriteria ?? null),
      dodInput: toMultiline(parseStringList(initial?.dodChecked ?? null)),
      linkedFilesInput: toMultiline(parseStringList(initial?.linkedFiles ?? null)),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedTitle = useWatch({ control, name: "title" });
  const watchedParentId = useWatch({ control, name: "parentId" });

  useEffect(() => {
    if (!slugTouched && watchedTitle) {
      setValue("slug", slugify(watchedTitle), { shouldValidate: false });
    }
  }, [watchedTitle, slugTouched, setValue]);

  const isEpic = !watchedParentId;

  async function onSubmit(values: UserStoryFormOutput) {
    setFormError(null);

    const payload = {
      ...values,
      parentId: values.parentId?.trim() || "",
      slug: values.slug?.trim() || "",
      personaRef: values.personaRef?.trim() || "",
      accent: values.accent?.trim() || "",
      sprintId: values.sprintId?.trim() || "",
      acceptanceInput: values.acceptanceInput?.trim() || "",
      dodInput: values.dodInput?.trim() || "",
      linkedFilesInput: values.linkedFilesInput?.trim() || "",
    };

    const result = isEdit
      ? await updateUserStory({ id: props.initialData.id, ...payload })
      : await createUserStory(payload);

    if (!result.success) {
      setFormError(result.error);
      if (result.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        if (first) setFormError(`${result.error} ${first}`);
      }
      return;
    }

    toast.success(isEdit ? "User story mise à jour." : "User story créée.");
    router.push(
      `/back-studio/scrum/${props.projectSlug}/backlog/${result.data.slug}`,
    );
    router.refresh();
  }

  /* Empêche de choisir une story elle-même comme parent (mode edit). */
  const epicOptions = isEdit
    ? props.epics.filter((e) => e.id !== props.initialData.id)
    : props.epics;

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

      {/* Parent (Epic) */}
      <Field data-invalid={errors.parentId ? "" : undefined}>
        <FieldLabel htmlFor="story-parent">
          Rattacher à un Epic{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (laisser vide pour créer un Epic racine)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="parentId"
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? ""}
              id="story-parent"
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">— Aucun (Epic racine) —</option>
              {epicOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {isEpic
            ? "Mode Epic : cette story sera un conteneur de haut niveau."
            : "Mode Story : cette story sera rattachée à l'Epic sélectionné."}
        </p>
        {errors.parentId?.message && (
          <FieldError errors={[{ message: errors.parentId.message }]} />
        )}
      </Field>

      {/* Titre */}
      <Field data-invalid={errors.title ? "" : undefined}>
        <FieldLabel htmlFor="story-title">Titre</FieldLabel>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              {...field}
              id="story-title"
              autoComplete="off"
              placeholder="Authentification par email et mot de passe"
              className="h-11"
              aria-invalid={errors.title ? true : undefined}
            />
          )}
        />
        {errors.title?.message && (
          <FieldError errors={[{ message: errors.title.message }]} />
        )}
      </Field>

      {/* Slug */}
      <Field data-invalid={errors.slug ? "" : undefined}>
        <FieldLabel htmlFor="story-slug">Slug (URL)</FieldLabel>
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="story-slug"
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
          Laissez vide pour générer automatiquement depuis le titre.
        </p>
        {errors.slug?.message && (
          <FieldError errors={[{ message: errors.slug.message }]} />
        )}
      </Field>

      {/* Format standard : En tant que / Je veux / Afin de */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={errors.asA ? "" : undefined}>
          <FieldLabel htmlFor="story-as-a">En tant que</FieldLabel>
          <Controller
            control={control}
            name="asA"
            render={({ field }) => (
              <Input
                {...field}
                id="story-as-a"
                autoComplete="off"
                placeholder="visiteur"
                className="h-11"
                aria-invalid={errors.asA ? true : undefined}
              />
            )}
          />
          {errors.asA?.message && (
            <FieldError errors={[{ message: errors.asA.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.iWant ? "" : undefined}>
          <FieldLabel htmlFor="story-i-want">Je veux</FieldLabel>
          <Controller
            control={control}
            name="iWant"
            render={({ field }) => (
              <Input
                {...field}
                id="story-i-want"
                autoComplete="off"
                placeholder="créer un compte"
                className="h-11"
                aria-invalid={errors.iWant ? true : undefined}
              />
            )}
          />
          {errors.iWant?.message && (
            <FieldError errors={[{ message: errors.iWant.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.soThat ? "" : undefined}>
          <FieldLabel htmlFor="story-so-that">Afin de</FieldLabel>
          <Controller
            control={control}
            name="soThat"
            render={({ field }) => (
              <Input
                {...field}
                id="story-so-that"
                autoComplete="off"
                placeholder="accéder au contenu privé"
                className="h-11"
                aria-invalid={errors.soThat ? true : undefined}
              />
            )}
          />
          {errors.soThat?.message && (
            <FieldError errors={[{ message: errors.soThat.message }]} />
          )}
        </Field>
      </div>

      {/* Persona de référence */}
      <Field data-invalid={errors.personaRef ? "" : undefined}>
        <FieldLabel htmlFor="story-persona">
          Persona de référence{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (optionnel)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="personaRef"
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? ""}
              id="story-persona"
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">— Aucun —</option>
              {props.personas.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.personaRef?.message && (
          <FieldError errors={[{ message: errors.personaRef.message }]} />
        )}
      </Field>

      {/* Status + Priorité + Story Points + Sprint */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field data-invalid={errors.status ? "" : undefined}>
          <FieldLabel htmlFor="story-status">Statut</FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? "backlog"}
                id="story-status"
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                {STORY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STORY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>

        <Field data-invalid={errors.priority ? "" : undefined}>
          <FieldLabel htmlFor="story-priority">
            Priorité ({STORY_PRIORITY_MIN}-{STORY_PRIORITY_MAX})
          </FieldLabel>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Input
                {...field}
                value={String(field.value ?? 5)}
                id="story-priority"
                type="number"
                min={STORY_PRIORITY_MIN}
                max={STORY_PRIORITY_MAX}
                className="h-11 font-mono"
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                aria-invalid={errors.priority ? true : undefined}
              />
            )}
          />
          {errors.priority?.message && (
            <FieldError errors={[{ message: errors.priority.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.storyPoints ? "" : undefined}>
          <FieldLabel htmlFor="story-points">
            Story points{" "}
            <span className="font-normal normal-case text-muted-foreground/70">
              (optionnel)
            </span>
          </FieldLabel>
          <Controller
            control={control}
            name="storyPoints"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                id="story-points"
                type="number"
                min={0}
                max={999}
                placeholder="—"
                className="h-11 font-mono"
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)
                }
                aria-invalid={errors.storyPoints ? true : undefined}
              />
            )}
          />
        </Field>

        <Field data-invalid={errors.sprintId ? "" : undefined}>
          <FieldLabel htmlFor="story-sprint">Sprint</FieldLabel>
          <Controller
            control={control}
            name="sprintId"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                id="story-sprint"
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">— Aucun —</option>
                {props.sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
      </div>

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

      {/* Critères d'acceptation */}
      <Field data-invalid={errors.acceptanceInput ? "" : undefined}>
        <FieldLabel htmlFor="story-ac">
          Critères d&apos;acceptation{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (une ligne = un critère)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="acceptanceInput"
          render={({ field }) => (
            <textarea
              {...field}
              value={field.value ?? ""}
              id="story-ac"
              rows={5}
              spellCheck={false}
              placeholder={"Un email valide est requis\nLe mot de passe fait 8 caractères minimum\nUn email de confirmation est envoyé"}
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.acceptanceInput ? true : undefined}
            />
          )}
        />
        {errors.acceptanceInput?.message && (
          <FieldError errors={[{ message: errors.acceptanceInput.message }]} />
        )}
      </Field>

      {/* Definition of Done */}
      <Field data-invalid={errors.dodInput ? "" : undefined}>
        <FieldLabel htmlFor="story-dod">
          Definition of Done{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (une ligne = un item)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="dodInput"
          render={({ field }) => (
            <textarea
              {...field}
              value={field.value ?? ""}
              id="story-dod"
              rows={4}
              spellCheck={false}
              placeholder={"Tests unitaires\nDocumentation\nRevue de code"}
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.dodInput ? true : undefined}
            />
          )}
        />
        {errors.dodInput?.message && (
          <FieldError errors={[{ message: errors.dodInput.message }]} />
        )}
      </Field>

      {/* Fichiers liés */}
      <Field data-invalid={errors.linkedFilesInput ? "" : undefined}>
        <FieldLabel htmlFor="story-files">
          Fichiers liés{" "}
          <span className="font-normal normal-case text-muted-foreground/70">
            (une ligne = un chemin)
          </span>
        </FieldLabel>
        <Controller
          control={control}
          name="linkedFilesInput"
          render={({ field }) => (
            <textarea
              {...field}
              value={field.value ?? ""}
              id="story-files"
              rows={3}
              spellCheck={false}
              placeholder={"app/auth/login/page.tsx\nlib/auth/auth.ts"}
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              aria-invalid={errors.linkedFilesInput ? true : undefined}
            />
          )}
        />
        {errors.linkedFilesInput?.message && (
          <FieldError errors={[{ message: errors.linkedFilesInput.message }]} />
        )}
      </Field>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={
            isEdit
              ? `/back-studio/scrum/${props.projectSlug}/backlog/${props.initialData.slug}`
              : `/back-studio/scrum/${props.projectSlug}/backlog`
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
              {isEdit
                ? "Enregistrer"
                : isEpic
                  ? "Créer l'Epic"
                  : "Créer la story"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
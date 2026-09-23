/*
path :           app/auth/register/RegisterForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire d'inscription : image de profil (file picker, stockée en base64),
                 nom, email, mot de passe avec indicateur de force, confirmation. L'image est
                 lue via FileReader.readAsDataURL() et transmise à BetterAuth sous forme de
                 data URL base64.
flow:            Client Component → useForm + zodResolver(registerSchema) → useWatch pour
                 l'aperçu en direct → handleFileChange lit le fichier (max 2 Mo) → onSubmit
                 appelle signUp.email() → si erreur USER_ALREADY_EXISTS/422 : setError sur
                 email ; si 429 : formError ; sinon : formError → si succès : toast +
                 router.replace(callbackUrl) + router.refresh().
ecosystem:       Auth = [
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/session.ts",
                   "@/utils/initials.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/auth/register/page.tsx",
                  "@/components/auth/PasswordInput.tsx",
                  "@/components/auth/PasswordStrength.tsx",
                  "@/lib/auth/auth-client.ts",
                  "@/lib/utils/initials.ts",
                  "@/lib/validations/auth.ts",
                  "@/components/ui/alert.tsx",
                  "@/components/ui/avatar.tsx",
                  "@/components/ui/button.tsx",
                  "@/components/ui/field.tsx",
                  "@/components/ui/input.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/avatar",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/auth/PasswordInput",
                  "@/components/auth/PasswordStrength",
                  "@/lib/auth/auth-client",
                  "@/lib/utils/initials",
                  "@/lib/validations/auth",
                  "props reçues : { callbackUrl: string }"]
exports:         ["RegisterForm", "RegisterFormProps"]
useBy:           ["@/app/auth/register/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer un compte avec mon email"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState, useRef, useEffect, useForm, useRouter, FileReader, toast.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Mail,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { signUp } from "@/lib/auth/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { initialsOf } from "@/utils/initials";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 Mo

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface RegisterFormProps {
  readonly callbackUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    setValue,
    trigger,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      image: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  /* Valeurs observées en direct */
  const watchedImage = useWatch({ control, name: "image" });
  const watchedName = useWatch({ control, name: "name" });
  const watchedPassword = useWatch({ control, name: "password" });
  const watchedConfirm = useWatch({ control, name: "confirmPassword" });

  /* Aperçu : data URL ou URL http(s) */
  const previewImageUrl =
    watchedImage && /^(https?:\/\/|data:image\/)/.test(watchedImage)
      ? watchedImage
      : undefined;

  /* Confirmation visuelle */
  const passwordsMatch =
    watchedConfirm.length > 0 && watchedPassword === watchedConfirm;

  /* Revalide la confirmation en direct quand l'un des deux change */
  useEffect(() => {
    if (watchedConfirm) {
      void trigger("confirmPassword");
    }
  }, [watchedPassword, watchedConfirm, trigger]);

  const isPending = isSubmitting || redirecting;

  /* ---------------------------------------------------------------- */
  /*  Handlers image                                                   */
  /* ---------------------------------------------------------------- */

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    /* Reset immédiat : permet de re-sélectionner le même fichier */
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("image", { message: "Le fichier doit être une image." });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("image", {
        message: "Image trop lourde (2 Mo maximum).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        setError("image", { message: "Lecture du fichier impossible." });
        return;
      }
      setValue("image", dataUrl, { shouldValidate: true });
      clearErrors("image");
    };
    reader.onerror = () => {
      setError("image", { message: "Lecture du fichier impossible." });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setValue("image", "", { shouldValidate: true });
    clearErrors("image");
  }

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */

  async function onSubmit(values: RegisterInput) {
    setFormError(null);

    try {
      const { error } = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.image ? { image: values.image } : {}),
      });

      if (error) {
        if (
          error.code?.startsWith("USER_ALREADY_EXISTS") ||
          error.status === 422
        ) {
          setError("email", {
            message: "Un compte existe déjà avec cet email.",
          });
        } else if (error.status === 429) {
          setFormError("Trop de tentatives. Réessayez dans un instant.");
        } else {
          setFormError(error.message ?? "Inscription impossible. Réessayez.");
        }
        return;
      }

      setRedirecting(true);
      toast.success("Compte créé, bienvenue !");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setFormError(
        "Impossible de joindre le serveur. Vérifiez votre connexion.",
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Rendu                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-chart-1/5 sm:p-8">
      {/* En-tête */}
      <div className="mb-8 space-y-3">
        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-lg shadow-chart-2/30">
          <UserPlus className="size-5" aria-hidden />
        </span>
        <h1 className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Rejoignez Genesis
        </h1>
        <p className="text-sm text-muted-foreground">
          Créez votre compte pour commencer à structurer vos projets.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  IMAGE — EN PREMIER                                        */}
        {/* ---------------------------------------------------------- */}
        <Field data-invalid={errors.image ? "" : undefined}>
          <FieldLabel>Photo de profil</FieldLabel>

          <div className="flex items-center gap-4">
            {/* Avatar cliquable */}
            <button
              type="button"
              onClick={handlePickFile}
              aria-label="Choisir une image"
              className="group relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-border/60 transition-all duration-200 hover:ring-chart-1/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar className="size-full">
                {previewImageUrl && (
                  <AvatarImage src={previewImageUrl} alt="" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-lg font-bold text-white">
                  {initialsOf(watchedName)}
                </AvatarFallback>
              </Avatar>

              {/* Overlay au survol */}
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <ImagePlus className="size-6 text-white" />
              </span>
            </button>

            {/* Actions + texte */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePickFile}
                  className="gap-1.5"
                >
                  <ImagePlus className="size-3.5" aria-hidden />
                  Choisir une image
                </Button>

                {previewImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Retirer
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP · 2 Mo max. Laissez vide pour utiliser vos
                initiales.
              </p>
            </div>
          </div>

          {/* Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            tabIndex={-1}
          />

          {errors.image?.message && (
            <FieldError errors={[{ message: errors.image.message }]} />
          )}
        </Field>

        {/* ---------------------------------------------------------- */}
        {/*  NOM                                                        */}
        {/* ---------------------------------------------------------- */}
        <Field data-invalid={errors.name ? "" : undefined}>
          <FieldLabel htmlFor="register-name">Nom affiché</FieldLabel>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  {...field}
                  id="register-name"
                  autoComplete="name"
                  placeholder="Votre nom ou pseudo"
                  className="h-11 pl-10"
                  aria-invalid={errors.name ? true : undefined}
                />
              )}
            />
          </div>
          {errors.name?.message && (
            <FieldError errors={[{ message: errors.name.message }]} />
          )}
        </Field>

        {/* ---------------------------------------------------------- */}
        {/*  EMAIL                                                      */}
        {/* ---------------------------------------------------------- */}
        <Field data-invalid={errors.email ? "" : undefined}>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className="h-11 pl-10"
                  aria-invalid={errors.email ? true : undefined}
                />
              )}
            />
          </div>
          {errors.email?.message && (
            <FieldError errors={[{ message: errors.email.message }]} />
          )}
        </Field>

        {/* ---------------------------------------------------------- */}
        {/*  MOT DE PASSE + INDICATEUR                                  */}
        {/* ---------------------------------------------------------- */}
        <Field data-invalid={errors.password ? "" : undefined}>
          <FieldLabel htmlFor="register-password">Mot de passe</FieldLabel>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordInput
                {...field}
                id="register-password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                aria-invalid={errors.password ? true : undefined}
              />
            )}
          />
          <PasswordStrength value={watchedPassword} />
          {errors.password?.message && (
            <FieldError errors={[{ message: errors.password.message }]} />
          )}
        </Field>

        {/* ---------------------------------------------------------- */}
        {/*  CONFIRMATION                                               */}
        {/* ---------------------------------------------------------- */}
        <Field data-invalid={errors.confirmPassword ? "" : undefined}>
          <FieldLabel htmlFor="register-confirm">
            Confirmer le mot de passe
          </FieldLabel>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <PasswordInput
                {...field}
                id="register-confirm"
                autoComplete="new-password"
                placeholder="Saisissez-le à nouveau"
                aria-invalid={errors.confirmPassword ? true : undefined}
              />
            )}
          />

          {passwordsMatch && (
            <p className="flex items-center gap-1.5 text-xs text-chart-4">
              <Check className="size-3.5" aria-hidden />
              Les mots de passe correspondent
            </p>
          )}

          {errors.confirmPassword?.message && (
            <FieldError
              errors={[{ message: errors.confirmPassword.message }]}
            />
          )}
        </Field>

        {/* ---------------------------------------------------------- */}
        {/*  SUBMIT                                                     */}
        {/* ---------------------------------------------------------- */}
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 text-base font-semibold text-white shadow-lg shadow-chart-2/25 transition hover:brightness-110 disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Création du compte…
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-chart-1 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

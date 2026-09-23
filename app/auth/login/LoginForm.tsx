/*
path :           app/auth/login/LoginForm.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de connexion email + mot de passe. Utilise react-hook-form,
                 zodResolver(loginSchema), PasswordInput et Field shadcn.
flow:            Client Component → useForm → onSubmit → signIn.email() → si erreur :
                 setFormError avec message adapté (401/400/429/autre) → si succès :
                 toast + router.replace(callbackUrl) + router.refresh().
ecosystem:       Auth = [
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/auth/login/page.tsx",
                  "@/components/auth/PasswordInput.tsx",
                  "@/lib/auth/auth-client.ts",
                  "@/lib/validations/auth.ts",
                  "@/components/ui/alert.tsx",
                  "@/components/ui/button.tsx",
                  "@/components/ui/field.tsx",
                  "@/components/ui/input.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react", "sonner",
                  "@/components/ui/alert",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/auth/PasswordInput",
                  "@/lib/auth/auth-client",
                  "@/lib/validations/auth",
                  "props reçues : { callbackUrl: string }"]
exports:         ["LoginForm", "LoginFormProps"]
useBy:           ["@/app/auth/login/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux me connecter avec mon email"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState, useForm, useRouter, toast, interactions utilisateur.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { signIn } from "@/lib/auth/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LoginFormProps {
  readonly callbackUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const isPending = isSubmitting || redirecting;

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    try {
      const { error } = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.status === 401 || error.status === 400) {
          setFormError("Email ou mot de passe incorrect.");
        } else if (error.status === 429) {
          setFormError("Trop de tentatives. Réessayez dans un instant.");
        } else {
          setFormError(error.message ?? "Connexion impossible. Réessayez.");
        }
        return;
      }

      setRedirecting(true);
      toast.success("Connexion réussie");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setFormError(
        "Impossible de joindre le serveur. Vérifiez votre connexion.",
      );
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-chart-1/5 sm:p-8">
      {/* En-tête */}
      <div className="mb-8 space-y-3">
        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-lg shadow-chart-2/30">
          <Lock className="size-5" aria-hidden />
        </span>
        <h1 className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Bon retour
        </h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour retrouver vos projets.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Email */}
        <Field data-invalid={errors.email ? "" : undefined}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
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
                  id="login-email"
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

        {/* Mot de passe */}
        <Field data-invalid={errors.password ? "" : undefined}>
          <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordInput
                {...field}
                id="login-password"
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                aria-invalid={errors.password ? true : undefined}
              />
            )}
          />
          {errors.password?.message && (
            <FieldError errors={[{ message: errors.password.message }]} />
          )}
        </Field>

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 text-base font-semibold text-white shadow-lg shadow-chart-2/25 transition hover:brightness-110 disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Connexion…
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-chart-1 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

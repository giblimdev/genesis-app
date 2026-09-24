/*
path :           app/auth/register/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'inscription. Vérifie la session : si l'utilisateur est déjà connecté,
                 redirige vers /conception. Sinon, rend <RegisterForm />.
flow:            Server Component async → getSession() → si session : redirect("/conception")
                 → sinon : <RegisterForm callbackUrl="/conception" />.
ecosystem:       Auth = [
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/auth/register/RegisterForm.tsx",
                  "@/lib/auth/session.ts"]
imports:         ["next", "next/navigation",
                  "@/lib/auth/session",
                  "@/app/auth/register/RegisterForm",
                  "props passées : { callbackUrl: \"/conception\" }"]
exports:         ["metadata", "default RegisterPage"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux accéder à la page d'inscription"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { RegisterForm } from "./RegisterForm";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte Genesis.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/auth/welcome");

  return <RegisterForm callbackUrl="/auth/login" />;
}

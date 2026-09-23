/*
path :           app/auth/login/page.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de connexion. Vérifie la session : si l'utilisateur est déjà connecté,
                 redirige vers /conception. Sinon, rend <LoginForm />.
flow:            Server Component async → getSession() → si session : redirect("/conception")
                 → sinon : <LoginForm callbackUrl="/conception" />.
ecosystem:       Auth = [
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/auth/login/LoginForm.tsx",
                  "@/lib/auth/session.ts"]
imports:         ["next", "next/navigation",
                  "@/lib/auth/session",
                  "@/app/auth/login/LoginForm",
                  "props passées : { callbackUrl: \"/conception\" }"]
exports:         ["metadata", "default LoginPage"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux accéder à la page de connexion"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à Genesis.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/conception");

  return <LoginForm callbackUrl="/conception" />;
}

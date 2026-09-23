// src/lib/auth/auth-client.ts
/*
  role:           Client BetterAuth pour le navigateur. Expose signIn,
                  signUp, signOut et useSession.

  flow:           Importé par les composants client (LoginForm,
                  RegisterForm, etc.). Même origine que l'app, pas de
                  baseURL nécessaire.

  imports:        better-auth/react.

  structure:      - constante authClient
                  - exports nommés signIn, signUp, signOut, useSession

  ecosysteme:     Auth

  usedBy:         app/auth/login/LoginForm.tsx,
                  app/auth/register/RegisterForm.tsx.
*/

"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
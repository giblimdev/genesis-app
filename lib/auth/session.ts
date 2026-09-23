// src/lib/auth/session.ts
/*
  role:           Wrapper serveur autour de auth.api.getSession. Mémoïsé
                  via React.cache pour éviter les appels multiples dans
                  un même rendu.

  flow:           Appelé par les Server Components et Server Actions.
                  Ne jamais importer depuis un Client Component.

  imports:        server-only, react (cache), next/headers,
                  @/lib/auth/auth.

  structure:      - constante getSession (mémoïsée)

  ecosysteme:     Auth

  usedBy:         app/auth/login/page.tsx, app/auth/register/page.tsx,
                  Server Actions protégées.
*/

import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

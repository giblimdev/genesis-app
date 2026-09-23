// src/lib/auth/auth.ts
/*
  role:           Configuration BetterAuth côté serveur : adapter Prisma,
                  email/mot de passe, OAuth GitHub et Google.

  flow:           Importé par app/api/auth/[...all]/route.ts et les
                  helpers serveur (getSession). Ne jamais importer côté
                  client.

  imports:        better-auth, @better-auth/prisma-adapter, better-auth/next-js,
                  @/lib/prisma, @/lib/env.

  structure:      - constante auth
                  - type Session

  ecosysteme:     Auth

  usedBy:         app/api/auth/[...all]/route.ts, lib/auth/session.ts.
*/

import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],

  database: prismaAdapter(prisma, { provider: "sqlite" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // renouvelée si > 1 jour
  },

  plugins: [nextCookies()], // doit rester en dernier
});

export type Session = typeof auth.$Infer.Session;

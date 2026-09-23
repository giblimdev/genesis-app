// src/lib/validations/auth.ts
/*
  role:           Schémas Zod pour l'authentification : inscription,
                  connexion, mot de passe oublié, réinitialisation,
                  changement de mot de passe. Source unique de vérité
                  pour la validation des entrées.

  flow:           Importé par les formulaires (react-hook-form) et
                  réutilisable côté serveur. Les schémas sont utilisés
                  via zodResolver dans chaque formulaire.

  imports:        zod.

  structure:      - interface PasswordRule + PASSWORD_RULES
                  - interface PasswordStrength + getPasswordStrength
                  - imageField (URL http(s) OU data URL base64)
                  - registerSchema + RegisterInput
                  - loginSchema + LoginInput
                  - forgotPasswordSchema + ForgotPasswordInput
                  - resetPasswordSchema + ResetPasswordInput
                  - changePasswordSchema + ChangePasswordInput

  ecosysteme:     Auth

  usedBy:         LoginForm, RegisterForm, ForgotPasswordForm,
                  ResetPasswordForm, PasswordForm.

  notes:          - imageField accepte deux formats :
                    · URL http(s) — ex. https://exemple.com/avatar.jpg
                    · data URL base64 — ex. data:image/png;base64,iVBOR…
                  - Un champ vide est transformé en undefined pour que
                    BetterAuth reçoive null côté base de données.
                  - Les schémas réutilisent les mêmes règles pour
                    register et resetPassword (confirmation du mot de
                    passe).
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Règles de mot de passe                                             */
/* ------------------------------------------------------------------ */

export interface PasswordRule {
  readonly id: string;
  readonly label: string;
  readonly test: (value: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: "8 caractères minimum",
    test: (v) => v.length >= 8,
  },
  {
    id: "lower",
    label: "Une minuscule",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "upper",
    label: "Une majuscule",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "digit",
    label: "Un chiffre",
    test: (v) => /\d/.test(v),
  },
  {
    id: "special",
    label: "Un caractère spécial",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Force du mot de passe                                              */
/* ------------------------------------------------------------------ */

export interface PasswordStrength {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
}

const STRENGTH_LABELS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "—",
  1: "Faible",
  2: "Moyen",
  3: "Bon",
  4: "Fort",
};

export function getPasswordStrength(value: string): PasswordStrength {
  if (!value) {
    return { score: 0, label: STRENGTH_LABELS[0] };
  }

  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;

  let score: 0 | 1 | 2 | 3 | 4;
  if (passed <= 1) score = 1;
  else if (passed === 2) score = 2;
  else if (passed === 3) score = 2;
  else if (passed === 4) score = 3;
  else score = 4;

  return { score, label: STRENGTH_LABELS[score] };
}

/* ------------------------------------------------------------------ */
/*  Champ image (URL http(s) OU data URL base64)                       */
/* ------------------------------------------------------------------ */

const imageField = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .refine(
    (v) =>
      v === undefined ||
      /^https?:\/\/.+/.test(v) ||
      /^data:image\/[a-z0-9.+-]+;base64,/i.test(v),
    {
      message:
        "Format d'image invalide (URL http(s) ou data URL base64 attendu).",
    },
  );

/* ------------------------------------------------------------------ */
/*  Inscription                                                        */
/* ------------------------------------------------------------------ */

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Nom : 2 caractères minimum." })
      .max(60, { message: "Nom : 60 caractères maximum." }),

    email: z
      .email({ message: "Adresse email invalide." })
      .transform((v) => v.toLowerCase().trim()),

    password: z
      .string()
      .min(8, { message: "Mot de passe : 8 caractères minimum." })
      .max(128, { message: "Mot de passe : 128 caractères maximum." }),

    confirmPassword: z
      .string()
      .min(1, { message: "Confirmez le mot de passe." }),

    image: imageField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/* ------------------------------------------------------------------ */
/*  Connexion                                                          */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z
    .email({ message: "Adresse email invalide." })
    .transform((v) => v.toLowerCase().trim()),

  password: z
    .string()
    .min(1, { message: "Mot de passe requis." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/*  Mot de passe oublié                                                */
/* ------------------------------------------------------------------ */

export const forgotPasswordSchema = z.object({
  email: z
    .email({ message: "Adresse email invalide." })
    .transform((v) => v.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Réinitialisation du mot de passe                                   */
/* ------------------------------------------------------------------ */

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "Jeton manquant." }),
    password: z
      .string()
      .min(8, { message: "Mot de passe : 8 caractères minimum." })
      .max(128, { message: "Mot de passe : 128 caractères maximum." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirmez le mot de passe." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Changement de mot de passe (utilisateur connecté)                  */
/* ------------------------------------------------------------------ */

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Mot de passe actuel requis." }),
    newPassword: z
      .string()
      .min(8, { message: "Mot de passe : 8 caractères minimum." })
      .max(128, { message: "Mot de passe : 128 caractères maximum." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirmez le mot de passe." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
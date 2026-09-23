# Sprint 0
✘  non fait
✘✔ en cours
 ✔ fait

## 1. Fondations du projet 
✔- installer next
✔- installer les bibbliotheque
✘- instalation et de prisma et premiere migration.

✘ -Configurer les variables d’environnement (.env)
✘ -importer mes fichiers de base
✘✔- cree un premier repository


## 2. outils d'aide aux développement
✔- creer le prompt d'aide aux developement dans CONTRIBUTING.md
✔- cree app/back-studio/helpDev/page.tsx
✘✔- page de [CMD prisma, github; versel] [card des biblioteque cmd i bibliotheque][police][icon] [color]
✘✔- mise en place des nav
✘- crer l'outil de copie schema.prisma et package.json permet de cliquer un seul ou les deux


## 3. Authentification (Better Auth)
✔✘ Configurer Better Auth (email/password, sessions)
✔✘ Créer les routes d’auth (/api/auth/[...all])
✔✘ Créer les pages login / register / 
✔✘ Protéger les routes nécessaires via proxi.ts (midleware)
✔✘ Vérifier la cohérence avec le modèle User du schéma Prisma

## 4. Srum
✔✘ crud Project
✔✘ crud Feature
✔✘ crud Persona
✔✘ crud UserStory
✔✘ crud Sprint
✔✘ crud Task


/*
CONNECT EXISTING DATABASE:
  1. Configure your DATABASE_URL in prisma7.config.ts
  2. Run prisma db pull to introspect your database.

CREATE NEW DATABASE:
  Local: npx prisma dev (runs Postgres locally in your terminal)
  Cloud: npx create-db (creates a free Prisma Postgres database)

Then, define your models in prisma/schema.prisma and run prisma migrate dev to apply your schema.
npx prisma validate
npx prisma format
npx prisma generate

npx prisma migrate dev --name fix_schema

les npm i




*/
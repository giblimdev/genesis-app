# Sprint 0
✘  non fait
✘✔ en cours
✔ fait

## 0. etat du sprint
State =✘✔    
(valeur par défaut à la creation State =✘)( seuls les sprints dont State =✘)


## 1. Fondations du projet 
✔- installer next
✔- installer les bibbliotheque
✔- instalation et de prisma et premiere migration.

✔ -Configurer les variables d’environnement (.env)
✔ -importer mes fichiers de base
✔- cree un premier repository


## 2. outils d'aide aux développement
✔- creer le prompt d'aide aux developement dans CONTRIBUTING.md
✔- cree app/back-studio/helpDev/page.tsx
✔- page de [CMD prisma, github; versel] [card des biblioteque cmd i bibliotheque][police][icon] [color]
✔- mise en place de la nav
✔- crer l'outil de copie "schema.prisma" et "package.json" et "CONTIBUTING.md"

✔ metre a jour l'achitecture les lib reutilisable sont dans un dossier utils nom  a discuter 




## 3. CONTRIBUTING Maker

✘- lis CONTRIBUTING/nd

✘- edit chaque section. avec boutton up/qown pur changer l'ordre

✘ -permet d' ajouter une section de modiffier 

✘ -remplace CONTRIBUTING.md existant

## 3. Authentification (Better Auth)
✔ Configurer Better Auth (email/password, sessions)
✔ Créer les routes d’auth (/api/auth/[...all])
✔ Créer les pages login / register / 
✔✘ Protéger les routes nécessaires via proxi.ts (midleware)
✔ Vérifier la cohérence avec le modèle User du schéma Prisma

## 4. ecriture en em masse 
✔ module d'ecriture . creation de nouveau fichier a partir d'un chemin



## 5. Srum
✔ crud Project
✔ crud Feature
✔ crud Persona
✔✘ crud UserStory
✔✘ crud Sprint
✔✘ crud Task

## mise a jour save app
- utiliise /public/gggg exlud.json


✔- tester l'outil de copie "schema.prisma" et "package.json" permet de cliquer un seul ou les deux




/*Inventaire des tokens à personnaliser
Surfaces (5 paires)
Token	Rôle	Exemple
--background / --foreground	Fond global + texte	oklch(1 0 0)
--card / --card-foreground	Cartes	idem background
--popover / --popover-foreground	Menus, dropdowns	idem background
Actions (6 tokens)
Token	Rôle
--primary	Couleur d’action principale (boutons, liens actifs)
--primary-foreground	Texte sur primary
--secondary / --secondary-foreground	Action secondaire
--accent / --accent-foreground	Surbrillance (hover de menu)
États (4 tokens)
Token	Rôle
--muted / --muted-foreground	Zones discrètes, texte secondaire
--destructive / --destructive-foreground	Erreur, suppression
Bordures & focus (3 tokens)
Token	Rôle
--border	Bordures standard
--input	Bordure des inputs
--ring	Focus visible
Accents projet (5 tokens)
Token	Rôle
--chart-1	Accent principal (violet)
--chart-2	Accent secondaire (cyan)
--chart-3	Attention (amber)
--chart-4	Succès (emerald)
--chart-5	Danger léger (rose)
Polices (3 tokens)
Token	Rôle
--font-body	Police du corps (par défaut : Inter)
--font-heading	Police des titres (par défaut : Fraunces)
--font-code	Police du code (par défaut : JetBrains Mono)
Forme (1 token)
Token	Rôle
--radius	Rayon global (dérive --radius-sm/md/lg/xl/2xl/3xl/4xl)
Sidebar (8 tokens, optionnel)
Token	Rôle
--sidebar / --sidebar-foreground	Fond + texte
--sidebar-primary / --sidebar-primary-foreground	Action principale
--sidebar-accent / --sidebar-accent-foreground	Hover
--sidebar-border / --sidebar-ring	Bordure + focus
Comment personnaliser
Changer la couleur principale en bleu
css
:root {
  --primary: oklch(0.55 0.18 240);
  --ring:    oklch(0.55 0.18 240 / 40%);
}
.dark {
  --primary: oklch(0.72 0.16 240);
  --ring:    oklch(0.72 0.16 240 / 50%);
}
Changer le radius global
css
:root {
  --radius: 1rem;   /* au lieu de 0.625rem */
}
Tous les rounded-sm/md/lg/xl/2xl se recalculent automatiquement.

Changer une police
Dans :root :

css
--font-body: var(--font-fraunces);   /* titres = corps */
Ou via un thème [data-theme="editorial"].

Couleurs — repères oklch
oklch(L C H) :

Paramètre	Plage	Sens
L (luminosité)	0 → 1	0 = noir, 1 = blanc
C (chroma)	0 → 0.4	0 = gris, 0.2 = très saturé
H (hue)	0 → 360	Voir tableau ci-dessous
Hue courants
Couleur	Hue
Rouge	25
Rose	15
Orange	55
Amber	75
Jaune	95
Lime	120
Vert	145
Emerald	155
Teal	180
Cyan	200
Sky	220
Bleu	240
Indigo	265
Violet	295
Fuchsia	330
Exemples
css
/* Violet moyen, bien saturé */
--primary: oklch(0.55 0.22 295);

/* Bleu profond, peu saturé */
--primary: oklch(0.40 0.10 240);

/* Rose vif */
--primary: oklch(0.65 0.25 5);

/* Gris neutre */
--primary: oklch(0.55 0 0);
*/
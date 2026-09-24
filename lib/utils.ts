/*
path :           lib/utils.ts
projectId:       <à fournir>
type:            helper
generic:         true

role:            Fusionne des classes Tailwind conditionnelles en une chaîne unique
                 et sans conflit. Combinaison de clsx (assemblage conditionnel) et
                 tailwind-merge (résolution des classes conflictuelles). Le
                 dernier gagne en cas de conflit (ex. « p-2 p-4 » → « p-4 »).
                 Composant transverse utilisé dans toute l'UI.

flow:            cn(...inputs) → clsx(inputs) → string brut → twMerge → string
                 final sans doublons ni conflits. Aucun état, aucun effet.

ecosystem:       Utils = [
                   "lib/utils.ts",
                 ]
relatedFiles:    ["@/components/common/AccentPicker.tsx",
                  ...]
imports:         ["clsx", "tailwind-merge"]
exports:         ["cn"]
useBy:           [...]

userStories:     ["*en tant que développeur je veux fusionner des classes Tailwind"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export { cn } from "cn";

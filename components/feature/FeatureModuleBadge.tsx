/*
path :           components/feature/FeatureModuleBadge.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Badge coloré du module d'une feature (vision, conception, backlog,
                 dev, qualite, communication, equipe, securite). Mappe chaque module
                 sur un token de thème.
flow:            Rendu pur → module en prop → lookup → span coloré.
ecosystem:       Dev = [
                   "@/components/feature/FeatureModuleBadge.tsx",
                 ]
relatedFiles:    ["@/components/feature/FeatureCard.tsx",
                  "@/components/feature/FeatureForm.tsx"]
imports:         ["@/lib/validations/feature", "@/lib/utils"]
exports:         ["FeatureModuleBadge", "FeatureModuleBadgeProps"]

userStories:     ["*en tant que développeur je veux afficher le module d'une feature"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  FEATURE_MODULE_LABELS,
  type FeatureModule,
} from "@/lib/validations/feature";
import { cn } from "@/lib/utils";

const MODULE_STYLE: Record<FeatureModule, string> = {
  vision: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  conception: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  backlog: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  dev: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  qualite: "border-chart-5/30 bg-chart-5/10 text-chart-5",
  communication: "border-border bg-muted/40 text-foreground",
  equipe: "border-border bg-muted/40 text-foreground",
  securite: "border-destructive/30 bg-destructive/10 text-destructive",
};

export type FeatureModuleBadgeProps = {
  readonly module: string;
  readonly className?: string;
};

export function FeatureModuleBadge({
  module,
  className,
}: FeatureModuleBadgeProps) {
  const known = (module in MODULE_STYLE ? module : "vision") as FeatureModule;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        MODULE_STYLE[known],
        className,
      )}
    >
      {FEATURE_MODULE_LABELS[known]}
    </span>
  );
}
/*
path :           components/Reveal.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Wrapper client qui anime l'apparition de ses enfants au scroll
                 (fade + léger translateY) avec motion/react.
flow:            motion.div avec initial + whileInView → l'animation se joue une
                 seule fois à l'entrée dans le viewport. Toutes les valeurs
                 dynamiques (y, delay, duration) sont passées à motion ; les
                 classes Tailwind ne portent que la structure et le layout.
ecosystem:       UI = [
                   "@/components/Reveal.tsx",
                 ]
relatedFiles:    []
imports:         ["react", "motion/react"]
exports:         ["Reveal", "RevealProps", "default Reveal"]
useBy:           ["@/app/page.tsx"]

userStories:     ["*auto-reveal-animation"]
status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : motion.div utilise des API navigateur (IntersectionObserver, animations).

import type { ReactNode } from "react";
import { motion } from "motion/react";

export interface RevealProps {
  /** Contenu à révéler au scroll */
  readonly children: ReactNode;
  /** Délai en secondes avant le début de l'animation (défaut : 0) */
  readonly delay?: number;
  /** Décalage vertical initial en pixels (défaut : 12) */
  readonly y?: number;
  /** Durée de l'animation en secondes (défaut : 0.5) */
  readonly duration?: number;
  /** Rejouer l'animation à chaque entrée dans le viewport (défaut : false) */
  readonly repeat?: boolean;
  /** Classes Tailwind appliquées au wrapper */
  readonly className?: string;
}

export function Reveal({
  children,
  delay = 0,
  y = 12,
  duration = 0.5,
  repeat = false,
  className,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;

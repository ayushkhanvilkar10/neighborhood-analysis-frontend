"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

interface BlurImageCardProps {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

export function BlurImageCard({ src, alt, title, subtitle }: BlurImageCardProps) {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className="relative my-4 aspect-square h-[225px] overflow-hidden rounded-[4px]"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <img src={src} alt={alt} className="absolute inset-0" />
      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[75%] w-full"
        blurIntensity={0.5}
        animate={isHover ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0"
        animate={isHover ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-medium text-white">{title}</p>
          <span className="text-base text-zinc-300">{subtitle}</span>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = pathname === "/login" || pathname === "/onboarding";

  return (
    <div className={isFullscreen ? "" : "lg:pl-56 pt-14 lg:pt-0"}>
      {children}
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin  = pathname === "/login";

  return (
    <div className={isLogin ? "" : "lg:pl-56 pt-14 lg:pt-0"}>
      {children}
    </div>
  );
}

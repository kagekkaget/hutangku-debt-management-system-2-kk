import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AppShell from "./AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        warungName: user.warungName,
        email: user.email,
        phone: user.phone,
      }}
    >
      {children}
    </AppShell>
  );
}

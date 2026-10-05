import { AdminNav } from "@/components/admin/admin-nav";
import { requireAccess } from "@/lib/auth";

// Sperrt die Route für Rollen ohne Zugriff (siehe lib/roles.ts). Die Daten schützt zusätzlich die RLS,
// jede Server Action prüft die Rolle noch einmal selbst (requireAdmin).
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccess("/admin");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl">Admin</h1>
      <AdminNav />
      {children}
    </div>
  );
}

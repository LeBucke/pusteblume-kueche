import { requireAccess } from "@/lib/auth";

// Sperrt die Route für Rollen ohne Zugriff (siehe lib/roles.ts). Die Daten schützt zusätzlich die RLS.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccess("/zutaten");
  return children;
}

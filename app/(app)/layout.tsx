import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ohne Sitzung auf /login, ohne aktives Profil mit Rolle auf /kein-zugang.
  const profile = await requireProfile();

  return (
    <AppShell displayName={profile.displayName} roles={profile.roles}>
      {children}
    </AppShell>
  );
}

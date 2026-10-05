import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { homePath } from "@/lib/roles";

export const metadata: Metadata = { title: "Kein Zugang" };

export default async function KeinZugangPage() {
  // Wer doch Zugang hat (z. B. nach einer Rollenänderung), geht direkt weiter.
  const profile = await getCurrentProfile();
  if (profile) redirect(homePath(profile.roles) ?? "/login");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 font-display text-4xl leading-none font-bold tracking-tight">Kein Zugang</h1>
        <p className="mb-5 text-lg">
          Dein Konto hat im Moment keinen Zugang zur Pusteblume Küche. Bitte wende dich an den Vorstand.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Abmelden
          </Button>
        </form>
      </Card>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { fehler } = await searchParams;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-20 size-64 rounded-full bg-deko-1 opacity-55"
      />
      <div className="relative w-full max-w-md">
        <Image
          src="/logo.png"
          alt="Kindertagesstätte Pusteblume"
          width={1143}
          height={380}
          priority
          className="mx-auto mb-6 h-14 w-auto"
        />
        <Card>
          <h1 className="mb-1 font-display text-4xl leading-none font-bold tracking-tight">Anmelden</h1>
          <p className="mb-5 text-muted">
            Gib deine Mailadresse ein. Du bekommst einen Link, ein Passwort brauchst du nicht.
          </p>
          {fehler && (
            <p role="alert" className="mb-4 rounded-card-sm bg-info px-4 py-2 text-info-ink">
              Der Link ist abgelaufen oder wurde schon benutzt. Fordere unten einen neuen an.
            </p>
          )}
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";

/** Rahmen der Teamansichten: Kopfzeile mit Logo und Navigation, unten Navigation auf dem Handy. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {/* Ein Pastellkreis als Markenzeichen, in Teamansichten höchstens einer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-28 -right-24 size-64 rounded-full bg-deko-2 opacity-55"
      />

      <header className="relative flex items-center gap-6 px-4 pt-4 pb-3 md:px-8 md:pt-[18px]">
        <Link href="/" className="shrink-0 rounded-card-sm">
          <Image
            src="/logo.png"
            alt="Kindertagesstätte Pusteblume"
            width={1143}
            height={380}
            priority
            className="h-10 w-auto md:h-[46px]"
          />
        </Link>
        <AppNav layout="top" className="ml-2 hidden md:block" />
        {/* Platzhalter, bis es mit Paket 03 angemeldete Nutzer gibt */}
        <div className="ml-auto flex items-center gap-2.5 text-[15px] text-muted">
          <span
            aria-hidden="true"
            className="inline-flex size-[34px] items-center justify-center rounded-full bg-course-starter font-extrabold text-ink"
          >
            ?
          </span>
          <span className="hidden sm:inline">Nicht angemeldet</span>
        </div>
      </header>

      <main className="relative flex-1 px-4 pt-1 pb-28 md:px-8 md:pb-10">
        {children}
      </main>

      <AppNav
        layout="bottom"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      />
    </div>
  );
}

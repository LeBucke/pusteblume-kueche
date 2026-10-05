import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { homePath } from "@/lib/roles";

/** Startseite nach Rolle (planung: Speiseplan, kueche: Heute, einkauf: Einkauf, admin: Admin). */
export default async function Home() {
  const profile = await requireProfile();
  redirect(homePath(profile.roles) ?? "/kein-zugang");
}

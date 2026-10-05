import { redirect } from "next/navigation";

// Vorläufig. Ab Paket 03 richtet sich die Startseite nach der Rolle.
export default function Home() {
  redirect("/heute");
}

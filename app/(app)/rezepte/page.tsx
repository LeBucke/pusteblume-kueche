import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Rezepte" };

export default function Page() {
  return <PagePlaceholder title="Rezepte" paket="06" />;
}

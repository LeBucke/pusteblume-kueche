import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Speiseplan" };

export default function Page() {
  return <PagePlaceholder title="Speiseplan" paket="07" />;
}

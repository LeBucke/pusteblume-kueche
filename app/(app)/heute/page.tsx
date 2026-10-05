import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Heute" };

export default function Page() {
  return <PagePlaceholder title="Heute" paket="09" />;
}

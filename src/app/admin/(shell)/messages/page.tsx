import type { Metadata } from "next";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconMessages } from "@/components/admin/AdminIcons";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <EmptyState title="MESSAGES" sub="Texts and DMs with your customers, in one inbox." icon={<IconMessages />} line="Your texts and DMs will land here." />;
}

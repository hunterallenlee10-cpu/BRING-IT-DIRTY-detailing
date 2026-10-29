import type { Metadata } from "next";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconReviews } from "@/components/admin/AdminIcons";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <EmptyState title="REVIEWS" sub="Ask happy customers for a Google review at the right moment." icon={<IconReviews />} line="Review requests and new Google reviews will land here." />;
}

import type { Metadata } from "next";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconCustomers } from "@/components/admin/AdminIcons";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <EmptyState title="CUSTOMERS" sub="Every car you have detailed, and who it belongs to." icon={<IconCustomers />} line="Repeat customers, their cars and their history will show up here." />;
}

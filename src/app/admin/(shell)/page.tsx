import type { Metadata } from "next";
import { OverviewScreen } from "@/components/admin/screens/OverviewScreen";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <OverviewScreen />;
}

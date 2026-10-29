import type { Metadata } from "next";
import { AutomationsScreen } from "@/components/admin/screens/AutomationsScreen";

export const metadata: Metadata = { title: "Automations" };

export default function Page() {
  return <AutomationsScreen />;
}

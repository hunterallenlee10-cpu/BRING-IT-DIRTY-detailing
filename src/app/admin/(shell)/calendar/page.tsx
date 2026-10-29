import type { Metadata } from "next";
import { CalendarScreen } from "@/components/admin/screens/CalendarScreen";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <CalendarScreen />;
}

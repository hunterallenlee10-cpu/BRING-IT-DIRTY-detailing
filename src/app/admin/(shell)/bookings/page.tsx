import type { Metadata } from "next";
import { BookingsScreen } from "@/components/admin/screens/BookingsScreen";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return <BookingsScreen />;
}

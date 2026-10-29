import { IconAutomations, IconBookings, IconCalendar, IconCustomers, IconLeads, IconMessages, IconOverview, IconReviews, IconSettings } from "./AdminIcons";

export const NAV = [
  { href: "/admin", label: "Overview", icon: IconOverview },
  { href: "/admin/leads", label: "Leads", icon: IconLeads, badge: true },
  { href: "/admin/bookings", label: "Bookings", icon: IconBookings },
  { href: "/admin/calendar", label: "Calendar", icon: IconCalendar },
  { href: "/admin/messages", label: "Messages", icon: IconMessages },
  { href: "/admin/customers", label: "Customers", icon: IconCustomers },
  { href: "/admin/reviews", label: "Reviews", icon: IconReviews },
  { href: "/admin/automations", label: "Automations", icon: IconAutomations },
  { href: "/admin/settings", label: "Settings", icon: IconSettings },
];

export const isActive = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

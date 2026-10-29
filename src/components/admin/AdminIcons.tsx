type P = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconOverview = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.6" />
    <rect x="13.5" y="11" width="7" height="9.5" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);
export const IconLeads = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" />
    <path d="M5.5 5.5h13l2 8v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18.5v-5l2-8Z" />
  </svg>
);
export const IconBookings = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="m9 14.6 2.1 2 4-4.2" />
  </svg>
);
export const IconCalendar = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
  </svg>
);
export const IconMessages = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5v-8Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
export const IconCustomers = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
    <path d="M15.5 5.6a3.1 3.1 0 0 1 0 5.8M17.6 14.9c1.5.6 2.6 2.2 2.9 4.6" />
  </svg>
);
export const IconReviews = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m12 3.8 2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.8l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 3.8Z" />
  </svg>
);
export const IconAutomations = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
  </svg>
);
export const IconSettings = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
  </svg>
);
export const IconSearch = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);
export const IconBell = ({ className, off }: P & { off?: boolean }) => (
  <svg {...base} className={className}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
export const IconMore = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="6" cy="12" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="18" cy="12" r="1.3" />
  </svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h9" />
  </svg>
);

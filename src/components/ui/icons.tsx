type P = { size?: number; className?: string };

export function PhoneIcon({ size = 18, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6.6 3.8 8.9 3.3c.6-.1 1.2.2 1.4.8l1 2.6c.2.6 0 1.2-.5 1.6L9.4 9.4a12 12 0 0 0 5.2 5.2l1.1-1.4c.4-.5 1-.7 1.6-.5l2.6 1c.6.2.9.8.8 1.4l-.5 2.3c-.1.7-.7 1.1-1.4 1.1C10.4 18.5 5.5 13.6 5.5 5.2c0-.7.4-1.3 1.1-1.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Chevron({ size = 12, className = "", dir = "down" }: P & { dir?: "down" | "up" | "right" | "left" }) {
  const rot = { down: 0, up: 180, right: -90, left: 90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className={className} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 16, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8.4 6.4 11.6 13 4.6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ size = 14, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="m8 1.6 1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3l-3.9 2.3 1-4.4-3.4-3 4.5-.5L8 1.6Z" fill="currentColor" />
    </svg>
  );
}

export function PinIcon({ size = 16, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function GoogleIcon({ size = 18, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M20 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.5a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.6 2.5-6.2Z" fill="currentColor" opacity=".9" />
      <path d="M12 20.5c2.3 0 4.2-.8 5.5-2.1l-2.7-2.1c-.7.5-1.7.8-2.8.8-2.2 0-4-1.5-4.7-3.4H4.5v2.2a8.5 8.5 0 0 0 7.5 4.6Z" fill="currentColor" opacity=".7" />
      <path d="M7.3 13.7a5 5 0 0 1 0-3.4V8.1H4.5a8.5 8.5 0 0 0 0 7.8l2.8-2.2Z" fill="currentColor" opacity=".5" />
      <path d="M12 6.9c1.2 0 2.3.4 3.2 1.3l2.4-2.4A8.5 8.5 0 0 0 4.5 8.1l2.8 2.2C8 8.4 9.8 6.9 12 6.9Z" fill="currentColor" opacity=".8" />
    </svg>
  );
}

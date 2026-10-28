export function Eyebrow({ num, label, className = "" }: { num?: string; label: string; className?: string }) {
  return (
    <span className={`eyebrow ${className}`}>
      <span className="slash" aria-hidden="true">/</span>
      {num ? (
        <span>
          {num} · {label}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}

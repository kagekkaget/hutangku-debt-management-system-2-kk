type Props = {
  size?: number;
  className?: string;
  tone?: "solid" | "light";
};

/** Monogram stempel HutangKu — digambar sebagai path, tetap tajam di 16px. */
export function Mark({ size = 36, className = "", tone = "solid" }: Props) {
  const bg = tone === "solid" ? "#0F4A34" : "#FFFCF5";
  const fg = tone === "solid" ? "#F6F1E7" : "#0F4A34";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="HutangKu"
      className={className}
    >
      <rect x="2" y="2" width="44" height="44" rx="12" fill={bg} />
      <rect
        x="6.5"
        y="6.5"
        width="35"
        height="35"
        rx="8"
        fill="none"
        stroke={fg}
        strokeWidth="1.4"
        strokeDasharray="2.6 3.2"
        opacity="0.75"
      />
      {/* H — palang tengah diperpanjang jadi garis buku kas */}
      <path
        d="M13.2 14h4.7v7.2h4.6V14h4.7v20h-4.7v-7.6h-4.6V34h-4.7V14Z"
        fill={fg}
      />
      <path d="M9 23.1h30v1.9H9z" fill={fg} opacity="0.55" />
      {/* titik stempel */}
      <circle cx="33.6" cy="31.2" r="2.6" fill={fg} />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={30} />
      <span className="display text-[1.35rem] leading-none font-[900] tracking-[-0.02em]">
        Hutang<span className="text-daun">Ku</span>
      </span>
    </span>
  );
}

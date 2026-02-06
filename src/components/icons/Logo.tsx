export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" stroke="url(#gradient)" strokeWidth="3" />
      <path
        d="M24 12V36M18 18L24 12L30 18M18 30L24 36L30 30"
        stroke="url(#gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="4" fill="url(#gradient)" />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  )
}
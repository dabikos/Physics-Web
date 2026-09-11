export function GooglePlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.609 1.814L13.792 12 3.61 22.186a2.03 2.03 0 01-.61-1.464V3.278c0-.563.225-1.095.609-1.464z"
        fill="#00D3FF"
      />
      <path
        d="M17.18 8.613l-3.388 3.387L3.61 1.814C3.96 1.464 4.47 1.25 5.03 1.25c.57 0 1.15.22 1.76.57l10.39 6.793z"
        fill="#00F076"
      />
      <path
        d="M17.18 15.387L6.79 22.18c-.61.35-1.19.57-1.76.57-.56 0-1.07-.214-1.42-.564l10.182-10.186 3.388 3.387z"
        fill="#FF3A44"
      />
      <path
        d="M21.36 10.687l-4.18-2.73-3.388 4.043 3.388 4.043 4.18-2.73a1.53 1.53 0 000-2.626z"
        fill="#FFAA00"
      />
    </svg>
  )
}

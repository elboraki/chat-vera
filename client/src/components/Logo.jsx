export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VeraChat logo"
    >
      <defs>
        <linearGradient id="vera-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
        <linearGradient id="vera-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="64" height="64" rx="16" fill="url(#vera-bg)" />

      {/* Bird body (chat-bubble shaped) */}
      <path
        d="M44 22c0-3.5-3-6-7-6h-10c-5.5 0-10 4.5-10 10v6c0 4.5 3.5 8 8 8h1l-2 5c-.3.7.5 1.3 1.1.9l7-5.4c.4-.3.9-.5 1.4-.5h3.5c4 0 7-2.5 7-6v-3.5l5 3c.7.4 1.5-.1 1.5-.9V21c0-.8-.8-1.3-1.5-.9l-5 3V22z"
        fill="url(#vera-body)"
      />

      {/* Eye */}
      <circle cx="34" cy="26" r="2" fill="#1a1d2e" />
      <circle cx="34.7" cy="25.3" r="0.6" fill="#ffffff" />

      {/* Beak */}
      <path
        d="M44 28l4-2v4l-4-2z"
        fill="#ffb84d"
      />

      {/* Wing accent */}
      <path
        d="M22 30c2-2 5-3 8-3"
        stroke="#a5b4fc"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

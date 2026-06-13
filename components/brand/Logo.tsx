import { useId } from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  /** "comanda" = papéis empilhados | "bubble" = bolha de conversa */
  variant?: "comanda" | "bubble";
}

/** Bolha de conversa + Z (versão anterior) */
export function LogoIconBubble({ size = 40, className = "" }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id={`${uid}-z`} x1="14" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
      </defs>

      <path
        d="M8 7.5h30.5a7.5 7.5 0 0 1 7.5 7.5v21a7.5 7.5 0 0 1-7.5 7.5H21.2L13.8 44.5V43.5H8a7.5 7.5 0 0 1-7.5-7.5V15A7.5 7.5 0 0 1 8 7.5Z"
        fill={`url(#${uid}-bg)`}
      />
      <path
        d="M8 7.5h30.5a7.5 7.5 0 0 1 7.5 7.5v9H8V7.5Z"
        fill="white"
        fillOpacity="0.12"
      />
      <path
        d="M15.5 17.2H33.8L18.8 30.2H32.8"
        stroke="#14532d"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        transform="translate(0.8 0.9)"
      />
      <path
        d="M14.5 16.2H34.5L18.5 29.2H33.5"
        stroke={`url(#${uid}-z)`}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Comandas empilhadas + Z sólida (nova sugestão) */
export function LogoIconComanda({ size = 40, className = "" }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-front`} x1="11" y1="7" x2="37" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>

      {/* Papel de fundo — pilha de comandas */}
      <rect
        x="13"
        y="13"
        width="26"
        height="30"
        rx="5"
        fill="#14532d"
        transform="rotate(-9 26 28)"
      />
      <rect
        x="12"
        y="10"
        width="26"
        height="30"
        rx="5"
        fill="#166534"
        transform="rotate(5 25 25)"
      />

      {/* Comanda principal */}
      <rect x="11" y="7" width="26" height="34" rx="5.5" fill={`url(#${uid}-front)`} />

      {/* Canto dobrado */}
      <path d="M31.5 7H37V12.5L31.5 7Z" fill="#4ade80" fillOpacity="0.45" />
      <path d="M31.5 7L37 12.5H31.5V7Z" fill="white" fillOpacity="0.18" />

      {/* Linhas de pedido — abaixo do Z */}
      <line
        x1="16"
        y1="32"
        x2="30"
        y2="32"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="35.5"
        x2="26"
        y2="35.5"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Sombra do Z */}
      <path
        d="M14.5 17.5H34.5L18 28.5H33"
        stroke="#14532d"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        transform="translate(0.7 0.8)"
      />

      {/* Z traçado — três traços claros */}
      <path
        d="M14 16.5H34L17.5 28H33"
        stroke="white"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoIcon({
  size = 40,
  className = "",
  variant = "comanda",
}: {
  size?: number;
  className?: string;
  variant?: "comanda" | "bubble";
}) {
  if (variant === "bubble") {
    return <LogoIconBubble size={size} className={className} />;
  }
  return <LogoIconComanda size={size} className={className} />;
}

export default function Logo({
  size = 40,
  showWordmark = true,
  className = "",
  variant = "comanda",
}: LogoProps) {
  if (!showWordmark) {
    return <LogoIcon size={size} className={className} variant={variant} />;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} variant={variant} />
      <span className="text-xl font-bold tracking-tight text-gray-900">
        Zap<span className="text-brand">Comanda</span>
      </span>
    </span>
  );
}

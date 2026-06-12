import { useId } from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
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

      {/* Balão de conversa — identidade WhatsApp sem copiar */}
      <path
        d="M8 7.5h30.5a7.5 7.5 0 0 1 7.5 7.5v21a7.5 7.5 0 0 1-7.5 7.5H21.2L13.8 44.5V43.5H8a7.5 7.5 0 0 1-7.5-7.5V15A7.5 7.5 0 0 1 8 7.5Z"
        fill={`url(#${uid}-bg)`}
      />

      {/* Brilho suave no topo */}
      <path
        d="M8 7.5h30.5a7.5 7.5 0 0 1 7.5 7.5v9H8V7.5Z"
        fill="white"
        fillOpacity="0.12"
      />

      {/* Sombra do Z — profundidade */}
      <path
        d="M15.5 17.2H33.8L18.8 30.2H32.8"
        stroke="#14532d"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        transform="translate(0.8 0.9)"
      />

      {/* Z principal — traço robusto com preenchimento em gradiente */}
      <path
        d="M14.5 16.2H34.5L18.5 29.2H33.5"
        stroke={`url(#${uid}-z)`}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corte diagonal — detalhe de design */}
      <path
        d="M22.5 22.8L27.8 27.8"
        stroke="#4ade80"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export default function Logo({ size = 40, showWordmark = true, className = "" }: LogoProps) {
  if (!showWordmark) {
    return <LogoIcon size={size} className={className} />;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} />
      <span className="text-xl font-bold tracking-tight text-gray-900">
        Zap<span className="text-brand">Comanda</span>
      </span>
    </span>
  );
}

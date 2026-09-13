import React from 'react';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const Logo3D: React.FC<Logo3DProps> = ({
  size = 'md',
  showText = false,
  textColor = 'text-white',
  className = '',
}) => {
  // Dimensions for icon
  const dims = {
    sm: { box: 28, text: 'text-xs', sub: 'text-[9px]' },
    md: { box: 36, text: 'text-sm sm:text-base', sub: 'text-[10px]' },
    lg: { box: 48, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 64, text: 'text-2xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Modern Isometric Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        style={{ width: dims.box, height: dims.box }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Plane: Radiant Luminous Indigo/Cyan */}
            <linearGradient id="planeTop" x1="50" y1="8" x2="50" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="45%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>

            {/* Left Plane: Deep Midnight Indigo Shadow */}
            <linearGradient id="planeLeft" x1="16" y1="30" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3730A3" />
              <stop offset="60%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>

            {/* Right Plane: Vibrant Cobalt/Teal Tint */}
            <linearGradient id="planeRight" x1="84" y1="30" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#2E1065" />
            </linearGradient>

            {/* Specular Highlight Rim */}
            <linearGradient id="rimLight" x1="20" y1="12" x2="80" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>

            {/* 3D Floating Sphere Core */}
            <radialGradient id="sphereGlow" cx="44%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0284C7" />
              <stop offset="85%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#082F49" />
            </radialGradient>

            {/* Realistic Ambient 3D Shadow below */}
            <filter id="softShadow3d" x="-30%" y="-20%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#090D1A" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Ambient Base Shadow */}
          <ellipse cx="50" cy="91" rx="28" ry="7" fill="#000000" fillOpacity="0.35" filter="blur(3px)" />

          {/* Isometric 3D Hex Prism */}
          <g filter="url(#softShadow3d)">
            {/* Left Face */}
            <path
              d="M 16 32 L 50 50 L 50 86 L 16 68 Z"
              fill="url(#planeLeft)"
            />
            {/* Right Face */}
            <path
              d="M 84 32 L 50 50 L 50 86 L 84 68 Z"
              fill="url(#planeRight)"
            />
            {/* Top Face */}
            <path
              d="M 50 14 L 84 32 L 50 50 L 16 32 Z"
              fill="url(#planeTop)"
            />
          </g>

          {/* Crisp Specular Light Bevel on Top Face */}
          <path
            d="M 50 14 L 84 32 L 50 50 L 16 32 Z"
            stroke="url(#rimLight)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* Subtle Vertical Spine Edge */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="86"
            stroke="#818CF8"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Floating Modern Minimalist 3D Core Sphere with Cyan Energy Ring */}
          <g transform="translate(0, -1)">
            {/* Ambient Back Glow */}
            <circle cx="50" cy="48" r="14" fill="#0284C7" fillOpacity="0.2" filter="blur(2px)" />

            {/* 3D Sphere */}
            <circle
              cx="50"
              cy="48"
              r="12"
              fill="url(#sphereGlow)"
              className="drop-shadow-[0_4px_8px_rgba(2,132,199,0.5)]"
            />

            {/* Specular Highlight on Sphere */}
            <circle cx="46" cy="44" r="3.5" fill="#FFFFFF" fillOpacity="0.75" />

            {/* Clean Number "3" Emblem on Sphere */}
            <path
              d="M 47.5 44 C 47.5 42.8 51.5 42.5 51.5 44.5 C 51.5 46 49.5 46.5 49.5 47.5 C 50.5 47.5 52 47.5 52 49.8 C 52 51.8 47.5 52 47.5 50.5"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.95"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight leading-none ${dims.text} ${textColor}`}>
              Neo PoRT3
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 font-mono font-bold border border-indigo-500/40">
              RT.03
            </span>
          </div>
          <p className={`${dims.sub} text-indigo-200 uppercase tracking-tight truncate leading-tight mt-0.5 font-medium`}>
            Portal Warga RT.03 RW.14 BPTW
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo3D;

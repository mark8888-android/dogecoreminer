import React from 'react';

export const DogeMinerLogo: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="56" fill="url(#dogeGoldGrad)" stroke="#F59E0B" strokeWidth="4" />
    <circle cx="60" cy="60" r="48" fill="#FBBF24" opacity="0.3" />
    {/* Shiba Ears */}
    <polygon points="32,46 44,22 56,42" fill="#D97706" />
    <polygon points="36,44 44,26 52,42" fill="#FDE68A" />
    <polygon points="88,46 76,22 64,42" fill="#D97706" />
    <polygon points="84,44 76,26 68,42" fill="#FDE68A" />
    {/* Shiba Head */}
    <ellipse cx="60" cy="68" rx="34" ry="30" fill="#F59E0B" />
    {/* White Muzzle */}
    <ellipse cx="60" cy="74" rx="20" ry="16" fill="#FEF3C7" />
    {/* Nose */}
    <ellipse cx="60" cy="68" rx="5" ry="4" fill="#1E293B" />
    <path d="M60,72 L60,77 M56,76 Q60,80 64,76" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <ellipse cx="46" cy="60" rx="4" ry="5" fill="#1E293B" />
    <circle cx="48" cy="58" r="1.5" fill="#FFFFFF" />
    <ellipse cx="74" cy="60" rx="4" ry="5" fill="#1E293B" />
    <circle cx="76" cy="58" r="1.5" fill="#FFFFFF" />
    {/* Miner Hardhat */}
    <path d="M30,46 Q60,26 90,46 Q92,52 86,52 L34,52 Q28,52 30,46 Z" fill="#E11D48" />
    <path d="M26,50 L94,50 Q96,53 92,54 L28,54 Q24,53 26,50 Z" fill="#BE123C" />
    {/* Hardhat Headlamp */}
    <circle cx="60" cy="42" r="7" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
    <circle cx="60" cy="42" r="4" fill="#FFFFFF" />
    <defs>
      <linearGradient id="dogeGoldGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="0.5" stopColor="#D97706" />
        <stop offset="1" stopColor="#92400E" />
      </linearGradient>
    </defs>
  </svg>
);

export const GoldDogeCoin: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coinGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.4" stopColor="#F59E0B" />
        <stop offset="0.8" stopColor="#D97706" />
        <stop offset="1" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="coinRim" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.5" stopColor="#B45309" />
        <stop offset="1" stopColor="#451A03" />
      </linearGradient>
    </defs>
    {/* Outer Coin Body */}
    <circle cx="50" cy="50" r="46" fill="url(#coinRim)" />
    <circle cx="50" cy="50" r="42" fill="url(#coinGrad)" />
    <circle cx="50" cy="50" r="38" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
    {/* Dogecoin Iconic 'Ð' */}
    <path
      d="M38 28 H54 C66 28 72 37 72 50 C72 63 66 72 54 72 H38 V28 Z M46 36 V46 H54 C60 46 64 48 64 50 C64 52 60 54 54 54 H46 V64 H54 C62 64 64 58 64 50 C64 42 62 36 54 36 H46 Z"
      fill="#451A03"
      opacity="0.3"
    />
    <path
      d="M36 26 H52 C64 26 70 35 70 48 C70 61 64 70 52 70 H36 V26 Z M44 34 V44 H52 C58 44 62 46 62 48 C62 50 58 52 52 52 H44 V62 H52 C60 62 62 56 62 48 C62 40 60 34 52 34 H44 Z"
      fill="#FFFFFF"
    />
    <rect x="28" y="46" width="24" height="6" rx="2" fill="#FFFFFF" />
  </svg>
);

export const PickaxeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 9.5 3 21" />
    <path d="m21 3-5 5" />
    <path d="M14.5 4.5c1.5-1.5 4-2 6-2-0 2-.5 4.5-2 6l-3.5 3.5-4-4Z" />
    <path d="m13 11-4-4" />
  </svg>
);

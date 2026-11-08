/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface JewelLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark-only' | 'full';
  showSubtitle?: boolean;
  className?: string;
}

export const JewelLogo: React.FC<JewelLogoProps> = ({
  size = 'md',
  variant = 'mark-only',
  showSubtitle = true,
  className = '',
}) => {
  // Dimensions map
  const sizeMap = {
    xs: { icon: 22, text: 'text-xs', sub: 'text-[9px]' },
    sm: { icon: 28, text: 'text-sm', sub: 'text-[10px]' },
    md: { icon: 34, text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 42, text: 'text-lg', sub: 'text-[11px]' },
    xl: { icon: 54, text: 'text-2xl', sub: 'text-xs' },
  };

  const dim = sizeMap[size];

  // Modern Eye-Catching Faceted Diamond & Golden Crown Emblem
  const iconSvg = (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-[#FAF5EB] via-white to-[#F3E7CF] p-1 border border-[#E8D4B0] shadow-[0_2px_8px_rgba(155,112,40,0.12)] group-hover:shadow-[0_4px_14px_rgba(155,112,40,0.22)] group-hover:border-[#9B7028] transition-all duration-300 ${className}`}
      style={{ width: dim.icon, height: dim.icon }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_1px_1px_rgba(127,88,26,0.3)]"
      >
        <defs>
          {/* Main Gold Facet Gradients */}
          <linearGradient id="facetGold1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFB664" />
            <stop offset="50%" stopColor="#B38634" />
            <stop offset="100%" stopColor="#825C1D" />
          </linearGradient>

          <linearGradient id="facetGold2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D1" />
            <stop offset="40%" stopColor="#CF9F47" />
            <stop offset="100%" stopColor="#966C24" />
          </linearGradient>

          <linearGradient id="facetGoldCenter" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFF9E8" />
            <stop offset="60%" stopColor="#E2B762" />
            <stop offset="100%" stopColor="#A87B2B" />
          </linearGradient>

          <linearGradient id="pavilionGold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#C49640" />
            <stop offset="100%" stopColor="#6C4914" />
          </linearGradient>

          {/* Sparkle Glow */}
          <linearGradient id="sparkleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5D78E" />
          </linearGradient>
        </defs>

        {/* --- BRILLIANT FACETED GEMSTONE GEOMETRY --- */}
        {/* Upper Table Facet (Top Crown Center) */}
        <polygon
          points="50,15 76,26 68,44 32,44 24,26"
          fill="url(#facetGoldCenter)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Upper Left Star Facet */}
        <polygon
          points="24,26 50,15 15,36"
          fill="url(#facetGold1)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Upper Right Star Facet */}
        <polygon
          points="50,15 76,26 85,36"
          fill="url(#facetGold2)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Upper Left Girdle Facet */}
        <polygon
          points="15,36 24,26 32,44 14,48"
          fill="url(#facetGold2)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Upper Right Girdle Facet */}
        <polygon
          points="76,26 85,36 86,48 68,44"
          fill="url(#facetGold1)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Middle Central Pavilion Facet */}
        <polygon
          points="32,44 68,44 50,88"
          fill="url(#facetGoldCenter)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Lower Left Pavilion Facet */}
        <polygon
          points="14,48 32,44 50,88"
          fill="url(#pavilionGold)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Lower Right Pavilion Facet */}
        <polygon
          points="68,44 86,48 50,88"
          fill="url(#facetGold1)"
          stroke="#FFFFFF"
          strokeWidth="0.75"
        />

        {/* Bottom Culet Point Accent */}
        <circle cx="50" cy="88" r="1.5" fill="#FFF4D4" />

        {/* --- RADIANT CELESTIAL SPARKLE AT APEX --- */}
        <g transform="translate(73, 16) scale(0.65)">
          {/* Vertical Flare */}
          <ellipse cx="12" cy="12" rx="2" ry="14" fill="url(#sparkleGlow)" />
          {/* Horizontal Flare */}
          <ellipse cx="12" cy="12" rx="14" ry="2" fill="url(#sparkleGlow)" />
          {/* Diagonal Flares */}
          <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );

  if (variant === 'mark-only') {
    return iconSvg;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {iconSvg}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${dim.text} font-bold tracking-tight text-[#20242B]`}>
            JOYERI
          </span>
          <span className="text-[10px] font-bold tracking-wider text-[#7F581A] bg-[#9B7028]/10 px-1.5 py-0.5 rounded uppercase">
            ERP
          </span>
        </div>
        {showSubtitle && (
          <p className={`${dim.sub} text-[#727985] font-semibold tracking-wide uppercase mt-0.5`}>
            Joyerías & Metales Preciosos
          </p>
        )}
      </div>
    </div>
  );
};

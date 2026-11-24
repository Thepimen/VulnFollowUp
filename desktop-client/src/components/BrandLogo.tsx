import React from 'react';

interface BrandLogoProps {
  size?: number;
  variant?: 'default' | 'brutalist';
}

/**
 * Bespoke geometric prism-chevron monogram for VulnFollowUp.
 * Replaces cliché security shield icons with an original architectural mark
 * uniting the three brand colors: Sapphire (#0042AC), Ocean (#00D3FB) & Neon Jade (#83FD80).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  variant = 'default',
}) => {
  const rx = variant === 'brutalist' ? 0 : 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="36" height="36" rx={rx} fill="#0B1224" />
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="34.5"
        rx={Math.max(0, rx - 0.75)}
        stroke="#0042AC"
        strokeWidth="1.5"
      />
      {/* Left descending precision vector (Sapphire -> Ocean) */}
      <path d="M8 9.5H13.4L17.9 22.8L15.1 26.5H12.9L8 9.5Z" fill="#0042AC" />
      {/* Right interlocking precision arm (Ocean Blue) */}
      <path d="M18.6 19.6L22.3 9.5H27.8L20.5 26.5H15.8L18.6 19.6Z" fill="#00D3FB" />
      {/* Signature Neon Jade telemetry bar & node */}
      <rect x="20.5" y="15.8" width="7.2" height="3.2" fill="#83FD80" />
      <rect x="24.5" y="23.2" width="3.3" height="3.3" fill="#83FD80" />
    </svg>
  );
};

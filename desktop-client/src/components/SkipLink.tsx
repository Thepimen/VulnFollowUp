import React from 'react';

interface SkipLinkProps {
  label?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  label = 'Saltar al contenido principal / Skip to main content',
}) => {
  return (
    <a href="#main-content" className="skip-link">
      {label}
    </a>
  );
};

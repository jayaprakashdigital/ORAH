interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export function Logo({ className = '', variant = 'full' }: LogoProps) {
  const primaryColor = '#3B82F6';
  const secondaryColor = '#1E40AF';
  const textColor = '#1e293b';

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="48" height="48" rx="12" fill={primaryColor} fillOpacity="0.1" />
        <circle cx="24" cy="24" r="16" fill={primaryColor} fillOpacity="0.2" />
        <path
          d="M24 12C17.373 12 12 17.373 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 17.373 30.627 12 24 12ZM24 33.6C18.699 33.6 14.4 29.301 14.4 24C14.4 18.699 18.699 14.4 24 14.4C29.301 14.4 33.6 18.699 33.6 24C33.6 29.301 29.301 33.6 24 33.6Z"
          fill={primaryColor}
        />
        <path
          d="M24 18C20.686 18 18 20.686 18 24C18 27.314 20.686 30 24 30C27.314 30 30 27.314 30 24C30 20.686 27.314 18 24 18Z"
          fill={secondaryColor}
        />
        <circle cx="24" cy="24" r="3" fill={primaryColor} />
        <path
          d="M16 24H14M34 24H32M24 16V14M24 34V32"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M28.5 19.5L29.9 18.1M18.1 29.9L19.5 28.5M28.5 28.5L29.9 29.9M18.1 18.1L19.5 19.5"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 180 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="12" fill={primaryColor} fillOpacity="0.1" />
      <circle cx="24" cy="24" r="16" fill={primaryColor} fillOpacity="0.2" />
      <path
        d="M24 12C17.373 12 12 17.373 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 17.373 30.627 12 24 12ZM24 33.6C18.699 33.6 14.4 29.301 14.4 24C14.4 18.699 18.699 14.4 24 14.4C29.301 14.4 33.6 18.699 33.6 24C33.6 29.301 29.301 33.6 24 33.6Z"
        fill={primaryColor}
      />
      <path
        d="M24 18C20.686 18 18 20.686 18 24C18 27.314 20.686 30 24 30C27.314 30 30 27.314 30 24C30 20.686 27.314 18 24 18Z"
        fill={secondaryColor}
      />
      <circle cx="24" cy="24" r="3" fill={primaryColor} />
      <path
        d="M16 24H14M34 24H32M24 16V14M24 34V32"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28.5 19.5L29.9 18.1M18.1 29.9L19.5 28.5M28.5 28.5L29.9 29.9M18.1 18.1L19.5 19.5"
        stroke={primaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <text
        x="56"
        y="32"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.02em"
      >
        ORAH
      </text>
      <text
        x="56"
        y="42"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="9"
        fontWeight="500"
        fill={textColor}
        fillOpacity="0.6"
        letterSpacing="0.05em"
      >
        AI VOICE AUTOMATION
      </text>
    </svg>
  );
}

import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'light' | 'sidebar';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  iconOnly = false,
  className = ''
}) => {
  // Variant colors
  const isDarkBg = variant === 'sidebar' || variant === 'dark';
  const textColor = isDarkBg ? 'text-white' : 'text-[#302923]';
  const subtextColor = isDarkBg ? 'text-[#D8C7B3]' : 'text-[#8A796D]';
  const badgeBg = isDarkBg ? 'bg-[#3A2B23] border border-[#8B6B52]/40 text-[#D8C7B3]' : 'bg-[#49372D] text-[#F5F1E9] shadow-sm';

  const sizeDimensions = {
    sm: { icon: 'w-8 h-8 text-sm', title: 'text-sm font-bold', sub: 'text-[10px]' },
    md: { icon: 'w-10 h-10 text-base', title: 'text-base font-bold', sub: 'text-xs' },
    lg: { icon: 'w-14 h-14 text-xl', title: 'text-xl font-bold tracking-wider', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20 text-3xl', title: 'text-2xl font-extrabold tracking-widest', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Logo Placeholder Asset Area */}
      <div
        className={`${sizeDimensions.icon} ${badgeBg} rounded-xl flex items-center justify-center shrink-0 font-serif font-bold relative group select-none transition-transform duration-200`}
        title="Logo Resmi Kopi Mbekayu (Area Aset Logo)"
      >
        {/* Stylized coffee bean / monogram icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 text-[#D8C7B3]"
        >
          {/* Coffee bean outline */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#D8C7B3" />
          {/* Characteristic curved s-line of coffee bean center crease */}
          <path d="M12 3c-1.5 3-3 6-1 9s3 6 1 9" stroke="#F5F1E9" strokeWidth="2" />
        </svg>
      </div>

      {!iconOnly && (
        <div>
          <div className={`font-serif tracking-wide ${sizeDimensions.title} ${textColor} leading-tight`}>
            KOPI MBEKAYU
          </div>
          {showSubtitle && (
            <div className={`${sizeDimensions.sub} ${subtextColor} font-medium tracking-tight leading-tight mt-0.5`}>
              Sistem Monitoring Stok Produksi Kopi
            </div>
          )}
        </div>
      )}
    </div>
  );
};

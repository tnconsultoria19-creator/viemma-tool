import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  align?: 'left' | 'right' | 'center';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignmentClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0 sm:-left-2';

  return (
    <span ref={containerRef} className="relative inline-flex items-center align-middle ml-1">
      <button
        type="button"
        aria-label={`Information: ${text}`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex items-center justify-center w-6 h-6 -my-1 rounded-full text-gray-400 hover:text-[#1A3326] hover:bg-gray-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] transition cursor-pointer"
      >
        <Info size={13} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {/* Tooltip Content: rendered above or below cleanly, never blocking the form input */}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[120] bottom-full mb-2 w-64 max-w-[85vw] rounded-xl border border-gray-200 bg-[#1A3326] px-3.5 py-2.5 text-left text-[11px] font-medium normal-case leading-relaxed tracking-normal text-white shadow-xl transition-all duration-150 ${alignmentClass} ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
        }`}
      >
        <span className="block text-gray-100">{text}</span>
        {/* Subtle arrow pointer pointing down */}
        <span className="absolute top-full left-4 -mt-[1px] border-4 border-transparent border-t-[#1A3326]" />
      </span>
    </span>
  );
};

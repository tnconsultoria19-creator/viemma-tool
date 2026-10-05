import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => (
  <span className="relative inline-flex align-middle ml-1">
    <button
      type="button"
      aria-label={`More information: ${text}`}
      className="group inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:text-[#1A3326] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-1"
    >
      <Info size={13} strokeWidth={2} aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-[120] mt-2 w-64 rounded-xl border border-gray-200 bg-[#1A3326] px-3 py-2 text-left text-[10px] font-medium normal-case leading-relaxed tracking-normal text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </button>
  </span>
);

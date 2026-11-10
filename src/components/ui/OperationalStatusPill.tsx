import React from 'react';

export type SemanticStatusTier = 'critical' | 'warning' | 'provisional' | 'confirmed' | 'neutral';
export type WorkspaceDensityMode = 'dense' | 'comfortable' | 'editorial';

export interface OperationalStatusPillProps {
  tier: SemanticStatusTier;
  label: string;
  sublabel?: string;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

const TIER_STYLES: Record<SemanticStatusTier, { bg: string; dot: string }> = {
  critical: {
    bg: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-600',
  },
  warning: {
    bg: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
  },
  provisional: {
    bg: 'bg-sky-50 text-sky-800 border-sky-300',
    dot: 'bg-sky-500',
  },
  confirmed: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-600',
  },
  neutral: {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-500',
  },
};

export const OperationalStatusPill: React.FC<OperationalStatusPillProps> = ({
  tier,
  label,
  sublabel,
  pulse = false,
  onClick,
  className = '',
}) => {
  const style = TIER_STYLES[tier] || TIER_STYLES.neutral;
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition ${
        style.bg
      } ${onClick ? 'hover:opacity-85 cursor-pointer' : ''} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot} ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      <span className="truncate">{label}</span>
      {sublabel && <span className="opacity-75 font-normal">({sublabel})</span>}
    </Component>
  );
};

/**
 * Helper to map domain states into the 4-tier semantic status language
 */
export function resolveSemanticTier(
  domainType: 'prdp' | 'hotel-settlement' | 'traveller' | 'flight',
  value: string,
  hasMissingOrFlagged?: boolean
): SemanticStatusTier {
  if (domainType === 'prdp') {
    if (value === 'Expired') return 'critical';
    if (value === 'Expiring Soon' || value === 'Not Provided') return 'warning';
    return 'confirmed';
  }
  if (domainType === 'hotel-settlement') {
    if (value === 'Unpaid') return 'critical';
    if (value === 'Negotiation / Pending Confirmation' || hasMissingOrFlagged) return 'warning';
    if (value === 'Deposit Paid') return 'provisional';
    if (value === 'Paid') return 'confirmed';
  }
  if (domainType === 'traveller') {
    if (hasMissingOrFlagged && value === 'Lead') return 'warning';
    if (value === 'Provisional') return 'provisional';
    if (value === 'Incomplete') return 'critical';
    return 'confirmed';
  }
  if (domainType === 'flight') {
    return hasMissingOrFlagged ? 'critical' : 'confirmed';
  }
  return 'neutral';
}

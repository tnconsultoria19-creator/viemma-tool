/**
 * VIEMMA TOURS — OPERATIONAL VALIDATORS
 * Enforces PrDP 45-day threshold state machine, schedule overlap detection, and status normalizers.
 */

import { TransferRecord, ActivityRecord } from './argonDomainModel';

export type PrDPState = 'Not Provided' | 'Expired' | 'Expiring Soon' | 'Valid';

export interface DriverPrDPResult {
  state: PrDPState;
  diffDays?: number;
  label: string;
}

export function evaluateDriverPrDPStatus(dateStr?: string, refDate: Date = new Date()): DriverPrDPResult {
  if (!dateStr || !dateStr.trim()) {
    return {
      state: 'Not Provided',
      label: 'PrDP Not Provided',
    };
  }

  const exp = new Date(dateStr);
  const now = new Date(refDate);
  now.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      state: 'Expired',
      diffDays,
      label: `PrDP Expired (${Math.abs(diffDays)} days ago)`,
    };
  }

  if (diffDays <= 45) {
    return {
      state: 'Expiring Soon',
      diffDays,
      label: `PrDP Expiring Soon (${diffDays} days remaining)`,
    };
  }

  return {
    state: 'Valid',
    diffDays,
    label: `PrDP Valid (${diffDays} days remaining)`,
  };
}

export interface AssignmentConflict {
  type: 'DRIVER_OVERLAP' | 'VEHICLE_OVERLAP' | 'INSUFFICIENT_TRANSFER_TIME';
  description: string;
  conflictingEntityId?: string;
  tripId?: string;
}

function parseTimeToMins(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function detectAssignmentConflicts(params: {
  candidateId: string;
  candidateTripId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  driver?: {
    id: string;
    fullName: string;
    phone?: string;
    languages?: string[];
    prdpExpiryDate?: string;
    status?: string;
  };
  vehicleId?: string;
  allTransfers?: TransferRecord[];
  allActivities?: ActivityRecord[];
}): AssignmentConflict[] {
  const conflicts: AssignmentConflict[] = [];
  const {
    candidateId,
    candidateTripId,
    date,
    startTime,
    durationMinutes,
    driver,
    vehicleId,
    allTransfers = [],
  } = params;

  const candidateStart = parseTimeToMins(startTime);
  const candidateEnd = candidateStart + (durationMinutes || 60);

  for (const tr of allTransfers) {
    if (tr.id === candidateId || tr.date !== date) continue;

    const trStart = parseTimeToMins(tr.pickupTime);
    const trEnd = trStart + (tr.estimatedDurationMinutes || 60);

    const hasOverlap = candidateStart < trEnd && candidateEnd > trStart;

    if (hasOverlap) {
      if (driver && tr.driverId === driver.id) {
        conflicts.push({
          type: 'DRIVER_OVERLAP',
          description: `Driver ${driver.fullName} is scheduled on transfer ${tr.id} (${tr.pickupTime}) in trip ${tr.tripId}.`,
          conflictingEntityId: tr.id,
          tripId: tr.tripId,
        });
      }

      if (vehicleId && tr.vehicleId === vehicleId) {
        conflicts.push({
          type: 'VEHICLE_OVERLAP',
          description: `Vehicle ${vehicleId} is scheduled on transfer ${tr.id} (${tr.pickupTime}) in trip ${tr.tripId}.`,
          conflictingEntityId: tr.id,
          tripId: tr.tripId,
        });
      }
    }
  }

  return conflicts;
}

export function normalizeHotelSettlementStatus(legacyStatus: string): {
  status: 'Unpaid' | 'Deposit Paid' | 'Paid';
  flaggedForReview: boolean;
} {
  const clean = (legacyStatus || '').toLowerCase().trim();

  if (clean.includes('partial') || clean.includes('deposit')) {
    return {
      status: 'Deposit Paid',
      flaggedForReview: clean.includes('partial'),
    };
  }

  if (clean.includes('fully') || clean === 'paid') {
    return {
      status: 'Paid',
      flaggedForReview: false,
    };
  }

  return {
    status: 'Unpaid',
    flaggedForReview: false,
  };
}

// Driver Permit Compliance & Operational Conflict Detector
// Validates 45-day PrDP/PDP thresholds, driver off-duty statuses, and multi-operation schedule conflicts.

import { AppState, Transfer, Activity, Driver } from '../types';

export interface DriverConflict {
  id: string;
  type: 'permit_expired' | 'permit_expiring_soon' | 'permit_missing' | 'off_duty' | 'time_overlap' | 'tight_turnaround' | 'missing_duration';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  driverName?: string;
  vehicleName?: string;
  conflictingEntity?: string;
}

export interface DriverConflictReport {
  hasCritical: boolean;
  hasWarnings: boolean;
  conflicts: DriverConflict[];
}

/**
 * Helper to compute PrDP compliance status
 */
export function evaluateDriverPermit(expiryDate?: string): {
  status: 'valid' | 'expiring_soon' | 'expired' | 'not_provided';
  diffDays?: number;
  label: string;
  badgeClass: string;
} {
  if (!expiryDate || !expiryDate.trim()) {
    return {
      status: 'not_provided',
      label: 'PrDP Not Recorded',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      diffDays,
      label: `PrDP EXPIRED (${Math.abs(diffDays)}d ago)`,
      badgeClass: 'bg-red-50 text-red-800 border-red-200 font-bold'
    };
  }

  if (diffDays <= 45) {
    return {
      status: 'expiring_soon',
      diffDays,
      label: `PrDP Expiring Soon (${diffDays}d left)`,
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
    };
  }

  return {
    status: 'valid',
    diffDays,
    label: `PrDP Valid (Exp: ${expiryDate})`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
  };
}

/**
 * Parse time string 'HH:MM' into minutes since midnight
 */
function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Parse duration string e.g. '30 min', '1h 30m', '2 hours' into minutes
 */
function parseDurationToMinutes(durStr?: string): number {
  if (!durStr) return 45; // Default assumed 45 min buffer
  const clean = durStr.toLowerCase().trim();
  let total = 0;
  
  const hourMatch = clean.match(/(\d+)\s*(?:h|hr|hour)/);
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;

  const minMatch = clean.match(/(\d+)\s*(?:m|min|minute)/);
  if (minMatch) total += parseInt(minMatch[1], 10);

  return total > 0 ? total : 45;
}

/**
 * Evaluate multi-operation conflicts for a driver and vehicle on a given date and time
 */
export function checkDriverOperationalConflicts(
  state: AppState,
  params: {
    targetId?: number | string;
    driverName?: string;
    vehicleName?: string;
    date?: string;
    time?: string;
    duration?: string;
  }
): DriverConflictReport {
  const conflicts: DriverConflict[] = [];
  const { targetId, driverName, vehicleName, date, time, duration } = params;

  if (!driverName && !vehicleName) {
    return { hasCritical: false, hasWarnings: false, conflicts: [] };
  }

  // 1. Locate Driver in Workspace Roster
  const matchedDriver = (state.drivers || []).find(d => 
    d.name.toLowerCase().trim() === driverName?.toLowerCase().trim() ||
    (d.preferredName && d.preferredName.toLowerCase().trim() === driverName?.toLowerCase().trim())
  );

  if (matchedDriver) {
    // Permit check
    const permit = evaluateDriverPermit(matchedDriver.prdpExpiryDate);
    if (permit.status === 'expired') {
      conflicts.push({
        id: `conf_permit_exp_${Date.now()}`,
        type: 'permit_expired',
        severity: 'critical',
        title: 'PrDP Permit Expired',
        description: `Driver ${matchedDriver.name}'s PrDP expired ${Math.abs(permit.diffDays || 0)} days ago on ${matchedDriver.prdpExpiryDate}. Legally prohibited from chauffeuring paying passengers.`,
        driverName: matchedDriver.name
      });
    } else if (permit.status === 'expiring_soon') {
      conflicts.push({
        id: `conf_permit_warn_${Date.now()}`,
        type: 'permit_expiring_soon',
        severity: 'warning',
        title: 'PrDP Permit Expiring Soon',
        description: `Driver ${matchedDriver.name}'s permit expires in ${permit.diffDays} days (${matchedDriver.prdpExpiryDate}). Ensure renewal process is initiated.`,
        driverName: matchedDriver.name
      });
    } else if (permit.status === 'not_provided') {
      conflicts.push({
        id: `conf_permit_none_${Date.now()}`,
        type: 'permit_missing',
        severity: 'warning',
        title: 'PrDP Expiry Date Not Recorded',
        description: `Driver ${matchedDriver.name} does not have a verified PrDP expiry date in the fleet register.`,
        driverName: matchedDriver.name
      });
    }

    // Availability / Off-duty check
    if (matchedDriver.status === 'Off Duty' || matchedDriver.status === 'Unavailable') {
      conflicts.push({
        id: `conf_offduty_${Date.now()}`,
        type: 'off_duty',
        severity: 'critical',
        title: 'Driver is Marked Off-Duty',
        description: `Driver ${matchedDriver.name} is currently flagged as "${matchedDriver.status}" in fleet management.`,
        driverName: matchedDriver.name
      });
    }
  }

  // 2. Schedule Overlaps & Turnarounds
  if (date && time) {
    const currentStartMin = parseTimeToMinutes(time);
    const currentDurMin = parseDurationToMinutes(duration);
    const currentEndMin = currentStartMin !== null ? currentStartMin + currentDurMin : null;

    if (!duration || !duration.trim()) {
      conflicts.push({
        id: `conf_dur_miss_${Date.now()}`,
        type: 'missing_duration',
        severity: 'info',
        title: 'Transfer Duration Not Specified',
        description: 'Estimated transfer duration is missing. Overlap detection assumes a standard 45-minute journey.',
        driverName
      });
    }

    // Check against all other transfers on the same date
    (state.transfers || []).forEach(other => {
      if (String(other.id) === String(targetId)) return;
      if (other.date !== date) return;

      const isSameDriver = driverName && other.driver && other.driver.toLowerCase().trim() === driverName.toLowerCase().trim();
      const isSameVehicle = vehicleName && other.vehicle && other.vehicle.toLowerCase().trim() === vehicleName.toLowerCase().trim();

      if (!isSameDriver && !isSameVehicle) return;

      const otherStartMin = parseTimeToMinutes(other.time);
      if (otherStartMin === null || currentStartMin === null || currentEndMin === null) return;

      const otherDurMin = parseDurationToMinutes(other.dur);
      const otherEndMin = otherStartMin + otherDurMin;

      // Direct time overlap
      const isOverlapping = (currentStartMin < otherEndMin) && (currentEndMin > otherStartMin);
      if (isOverlapping) {
        conflicts.push({
          id: `conf_overlap_${other.id}`,
          type: 'time_overlap',
          severity: 'critical',
          title: `Schedule Overlap on ${date}`,
          description: `${isSameDriver ? `Driver "${driverName}"` : `Vehicle "${vehicleName}"`} is already booked for "${other.from} → ${other.to}" (${other.time} – ${other.dur || '45m'}).`,
          driverName: isSameDriver ? driverName : undefined,
          vehicleName: isSameVehicle ? vehicleName : undefined,
          conflictingEntity: `Transfer: ${other.from} → ${other.to}`
        });
      } else {
        // Tight turnaround (< 30 minutes between jobs)
        const gap = currentStartMin >= otherEndMin 
          ? currentStartMin - otherEndMin 
          : otherStartMin - currentEndMin;

        if (gap >= 0 && gap < 30) {
          conflicts.push({
            id: `conf_tight_${other.id}`,
            type: 'tight_turnaround',
            severity: 'warning',
            title: `Tight Turnaround Buffer (${gap} mins)`,
            description: `Only ${gap} minutes buffer between "${other.from} → ${other.to}" and this transfer. Traffic delays in Cape Town may cause late arrival.`,
            driverName: isSameDriver ? driverName : undefined,
            vehicleName: isSameVehicle ? vehicleName : undefined,
            conflictingEntity: `Transfer: ${other.from} → ${other.to}`
          });
        }
      }
    });

    // Check against day activities assigned to this driver
    (state.activities || []).forEach(act => {
      // If activity occurs on same day
      const actDriverName = (act as any).driver || act.guideName;
      const isSameDriver = driverName && actDriverName && actDriverName.toLowerCase().trim() === driverName.toLowerCase().trim();
      if (!isSameDriver) return;

      const actStartMin = parseTimeToMinutes(act.start || act.pickup);
      if (actStartMin !== null && currentStartMin !== null && currentEndMin !== null) {
        const actDurMin = parseDurationToMinutes(act.dur);
        const actEndMin = actStartMin + actDurMin;

        if ((currentStartMin < actEndMin) && (currentEndMin > actStartMin)) {
          conflicts.push({
            id: `conf_act_overlap_${act.id}`,
            type: 'time_overlap',
            severity: 'critical',
            title: `Excursion Overlap on Day ${act.day}`,
            description: `Driver "${driverName}" is assigned to lead guided activity "${act.name}" from ${act.start || act.pickup} (${act.dur || 'multi-hour'}).`,
            driverName,
            conflictingEntity: `Experience: ${act.name}`
          });
        }
      }
    });
  }

  const hasCritical = conflicts.some(c => c.severity === 'critical');
  const hasWarnings = conflicts.some(c => c.severity === 'warning');

  return {
    hasCritical,
    hasWarnings,
    conflicts
  };
}

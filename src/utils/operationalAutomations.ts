/**
 * VIEMMA TOURS — PHASE 2 & 3 LOGICAL AUTOMATION ENGINE
 * 1. Flight-to-Transfer Bidirectional Buffer Synchronization
 * 2. Rooming Occupancy Math & Bed Capacity Guardrails
 * 3. Driver Duty Hours & Fatigue Safety Calculator (South Africa Ops)
 * 4. Supplier Settlement Due-Date Countdown Evaluator
 * 5. Western Cape Weather / "Cape Doctor" Wind Alert Evaluator
 */

import {
  FlightRecord,
  TransferRecord,
  HotelBookingRecord,
  RoomAllocationRecord,
  ActivityRecord,
  DriverProfileRecord,
} from './argonDomainModel';
import { detectAssignmentConflicts, AssignmentConflict } from './operationalValidators';

export type ScheduleConflict = AssignmentConflict;

// ---------------------------------------------------------------------------
// 1. BIDIRECTIONAL FLIGHT-TO-TRANSFER SYNCHRONIZATION
// ---------------------------------------------------------------------------

export interface FlightTransferSyncSuggestion {
  flightId: string;
  flightNumber: string;
  transferId: string;
  previousPickupTime: string;
  suggestedPickupTime: string;
  bufferMinutesApplied: number;
  updatedPickupSignText: string;
  resultingConflicts: ScheduleConflict[];
}

export function addMinutesToTime(timeHHMM: string, minutesToAdd: number): string {
  const match = (timeHHMM || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeHHMM;
  const totalMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + minutesToAdd;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function evaluateFlightDelayTransferSync(params: {
  updatedFlight: FlightRecord;
  isInternationalArrival?: boolean;
  leadTravellerName: string;
  allTransfers: TransferRecord[];
  allActivities: ActivityRecord[];
  drivers: DriverProfileRecord[];
}): FlightTransferSyncSuggestion[] {
  const {
    updatedFlight,
    isInternationalArrival = true,
    leadTravellerName,
    allTransfers,
    allActivities,
    drivers,
  } = params;

  const bufferMinutes =
    updatedFlight.direction === 'Arrival'
      ? isInternationalArrival
        ? 45 // CPT International customs & baggage buffer
        : 30 // CPT Domestic baggage buffer
      : -150; // Departure pickup 2.5h prior to flight

  const referenceFlightTime =
    updatedFlight.direction === 'Arrival'
      ? updatedFlight.arrivalTime
      : updatedFlight.departureTime;

  if (!referenceFlightTime) return [];

  const linkedTransfers = allTransfers.filter(
    (tr) =>
      tr.id === updatedFlight.id ||
      (tr.date === (updatedFlight.arrivalDate || updatedFlight.departureDate) &&
        (tr.travellerIds || []).some((id) => (updatedFlight.travellerIds || []).includes(id)))
  );

  const suggestions: FlightTransferSyncSuggestion[] = [];

  for (const transfer of linkedTransfers) {
    const suggestedPickupTime = addMinutesToTime(referenceFlightTime, bufferMinutes);
    if (suggestedPickupTime === transfer.pickupTime) continue;

    const assignedDriver = drivers.find((d) => d.id === transfer.driverId);
    const resultingConflicts = detectAssignmentConflicts({
      candidateId: transfer.id,
      candidateTripId: transfer.tripId,
      date: updatedFlight.arrivalDate || transfer.date,
      startTime: suggestedPickupTime,
      durationMinutes: transfer.estimatedDurationMinutes || 60,
      driver: assignedDriver,
      vehicleId: transfer.vehicleId,
      allTransfers,
      allActivities,
    });

    suggestions.push({
      flightId: updatedFlight.id,
      flightNumber: updatedFlight.flightNumber,
      transferId: transfer.id,
      previousPickupTime: transfer.pickupTime,
      suggestedPickupTime,
      bufferMinutesApplied: bufferMinutes,
      updatedPickupSignText:
        transfer.pickupSignText || `${leadTravellerName} (${updatedFlight.flightNumber})`,
      resultingConflicts,
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// 2. ROOMING OCCUPANCY MATH & BED CAPACITY GUARDRAILS
// ---------------------------------------------------------------------------

export const ROOM_TYPE_MAX_CAPACITY: Record<RoomAllocationRecord['roomType'], number> = {
  Single: 1,
  Double: 2,
  Twin: 2,
  Triple: 3,
  Family: 4,
  Suite: 4,
};

export interface RoomOccupancyValidationResult {
  hotelBookingId: string;
  propertyName: string;
  totalAllocatedPax: number;
  unallocatedTravellerIds: string[];
  overAllocatedRooms: Array<{
    roomId: string;
    roomType: RoomAllocationRecord['roomType'];
    roomLabel: string;
    assignedCount: number;
    maxCapacity: number;
    message: string;
  }>;
  duplicateRoomTravellerIds: string[];
  isValid: boolean;
}

export function validateHotelRoomingOccupancy(
  hotel: HotelBookingRecord,
  allGroupTravellerIds: string[]
): RoomOccupancyValidationResult {
  const overAllocatedRooms: RoomOccupancyValidationResult['overAllocatedRooms'] = [];
  const seenTravellers = new Set<string>();
  const duplicateSet = new Set<string>();

  for (const room of hotel.rooms || []) {
    const maxCapacity = ROOM_TYPE_MAX_CAPACITY[room.roomType] || 2;
    const assignedCount = room.travellerIds.length;

    if (assignedCount > maxCapacity) {
      overAllocatedRooms.push({
        roomId: room.id,
        roomType: room.roomType,
        roomLabel: room.roomNumberOrLabel || room.roomType,
        assignedCount,
        maxCapacity,
        message: `Over-allocation: ${assignedCount} travellers assigned to ${room.roomType} Room (Max: ${maxCapacity}).`,
      });
    }

    for (const tid of room.travellerIds) {
      if (seenTravellers.has(tid)) {
        duplicateSet.add(tid);
      }
      seenTravellers.add(tid);
    }
  }

  const unallocatedTravellerIds = allGroupTravellerIds.filter((id) => !seenTravellers.has(id));

  return {
    hotelBookingId: hotel.id,
    propertyName: hotel.propertyName,
    totalAllocatedPax: seenTravellers.size,
    unallocatedTravellerIds,
    overAllocatedRooms,
    duplicateRoomTravellerIds: Array.from(duplicateSet),
    isValid: overAllocatedRooms.length === 0 && duplicateSet.size === 0,
  };
}

// ---------------------------------------------------------------------------
// 3. DRIVER DUTY HOURS & FATIGUE SAFETY CALCULATOR
// ---------------------------------------------------------------------------

export interface DriverFatigueReport {
  driverId: string;
  driverName: string;
  date: string;
  totalScheduledMinutes: number;
  totalScheduledHours: number;
  maxContinuousBlockMinutes: number;
  exceedsDailyLimit: boolean; // > 10 hours (600 mins)
  exceedsContinuousLimit: boolean; // > 5 hours (300 mins) without 30m break
  fatigueWarningMessage?: string;
}

function parseMinutes(hhmm: string): number | null {
  const m = (hhmm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function calculateDriverDutyFatigue(params: {
  driver: DriverProfileRecord;
  date: string;
  transfers: TransferRecord[];
  activities: ActivityRecord[];
}): DriverFatigueReport {
  const { driver, date, transfers, activities } = params;

  const intervals: Array<{ start: number; end: number }> = [];

  for (const tr of transfers) {
    if (tr.driverId !== driver.id || tr.date !== date) continue;
    const s = parseMinutes(tr.pickupTime);
    if (s !== null) {
      intervals.push({ start: s, end: s + (tr.estimatedDurationMinutes || 60) });
    }
  }

  for (const act of activities) {
    if (act.driverId !== driver.id || act.date !== date || act.status === 'Cancelled') continue;
    const s = parseMinutes(act.startTime);
    const e = parseMinutes(act.endTime || '');
    if (s !== null) {
      intervals.push({ start: s, end: e !== null && e > s ? e : s + 120 });
    }
  }

  intervals.sort((a, b) => a.start - b.start);

  let totalMinutes = 0;
  let maxContinuous = 0;

  let currentContinuous = 0;
  let prevEnd: number | null = null;

  for (const block of intervals) {
    const duration = Math.max(0, block.end - block.start);
    totalMinutes += duration;

    if (prevEnd === null || block.start - prevEnd < 30) {
      // Less than 30 mins rest counts as continuous duty
      currentContinuous += duration;
    } else {
      currentContinuous = duration;
    }
    if (currentContinuous > maxContinuous) {
      maxContinuous = currentContinuous;
    }
    prevEnd = Math.max(prevEnd ?? 0, block.end);
  }

  const totalHours = Number((totalMinutes / 60).toFixed(1));
  const exceedsDailyLimit = totalMinutes > 600; // 10 hours
  const exceedsContinuousLimit = maxContinuous > 300; // 5 hours

  let fatigueWarningMessage: string | undefined;
  if (exceedsDailyLimit && exceedsContinuousLimit) {
    fatigueWarningMessage = `Fatigue Risk: ${driver.fullName} is scheduled for ${totalHours}h on ${date} with ${(
      maxContinuous / 60
    ).toFixed(1)}h continuous duty (no 30m break).`;
  } else if (exceedsDailyLimit) {
    fatigueWarningMessage = `Daily Duty Limit Exceeded: ${driver.fullName} is scheduled for ${totalHours}h on ${date} (Max recommended: 10h).`;
  } else if (exceedsContinuousLimit) {
    fatigueWarningMessage = `Rest Break Required: ${driver.fullName} has ${(
      maxContinuous / 60
    ).toFixed(1)}h consecutive duty on ${date} without a 30-min break.`;
  }

  return {
    driverId: driver.id,
    driverName: driver.fullName,
    date,
    totalScheduledMinutes: totalMinutes,
    totalScheduledHours: totalHours,
    maxContinuousBlockMinutes: maxContinuous,
    exceedsDailyLimit,
    exceedsContinuousLimit,
    fatigueWarningMessage,
  };
}

// ---------------------------------------------------------------------------
// 4. SUPPLIER BALANCE DUE-DATE COUNTDOWN EVALUATOR
// ---------------------------------------------------------------------------

export interface SupplierSettlementUrgency {
  tier: 'critical' | 'warning' | 'provisional' | 'confirmed';
  badgeLabel: string;
  daysUntilDue: number | null;
}

export function evaluateSupplierSettlementUrgency(params: {
  settlementStatus: HotelBookingRecord['settlementStatus'];
  balanceAmount: number;
  balanceDueDate?: string;
  referenceDate?: Date;
}): SupplierSettlementUrgency {
  const { settlementStatus, balanceAmount, balanceDueDate, referenceDate = new Date() } = params;

  if (settlementStatus === 'Paid' || balanceAmount <= 0) {
    return { tier: 'confirmed', badgeLabel: 'Settled in Full', daysUntilDue: null };
  }

  if (!balanceDueDate) {
    return {
      tier: settlementStatus === 'Unpaid' ? 'critical' : 'provisional',
      badgeLabel: `${settlementStatus} (No Due Date Set)`,
      daysUntilDue: null,
    };
  }

  const due = new Date(balanceDueDate);
  if (isNaN(due.getTime())) {
    return { tier: 'warning', badgeLabel: `${settlementStatus} (Invalid Due Date)`, daysUntilDue: null };
  }

  const diffDays = Math.ceil((due.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      tier: 'critical',
      badgeLabel: `OVERDUE by ${Math.abs(diffDays)}d`,
      daysUntilDue: diffDays,
    };
  }
  if (diffDays <= 7) {
    return {
      tier: 'warning',
      badgeLabel: `Balance Due in ${diffDays}d`,
      daysUntilDue: diffDays,
    };
  }
  return {
    tier: 'provisional',
    badgeLabel: `${settlementStatus} • Due in ${diffDays}d`,
    daysUntilDue: diffDays,
  };
}

// ---------------------------------------------------------------------------
// 5. WESTERN CAPE WEATHER & "CAPE DOCTOR" WIND ALERT EVALUATOR
// ---------------------------------------------------------------------------

export interface WesternCapeWeatherAlert {
  date: string;
  activityId: string;
  activityTitle: string;
  windSpeedKmh: number;
  severity: 'critical' | 'warning';
  recommendation: string;
}

export function evaluateWesternCapeWindAlerts(
  activities: ActivityRecord[],
  forecastByDateKmh: Record<string, number>
): WesternCapeWeatherAlert[] {
  const alerts: WesternCapeWeatherAlert[] = [];
  const windSensitiveKeywords = /table mountain|cableway|robben island|cape point|chapman|helicopter|marine|boat|catamaran/i;

  for (const act of activities) {
    if (act.status === 'Cancelled') continue;
    const windKmh = forecastByDateKmh[act.date];
    if (!windKmh || windKmh < 40) continue;

    if (windSensitiveKeywords.test(`${act.title} ${act.location}`)) {
      const isCritical = windKmh >= 50;
      alerts.push({
        date: act.date,
        activityId: act.id,
        activityTitle: act.title,
        windSpeedKmh: windKmh,
        severity: isCritical ? 'critical' : 'warning',
        recommendation: isCritical
          ? `High "Cape Doctor" SE wind (${windKmh} km/h) forecasted on ${act.date}. Table Mountain Aerial Cableway / Ferry closure likely — prepare swap to Constantia Winelands or Kirstenbosch.`
          : `Moderate-to-strong wind (${windKmh} km/h) on ${act.date}. Confirm morning operational status with supplier before dispatching driver.`,
      });
    }
  }

  return alerts;
}

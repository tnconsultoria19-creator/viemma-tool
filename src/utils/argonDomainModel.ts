/**
 * VIEMMA TOURS — ARGON DOMAIN MODEL
 * Single Source of Truth for Trip, Group, Lead Person, Travellers, and Services
 */

export interface GroupDefaults {
  destination?: string;
  startDate?: string;
  endDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  nationalityDefault?: string;
  generalPreferences?: string;
}

export type TravellerCategory = 'Adult' | 'Senior' | 'Child' | 'Infant';

export interface TravellerRecord {
  id: string;
  tripId: string;
  groupId: string;
  fullName: string;
  category: TravellerCategory;
  isLead: boolean;
  isProvisional: boolean;
  email?: string;
  phone?: string;
  nationality?: string;
  passportNo?: string;
  passportExpiry?: string;
  dietaryRequirements?: string;
  medicalOrAccessibilityNotes?: string;
  clientFacingNotes?: string;
  internalNotes?: string;
  missingFields: string[];
  overriddenFields?: string[];
}

export interface TripGroupStructure {
  id: string;
  tripId: string;
  groupName: string;
  leadTravellerId: string;
  defaults: GroupDefaults;
  travellers: TravellerRecord[];
  unmappedContextAlerts?: string[];
}

export interface FlightRecord {
  id: string;
  tripId: string;
  groupId: string;
  direction?: 'Arrival' | 'Departure' | 'Internal';
  flightNumber: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  pnr?: string;
  travellerIds?: string[];
}

export interface HotelBookingRecord {
  id: string;
  tripId: string;
  groupId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType?: string;
  settlementStatus: 'Unpaid' | 'Deposit Paid' | 'Paid';
  verifiedAddress?: string;
  googleMapsUrl?: string;
  addressUnresolvedFlag?: boolean;
  travellerIds?: string[];
  internalNotes?: string;
}

export interface TransferRecord {
  id: string;
  tripId: string;
  groupId: string;
  date: string;
  pickupTime: string;
  estimatedDurationMinutes?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupSignText?: string;
  clientFacingNotes?: string;
  internalNotes?: string;
  driverId?: string;
  vehicleId?: string;
  travellerIds?: string[];
  updatedAt?: string;
}

export interface ActivityRecord {
  id: string;
  tripId: string;
  groupId: string;
  groupIds?: string[];
  groupNames?: string[];
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  isGroupWide?: boolean;
  participantTravellerIds?: string[];
  excludedTravellerIds?: string[];
  status: 'Draft' | 'Planned' | 'Confirmed' | 'Completed' | 'Postponed' | 'Cancelled';
  clientFacingNotes?: string;
  internalNotes?: string;
  responsiblePerson?: string;
  venue?: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleName?: string;
  durationMinutes?: number;
  cost?: number;
  updatedAt?: string;
}

/**
 * Sequential VT-YYYY-XXX reference generator
 */
export function generateNextTripReference(existingRefs: string[] = [], year: number = 2026): string {
  const prefix = `VT-${year}-`;
  let maxSeq = 0;

  for (const ref of existingRefs) {
    if (typeof ref === 'string' && ref.startsWith(prefix)) {
      const numPart = parseInt(ref.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Compute missing fields for a traveller record
 */
export function computeMissingFields(traveller: Partial<TravellerRecord>): string[] {
  const missing: string[] = [];
  if (!traveller.fullName || traveller.isProvisional) {
    missing.push('Full Name');
  }
  if (!traveller.nationality) {
    missing.push('Nationality');
  }
  if (!traveller.passportNo) {
    missing.push('Passport No');
  }
  if (!traveller.passportExpiry) {
    missing.push('Passport Expiry');
  }
  if (traveller.isLead && !traveller.email && !traveller.phone) {
    missing.push('Contact Information');
  }
  return missing;
}

/**
 * Creates a new traveller record with inherited defaults
 */
export function createTravellerWithInheritance(params: {
  id: string;
  tripId: string;
  groupId: string;
  category?: TravellerCategory;
  isLead?: boolean;
  isProvisional?: boolean;
  fullName?: string;
  defaults?: GroupDefaults;
  email?: string;
  phone?: string;
  nationality?: string;
  passportNo?: string;
  passportExpiry?: string;
  dietaryRequirements?: string;
  medicalOrAccessibilityNotes?: string;
  clientFacingNotes?: string;
  internalNotes?: string;
}): TravellerRecord {
  const isLead = Boolean(params.isLead);
  const isProvisional = Boolean(params.isProvisional);
  const defaults = params.defaults || {};

  const record: TravellerRecord = {
    id: params.id,
    tripId: params.tripId,
    groupId: params.groupId,
    fullName: params.fullName || (isProvisional ? 'Provisional Traveller' : ''),
    category: params.category || 'Adult',
    isLead,
    isProvisional,
    // Only inherit email/phone for the Lead contact
    email: params.email ?? (isLead ? (defaults.contactEmail || '') : ''),
    phone: params.phone ?? (isLead ? (defaults.contactPhone || '') : ''),
    nationality: params.nationality ?? (defaults.nationalityDefault || ''),
    passportNo: params.passportNo || '',
    passportExpiry: params.passportExpiry || '',
    dietaryRequirements: params.dietaryRequirements || '',
    medicalOrAccessibilityNotes: params.medicalOrAccessibilityNotes || '',
    clientFacingNotes: params.clientFacingNotes || '',
    internalNotes: params.internalNotes || '',
    missingFields: [],
    overriddenFields: params.nationality ? ['nationality'] : [],
  };

  record.missingFields = computeMissingFields(record);
  return record;
}

/**
 * Creates provisional traveller records using quantities under the lead person
 */
export function quickAddProvisionalTravellers(
  current: TravellerRecord[],
  counts: { adults: number; seniors?: number; children?: number; infants?: number },
  tripId: string,
  groupId: string,
  defaults?: GroupDefaults
): TravellerRecord[] {
  const result: TravellerRecord[] = [...current];

  let adultIdx = 1;
  let seniorIdx = 1;
  let childIdx = 1;
  let infantIdx = 1;

  for (let i = 0; i < (counts.adults || 0); i++) {
    result.push(
      createTravellerWithInheritance({
        id: `trv_prov_adult_${Date.now()}_${adultIdx}`,
        tripId,
        groupId,
        category: 'Adult',
        isLead: false,
        isProvisional: true,
        fullName: `Adult ${adultIdx++}`,
        defaults,
      })
    );
  }

  for (let i = 0; i < (counts.seniors || 0); i++) {
    result.push(
      createTravellerWithInheritance({
        id: `trv_prov_senior_${Date.now()}_${seniorIdx}`,
        tripId,
        groupId,
        category: 'Senior',
        isLead: false,
        isProvisional: true,
        fullName: `Senior ${seniorIdx++}`,
        defaults,
      })
    );
  }

  for (let i = 0; i < (counts.children || 0); i++) {
    result.push(
      createTravellerWithInheritance({
        id: `trv_prov_child_${Date.now()}_${childIdx}`,
        tripId,
        groupId,
        category: 'Child',
        isLead: false,
        isProvisional: true,
        fullName: `Child ${childIdx++}`,
        defaults,
      })
    );
  }

  for (let i = 0; i < (counts.infants || 0); i++) {
    result.push(
      createTravellerWithInheritance({
        id: `trv_prov_infant_${Date.now()}_${infantIdx}`,
        tripId,
        groupId,
        category: 'Infant',
        isLead: false,
        isProvisional: true,
        fullName: `Infant ${infantIdx++}`,
        defaults,
      })
    );
  }

  return result;
}

/**
 * Update traveller record in place with stable ID
 */
export function updateTravellerInPlace(
  travellers: TravellerRecord[],
  targetId: string,
  updates: Partial<TravellerRecord>
): TravellerRecord[] {
  return travellers.map((t) => {
    if (t.id !== targetId) return t;

    const overridden = new Set(t.overriddenFields || []);
    for (const key of Object.keys(updates) as Array<keyof TravellerRecord>) {
      if (key !== 'id' && key !== 'tripId' && key !== 'groupId' && key !== 'missingFields') {
        overridden.add(key as string);
      }
    }

    const isProvisional = updates.fullName && !updates.isProvisional ? false : (updates.isProvisional ?? t.isProvisional);

    const merged: TravellerRecord = {
      ...t,
      ...updates,
      isProvisional,
      overriddenFields: Array.from(overridden),
    };
    merged.missingFields = computeMissingFields(merged);
    return merged;
  });
}

/**
 * Applies group defaults while respecting individual overrides
 */
export function applyGroupDefaultsWithInheritance(
  group: TripGroupStructure,
  updates: Partial<GroupDefaults>
): TripGroupStructure {
  const nextDefaults: GroupDefaults = { ...group.defaults, ...updates };

  const updatedTravellers = group.travellers.map((t) => {
    const overrides = t.overriddenFields || [];
    let nat = t.nationality;

    // Only update nationality if not explicitly overridden by traveller
    if (updates.nationalityDefault && !overrides.includes('nationality')) {
      nat = updates.nationalityDefault;
    }

    const updatedTraveller: TravellerRecord = {
      ...t,
      nationality: nat,
    };
    updatedTraveller.missingFields = computeMissingFields(updatedTraveller);
    return updatedTraveller;
  });

  return {
    ...group,
    defaults: nextDefaults,
    travellers: updatedTravellers,
  };
}

/**
 * Safely change the group lead person preserving all travellers
 */
export function changeGroupLeadPerson(group: TripGroupStructure, newLeadId: string): TripGroupStructure {
  const target = group.travellers.find((t) => t.id === newLeadId);
  if (!target) return group;

  const nextTravellers = group.travellers.map((t) => ({
    ...t,
    isLead: t.id === newLeadId,
  }));

  return {
    ...group,
    leadTravellerId: newLeadId,
    travellers: nextTravellers,
  };
}

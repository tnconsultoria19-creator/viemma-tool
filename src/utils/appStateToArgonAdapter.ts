/**
 * VIEMMA TOURS — APP STATE TO ARGON DOMAIN ADAPTER
 * Seamless bidirectional bridge between legacy AppState and Argon Domain Model
 */

import { AppState } from '../types';
import {
  TripGroupStructure,
  FlightRecord,
  HotelBookingRecord,
  TransferRecord,
  ActivityRecord,
  computeMissingFields,
} from './argonDomainModel';
import { normalizeHotelSettlementStatus } from './operationalValidators';

export function adaptAppStateToArgon(state: AppState): {
  group: TripGroupStructure;
  flights: FlightRecord[];
  hotels: HotelBookingRecord[];
  transfers: TransferRecord[];
  activities: ActivityRecord[];
  heroImageUrl?: string;
  supportingImageUrl?: string;
} {
  const leadGuest = state.guests.find((g) => g.isLead) || state.guests[0];
  const leadTravellerId = leadGuest ? String(leadGuest.id) : '1';

  const group: TripGroupStructure = {
    id: state.id || `grp_${state.ref || 'VT-2026-001'}`,
    tripId: state.ref || 'VT-2026-001',
    groupName: state.client?.name || state.title || 'Private Journey Party',
    leadTravellerId,
    defaults: {
      destination: state.client?.country || 'Cape Town, South Africa',
      startDate: state.client?.startDate || '',
      endDate: state.client?.endDate || '',
      contactEmail: state.client?.email || '',
      contactPhone: state.client?.phone || '',
      nationalityDefault: leadGuest?.nationality || leadGuest?.country || 'South African',
      generalPreferences: (state.groupConditions?.prefs || []).join(', ') || state.groupConditions?.notes || '',
    },
    travellers: (state.guests || []).map((g) => {
      const isLead = Boolean(g.isLead);
      const isProvisional = Boolean(g.isProvisional);
      const fullName = `${g.first || ''} ${g.last || ''}`.trim() || (isProvisional ? 'Provisional Traveller' : 'Guest');

      const rec = {
        id: String(g.id),
        tripId: state.ref || 'VT-2026-001',
        groupId: `grp_${state.ref || 'VT-2026-001'}`,
        fullName,
        category: (g.age === 'Elderly'
          ? 'Senior'
          : g.age === 'Child'
          ? 'Child'
          : g.age === 'Infant'
          ? 'Infant'
          : 'Adult') as any,
        isLead,
        isProvisional,
        email: g.individualEmail || (isLead ? state.client?.email : ''),
        phone: g.individualPhone || (isLead ? state.client?.phone : ''),
        nationality: g.nationality || g.country || '',
        passportNo: g.passportNo || '',
        passportExpiry: g.passportExpiry || '',
        dietaryRequirements: [
          ...(g.dietaryReligious || []),
          ...(g.dietaryLifestyle || []),
          ...(g.dietaryMedical || []),
          ...(g.dietaryPreferences || []),
        ].join(', ') || undefined,
        medicalOrAccessibilityNotes: [
          ...(g.accessibilityMobility || []),
          ...(g.accessibilityVision || []),
          ...(g.accessibilityHearing || []),
          g.medicalOperationalNotes,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
        clientFacingNotes: g.notes || '',
        internalNotes: g.notes || '',
        missingFields: [] as string[],
      };
      rec.missingFields = computeMissingFields(rec);
      return rec;
    }),
  };

  const flights: FlightRecord[] = (state.flights || []).map((f) => ({
    id: String(f.id),
    tripId: state.ref || 'VT-2026-001',
    groupId: group.id,
    direction: (f.from?.toLowerCase().includes('cpt') ? 'Departure' : 'Arrival') as any,
    flightNumber: `${f.airline || ''} ${f.flightNo || ''}`.trim() || 'Flight',
    airline: f.airline || '',
    departureAirport: f.from || '',
    arrivalAirport: f.to || '',
    departureDate: f.date || '',
    departureTime: f.depTime || '',
    arrivalDate: f.date || '',
    arrivalTime: f.arrTime || '',
    pnr: f.pnr || '',
    travellerIds: (f.paxIds || []).map(String),
  }));

  const hotels: HotelBookingRecord[] = (state.rooms || []).map((r) => {
    const settlement = normalizeHotelSettlementStatus(r.pay || 'Unpaid');
    return {
      id: String(r.id),
      tripId: state.ref || 'VT-2026-001',
      groupId: group.id,
      propertyName: r.hotel || 'Accommodation',
      checkInDate: r.cin || state.client?.startDate || '',
      checkOutDate: r.cout || state.client?.endDate || '',
      roomType: r.roomType || '',
      settlementStatus: settlement.status,
      verifiedAddress: r.address || '',
      googleMapsUrl: r.googleMapsUrl || '',
      addressUnresolvedFlag: Boolean(r.googleMapsUrl && !r.address),
      travellerIds: (r.guestIds || []).map(String),
      internalNotes: r.notes || '',
    };
  });

  const transfers: TransferRecord[] = (state.transfers || []).map((t) => ({
    id: String(t.id),
    tripId: state.ref || 'VT-2026-001',
    groupId: group.id,
    date: t.date || state.client?.startDate || '',
    pickupTime: t.time || '09:00',
    estimatedDurationMinutes: parseInt(t.dur || '60', 10) || 60,
    pickupLocation: t.from || 'Origin',
    dropoffLocation: t.to || 'Destination',
    pickupSignText: t.sign || leadGuest?.last || state.client?.name || '',
    clientFacingNotes: t.notes || '',
    internalNotes: t.notes || '',
    driverId: t.driverId || t.driver || '',
    vehicleId: t.vehicleId || t.vehicle || '',
    travellerIds: (t.paxIds || []).map(String),
    updatedAt: new Date().toISOString(),
  }));

  const activities: ActivityRecord[] = (state.activities || []).map((a) => {
    let actDate = a.date;
    if (!actDate && state.client?.startDate) {
      // Calculate day offset from start date
      const start = new Date(state.client.startDate);
      const dayNum = Math.max(1, a.day || 1);
      start.setDate(start.getDate() + (dayNum - 1));
      actDate = start.toISOString().split('T')[0];
    }

    return {
      id: String(a.id),
      tripId: state.ref || 'VT-2026-001',
      groupId: group.id,
      title: a.name || 'Day Excursion',
      date: actDate || state.client?.startDate || new Date().toISOString().split('T')[0],
      startTime: a.start || a.pickup || '09:30',
      endTime: a.endTime,
      location: a.pickupLoc || a.dropoffLoc || 'Cape Town',
      isGroupWide: (a.paxIds || []).length === state.guests.length,
      participantTravellerIds: (a.paxIds || []).map(String),
      excludedTravellerIds: a.excluded || [],
      status: (a.status === 'Requested'
        ? 'Draft'
        : a.status === 'Cancelled'
        ? 'Cancelled'
        : a.status === 'Confirmed'
        ? 'Confirmed'
        : a.status === 'Completed'
        ? 'Completed'
        : a.status === 'Postponed'
        ? 'Postponed'
        : 'Planned') as any,
      clientFacingNotes: a.desc || '',
      internalNotes: a.notes || '',
      responsiblePerson: a.responsiblePerson || a.guideName || '',
      venue: a.venue || a.pickupLoc || '',
      durationMinutes: parseInt(a.dur || '180', 10) || 180,
      cost: a.total || 0,
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    group,
    flights,
    hotels,
    transfers,
    activities,
    heroImageUrl: state.editorial?.heroImageUrl,
  };
}

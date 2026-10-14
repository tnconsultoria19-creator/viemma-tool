/**
 * VIEMMA TOURS — ITINERARY EXTRACTOR
 * Structured and free-text itinerary parser and importer.
 */

import {
  TripGroupStructure,
  TravellerRecord,
  FlightRecord,
  HotelBookingRecord,
  createTravellerWithInheritance,
  quickAddProvisionalTravellers,
} from './argonDomainModel';

export interface ItineraryImportPreview {
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  travellersDetected: TravellerRecord[];
  flightsDetected: FlightRecord[];
  hotelsDetected: HotelBookingRecord[];
  rawUnparsedLines: string[];
}

export function parseAndMapItineraryInput(
  input: string,
  group: TripGroupStructure,
  _existingFlights: FlightRecord[] = [],
  _existingHotels: HotelBookingRecord[] = []
): ItineraryImportPreview {
  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
  const travellers: TravellerRecord[] = [];
  const flights: FlightRecord[] = [];
  const hotels: HotelBookingRecord[] = [];
  const rawUnparsed: string[] = [];

  let leadRecord: TravellerRecord | null = null;
  let childCount = 0;
  let infantCount = 0;

  for (const line of lines) {
    // Check for lead person declaration
    const leadMatch = line.match(/lead\s*(?:person|contact)?:\s*([^(]+)(?:\(([^,]+),\s*([^)]+)\))?/i);
    if (leadMatch) {
      const name = leadMatch[1].trim();
      const email = leadMatch[2]?.trim() || '';
      const phone = leadMatch[3]?.trim() || '';

      leadRecord = createTravellerWithInheritance({
        id: `trv_lead_${Date.now()}`,
        tripId: group.tripId,
        groupId: group.id,
        category: 'Adult',
        isLead: true,
        isProvisional: false,
        fullName: name,
        email,
        phone,
        defaults: group.defaults,
      });
      travellers.push(leadRecord);
      continue;
    }

    // Check for named list items: - Elena Rostova — Lead or - Viktor Rostov — Adult
    const namedMatch = line.match(/^[-*•]\s*([^\-—]+)[—\-]\s*(Lead|Adult|Senior|Child|Infant)/i);
    if (namedMatch) {
      const name = namedMatch[1].trim();
      const roleOrCategory = namedMatch[2].trim().toLowerCase();
      const isLead = roleOrCategory === 'lead';

      // Avoid duplicating lead if already added
      if (isLead && leadRecord && leadRecord.fullName === name) {
        continue;
      }

      const category = isLead ? 'Adult' : (namedMatch[2] as any);
      const rec = createTravellerWithInheritance({
        id: `trv_named_${Date.now()}_${travellers.length + 1}`,
        tripId: group.tripId,
        groupId: group.id,
        category,
        isLead,
        isProvisional: false,
        fullName: name,
        defaults: group.defaults,
      });

      if (isLead && !leadRecord) {
        leadRecord = rec;
      }
      travellers.push(rec);
      continue;
    }

    // Check for quantity lines: e.g. "2 Children" or "1 Infant"
    const qtyMatch = line.match(/(\d+)\s*(children|child|infant|infants|adults|adult)/i);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[1], 10);
      const kind = qtyMatch[2].toLowerCase();
      if (kind.startsWith('child')) {
        childCount += qty;
      } else if (kind.startsWith('infant')) {
        infantCount += qty;
      }
      continue;
    }

    // Check for flight line: Flight: BA059 CPT 2026-12-10 09:15 PNR: X7K9MP
    const flightMatch = line.match(/flight:\s*([A-Z0-9]+)\s*([A-Z]{3})?\s*(\d{4}-\d{2}-\d{2})?\s*(\d{2}:\d{2})?(?:.*?PNR:\s*([A-Z0-9]+))?/i);
    if (flightMatch) {
      const flightNumber = flightMatch[1];
      const airport = flightMatch[2] || '';
      const date = flightMatch[3] || group.defaults.startDate || '';
      const time = flightMatch[4] || '';
      const pnr = flightMatch[5] || '';

      flights.push({
        id: `flt_parsed_${Date.now()}`,
        tripId: group.tripId,
        groupId: group.id,
        direction: 'Arrival',
        flightNumber,
        arrivalAirport: airport,
        arrivalDate: date,
        arrivalTime: time,
        pnr,
        travellerIds: travellers.map((t) => t.id),
      });
      continue;
    }

    // Check for hotel line: Hotel: Mount Nelson (https://maps.app.goo.gl/example123)
    const hotelMatch = line.match(/hotel:\s*([^(\n]+)(?:\((https?:\/\/[^\)]+)\))?/i);
    if (hotelMatch) {
      const propName = hotelMatch[1].trim();
      const mapsUrl = hotelMatch[2]?.trim() || '';

      hotels.push({
        id: `htl_parsed_${Date.now()}`,
        tripId: group.tripId,
        groupId: group.id,
        propertyName: propName,
        checkInDate: group.defaults.startDate || '2026-12-10',
        checkOutDate: group.defaults.endDate || '2026-12-18',
        settlementStatus: 'Deposit Paid',
        googleMapsUrl: mapsUrl,
        addressUnresolvedFlag: Boolean(mapsUrl),
        travellerIds: travellers.map((t) => t.id),
      });
      continue;
    }

    rawUnparsed.push(line);
  }

  // Quick add any detected child/infant quantities
  const fullTravellersList = quickAddProvisionalTravellers(
    travellers,
    { adults: 0, children: childCount, infants: infantCount },
    group.tripId,
    group.id,
    group.defaults
  );

  return {
    leadName: leadRecord?.fullName,
    leadEmail: leadRecord?.email,
    leadPhone: leadRecord?.phone,
    travellersDetected: fullTravellersList,
    flightsDetected: flights,
    hotelsDetected: hotels,
    rawUnparsedLines: rawUnparsed,
  };
}

export function commitImportPreviewToGroup(
  preview: ItineraryImportPreview,
  group: TripGroupStructure
): TripGroupStructure {
  const leadTraveller = preview.travellersDetected.find((t) => t.isLead) || preview.travellersDetected[0];

  return {
    ...group,
    leadTravellerId: leadTraveller ? leadTraveller.id : group.leadTravellerId,
    travellers: preview.travellersDetected.length > 0 ? preview.travellersDetected : group.travellers,
  };
}

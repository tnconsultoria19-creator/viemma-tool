import type { AppState, Activity, Flight, Guest, Room, Transfer } from '../types';

export type TripJsonScope = 'all' | 'clients' | 'flights' | 'transfers' | 'hotels' | 'programme' | 'timeline' | 'finance';
export type TripJsonMode = 'merge' | 'replace';

export interface TripJsonApplyResult {
  state: AppState;
  changed: string[];
  warnings: string[];
}

type AnyRecord = Record<string, any>;

const record = (value: unknown): AnyRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : null;

const keyMap = (source: AnyRecord) => new Map(
  Object.entries(source).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), value])
);

const pick = (source: AnyRecord | null, ...names: string[]): any => {
  if (!source) return undefined;
  const map = keyMap(source);
  for (const name of names) {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (map.has(key) && map.get(key) !== undefined && map.get(key) !== null) return map.get(key);
  }
  return undefined;
};

const text = (value: any, fallback = ''): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const number = (value: any, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.replace(/[ ,R$€£]/g, '')))) {
    return Number(value.replace(/[ ,R$€£]/g, ''));
  }
  return fallback;
};

const list = (value: any): AnyRecord[] | undefined =>
  Array.isArray(value) ? value.map(record).filter((item): item is AnyRecord => Boolean(item)) : undefined;

const firstLast = (source: AnyRecord): [string, string] => {
  const first = text(pick(source, 'first', 'firstName', 'givenName', 'forename'));
  const last = text(pick(source, 'last', 'lastName', 'surname', 'familyName'));
  const full = text(pick(source, 'fullName', 'name', 'travellerName', 'passengerName'));
  if (!first && full) {
    const pieces = full.split(/\s+/);
    return [pieces[0] || '', pieces.slice(1).join(' ')];
  }
  return [first, last];
};

const typology = (value: any): AppState['client']['tourTypology'] | undefined => {
  const v = text(value).toLowerCase().replace(/[_-]+/g, ' ');
  if (!v) return undefined;
  if (v.includes('airport') && v.includes('transfer')) return 'airport_transfer';
  if (v.includes('point to point') || v.includes('point-to-point')) return 'point_to_point_transfer';
  if (v.includes('half')) return 'half_day_tour';
  if (v.includes('full day') || v === 'full day') return 'full_day_tour';
  if (v.includes('safari') && (v.includes('multi') || v.includes('several'))) return 'multi_day_safari';
  if (v.includes('multi day') || v.includes('multi-day') || v.includes('overnight')) return 'multi_day_tour';
  if (v.includes('shared') || v.includes('scheduled')) return 'scheduled_shared_tour';
  if (v.includes('self drive') || v.includes('self-drive')) return 'self_drive_itinerary';
  if (v.includes('private guided') || v.includes('guided private')) return 'private_guided_tour';
  if (v.includes('private transfer')) return 'private_transfer';
  if (v.includes('tailor') || v.includes('bespoke') || v.includes('custom')) return 'tailor_made_tour';
  if (v.includes('transfer')) return 'private_transfer';
  if (v.includes('day tour') || v.includes('excursion')) return 'full_day_tour';
  if (v.includes('safari')) return 'multi_day_safari';
  return undefined;
};

const legacyTripType = (value: AppState['client']['tourTypology'] | undefined, existing: AppState['client']['tripType']): AppState['client']['tripType'] => {
  if (!value) return existing;
  if (value.includes('transfer')) return 'transfer';
  if (value.includes('multi_day')) return 'multi';
  if (value === 'self_drive_itinerary' || value === 'tailor_made_tour') return existing;
  return 'day';
};

function parseRoot(parsed: unknown): AnyRecord {
  const outer = record(parsed);
  if (!outer) throw new Error('The JSON must start with an object, for example { "client": { ... } }.');
  const nested = [outer.payload, outer.data, outer.booking, outer.trip].map(record).find(Boolean) || {};
  return { ...outer, ...nested };
}

function sourceArray(root: AnyRecord, ...names: string[]): AnyRecord[] | undefined {
  for (const name of names) {
    const found = pick(root, name);
    const parsed = list(found);
    if (parsed) return parsed;
  }
  return undefined;
}

function buildGuest(source: AnyRecord, existing: Guest | undefined, index: number, seed: number): Guest {
  const [first, last] = firstLast(source);
  const ageRaw = text(pick(source, 'ageCategory', 'ageGroup', 'age'), existing?.age || 'Adult').toLowerCase();
  const age: Guest['age'] = /infant|baby/.test(ageRaw) ? 'Infant' : /child|kid/.test(ageRaw) ? 'Child' : /teen/.test(ageRaw) ? 'Teen' : /elder|senior/.test(ageRaw) ? 'Elderly' : 'Adult';
  const isLeadValue = pick(source, 'isLead', 'isPrimary', 'lead', 'primaryContact', 'groupLead');
  const explicitId = number(pick(source, 'id', 'travellerId', 'passengerId'), 0);
  return {
    ...(existing || {}),
    id: existing?.id ?? (explicitId > 0 ? explicitId : seed + index),
    first: first || existing?.first || 'Traveller',
    last: last || existing?.last || '',
    preferredName: text(pick(source, 'preferredName', 'displayName'), existing?.preferredName || [first, last].filter(Boolean).join(' ')),
    nationality: text(pick(source, 'nationality', 'citizenship'), existing?.nationality || text(pick(source, 'country'), existing?.country || '')),
    country: text(pick(source, 'country', 'residenceCountry'), existing?.country || text(pick(source, 'nationality'), existing?.nationality || '')),
    age,
    exactAge: pick(source, 'exactAge', 'ageYears') !== undefined ? number(pick(source, 'exactAge', 'ageYears')) : existing?.exactAge,
    dob: text(pick(source, 'dob', 'dateOfBirth', 'birthDate'), existing?.dob || ''),
    passportNo: text(pick(source, 'passportNo', 'passportNumber'), existing?.passportNo || ''),
    passportExpiry: text(pick(source, 'passportExpiry', 'passportExpiryDate'), existing?.passportExpiry || ''),
    relationshipToLead: text(pick(source, 'relationshipToLead', 'relationship', 'relationshipToPrimary'), existing?.relationshipToLead || (isLeadValue ? 'Primary Contact' : 'Family Member')),
    individualEmail: text(pick(source, 'email', 'individualEmail'), existing?.individualEmail || ''),
    individualPhone: text(pick(source, 'phone', 'mobile', 'telephone', 'whatsapp'), existing?.individualPhone || ''),
    isLead: isLeadValue === undefined ? Boolean(existing?.isLead) : Boolean(isLeadValue),
    isProvisional: pick(source, 'isProvisional', 'provisional') === undefined ? existing?.isProvisional : Boolean(pick(source, 'isProvisional', 'provisional')),
    notes: text(pick(source, 'notes', 'specialRequirements', 'comments'), existing?.notes || ''),
    languagesSpoken: Array.isArray(pick(source, 'languagesSpoken', 'languages')) ? pick(source, 'languagesSpoken', 'languages').map((v: any) => text(v)).filter(Boolean) : existing?.languagesSpoken,
    diet: Array.isArray(pick(source, 'dietaryRequirements', 'dietary', 'diet')) ? pick(source, 'dietaryRequirements', 'dietary', 'diet').map((v: any) => text(v)).filter(Boolean) : existing?.diet,
    mob: Array.isArray(pick(source, 'accessibilityRequirements', 'mobility', 'accessibility')) ? pick(source, 'accessibilityRequirements', 'mobility', 'accessibility').map((v: any) => text(v)).filter(Boolean) : existing?.mob,
    pref: Array.isArray(pick(source, 'preferences', 'travelPreferences')) ? pick(source, 'preferences', 'travelPreferences').map((v: any) => text(v)).filter(Boolean) : existing?.pref,
  };
}

function mergeBy<T>(
  current: T[],
  incoming: T[],
  mode: TripJsonMode,
  match: (existing: T, candidate: T) => boolean,
): T[] {
  if (mode === 'replace') return incoming;
  const result = [...current];
  for (const candidate of incoming) {
    const index = result.findIndex(existing => match(existing, candidate));
    if (index >= 0) result[index] = { ...result[index], ...candidate };
    else result.push(candidate);
  }
  return result;
}

const same = (a: unknown, b: unknown) => text(a).toLowerCase().trim() === text(b).toLowerCase().trim();

function mapFlight(source: AnyRecord, existing: Flight | undefined, index: number, guests: Guest[]): Flight {
  const flightNo = text(pick(source, 'flightNo', 'flightNumber', 'flight', 'number'), existing?.flightNo || '');
  const date = text(pick(source, 'date', 'flightDate', 'departureDate', 'arrivalDate'), existing?.date || '');
  const directionRaw = text(pick(source, 'direction', 'journeyDirection', 'type'), existing?.direction || 'Inbound').toLowerCase();
  const direction: Flight['direction'] = /outbound|departure|return/.test(directionRaw) ? 'Outbound' : /internal|domestic|regional/.test(directionRaw) ? 'Internal' : 'Inbound';
  const statusRaw = text(pick(source, 'status', 'bookingStatus'), existing?.status || 'Pending');
  const validStatus = ['Quoted', 'Booked', 'Ticketed', 'Cancelled', 'Confirmed', 'Pending'].find(v => v.toLowerCase() === statusRaw.toLowerCase()) as Flight['status'] | undefined;
  const namedPax = pick(source, 'paxNames', 'travellerNames', 'travelerNames', 'passengerNames', 'travellers', 'travelers');
  let paxIds = Array.isArray(pick(source, 'paxIds', 'travellerIds', 'passengerIds')) ? pick(source, 'paxIds', 'travellerIds', 'passengerIds').map((x: any) => number(x)).filter((id: number) => guests.some(g => g.id === id)) : existing?.paxIds || [];
  if (Array.isArray(namedPax)) {
    paxIds = namedPax.map((n: any) => {
      const name = typeof n === 'string' ? n : text(pick(record(n), 'name', 'fullName', 'travellerName'));
      return guests.find(g => same(`${g.first} ${g.last}`, name) || same(g.preferredName, name))?.id;
    }).filter((id: number | undefined): id is number => id !== undefined);
  }
  return {
    ...(existing || {}), id: existing?.id ?? (number(pick(source, 'id'), 0) || Date.now() + index),
    direction, airline: text(pick(source, 'airline', 'carrier', 'airlineName'), existing?.airline || 'To be confirmed'),
    flightNo: flightNo || existing?.flightNo || 'TBC', pnr: text(pick(source, 'pnr', 'bookingReference', 'recordLocator'), existing?.pnr || ''),
    from: text(pick(source, 'from', 'origin', 'departureAirport', 'fromAirport'), existing?.from || ''),
    to: text(pick(source, 'to', 'destination', 'arrivalAirport', 'toAirport'), existing?.to || ''),
    date, depTime: text(pick(source, 'depTime', 'departureTime', 'departAt'), existing?.depTime || ''),
    arrTime: text(pick(source, 'arrTime', 'arrivalTime', 'arriveAt'), existing?.arrTime || ''),
    duration: text(pick(source, 'duration', 'flightDuration'), existing?.duration || ''),
    cabin: text(pick(source, 'cabin', 'class'), existing?.cabin || 'Economy') as Flight['cabin'],
    status: validStatus || existing?.status || 'Pending', paxIds,
    bagHand: number(pick(source, 'bagHand', 'handBaggage'), existing?.bagHand || 0),
    bagCheck: number(pick(source, 'bagCheck', 'checkedBaggage'), existing?.bagCheck || 0),
    bagOver: number(pick(source, 'bagOver', 'extraBags'), existing?.bagOver || 0),
    cost: number(pick(source, 'cost', 'supplierCost', 'price'), existing?.cost || 0),
    markup: number(pick(source, 'markup'), existing?.markup || 0),
    qty: number(pick(source, 'qty', 'quantity'), existing?.qty || Math.max(1, paxIds.length)),
    notes: text(pick(source, 'notes', 'remarks'), existing?.notes || ''),
    stops: Array.isArray(pick(source, 'stops', 'layovers')) ? pick(source, 'stops', 'layovers').map((stop: AnyRecord, i: number) => ({
      id: number(pick(stop, 'id'), Date.now() + i), airport: text(pick(stop, 'airport', 'code')),
      arrTime: text(pick(stop, 'arrTime', 'arrivalTime')), depTime: text(pick(stop, 'depTime', 'departureTime')),
      duration: text(pick(stop, 'duration')), changeFlightNo: text(pick(stop, 'changeFlightNo', 'flightNo'))
    })) : existing?.stops || [],
  };
}

function mapTransfer(source: AnyRecord, existing: Transfer | undefined, index: number, guests: Guest[]): Transfer {
  const typeText = text(pick(source, 'type', 'transferType', 'serviceType'), existing?.type || 'Point-to-Point').toLowerCase();
  const type: Transfer['type'] = /arrival|inbound airport/.test(typeText) ? 'Airport Arrival' :
    /departure|outbound airport/.test(typeText) ? 'Airport Departure' :
    /inter.?hotel|hotel change/.test(typeText) ? 'Inter-Hotel' :
    /activity|tour transfer/.test(typeText) ? 'Activity Transfer' :
    /full.day|vehicle hire|disposal/.test(typeText) ? 'Full-Day Vehicle' :
    /airport/.test(typeText) ? (text(pick(source, 'direction')).toLowerCase() === 'departure' ? 'Airport Departure' : 'Airport Arrival') :
    'Point-to-Point';
  const nameIds = pick(source, 'paxNames', 'travellerNames', 'passengerNames', 'travellers', 'travelers');
  const paxIds = Array.isArray(nameIds) ? nameIds.map((n: any) => {
    const name = typeof n === 'string' ? n : text(pick(record(n), 'name', 'fullName'));
    return guests.find(g => same(`${g.first} ${g.last}`, name) || same(g.preferredName, name))?.id;
  }).filter((id: number | undefined): id is number => id !== undefined) :
    Array.isArray(pick(source, 'paxIds', 'travellerIds')) ? pick(source, 'paxIds', 'travellerIds').map((v: any) => number(v)).filter((id: number) => guests.some(g => g.id === id)) : existing?.paxIds || [];
  const statusRaw = text(pick(source, 'status', 'bookingStatus'), existing?.status || 'Pending');
  const status: Transfer['status'] = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Assigned'].find(v => v.toLowerCase() === statusRaw.toLowerCase()) as Transfer['status'] || 'Pending';
  return {
    ...(existing || {}), id: existing?.id ?? (number(pick(source, 'id'), 0) || Date.now() + 100 + index),
    type, date: text(pick(source, 'date', 'serviceDate'), existing?.date || ''),
    time: text(pick(source, 'time', 'pickupTime', 'departureTime'), existing?.time || ''),
    status, from: text(pick(source, 'from', 'pickup', 'pickupLocation', 'origin'), existing?.from || ''),
    to: text(pick(source, 'to', 'dropoff', 'dropOffLocation', 'destination'), existing?.to || ''),
    meet: text(pick(source, 'meet', 'meetingPoint', 'meetingInstructions'), existing?.meet || ''),
    sign: text(pick(source, 'sign', 'pickupSignText', 'meetAndGreetName'), existing?.sign || ''),
    flight: text(pick(source, 'flight', 'flightNo', 'flightNumber'), existing?.flight || ''),
    dist: text(pick(source, 'dist', 'distance'), existing?.dist || ''),
    dur: text(pick(source, 'dur', 'duration', 'journeyTime'), existing?.dur || ''),
    vehicle: text(pick(source, 'vehicle', 'vehicleName', 'vehicleType'), existing?.vehicle || ''),
    driver: text(pick(source, 'driver', 'driverName'), existing?.driver || ''),
    driverPhone: text(pick(source, 'driverPhone', 'phone'), existing?.driverPhone || ''),
    paxCount: number(pick(source, 'paxCount', 'passengers', 'travellerCount'), existing?.paxCount || paxIds.length),
    paxIds, bagHand: number(pick(source, 'bagHand'), existing?.bagHand || 0),
    bagCheck: number(pick(source, 'bagCheck'), existing?.bagCheck || 0), bagOver: number(pick(source, 'bagOver'), existing?.bagOver || 0),
    seats: Array.isArray(pick(source, 'seats', 'childSeats')) ? pick(source, 'seats', 'childSeats').map((v: any) => text(v)) : existing?.seats || [],
    special: Array.isArray(pick(source, 'special', 'extras')) ? pick(source, 'special', 'extras').map((v: any) => text(v)) : existing?.special || [],
    cost: number(pick(source, 'cost', 'supplierCost', 'price'), existing?.cost || 0),
    tolls: number(pick(source, 'tolls'), existing?.tolls || 0), parking: number(pick(source, 'parking'), existing?.parking || 0),
    notes: text(pick(source, 'notes', 'remarks'), existing?.notes || ''), waypoints: existing?.waypoints || [],
  };
}

function mapRoom(source: AnyRecord, existing: Room | undefined, index: number, guests: Guest[]): Room {
  const [first, rest] = firstLast(source);
  const hotel = text(pick(source, 'hotel', 'hotelName', 'property', 'propertyName', 'accommodation', 'name'), existing?.hotel || first);
  const inDate = text(pick(source, 'cin', 'checkIn', 'checkInDate', 'arrivalDate'), existing?.cin || '');
  const outDate = text(pick(source, 'cout', 'checkOut', 'checkOutDate', 'departureDate'), existing?.cout || '');
  const assignedNames = pick(source, 'assignedPaxNames', 'travellerNames', 'guestNames', 'travellers', 'travelers');
  const guestIds = Array.isArray(assignedNames) ? assignedNames.map((v: any) => {
    const name = typeof v === 'string' ? v : text(pick(record(v), 'name', 'fullName'));
    return guests.find(g => same(`${g.first} ${g.last}`, name) || same(g.preferredName, name))?.id;
  }).filter((id: number | undefined): id is number => id !== undefined) :
    Array.isArray(pick(source, 'guestIds', 'travellerIds')) ? pick(source, 'guestIds', 'travellerIds').map((v: any) => number(v)).filter((id: number) => guests.some(g => g.id === id)) : existing?.guestIds || [];
  const meal = text(pick(source, 'meal', 'mealPlan', 'mealBasis', 'boardBasis'), existing?.meal || 'Room Only');
  const payRaw = text(pick(source, 'pay', 'paymentStatus'), existing?.pay || 'Negotiation / Pending Confirmation');
  const pay: Room['pay'] = ['Unpaid', 'Deposit Paid', 'Paid', 'Negotiation / Pending Confirmation', 'Fully Paid'].find(v => v.toLowerCase() === payRaw.toLowerCase()) as Room['pay'] || 'Negotiation / Pending Confirmation';
  return {
    ...(existing || {}), id: existing?.id ?? (number(pick(source, 'id'), 0) || Date.now() + 200 + index),
    hotel: hotel || rest, conf: text(pick(source, 'conf', 'confirmationReference', 'bookingReference'), existing?.conf || ''),
    pay, status: text(pick(source, 'status', 'bookingStatus'), existing?.status || 'Requested') as Room['status'],
    roomType: text(pick(source, 'roomType', 'roomCategory'), existing?.roomType || 'To be confirmed'),
    bed: text(pick(source, 'bed', 'bedType'), existing?.bed || 'To be confirmed'),
    meal, cin: inDate, cout: outDate,
    nights: number(pick(source, 'nights', 'nightCount'), existing?.nights || (inDate && outDate ? Math.max(0, Math.round((Date.parse(outDate) - Date.parse(inDate)) / 86400000)) : 0)),
    guestIds, rate: number(pick(source, 'rate', 'nightlyRate', 'pricePerNight', 'cost'), existing?.rate || 0),
    supp: number(pick(source, 'supp', 'supplement', 'totalSupplement'), existing?.supp || 0),
    reqs: Array.isArray(pick(source, 'reqs', 'requests', 'roomRequests')) ? pick(source, 'reqs', 'requests', 'roomRequests').map((v: any) => text(v)) : existing?.reqs || [],
    notes: text(pick(source, 'notes', 'remarks', 'specialRequests'), existing?.notes || ''),
    address: text(pick(source, 'address', 'propertyAddress'), existing?.address || ''),
    googleMapsUrl: text(pick(source, 'googleMapsUrl', 'mapsUrl'), existing?.googleMapsUrl || ''),
  };
}

function mapActivity(source: AnyRecord, existing: Activity | undefined, index: number, guests: Guest[]): Activity {
  const day = Math.max(1, number(pick(source, 'day', 'dayNumber', 'itineraryDay'), existing?.day || 1));
  const name = text(pick(source, 'name', 'title', 'activity', 'experience', 'tourName'), existing?.name || 'Activity to be confirmed');
  const slotRaw = text(pick(source, 'slot', 'timeOfDay', 'period'), existing?.slot || 'Full Day').toLowerCase();
  const slot: Activity['slot'] = /morning|am/.test(slotRaw) ? 'Morning' : /afternoon|pm/.test(slotRaw) ? 'Afternoon' : /evening|sunset/.test(slotRaw) ? 'Evening' : 'Full Day';
  const paxNames = pick(source, 'paxNames', 'travellerNames', 'guestNames', 'travellers', 'travelers');
  const paxIds = Array.isArray(paxNames) ? paxNames.map((v: any) => {
    const nameValue = typeof v === 'string' ? v : text(pick(record(v), 'name', 'fullName'));
    return guests.find(g => same(`${g.first} ${g.last}`, nameValue) || same(g.preferredName, nameValue))?.id;
  }).filter((id: number | undefined): id is number => id !== undefined) :
    Array.isArray(pick(source, 'paxIds', 'travellerIds', 'guestIds')) ? pick(source, 'paxIds', 'travellerIds', 'guestIds').map((v: any) => number(v)).filter((id: number) => guests.some(g => g.id === id)) : existing?.paxIds || guests.map(g => g.id);
  const statusRaw = text(pick(source, 'status', 'bookingStatus'), existing?.status || 'Planned');
  const status: Activity['status'] = ['Draft', 'Planned', 'Requested', 'Confirmed', 'Completed', 'Postponed', 'Cancelled'].find(v => v.toLowerCase() === statusRaw.toLowerCase()) as Activity['status'] || 'Planned';
  const pAdult = number(pick(source, 'pAdult', 'adultPrice', 'pricePerAdult'), existing?.pAdult || 0);
  const pChild = number(pick(source, 'pChild', 'childPrice', 'pricePerChild'), existing?.pChild || 0);
  const nAdult = number(pick(source, 'nAdult', 'adultCount'), existing?.nAdult || guests.filter(g => g.age === 'Adult' || g.age === 'Elderly').length);
  const nChild = number(pick(source, 'nChild', 'childCount'), existing?.nChild || guests.filter(g => g.age === 'Child' || g.age === 'Teen').length);
  return {
    ...(existing || {}), id: existing?.id ?? (number(pick(source, 'id'), 0) || Date.now() + 300 + index),
    day, date: text(pick(source, 'date', 'activityDate'), existing?.date || ''),
    slot, name, desc: text(pick(source, 'desc', 'description', 'clientDescription', 'summary'), existing?.desc || ''),
    clientDescription: text(pick(source, 'clientDescription', 'descriptionForClient'), existing?.clientDescription || ''),
    pickup: text(pick(source, 'pickup', 'pickupTime', 'collectionTime'), existing?.pickup || ''),
    start: text(pick(source, 'start', 'startTime', 'time'), existing?.start || ''),
    endTime: text(pick(source, 'endTime', 'finishTime', 'end'), existing?.endTime || ''),
    dur: text(pick(source, 'dur', 'duration', 'durationText'), existing?.dur || ''),
    venue: text(pick(source, 'venue', 'location', 'site'), existing?.venue || ''),
    pickupLoc: text(pick(source, 'pickupLoc', 'pickupLocation', 'meetingPoint'), existing?.pickupLoc || ''),
    status, conf: text(pick(source, 'conf', 'confirmationReference', 'bookingReference'), existing?.conf || ''),
    supplier: text(pick(source, 'supplier', 'operator', 'provider'), existing?.supplier || ''),
    supPhone: text(pick(source, 'supPhone', 'supplierPhone', 'contactNumber'), existing?.supPhone || ''),
    paxIds, pAdult, pChild, nAdult, nChild,
    flat: number(pick(source, 'flat', 'fixedCost'), existing?.flat || 0),
    total: number(pick(source, 'total', 'sellingPrice', 'totalPrice'), existing?.total || pAdult * nAdult + pChild * nChild),
    inc: Array.isArray(pick(source, 'inc', 'includes', 'inclusions')) ? pick(source, 'inc', 'includes', 'inclusions').map((v: any) => text(v)) : existing?.inc || [],
    backup: text(pick(source, 'backup', 'alternative'), existing?.backup || ''),
    notes: text(pick(source, 'notes', 'remarks', 'operationalNotes'), existing?.notes || ''),
    isFree: Boolean(pick(source, 'isFree', 'complimentary') ?? existing?.isFree ?? false),
    groupIds: Array.isArray(pick(source, 'groupIds')) ? pick(source, 'groupIds').map((v: any) => text(v)) : existing?.groupIds,
    groupNames: Array.isArray(pick(source, 'groupNames', 'groups')) ? pick(source, 'groupNames').map((v: any) => text(v)) : existing?.groupNames,
    category: text(pick(source, 'category', 'tourCategory'), existing?.category || ''),
    destination: text(pick(source, 'destination', 'region'), existing?.destination || ''),
    voucherRef: text(pick(source, 'voucherRef', 'voucherNumber'), existing?.voucherRef || ''),
    packingAdvice: text(pick(source, 'packingAdvice', 'whatToBring'), existing?.packingAdvice || ''),
    dressCode: text(pick(source, 'dressCode'), existing?.dressCode || ''),
    accessibility: Array.isArray(pick(source, 'accessibility', 'accessibilityNotes')) ? pick(source, 'accessibility', 'accessibilityNotes').map((v: any) => text(v)) : existing?.accessibility,
    weatherDependency: text(pick(source, 'weatherDependency', 'weatherNotes'), existing?.weatherDependency || ''),
  };
}

const modeAllowed = (scope: TripJsonScope, section: TripJsonScope) => scope === 'all' || scope === section ||
  (scope === 'timeline' && section === 'programme') || (scope === 'programme' && section === 'timeline');

export function applyTripJson(
  current: AppState,
  parsedValue: unknown,
  scope: TripJsonScope,
  mode: TripJsonMode = 'merge',
): TripJsonApplyResult {
  const root = parseRoot(parsedValue);
  const next: AppState = { ...current };
  const changed: string[] = [];
  const warnings: string[] = [];
  const seed = Date.now();
  const clientSource = record(pick(root, 'client', 'customer', 'lead', 'primaryContact', 'clientDetails')) ||
    (pick(root, 'clientName', 'guestName', 'contactName') !== undefined ? root : null);
  const travellerSources = sourceArray(root, 'travellers', 'travelers', 'guests', 'passengers', 'tourParty');
  const flightSources = sourceArray(root, 'flights', 'flightDetails', 'airTravel');
  const transferSources = sourceArray(root, 'transfers', 'groundTransfers', 'transport');
  const roomSources = sourceArray(root, 'rooms', 'hotels', 'accommodations', 'stays', 'hotelBookings');
  let activitySources = sourceArray(root, 'activities', 'programme', 'program', 'dayTours', 'experiences');
  const itineraryValue = pick(root, 'itinerary', 'dailyItinerary', 'dailyPlan');
  if (!activitySources && Array.isArray(itineraryValue)) activitySources = list(itineraryValue);
  const itineraryObject = record(itineraryValue);
  if (!activitySources && itineraryObject) activitySources = sourceArray(itineraryObject, 'activities', 'programme', 'program', 'days');

  if (modeAllowed(scope, 'clients') && clientSource) {
    const typologyValue = pick(clientSource, 'tourTypology', 'tourType', 'bookingType', 'tripTypology', 'tripType', 'type') ?? pick(root, 'tourTypology', 'tourType');
    const parsedTypology = typology(typologyValue);
    const client = { ...next.client };
    const fields: [keyof typeof client, any, (value: any) => any][] = [
      ['name', pick(clientSource, 'name', 'clientName', 'fullName', 'groupName'), v => text(v)],
      ['preferredName', pick(clientSource, 'preferredName', 'firstNameToUse'), v => text(v)],
      ['email', pick(clientSource, 'email', 'emailAddress'), v => text(v)],
      ['phone', pick(clientSource, 'phone', 'telephone', 'mobile', 'contactNumber'), v => text(v)],
      ['whatsapp', pick(clientSource, 'whatsapp', 'whatsAppNumber'), v => text(v)],
      ['country', pick(clientSource, 'country', 'nationality', 'residenceCountry'), v => text(v)],
      ['startDate', pick(clientSource, 'startDate', 'arrivalDate', 'travelStart', 'checkIn'), v => text(v)],
      ['endDate', pick(clientSource, 'endDate', 'departureDate', 'travelEnd', 'checkOut'), v => text(v)],
      ['occasion', pick(clientSource, 'occasion', 'reasonForTravel', 'celebration'), v => text(v)],
    ];
    for (const [key, value, convert] of fields) if (value !== undefined) (client as AnyRecord)[key] = convert(value);
    if (parsedTypology) {
      client.tourTypology = parsedTypology;
      client.tripType = legacyTripType(parsedTypology, client.tripType);
    }
    if (Array.isArray(pick(clientSource, 'tags', 'interests', 'travelInterests'))) {
      client.tags = pick(clientSource, 'tags', 'interests', 'travelInterests').map((v: any) => text(v)).filter(Boolean);
    }
    if (pick(clientSource, 'contactMethod') !== undefined) {
      const contact = text(pick(clientSource, 'contactMethod')).toLowerCase();
      client.contactMethod = contact.includes('email') ? 'email' : contact.includes('call') || contact.includes('phone') ? 'call' : 'whatsapp';
    }
    next.client = client;
    if (pick(clientSource, 'notes', 'specialRequirements') !== undefined) {
      next.groupConditions = { ...next.groupConditions, notes: text(pick(clientSource, 'notes', 'specialRequirements')) };
    }
    changed.push('client details');
  }

  const dietary = pick(root, 'dietaryRequirements', 'dietary', 'dietaryNeeds');
  const accessibility = pick(root, 'accessibilityRequirements', 'accessibility', 'mobilityNeeds');
  const preferences = pick(root, 'preferences', 'travelPreferences');
  const conditionNotes = pick(root, 'groupNotes', 'generalNotes', 'specialRequirements', 'notes');
  if (modeAllowed(scope, 'clients') && [dietary, accessibility, preferences, conditionNotes].some(v => v !== undefined)) {
    next.groupConditions = {
      ...next.groupConditions,
      ...(Array.isArray(dietary) ? { dietary: dietary.map((v: any) => text(v)) } : {}),
      ...(Array.isArray(accessibility) ? { mobility: accessibility.map((v: any) => text(v)) } : {}),
      ...(Array.isArray(preferences) ? { prefs: preferences.map((v: any) => text(v)) } : {}),
      ...(conditionNotes !== undefined ? { notes: text(conditionNotes) } : {}),
    };
    changed.push('group requirements');
  }

  const importedByName = new Map<string, number>();
  if (modeAllowed(scope, 'clients') && travellerSources) {
    const incoming: Guest[] = travellerSources.map((source, index) => {
      const [first, last] = firstLast(source);
      const existing = next.guests.find(g => same(`${g.first} ${g.last}`, `${first} ${last}`) || (first && same(g.preferredName, first)));
      const guest = buildGuest(source, existing, index, seed);
      importedByName.set(`${guest.first} ${guest.last}`.toLowerCase(), guest.id);
      if (guest.preferredName) importedByName.set(guest.preferredName.toLowerCase(), guest.id);
      return guest;
    });
    if (incoming.length && !incoming.some(g => g.isLead) && next.guests.length === 0) incoming[0].isLead = true;
    next.guests = mergeBy(next.guests, incoming, mode, (a, b) => a.id === b.id || same(`${a.first} ${a.last}`, `${b.first} ${b.last}`));
    // Maintain one lead person only when the imported output explicitly marks a lead.
    if (incoming.some(g => g.isLead)) {
      const leadId = incoming.find(g => g.isLead)!.id;
      next.guests = next.guests.map(g => ({ ...g, isLead: g.id === leadId }));
    }
    const lead = next.guests.find(g => g.isLead);
    if (lead && (!next.client.name || !clientSource)) {
      next.client = { ...next.client, name: next.client.name || [lead.first, lead.last].filter(Boolean).join(' ').trim(), email: lead.individualEmail || next.client.email, phone: lead.individualPhone || next.client.phone, country: lead.nationality || lead.country || next.client.country };
    }
    changed.push(`${incoming.length} traveller record(s)`);
  }

  const guestForName = (name: any): Guest | undefined => {
    const value = typeof name === 'string' ? name : text(pick(record(name), 'name', 'fullName', 'travellerName'));
    const importedId = importedByName.get(value.toLowerCase());
    return next.guests.find(g => g.id === importedId) || next.guests.find(g => same(`${g.first} ${g.last}`, value) || same(g.preferredName, value));
  };
  // The mapping above normally leaves passenger linking to the item-specific mapper. Resolve any names to current guest IDs there.

  if (modeAllowed(scope, 'flights') && flightSources) {
    const incoming = flightSources.map((source, index) => {
      const key = text(pick(source, 'flightNo', 'flightNumber', 'flight', 'number'));
      const date = text(pick(source, 'date', 'flightDate', 'departureDate', 'arrivalDate'));
      const existing = next.flights.find(f => (key && same(f.flightNo, key) && (!date || same(f.date, date))) || (pick(source, 'id') !== undefined && f.id === number(pick(source, 'id'))));
      const mapped = mapFlight(source, existing, index, next.guests);
      const paxNames = pick(source, 'paxNames', 'travellerNames', 'travelerNames', 'passengerNames', 'travellers', 'travelers');
      if (Array.isArray(paxNames)) mapped.paxIds = paxNames.map(guestForName).filter(Boolean).map(g => g!.id);
      return mapped;
    });
    next.flights = mergeBy(next.flights, incoming, mode, (a, b) => a.id === b.id || (Boolean(a.flightNo) && same(a.flightNo, b.flightNo) && same(a.date, b.date)));
    changed.push(`${incoming.length} flight record(s)`);
  }

  if (modeAllowed(scope, 'transfers') && transferSources) {
    const incoming = transferSources.map((source, index) => {
      const date = text(pick(source, 'date', 'serviceDate'));
      const from = text(pick(source, 'from', 'pickup', 'pickupLocation', 'origin'));
      const to = text(pick(source, 'to', 'dropoff', 'dropOffLocation', 'destination'));
      const existing = next.transfers.find(t => (date && same(t.date, date) && same(t.from, from) && same(t.to, to)) || (pick(source, 'id') !== undefined && t.id === number(pick(source, 'id'))));
      const mapped = mapTransfer(source, existing, index, next.guests);
      const names = pick(source, 'paxNames', 'travellerNames', 'passengerNames', 'travellers', 'travelers');
      if (Array.isArray(names)) mapped.paxIds = names.map(guestForName).filter(Boolean).map(g => g!.id);
      return mapped;
    });
    next.transfers = mergeBy(next.transfers, incoming, mode, (a, b) => a.id === b.id || (same(a.date, b.date) && same(a.from, b.from) && same(a.to, b.to)));
    changed.push(`${incoming.length} transfer record(s)`);
  }

  if (modeAllowed(scope, 'hotels') && roomSources) {
    const incoming = roomSources.map((source, index) => {
      const hotel = text(pick(source, 'hotel', 'hotelName', 'property', 'propertyName', 'accommodation', 'name'));
      const cin = text(pick(source, 'cin', 'checkIn', 'checkInDate', 'arrivalDate'));
      const cout = text(pick(source, 'cout', 'checkOut', 'checkOutDate', 'departureDate'));
      const existing = next.rooms.find(r => (hotel && same(r.hotel, hotel) && (!cin || same(r.cin, cin)) && (!cout || same(r.cout, cout))) || (pick(source, 'id') !== undefined && r.id === number(pick(source, 'id'))));
      const mapped = mapRoom(source, existing, index, next.guests);
      const names = pick(source, 'assignedPaxNames', 'travellerNames', 'guestNames', 'travellers', 'travelers');
      if (Array.isArray(names)) mapped.guestIds = names.map(guestForName).filter(Boolean).map(g => g!.id);
      return mapped;
    });
    next.rooms = mergeBy(next.rooms, incoming, mode, (a, b) => a.id === b.id || (same(a.hotel, b.hotel) && same(a.cin, b.cin) && same(a.cout, b.cout)));
    changed.push(`${incoming.length} hotel / room record(s)`);
  }

  if ((modeAllowed(scope, 'programme') || modeAllowed(scope, 'timeline')) && activitySources) {
    const incoming = activitySources.flatMap((source, index) => {
      const name = text(pick(source, 'name', 'title', 'activity', 'experience', 'tourName'));
      const day = number(pick(source, 'day', 'dayNumber', 'itineraryDay'), 0);
      const date = text(pick(source, 'date', 'activityDate'));
      const existing = next.activities.find(a => (name && same(a.name, name) && (day ? a.day === day : !date || same(a.date, date))) || (pick(source, 'id') !== undefined && a.id === number(pick(source, 'id'))));
      return [mapActivity(source, existing, index, next.guests)];
    });
    next.activities = mergeBy(next.activities, incoming, mode, (a, b) => a.id === b.id || (same(a.name, b.name) && a.day === b.day));
    changed.push(`${incoming.length} programme item(s)`);
  }

  if ((modeAllowed(scope, 'timeline') || modeAllowed(scope, 'programme') || scope === 'all') &&
      (record(pick(root, 'dayTitles', 'dailyTitles', 'dayNames')) || (itineraryObject && record(pick(itineraryObject, 'dayTitles', 'dailyTitles', 'dayNames'))))) {
    const titles = record(pick(root, 'dayTitles', 'dailyTitles', 'dayNames')) || record(pick(itineraryObject, 'dayTitles', 'dailyTitles', 'dayNames')) || {};
    const normalized: Record<number, string> = { ...(next.dayTitles || {}) };
    for (const [day, titleValue] of Object.entries(titles)) {
      const dayNumber = number(day, 0);
      if (dayNumber > 0 && text(titleValue)) normalized[dayNumber] = text(titleValue);
    }
    next.dayTitles = normalized;
    changed.push('day titles');
  }

  const financeSource = record(pick(root, 'finance', 'pricing', 'quote', 'costing'));
  if (modeAllowed(scope, 'finance') && financeSource) {
    const currency = text(pick(financeSource, 'currency', 'pricingCurrency')).toUpperCase();
    const allowedCurrency = ['ZAR', 'USD', 'EUR', 'BRL', 'AOA'].includes(currency) ? currency as AppState['finance']['currency'] : undefined;
    next.finance = {
      ...next.finance,
      ...(allowedCurrency ? { currency: allowedCurrency } : {}),
      ...(pick(financeSource, 'margin', 'markup', 'markUp') !== undefined ? { margin: number(pick(financeSource, 'margin', 'markup', 'markUp'), next.finance.margin) } : {}),
      ...(pick(financeSource, 'marginType', 'markupType') !== undefined ? { marginType: text(pick(financeSource, 'marginType', 'markupType')).includes('%') ? '%' : 'Fixed' } : {}),
      ...(pick(financeSource, 'commission', 'comm') !== undefined ? { comm: number(pick(financeSource, 'commission', 'comm'), next.finance.comm) } : {}),
      ...(pick(financeSource, 'discount') !== undefined ? { discount: number(pick(financeSource, 'discount'), next.finance.discount) } : {}),
      ...(pick(financeSource, 'buffer', 'contingency') !== undefined ? { buffer: number(pick(financeSource, 'buffer', 'contingency'), next.finance.buffer) } : {}),
      ...(pick(financeSource, 'bufferNotes', 'pricingNotes') !== undefined ? { bufferNotes: text(pick(financeSource, 'bufferNotes', 'pricingNotes')) } : {}),
    };
    changed.push('pricing details');
  }

  const placard = record(pick(root, 'welcomePlacard', 'pickupSign', 'welcomeSign'));
  if (placard && (scope === 'all' || scope === 'transfers')) {
    const current = next.welcomePlacard || { showAgencyName: true, agencyName: 'Viemma Tours', guestName: '' };
    next.welcomePlacard = {
      ...current,
      ...(pick(placard, 'showAgencyName', 'showBrand') !== undefined ? { showAgencyName: Boolean(pick(placard, 'showAgencyName', 'showBrand')) } : {}),
      ...(pick(placard, 'agencyName', 'brandName', 'agentName') !== undefined ? { agencyName: text(pick(placard, 'agencyName', 'brandName', 'agentName')) } : {}),
      ...(pick(placard, 'guestName', 'signName', 'travellerName') !== undefined ? { guestName: text(pick(placard, 'guestName', 'signName', 'travellerName')) } : {}),
    };
    changed.push('welcome placard settings');
  }

  if (changed.length === 0) {
    warnings.push('No fields for this section were found. Check the JSON keys, or switch to Whole itinerary on the Clients page.');
    if (scope !== 'all' && root.schemaVersion && !String(root.schemaVersion).toLowerCase().includes('viemma')) {
      warnings.push('You can use any JSON schema; the importer maps common travel fields. A Viemma-style output makes the mapping more reliable.');
    }
  }
  return { state: next, changed, warnings };
}

export function parseTripJson(textValue: string): unknown {
  const cleaned = textValue.trim().replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  if (!cleaned) throw new Error('Paste the JSON output first.');
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('This is not valid JSON. Copy the complete JSON object, including its opening and closing braces.');
  }
}

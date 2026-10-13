import React, { useState } from 'react';
import { 
  AppState, 
  Guest, 
  Flight, 
  Room, 
  Transfer, 
  Activity, 
  AIItineraryPayload, 
  AIImportGuest, 
  AIImportFlight, 
  AIImportStay, 
  AIImportTransfer, 
  AIImportActivity 
} from '../types';
import { 
  Sparkles, 
  X, 
  Check, 
  AlertTriangle, 
  FileText, 
  Copy, 
  CheckCircle, 
  ArrowRight, 
  Plane, 
  Hotel, 
  Car, 
  Route, 
  Users, 
  Calendar, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit3
} from 'lucide-react';

interface AIItineraryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppState;
  onApplyItinerary: (updatedState: Partial<AppState>) => void;
}

const normalizeIdentity = (value?: string) => (value || '').trim().toLocaleLowerCase();

/** Merge by stable record ID, preserving records not mentioned by an import. */
const mergeRecordsById = <T extends { id: number | string },>(existing: T[], incoming: T[]): T[] => {
  const merged = [...existing];
  incoming.forEach(item => {
    const index = merged.findIndex(record => String(record.id) === String(item.id));
    if (index < 0) merged.push(item);
    else merged[index] = { ...merged[index], ...item };
  });
  return merged;
};

const SAMPLE_AI_PAYLOAD: AIItineraryPayload = {
  schemaVersion: "viemma-itinerary-v1",
  tripRef: "VT-2026-8821",
  tripTitle: "Bespoke Cape & Winelands Luxury Escape",
  client: {
    name: "Dr. Jonathan Vance",
    preferredName: "Jonathan",
    email: "jvance@harvard.edu",
    phone: "+1 617 555 0192",
    whatsapp: "+1 617 555 0192",
    country: "🇺🇸 United States",
    startDate: "2026-10-18",
    endDate: "2026-10-25",
    occasion: "20th Wedding Anniversary",
    notes: "VIP guests, private cellar access requested, prefers quiet vehicle rides."
  },
  travellers: [
    {
      first: "Jonathan",
      last: "Vance",
      preferredName: "Jonathan",
      age: "Adult",
      nationality: "🇺🇸 United States",
      relationshipToLead: "Primary Contact",
      isLead: true,
      dietary: ["Vegetarian"],
      notes: "Anniversary lead traveller"
    },
    {
      first: "Eleanor",
      last: "Vance",
      preferredName: "Eleanor",
      age: "Adult",
      nationality: "🇺🇸 United States",
      relationshipToLead: "Spouse",
      isLead: false,
      dietary: ["Gluten-Free"],
      notes: "Severe gluten intolerance, celebratory sparkling wine preference"
    }
  ],
  flights: [
    {
      airline: "British Airways",
      flightNo: "BA059",
      from: "LHR",
      to: "CPT",
      date: "2026-10-18",
      depTime: "21:30",
      arrTime: "10:15",
      cabin: "Business",
      direction: "Inbound",
      pnr: "VANCE2",
      paxNames: ["Jonathan Vance", "Eleanor Vance"],
      notes: "Club World lie-flat seats confirmed"
    },
    {
      airline: "British Airways",
      flightNo: "BA058",
      from: "CPT",
      to: "LHR",
      date: "2026-10-25",
      depTime: "19:40",
      arrTime: "06:20",
      cabin: "Business",
      direction: "Outbound",
      pnr: "VANCE2",
      paxNames: ["Jonathan Vance", "Eleanor Vance"],
      notes: "Return leg via Heathrow"
    }
  ],
  accommodations: [
    {
      hotel: "The Silo Hotel (Cape Town)",
      roomType: "Deluxe Superior Suite",
      meal: "B&B",
      cin: "2026-10-18",
      cout: "2026-10-22",
      nights: 4,
      rate: 18500,
      assignedPaxNames: ["Jonathan Vance", "Eleanor Vance"],
      notes: "Complimentary anniversary vintage bottle requested at check-in"
    },
    {
      hotel: "Belmond Mount Nelson Hotel (Gardens)",
      roomType: "Executive Suite",
      meal: "B&B",
      cin: "2026-10-22",
      cout: "2026-10-25",
      nights: 3,
      rate: 14200,
      assignedPaxNames: ["Jonathan Vance", "Eleanor Vance"],
      notes: "Afternoon high tea reservation confirmed"
    }
  ],
  transfers: [
    {
      type: "Airport Arrival",
      date: "2026-10-18",
      time: "10:30",
      from: "Cape Town International Airport",
      to: "The Silo Hotel (Cape Town)",
      vehicle: "Mercedes V-Class — 7 Seater",
      notes: "Chauffeur meet with bespoke sign 'DR & MRS VANCE'"
    },
    {
      type: "Inter-Hotel",
      date: "2026-10-22",
      time: "11:00",
      from: "The Silo Hotel (Cape Town)",
      to: "Belmond Mount Nelson Hotel (Gardens)",
      vehicle: "Mercedes V-Class — 7 Seater",
      notes: "Luggage transfer between luxury properties"
    }
  ],
  activities: [
    {
      day: 1,
      slot: "Afternoon",
      name: "Table Mountain Aerial Cableway",
      desc: "Fast-track VIP cable car ascent with sunset champagne terrace",
      dur: "3 hours",
      pAdult: 450,
      notes: "Weather dependent, flexible timing"
    },
    {
      day: 2,
      slot: "Full Day",
      name: "Cape Peninsula Scenic Tour",
      desc: "Private guided excursion via Chapman's Peak to Cape Point and Boulders Beach penguins",
      dur: "8 hours",
      pAdult: 1600,
      notes: "Includes private seafood lunch at Harbour House Kalk Bay"
    }
  ]
};

const LLM_SYSTEM_PROMPT = `You are a specialist Travel Operations parser for Viemma Tours (Bespoke Southern Africa Luxury Travel OS).
Transform the provided travel itinerary, email inquiry, or client brief into a valid, strict JSON payload matching the "viemma-itinerary-v1" schema below.

### Output JSON Requirements:
1. MUST output ONLY valid JSON without markdown wrapping or commentary.
2. Follow this exact schema:

{
  "schemaVersion": "viemma-itinerary-v1",
  "tripRef": "VT-2026-XXXX",
  "tripTitle": "Short descriptive title",
  "client": {
    "name": "Lead Client Full Name",
    "preferredName": "Preferred First Name",
    "email": "client@example.com",
    "phone": "+27 ... or international",
    "country": "🇿🇦 South Africa or flag + country",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "occasion": "Honeymoon / Anniversary / Safari Vacation",
    "notes": "Any client level operational notes"
  },
  "travellers": [
    {
      "id": 123,
      "provisionalLabel": "Optional stable label such as Adult 1 for an unnamed person",
      "first": "First Name",
      "last": "Last Name",
      "preferredName": "Preferred First Name",
      "age": "Adult" | "Elderly" | "Teen" | "Child" | "Infant",
      "nationality": "Country",
      "relationshipToLead": "Primary Contact" | "Spouse" | "Child" | "Friend",
      "isLead": true | false,
      "dietary": ["Vegetarian", "Gluten-Free", ...],
      "accessibility": ["Wheelchair", "Step-free access", ...],
      "roomPreference": "Room type / sharing preference if supplied",
      "notes": "..."
    }
  ],
  "flights": [
    {
      "airline": "Airline Name",
      "flightNo": "Flight Code",
      "from": "3-letter IATA code",
      "to": "3-letter IATA code",
      "date": "YYYY-MM-DD",
      "depTime": "HH:MM",
      "arrTime": "HH:MM",
      "cabin": "Economy" | "Premium Economy" | "Business" | "First",
      "direction": "Inbound" | "Outbound" | "Internal",
      "pnr": "6-char code",
      "paxNames": ["First Last"]
    }
  ],
  "accommodations": [
    {
      "hotel": "Hotel Name (Area)",
      "address": "Full street address if provided",
      "googleMapsUrl": "Google Maps share URL if provided",
      "roomType": "Deluxe / Superior / Suite",
      "meal": "B&B" | "HB" | "FB" | "AI",
      "cin": "YYYY-MM-DD",
      "cout": "YYYY-MM-DD",
      "nights": 4,
      "rate": 8500,
      "assignedPaxNames": ["First Last"]
    }
  ],
  "transfers": [
    {
      "type": "Airport Arrival" | "Airport Departure" | "Inter-Hotel" | "Activity Transfer" | "Full-Day Vehicle" | "Point-to-Point",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "from": "Origin",
      "to": "Destination",
      "vehicle": "Vehicle Model"
    }
  ],
  "activities": [
    {
      "day": 1,
      "slot": "Morning" | "Afternoon" | "Evening" | "Full Day",
      "name": "Activity Name",
      "desc": "Summary",
      "dur": "3 hours",
      "pAdult": 450
    }
  ]
}`;

export const AIItineraryImportModal: React.FC<AIItineraryImportModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onApplyItinerary
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'prompt' | 'review'>('json');
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [payload, setPayload] = useState<AIItineraryPayload | null>(null);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(LLM_SYSTEM_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleLoadSample = () => {
    setRawJsonInput(JSON.stringify(SAMPLE_AI_PAYLOAD, null, 2));
    setParseError(null);
  };

  const handleInspectJson = () => {
    setParseError(null);
    if (!rawJsonInput.trim()) {
      setParseError('Please paste your itinerary JSON payload.');
      return;
    }

    try {
      // Allow user to paste text that contains ```json ... ``` wrapper
      let clean = rawJsonInput.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(clean) as AIItineraryPayload;

      // Validation
      if (!parsed.client || !parsed.client.name) {
        throw new Error('Missing client object or client.name in payload.');
      }
      if (!parsed.travellers || !Array.isArray(parsed.travellers) || parsed.travellers.length === 0) {
        throw new Error('At least one traveller must be listed in "travellers" array.');
      }

      // Pre-process items for review
      const processed: AIItineraryPayload = {
        ...parsed,
        schemaVersion: parsed.schemaVersion || 'viemma-itinerary-v1',
        tripRef: parsed.tripRef || currentState.ref,
        client: {
          ...parsed.client,
          needsReview: Boolean(!parsed.client.email || !parsed.client.phone || !parsed.client.country || !parsed.client.startDate || !parsed.client.endDate || parsed.client.needsReview),
          reviewReason: !parsed.client.email ? 'Missing client email' : !parsed.client.phone ? 'Missing client phone' : !parsed.client.country ? 'Missing client country' : !parsed.client.startDate ? 'Missing trip start date' : !parsed.client.endDate ? 'Missing trip end date' : parsed.client.reviewReason
        },
        travellers: parsed.travellers.map((g, idx) => ({
          ...g,
          isLead: g.isLead ?? false,
          age: g.age,
          nationality: g.nationality || parsed.client.country || '',
          needsReview: !g.last || !g.first || !g.age || (!g.nationality && !parsed.client.country) || g.needsReview,
          reviewReason: !g.last ? 'Missing traveller surname' : !g.first ? 'Missing traveller first name' : !g.age ? 'Missing traveller age category' : (!g.nationality && !parsed.client.country) ? 'Missing traveller nationality' : g.reviewReason
        })),
        flights: (parsed.flights || []).map(f => ({
          ...f,
          cabin: f.cabin,
          direction: f.direction,
          needsReview: !f.airline || !f.flightNo || !f.from || !f.to || !f.date || !f.depTime || !f.arrTime || !f.cabin || !f.direction || f.needsReview,
          reviewReason: !f.airline ? 'Missing airline' : !f.flightNo ? 'Missing flight number' : !f.from ? 'Missing origin airport' : !f.to ? 'Missing destination airport' : !f.date ? 'Missing flight date' : !f.depTime ? 'Missing departure time' : !f.arrTime ? 'Missing arrival time' : !f.cabin ? 'Missing cabin class' : !f.direction ? 'Missing flight direction' : f.reviewReason
        })),
        accommodations: (parsed.accommodations || []).map(s => ({
          ...s,
          meal: s.meal,
          nights: s.nights,
          needsReview: !s.hotel || !s.roomType || !s.cin || !s.cout || s.needsReview,
          reviewReason: !s.hotel ? 'Missing property name' : !s.roomType ? 'Missing room type' : !s.cin ? 'Missing check-in date' : !s.cout ? 'Missing check-out date' : s.reviewReason
        })),
        transfers: (parsed.transfers || []).map(t => ({
          ...t,
          needsReview: !t.type || !t.from || !t.to || !t.date || !t.time || t.needsReview,
          reviewReason: !t.from ? 'Missing pickup/origin location' : !t.to ? 'Missing drop-off/destination location' : !t.date ? 'Missing transfer date' : !t.time ? 'Missing transfer time' : !t.type ? 'Missing transfer type' : t.reviewReason
        })),
        activities: (parsed.activities || []).map(a => ({
          ...a,
          needsReview: !a.name || !a.day || !a.start || !a.dur || a.needsReview,
          reviewReason: !a.name ? 'Missing activity name' : !a.day ? 'Missing itinerary day' : !a.start ? 'Missing activity start time' : !a.dur ? 'Missing activity duration' : a.reviewReason
        }))
      };

      setPayload(processed);
      setActiveTab('review');
    } catch (err: any) {
      setParseError(err.message || 'Malformed JSON format. Please verify syntax.');
    }
  };

  // Inline editing in review tab
  const handleUpdateClientField = (field: keyof AIItineraryPayload['client'], val: any) => {
    if (!payload) return;
    setPayload({
      ...payload,
      client: {
        ...payload.client,
        [field]: val
      }
    });
  };

  const handleUpdateTraveller = (idx: number, updates: Partial<AIImportGuest>) => {
    if (!payload) return;
    const updated = [...payload.travellers];
    if (updates.isLead === true) {
      updated.forEach((traveller, index) => {
        updated[index] = { ...traveller, isLead: index === idx };
      });
    } else {
      updated[idx] = { ...updated[idx], ...updates };
    }
    setPayload({ ...payload, travellers: updated });
  };

  const handleMarkTravellerReviewed = (idx: number) => {
    handleUpdateTraveller(idx, { needsReview: false, isReviewed: true });
  };

  const handleUpdateFlight = (idx: number, updates: Partial<AIImportFlight>) => {
    if (!payload || !payload.flights) return;
    const updated = [...payload.flights];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, flights: updated });
  };

  const handleMarkFlightReviewed = (idx: number) => {
    handleUpdateFlight(idx, { needsReview: false, isReviewed: true });
  };

  const handleUpdateStay = (idx: number, updates: Partial<AIImportStay>) => {
    if (!payload || !payload.accommodations) return;
    const updated = [...payload.accommodations];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, accommodations: updated });
  };

  const handleMarkStayReviewed = (idx: number) => {
    handleUpdateStay(idx, { needsReview: false, isReviewed: true });
  };

  const handleUpdateTransfer = (idx: number, updates: Partial<AIImportTransfer>) => {
    if (!payload?.transfers) return;
    const updated = [...payload.transfers];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, transfers: updated });
  };

  const handleMarkTransferReviewed = (idx: number) => {
    handleUpdateTransfer(idx, { needsReview: false, isReviewed: true });
  };

  const handleUpdateActivity = (idx: number, updates: Partial<AIImportActivity>) => {
    if (!payload?.activities) return;
    const updated = [...payload.activities];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, activities: updated });
  };

  const handleMarkActivityReviewed = (idx: number) => {
    handleUpdateActivity(idx, { needsReview: false, isReviewed: true });
  };

  const handleMarkAllReviewed = () => {
    if (!payload) return;
    setPayload({
      ...payload,
      client: { ...payload.client, needsReview: false, isReviewed: true },
      travellers: payload.travellers.map(t => ({ ...t, needsReview: false, isReviewed: true })),
      flights: (payload.flights || []).map(f => ({ ...f, needsReview: false, isReviewed: true })),
      accommodations: (payload.accommodations || []).map(s => ({ ...s, needsReview: false, isReviewed: true })),
      transfers: (payload.transfers || []).map(t => ({ ...t, needsReview: false, isReviewed: true })),
      activities: (payload.activities || []).map(a => ({ ...a, needsReview: false, isReviewed: true }))
    });
  };

  // Apply to Master Workspace State
  const handleConfirmAndApply = () => {
    if (!payload) return;

    const hasExistingData = Boolean(currentState.client.name.trim()) || currentState.guests.length > 0 || currentState.flights.length > 0 || currentState.rooms.length > 0 || currentState.transfers.length > 0 || currentState.activities.length > 0;
    if (hasExistingData && !window.confirm('This booking already contains data. The import will merge into existing records, update matching records with supplied information, and keep records that are not in the import. Missing imported fields will not intentionally clear existing values. Continue?')) return;

    // 1. Resolve traveller names to existing people first, then create new IDs only when needed.
    const guestIdMap = new Map<string, number>();
    const seenImportIdentities = new Set<string>();
    const importTravellerRows = payload.travellers.filter(tg => {
      const suppliedId = tg.id !== undefined ? 'id:' + tg.id : '';
      const fullName = normalizeIdentity((tg.first || '') + ' ' + (tg.last || ''));
      const provisionalLabel = normalizeIdentity(tg.provisionalLabel || '');
      const identity = suppliedId || (fullName ? 'name:' + fullName : provisionalLabel ? 'label:' + provisionalLabel : '');
      if (!identity) return true;
      if (seenImportIdentities.has(identity)) return false;
      seenImportIdentities.add(identity);
      return true;
    });
    let nextGuestId = Math.max(0, ...currentState.guests.map(g => Number(g.id) || 0), ...importTravellerRows.map(g => Number(g.id) || 0)) + 1;
    const assignedImportIds = new Set<number>();
    const anonymousLabelCounts = new Map<string, number>();
    const importedGuests: Guest[] = importTravellerRows.map((tg, idx) => {
      const first = (tg.first || '').trim();
      const last = (tg.last || '').trim();
      const suppliedLabel = (tg.provisionalLabel || '').trim();
      const fullName = normalizeIdentity(first + ' ' + last);
      const ageKey = tg.age || 'Traveller';
      const anonymousOrdinal = (anonymousLabelCounts.get(ageKey) || 0) + 1;
      anonymousLabelCounts.set(ageKey, anonymousOrdinal);
      const autoLabel = !first && !last ? (ageKey + ' ' + anonymousOrdinal) : '';
      const matchingLabel = suppliedLabel || autoLabel;
      const rawById = tg.id ? currentState.guests.find(g => g.id === tg.id) : undefined;
      const idNameConflicts = Boolean(rawById && fullName && normalizeIdentity((rawById.first || '') + ' ' + (rawById.last || '')) !== fullName);
      const existingById = !idNameConflicts && tg.id && !assignedImportIds.has(tg.id) ? rawById : undefined;
      const existingByName = fullName
        ? currentState.guests.find(g => normalizeIdentity((g.first || '') + ' ' + (g.last || '')) === fullName)
        : undefined;
      const existingByLabel = matchingLabel
        ? currentState.guests.find(g => g.isProvisional && normalizeIdentity(g.provisionalLabel || g.first) === normalizeIdentity(matchingLabel))
        : undefined;
      const existingGuest = existingById || existingByName || existingByLabel;
      const suppliedIdAvailable = Boolean(tg.id && !currentState.guests.some(g => g.id === tg.id) && !assignedImportIds.has(tg.id));
      let id = existingGuest?.id ?? (suppliedIdAvailable ? tg.id as number : nextGuestId++);
      // Every traveller in the import gets a unique ID, even when an AI payload repeats one.
      if (assignedImportIds.has(id)) id = nextGuestId++;
      assignedImportIds.add(id);
      const mergedFirst = first || existingGuest?.first || '';
      const mergedLast = last || existingGuest?.last || '';
      const mergedIsAnonymous = !mergedFirst && !mergedLast;
      const resolvedLabel = mergedIsAnonymous ? (matchingLabel || existingGuest?.provisionalLabel || ('Traveller ' + (idx + 1))) : undefined;
      if (fullName) guestIdMap.set(fullName, id);
      if (resolvedLabel) guestIdMap.set(normalizeIdentity(resolvedLabel), id);

      return {
        ...(existingGuest || {} as Guest),
        id,
        first: mergedFirst,
        last: mergedLast,
        preferredName: tg.preferredName || existingGuest?.preferredName || '',
        nationality: tg.nationality || existingGuest?.nationality || payload.client.country || '',
        country: tg.country || existingGuest?.country || payload.client.country || '',
        age: (tg.age || existingGuest?.age || '') as Guest['age'],
        exactAge: tg.exactAge ?? existingGuest?.exactAge,
        dob: tg.dob || existingGuest?.dob || '',
        passportNo: tg.passportNo || existingGuest?.passportNo || '',
        passportExpiry: tg.passportExpiry || existingGuest?.passportExpiry || '',
        relationshipToLead: tg.relationshipToLead || existingGuest?.relationshipToLead || (tg.isLead ? 'Primary Contact' : 'Family Member'),
        individualEmail: tg.individualEmail || existingGuest?.individualEmail || '',
        individualPhone: tg.individualPhone || existingGuest?.individualPhone || '',
        languagesSpoken: existingGuest?.languagesSpoken || ['English'],
        isLead: tg.isLead ?? existingGuest?.isLead ?? false,
        notes: tg.notes || existingGuest?.notes || '',
        diet: tg.dietary || existingGuest?.diet || [],
        attachments: existingGuest?.attachments || [],
        customFoodRequirements: tg.customFoodRequirements || existingGuest?.customFoodRequirements || [],
        customAccessibilityRequirements: tg.customAccessibilityRequirements || existingGuest?.customAccessibilityRequirements || [],
        customAccommodationRequirements: tg.customAccommodationRequirements || existingGuest?.customAccommodationRequirements || [],
        accessibilityMobility: tg.accessibility || existingGuest?.accessibilityMobility || [],
        accessibilityVision: existingGuest?.accessibilityVision || [],
        accessibilityHearing: existingGuest?.accessibilityHearing || [],
        medicalOperationalNotes: existingGuest?.medicalOperationalNotes || '',
        dietaryReligious: existingGuest?.dietaryReligious || [],
        dietaryLifestyle: tg.dietary || existingGuest?.dietaryLifestyle || [],
        dietaryMedical: existingGuest?.dietaryMedical || [],
        dietaryPreferences: existingGuest?.dietaryPreferences || [],
        preferencesAccommodation: tg.roomPreference ? [tg.roomPreference] : (existingGuest?.preferencesAccommodation || []),
        roomTypePref: tg.roomPreference || existingGuest?.roomTypePref || '',
        preferencesTransport: existingGuest?.preferencesTransport || [],
        preferencesInterests: existingGuest?.preferencesInterests || [],
        isProvisional: mergedIsAnonymous,
        provisionalLabel: resolvedLabel,
        leadContactId: existingGuest?.leadContactId
      };
    });

    const allGuestIds = importedGuests.map(g => g.id);

    // 2. Match flights to existing records. Never invent missing routes, dates, times or prices.
    const importedFlights: Flight[] = (payload.flights || []).map((f, idx) => {
      const existingFlight = currentState.flights.find(item =>
        Boolean(f.flightNo && item.flightNo) &&
        normalizeIdentity(item.flightNo) === normalizeIdentity(f.flightNo) &&
        (!f.date || item.date === f.date) &&
        (!f.airline || normalizeIdentity(item.airline) === normalizeIdentity(f.airline))
      );
      const namedPaxIds: number[] = [];
      (f.paxNames || []).forEach(name => {
        const id = guestIdMap.get(normalizeIdentity(name));
        if (id && !namedPaxIds.includes(id)) namedPaxIds.push(id);
      });
      const paxIds = namedPaxIds.length ? namedPaxIds : (existingFlight?.paxIds || []);
      const missingFields = [
        !f.airline && 'Airline',
        !f.flightNo && 'Flight number',
        !f.from && 'Origin airport',
        !f.to && 'Destination airport',
        !f.date && 'Flight date',
        !f.depTime && 'Departure time',
        !f.arrTime && 'Arrival time',
        !f.cabin && 'Cabin class',
        !f.direction && 'Flight direction',
        !f.pnr && !existingFlight?.pnr && 'PNR / booking reference'
      ].filter((value): value is string => Boolean(value));

      return {
        ...(existingFlight || {} as Flight),
        id: existingFlight?.id ?? (Date.now() + 100 + idx),
        direction: f.direction || existingFlight?.direction || 'Inbound',
        airline: f.airline || existingFlight?.airline || '',
        flightNo: f.flightNo || existingFlight?.flightNo || '',
        pnr: f.pnr || existingFlight?.pnr || '',
        from: f.from || existingFlight?.from || '',
        to: f.to || existingFlight?.to || '',
        date: f.date || existingFlight?.date || '',
        depTime: f.depTime || existingFlight?.depTime || '',
        arrTime: f.arrTime || existingFlight?.arrTime || '',
        duration: existingFlight?.duration || '',
        cabin: f.cabin || existingFlight?.cabin || 'Economy',
        status: existingFlight?.status || 'Pending',
        paxIds,
        bagHand: existingFlight?.bagHand || 0,
        bagCheck: existingFlight?.bagCheck || 0,
        bagOver: existingFlight?.bagOver || 0,
        cost: f.cost ?? existingFlight?.cost ?? 0,
        markup: existingFlight?.markup || 0,
        qty: paxIds.length || existingFlight?.qty || 0,
        notes: f.notes || existingFlight?.notes || '',
        supplierContact: existingFlight?.supplierContact || '',
        confirmationRef: existingFlight?.confirmationRef || '',
        bookingUrl: existingFlight?.bookingUrl || '',
        referenceLinks: existingFlight?.referenceLinks || [],
        attachments: existingFlight?.attachments || [],
        stops: existingFlight?.stops || [],
        isIncomplete: missingFields.length > 0,
        missingFields: missingFields.length ? missingFields : undefined
      };
    });

    // 3. Match accommodation by property, dates and room type. Unknown commercial values stay blank.
    const importedRooms: Room[] = (payload.accommodations || []).map((s, idx) => {
      const existingRoom = currentState.rooms.find(item =>
        normalizeIdentity(item.hotel) === normalizeIdentity(s.hotel) &&
        (!s.cin || item.cin === s.cin) &&
        (!s.cout || item.cout === s.cout) &&
        (!s.roomType || normalizeIdentity(item.roomType) === normalizeIdentity(s.roomType))
      );
      const resolvedGuestIds: number[] = [];
      (s.assignedPaxNames || []).forEach(name => {
        const id = guestIdMap.get(normalizeIdentity(name));
        if (id && !resolvedGuestIds.includes(id)) resolvedGuestIds.push(id);
      });
      const guestIds = resolvedGuestIds.length ? resolvedGuestIds : (existingRoom?.guestIds || []);
      const derivedNights = s.cin && s.cout
        ? Math.max(0, Math.round((new Date(s.cout).getTime() - new Date(s.cin).getTime()) / 86400000))
        : 0;

      return {
        ...(existingRoom || {} as Room),
        id: existingRoom?.id ?? (Date.now() + 200 + idx),
        hotel: s.hotel || existingRoom?.hotel || '',
        conf: existingRoom?.conf || '',
        pay: existingRoom?.pay || 'Unpaid',
        roomType: s.roomType || existingRoom?.roomType || '',
        bed: existingRoom?.bed || '',
        meal: s.meal || existingRoom?.meal || '',
        cin: s.cin || existingRoom?.cin || '',
        cout: s.cout || existingRoom?.cout || '',
        nights: s.nights ?? existingRoom?.nights ?? derivedNights,
        guestIds,
        rate: s.rate ?? existingRoom?.rate ?? 0,
        supp: existingRoom?.supp || 0,
        reqs: existingRoom?.reqs || [],
        notes: s.notes || existingRoom?.notes || '',
        address: s.address || existingRoom?.address || '',
        googleMapsUrl: s.googleMapsUrl || existingRoom?.googleMapsUrl || '',
        attachments: existingRoom?.attachments || [],
        allocatedRooms: existingRoom?.allocatedRooms || []
      };
    });

    // 4. Match transfers without assigning fictional drivers, times, vehicles or prices.
    const validTransferTypes: Transfer['type'][] = ['Airport Arrival', 'Airport Departure', 'Inter-Hotel', 'Activity Transfer', 'Full-Day Vehicle', 'Point-to-Point'];
    const importedTransfers: Transfer[] = (payload.transfers || []).map((t, idx) => {
      const transferType = validTransferTypes.includes(t.type as Transfer['type']) ? t.type as Transfer['type'] : undefined;
      const existingTransfer = currentState.transfers.find(item =>
        (!t.date || item.date === t.date) &&
        (!transferType || item.type === transferType) &&
        Boolean(t.from && t.to) &&
        normalizeIdentity(item.from) === normalizeIdentity(t.from) &&
        normalizeIdentity(item.to) === normalizeIdentity(t.to)
      );
      const paxIds = existingTransfer?.paxIds || [];
      return {
        ...(existingTransfer || {} as Transfer),
        id: existingTransfer?.id ?? (Date.now() + 300 + idx),
        type: transferType || existingTransfer?.type || 'Point-to-Point',
        date: t.date || existingTransfer?.date || '',
        time: t.time || existingTransfer?.time || '',
        status: existingTransfer?.status || 'Pending',
        from: t.from || existingTransfer?.from || '',
        to: t.to || existingTransfer?.to || '',
        meet: existingTransfer?.meet || '',
        sign: existingTransfer?.sign || '',
        flight: t.flight || existingTransfer?.flight || '',
        dist: existingTransfer?.dist || '',
        dur: existingTransfer?.dur || '',
        vehicle: t.vehicle || existingTransfer?.vehicle || '',
        driver: existingTransfer?.driver || '',
        driverPhone: existingTransfer?.driverPhone || '',
        paxCount: paxIds.length || existingTransfer?.paxCount || 0,
        paxIds,
        bagHand: existingTransfer?.bagHand || 0,
        bagCheck: existingTransfer?.bagCheck || 0,
        bagOver: existingTransfer?.bagOver || 0,
        seats: existingTransfer?.seats || [],
        special: existingTransfer?.special || [],
        cost: existingTransfer?.cost || 0,
        tolls: existingTransfer?.tolls || 0,
        parking: existingTransfer?.parking || 0,
        notes: t.notes || existingTransfer?.notes || '',
        waypoints: existingTransfer?.waypoints || []
      };
    });

    // 5. Match activities by day and name. Unprovided prices and operational times remain blank.
    const importedActivities: Activity[] = (payload.activities || []).map((a, idx) => {
      const day = a.day ?? 1;
      const existingActivity = currentState.activities.find(item =>
        item.day === day && normalizeIdentity(item.name) === normalizeIdentity(a.name)
      );
      const paxIds = existingActivity?.paxIds || [];
      return {
        ...(existingActivity || {} as Activity),
        id: existingActivity?.id ?? (Date.now() + 400 + idx),
        day,
        slot: a.slot || existingActivity?.slot || 'Morning',
        name: a.name,
        desc: a.desc || existingActivity?.desc || '',
        pickup: a.pickup || existingActivity?.pickup || '',
        start: a.start || existingActivity?.start || '',
        dur: a.dur || existingActivity?.dur || '',
        pickupLoc: a.pickupLoc || existingActivity?.pickupLoc || '',
        status: existingActivity?.status || 'Planned',
        conf: existingActivity?.conf || '',
        supplier: a.supplier || existingActivity?.supplier || '',
        supPhone: a.supPhone || existingActivity?.supPhone || '',
        paxIds,
        pAdult: a.pAdult ?? existingActivity?.pAdult ?? 0,
        pChild: a.pChild ?? existingActivity?.pChild ?? 0,
        nAdult: a.nAdult ?? existingActivity?.nAdult ?? 0,
        nChild: a.nChild ?? existingActivity?.nChild ?? 0,
        flat: a.flat ?? existingActivity?.flat ?? 0,
        total: existingActivity?.total || 0,
        inc: a.inc || existingActivity?.inc || [],
        backup: a.backup || existingActivity?.backup || '',
        notes: a.notes || existingActivity?.notes || '',
        isFree: a.isFree ?? existingActivity?.isFree ?? false
      };
    });

    // Keep records that weren't mentioned by the import. Matched records reuse their IDs.
    const mergedGuests = mergeRecordsById(currentState.guests, importedGuests);
    const designatedLeadId =
      importedGuests.find(g => g.isLead)?.id ??
      currentState.guests.find(g => g.isLead)?.id;
    const normalizedMergedGuests = mergedGuests.map(g => ({
      ...g,
      isLead: designatedLeadId ? g.id === designatedLeadId : Boolean(g.isLead),
      leadContactId: designatedLeadId && g.id !== designatedLeadId ? designatedLeadId : undefined
    }));
    const mergedFlights = mergeRecordsById(currentState.flights, importedFlights);
    const mergedRooms = mergeRecordsById(currentState.rooms, importedRooms);
    const mergedTransfers = mergeRecordsById(currentState.transfers, importedTransfers);
    const mergedActivities = mergeRecordsById(currentState.activities, importedActivities);

    let durationText = currentState.client.durationText;
    if (payload.client.startDate && payload.client.endDate) {
      const startDate = new Date(payload.client.startDate);
      const endDate = new Date(payload.client.endDate);
      const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
      durationText = `${diffDays} Days / ${Math.max(0, diffDays - 1)} Nights`;
    }

    onApplyItinerary({
      ref: currentState.ref,
      title: payload.tripTitle || `${payload.client.name} Luxury Itinerary`,
      client: {
        ...currentState.client,
        name: payload.client.name || currentState.client.name,
        email: payload.client.email || currentState.client.email,
        phone: payload.client.phone || currentState.client.phone,
        country: payload.client.country || currentState.client.country,
        startDate: payload.client.startDate || currentState.client.startDate,
        endDate: payload.client.endDate || currentState.client.endDate,
        durationText,
        occasion: payload.client.occasion || currentState.client.occasion
      },
      guests: normalizedMergedGuests,
      flights: mergedFlights,
      rooms: mergedRooms,
      transfers: mergedTransfers,
      activities: mergedActivities
    });

    onClose();
  };

  // Count items needing review
  const flaggedCount = payload ? (
    (payload.client.needsReview ? 1 : 0) +
    payload.travellers.filter(t => t.needsReview).length +
    (payload.flights || []).filter(f => f.needsReview).length +
    (payload.accommodations || []).filter(s => s.needsReview).length +
    (payload.transfers || []).filter(t => t.needsReview).length +
    (payload.activities || []).filter(a => a.needsReview).length
  ) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-[#1A3326] text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif">AI Itinerary & Client Ingestion Engine</h2>
                <span className="text-[10px] bg-[#D4AF37] text-[#1A3326] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  v1 JSON Schema
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Paste structured AI JSON from ChatGPT, Claude, or Gemini to populate travellers, flights, accommodations, and ground logistics.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS BAR */}
        <div className="bg-[#FAF9F6] border-b border-gray-200 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-[#1A3326] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              <FileText size={13} /> 1. Paste JSON Payload
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'prompt'
                  ? 'bg-[#1A3326] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              <Copy size={13} /> LLM Prompt Template
            </button>
            {payload && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'review'
                    ? 'bg-[#D4AF37] text-[#1A3326] font-extrabold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                <CheckCircle size={13} /> 2. Review & Inspect ({payload.travellers.length} Travellers)
              </button>
            )}
          </div>

          {activeTab === 'review' && flaggedCount > 0 && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-600" />
              {flaggedCount} {flaggedCount === 1 ? 'Item Needs' : 'Items Need'} Review
            </span>
          )}
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PASTE JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1A3326]">Paste Itinerary JSON Payload</h3>
                  <p className="text-xs text-gray-500">
                    Paste raw JSON generated by your AI Assistant (ChatGPT, Gemini, Claude).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} /> Load Sample Luxury Payload
                </button>
              </div>

              <textarea
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                rows={14}
                placeholder={`{\n  "schemaVersion": "viemma-itinerary-v1",\n  "client": { "name": "Lord & Lady Sterling", ... },\n  "travellers": [ ... ]\n}`}
                className="w-full p-4 font-mono text-xs bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition leading-relaxed shadow-inner"
              />

              {parseError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600 shrink-0" />
                  <span className="font-semibold">{parseError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleInspectJson}
                  className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#244634] text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>Parse & Inspect Itinerary</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT TEMPLATE */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950">How to use with ChatGPT / Gemini / Claude:</h4>
                  <p className="text-[11px] text-amber-900">
                    Copy the system prompt below, paste it into your AI session alongside the client's email or quotation, and copy the resulting JSON back here.
                  </p>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="px-4 py-2 rounded-xl bg-[#1A3326] text-white hover:bg-[#244634] text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedPrompt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[#D4AF37]" />}
                  <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-gray-900 text-emerald-400 text-[11px] font-mono rounded-2xl overflow-x-auto max-h-[420px] leading-relaxed">
                  {LLM_SYSTEM_PROMPT}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEW & EDIT */}
          {activeTab === 'review' && payload && (
            <div className="space-y-6 text-xs">
              
              {/* TOP SUMMARY STRIP */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Trip Reference & Title</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {payload.tripRef}
                    </span>
                    <h3 className="text-sm font-bold text-[#1A3326]">
                      {payload.tripTitle || payload.client.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {flaggedCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllReviewed}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={13} /> Mark All Reviewed
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1">
                      <CheckCircle size={13} /> All Items Verified
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION: CLIENT DETAILS */}
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <Users size={14} className="text-[#D4AF37]" /> 1. Client & Lead Travel Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Client Full Name *</label>
                    <input
                      type="text"
                      value={payload.client.name}
                      onChange={(e) => handleUpdateClientField('name', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={payload.client.email || ''}
                      onChange={(e) => handleUpdateClientField('email', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={payload.client.phone || ''}
                      onChange={(e) => handleUpdateClientField('phone', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Country / Nationality</label>
                    <input
                      type="text"
                      value={payload.client.country || ''}
                      onChange={(e) => handleUpdateClientField('country', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={payload.client.startDate || ''}
                      onChange={(e) => handleUpdateClientField('startDate', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-600 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={payload.client.endDate || ''}
                      onChange={(e) => handleUpdateClientField('endDate', e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>
                {payload.client.needsReview && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[11px] text-amber-900 font-semibold"><AlertTriangle size={12} className="inline mr-1" />Review client details: {payload.client.reviewReason || 'Some client contact or trip information is missing.'}</p>
                    <button type="button" onClick={() => setPayload({ ...payload, client: { ...payload.client, needsReview: false, isReviewed: true } })} className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-950 text-[11px] font-bold">Mark as Reviewed</button>
                  </div>
                )}
              </div>

              {/* SECTION: TRAVELLERS MANIFEST */}
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-[#D4AF37]" /> 2. Travellers Manifest ({payload.travellers.length})
                  </h4>
                  <span className="text-[11px] text-gray-500">Source of truth for passenger counts</span>
                </div>

                <div className="space-y-3">
                  {payload.travellers.map((tg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border transition ${
                        tg.needsReview 
                          ? 'bg-amber-50/50 border-amber-300' 
                          : 'bg-gray-50/60 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={tg.first}
                            onChange={(e) => handleUpdateTraveller(idx, { first: e.target.value })}
                            className="p-1.5 rounded-lg border bg-white font-bold text-xs w-28"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={tg.last}
                            onChange={(e) => handleUpdateTraveller(idx, { last: e.target.value })}
                            className="p-1.5 rounded-lg border bg-white font-bold text-xs w-28"
                          />
                          <select
                            value={tg.age || ''}
                            onChange={(e) => handleUpdateTraveller(idx, { age: (e.target.value || undefined) as AIImportGuest['age'], needsReview: true, isReviewed: false })}
                            className="p-1.5 rounded-lg border bg-white text-xs"
                          >
                            <option value="">Age TBC</option>
<option value="Adult">Adult</option>
                            <option value="Elderly">Elderly</option>
                            <option value="Teen">Teen</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                          <label className="flex items-center gap-1 text-[11px] font-bold text-[#1A3326] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tg.isLead || false}
                              onChange={(e) => handleUpdateTraveller(idx, { isLead: e.target.checked })}
                              className="rounded accent-emerald-800"
                            />
                            ★ Lead
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          {tg.dietary && tg.dietary.length > 0 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                              Diet: {tg.dietary.join(', ')}
                            </span>
                          )}
                          {tg.needsReview ? (
                            <button
                              type="button"
                              onClick={() => handleMarkTravellerReviewed(idx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-300 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={11} /> Mark Reviewed
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle size={12} /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {tg.needsReview && tg.reviewReason && (
                        <p className="text-[10px] font-bold text-amber-800 mt-2 flex items-center gap-1">
                          <AlertTriangle size={11} /> Note: {tg.reviewReason}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <label className="text-[10px] font-bold text-gray-600">Preferred name
                          <input value={tg.preferredName || ''} onChange={e => handleUpdateTraveller(idx, { preferredName: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Name to use" />
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Age category
                          <select value={tg.age || ''} onChange={e => handleUpdateTraveller(idx, { age: (e.target.value || undefined) as AIImportGuest['age'], needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal">
                            <option value="">Not supplied — confirm</option><option value="Adult">Adult</option><option value="Elderly">Elderly</option><option value="Teen">Teen</option><option value="Child">Child</option><option value="Infant">Infant</option>
                          </select>
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Nationality
                          <input value={tg.nationality || ''} onChange={e => handleUpdateTraveller(idx, { nationality: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Confirm if not supplied" />
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Dietary requirements (comma-separated)
                          <input value={(tg.dietary || []).join(', ')} onChange={e => handleUpdateTraveller(idx, { dietary: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Vegetarian, nut allergy..." />
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Accessibility / mobility requirements
                          <input value={(tg.accessibility || []).join(', ')} onChange={e => handleUpdateTraveller(idx, { accessibility: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Wheelchair, step-free access..." />
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Room preference
                          <input value={tg.roomPreference || ''} onChange={e => handleUpdateTraveller(idx, { roomPreference: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Twin / double / family / sharing requests" />
                        </label>
                        <label className="text-[10px] font-bold text-gray-600">Traveller notes
                          <input value={tg.notes || ''} onChange={e => handleUpdateTraveller(idx, { notes: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Requirements, room sharing, other notes" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: FLIGHTS */}
              {payload.flights && payload.flights.length > 0 && (
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                    <Plane size={14} className="text-[#D4AF37]" /> 3. Aviation Sectors ({payload.flights.length})
                  </h4>
                  <div className="space-y-2.5">
                    {payload.flights.map((f, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          f.needsReview ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/60 border-gray-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                          <label className="text-[10px] font-bold text-gray-600">Airline<input value={f.airline || ''} onChange={e => handleUpdateFlight(idx, { airline: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Airline" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Flight number<input value={f.flightNo || ''} onChange={e => handleUpdateFlight(idx, { flightNo: e.target.value.toUpperCase(), needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-mono font-normal" placeholder="e.g. EK772" /></label>
                          <label className="text-[10px] font-bold text-gray-600">From<input value={f.from || ''} onChange={e => handleUpdateFlight(idx, { from: e.target.value.toUpperCase(), needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-mono font-normal" placeholder="Airport / code" /></label>
                          <label className="text-[10px] font-bold text-gray-600">To<input value={f.to || ''} onChange={e => handleUpdateFlight(idx, { to: e.target.value.toUpperCase(), needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-mono font-normal" placeholder="Airport / code" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Flight date<input type="date" value={f.date || ''} onChange={e => handleUpdateFlight(idx, { date: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Departure time<input type="time" value={f.depTime || ''} onChange={e => handleUpdateFlight(idx, { depTime: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Arrival time<input type="time" value={f.arrTime || ''} onChange={e => handleUpdateFlight(idx, { arrTime: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">PNR / booking reference<input value={f.pnr || ''} onChange={e => handleUpdateFlight(idx, { pnr: e.target.value.toUpperCase(), needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-mono font-normal" placeholder="Optional" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Cabin class<select value={f.cabin || 'Economy'} onChange={e => handleUpdateFlight(idx, { cabin: e.target.value as AIImportFlight['cabin'] })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal"><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option></select></label>
                          <label className="text-[10px] font-bold text-gray-600">Direction<select value={f.direction || 'Inbound'} onChange={e => handleUpdateFlight(idx, { direction: e.target.value as AIImportFlight['direction'] })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal"><option>Inbound</option><option>Outbound</option><option>Internal</option></select></label>
                          <label className="text-[10px] font-bold text-gray-600 sm:col-span-2">Notes<input value={f.notes || ''} onChange={e => handleUpdateFlight(idx, { notes: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Optional flight notes" /></label>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.needsReview ? (
                            <button
                              type="button"
                              onClick={() => handleMarkFlightReviewed(idx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-300 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={11} /> Mark Reviewed
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle size={12} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: ACCOMMODATIONS */}
              {payload.accommodations && payload.accommodations.length > 0 && (
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                    <Hotel size={14} className="text-[#D4AF37]" /> 4. Accommodations & Stays ({payload.accommodations.length})
                  </h4>
                  <div className="space-y-2.5">
                    {payload.accommodations.map((s, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          s.needsReview ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/60 border-gray-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                          <label className="text-[10px] font-bold text-gray-600">Property / accommodation name<input value={s.hotel || ''} onChange={e => handleUpdateStay(idx, { hotel: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Hotel / property name" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Room type<input value={s.roomType || ''} onChange={e => handleUpdateStay(idx, { roomType: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Suite, twin room..." /></label>
                          <label className="text-[10px] font-bold text-gray-600">Hotel address<input value={s.address || ''} onChange={e => handleUpdateStay(idx, { address: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Street address, suburb, city" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Google Maps share link<input value={s.googleMapsUrl || ''} onChange={e => handleUpdateStay(idx, { googleMapsUrl: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Paste location URL if supplied" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Check-in<input type="date" value={s.cin || ''} onChange={e => handleUpdateStay(idx, { cin: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Check-out<input type="date" value={s.cout || ''} onChange={e => handleUpdateStay(idx, { cout: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Nights<input type="number" min="0" value={s.nights ?? ''} onChange={e => handleUpdateStay(idx, { nights: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Meal plan<input value={s.meal || ''} onChange={e => handleUpdateStay(idx, { meal: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="B&B, Half board..." /></label>
                          <label className="text-[10px] font-bold text-gray-600">Rate (as supplied)<input type="number" min="0" value={s.rate ?? ''} onChange={e => handleUpdateStay(idx, { rate: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Do not guess" /></label>
                          <label className="text-[10px] font-bold text-gray-600">Assigned passenger names<input value={(s.assignedPaxNames || []).join(', ')} onChange={e => handleUpdateStay(idx, { assignedPaxNames: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Names separated by commas" /></label>
                          <label className="text-[10px] font-bold text-gray-600 sm:col-span-2 lg:col-span-4">Property notes / requirements<input value={s.notes || ''} onChange={e => handleUpdateStay(idx, { notes: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Room sharing, dietary or property requirements" /></label>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.needsReview ? (
                            <button
                              type="button"
                              onClick={() => handleMarkStayReviewed(idx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-300 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={11} /> Mark Reviewed
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle size={12} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: TRANSFERS & ACTIVITIES — REVIEW AND EDIT BEFORE APPLY */}
              <div className="space-y-4">
                <section className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2"><Car size={14} className="text-emerald-700" /> Ground Transfers ({payload.transfers?.length || 0})</h4>
                    <span className="text-[10px] text-gray-500">Unknown details are left blank for confirmation.</span>
                  </div>
                  {(!payload.transfers || payload.transfers.length === 0) && <p className="text-xs text-gray-400">No ground transfers supplied.</p>}
                  {(payload.transfers || []).map((t, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border space-y-3 ${t.needsReview ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/60 border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-700">Transfer {idx + 1}</span>
                        {t.needsReview ? <button type="button" onClick={() => handleMarkTransferReviewed(idx)} className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] w-fit"><Check size={11} className="inline mr-1" />Mark Reviewed</button> : <span className="text-[10px] text-emerald-700 font-bold"><CheckCircle size={12} className="inline mr-1" />Verified</span>}
                      </div>
                      {t.needsReview && t.reviewReason && <p className="text-[10px] text-amber-800 font-semibold"><AlertTriangle size={11} className="inline mr-1" />{t.reviewReason}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <label className="text-[10px] font-bold text-gray-600">Transfer type<select value={t.type || ''} onChange={e => handleUpdateTransfer(idx, { type: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal"><option value="">Select type</option><option>Airport Arrival</option><option>Airport Departure</option><option>Inter-Hotel</option><option>Activity Transfer</option><option>Full-Day Vehicle</option><option>Point-to-Point</option></select></label>
                        <label className="text-[10px] font-bold text-gray-600">Date<input type="date" value={t.date || ''} onChange={e => handleUpdateTransfer(idx, { date: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Pickup time<input type="time" value={t.time || ''} onChange={e => handleUpdateTransfer(idx, { time: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Flight number / link<input value={t.flight || ''} onChange={e => handleUpdateTransfer(idx, { flight: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Optional" /></label>
                        <label className="text-[10px] font-bold text-gray-600">From / pickup address<input value={t.from || ''} onChange={e => handleUpdateTransfer(idx, { from: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Origin" /></label>
                        <label className="text-[10px] font-bold text-gray-600">To / drop-off address<input value={t.to || ''} onChange={e => handleUpdateTransfer(idx, { to: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Destination" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Vehicle requested<input value={t.vehicle || ''} onChange={e => handleUpdateTransfer(idx, { vehicle: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Vehicle type, if known" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Notes / meet-and-greet instructions<input value={t.notes || ''} onChange={e => handleUpdateTransfer(idx, { notes: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Do not invent instructions" /></label>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2"><Route size={14} className="text-[#D4AF37]" /> Activities & Experiences ({payload.activities?.length || 0})</h4>
                    <span className="text-[10px] text-gray-500">Prices and timings are not guessed.</span>
                  </div>
                  {(!payload.activities || payload.activities.length === 0) && <p className="text-xs text-gray-400">No activities supplied.</p>}
                  {(payload.activities || []).map((a, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border space-y-3 ${a.needsReview ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/60 border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-700">Activity {idx + 1}</span>
                        {a.needsReview ? <button type="button" onClick={() => handleMarkActivityReviewed(idx)} className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px] w-fit"><Check size={11} className="inline mr-1" />Mark Reviewed</button> : <span className="text-[10px] text-emerald-700 font-bold"><CheckCircle size={12} className="inline mr-1" />Verified</span>}
                      </div>
                      {a.needsReview && a.reviewReason && <p className="text-[10px] text-amber-800 font-semibold"><AlertTriangle size={11} className="inline mr-1" />{a.reviewReason}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <label className="text-[10px] font-bold text-gray-600">Activity name<input value={a.name || ''} onChange={e => handleUpdateActivity(idx, { name: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Activity / experience" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Day number<input type="number" min="1" value={a.day ?? ''} onChange={e => handleUpdateActivity(idx, { day: e.target.value === '' ? undefined : Number(e.target.value), needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Time slot<select value={a.slot || 'Morning'} onChange={e => handleUpdateActivity(idx, { slot: e.target.value as AIImportActivity['slot'] })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Full Day</option></select></label>
                        <label className="text-[10px] font-bold text-gray-600">Start time<input type="time" value={a.start || ''} onChange={e => handleUpdateActivity(idx, { start: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Pickup time<input type="time" value={a.pickup || ''} onChange={e => handleUpdateActivity(idx, { pickup: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Duration<input value={a.dur || ''} onChange={e => handleUpdateActivity(idx, { dur: e.target.value, needsReview: true, isReviewed: false })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="e.g. 3 hours" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Adult rate (as supplied)<input type="number" min="0" value={a.pAdult ?? ''} onChange={e => handleUpdateActivity(idx, { pAdult: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Unknown stays blank" /></label>
                        <label className="text-[10px] font-bold text-gray-600">Child rate (as supplied)<input type="number" min="0" value={a.pChild ?? ''} onChange={e => handleUpdateActivity(idx, { pChild: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Unknown stays blank" /></label>
                        <label className="text-[10px] font-bold text-gray-600 sm:col-span-2 lg:col-span-4">Description<input value={a.desc || ''} onChange={e => handleUpdateActivity(idx, { desc: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Experience details" /></label>
                        <label className="text-[10px] font-bold text-gray-600 sm:col-span-2 lg:col-span-4">Inclusions (comma-separated)<input value={(a.inc || []).join(', ')} onChange={e => handleUpdateActivity(idx, { inc: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Entry tickets, guide, transport..." /></label>
                        <label className="text-[10px] font-bold text-gray-600 sm:col-span-2 lg:col-span-4">Notes<input value={a.notes || ''} onChange={e => handleUpdateActivity(idx, { notes: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-gray-200 bg-white text-xs font-normal" placeholder="Requirements / source notes" /></label>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER CONTROLS */}
        <div className="bg-[#FAF9F6] border-t border-gray-200 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200/80 text-gray-700 hover:bg-gray-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'review' && payload && (
            <button
              type="button"
              onClick={handleConfirmAndApply}
              className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Check size={14} className="text-[#D4AF37]" />
              <span>Apply Itinerary to Workspace</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

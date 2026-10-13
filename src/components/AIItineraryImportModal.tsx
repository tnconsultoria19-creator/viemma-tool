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
      "first": "First Name",
      "last": "Last Name",
      "preferredName": "Preferred First Name",
      "age": "Adult" | "Elderly" | "Teen" | "Child" | "Infant",
      "nationality": "Country",
      "relationshipToLead": "Primary Contact" | "Spouse" | "Child" | "Friend",
      "isLead": true | false,
      "dietary": ["Vegetarian", "Gluten-Free", ...],
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
      "type": "Airport Arrival" | "Airport Departure" | "Inter-Hotel" | "Day Excursion",
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
        travellers: parsed.travellers.map((g, idx) => ({
          ...g,
          isLead: g.isLead ?? (idx === 0),
          age: g.age || 'Adult',
          nationality: g.nationality || parsed.client.country || '🇿🇦 South Africa',
          needsReview: !g.last || !g.first || g.needsReview,
          reviewReason: !g.last ? 'Missing traveller surname' : g.reviewReason
        })),
        flights: (parsed.flights || []).map(f => ({
          ...f,
          cabin: f.cabin || 'Business',
          direction: f.direction || 'Inbound',
          needsReview: !f.airline || !f.flightNo || !f.from || !f.to || !f.date || !f.depTime || !f.arrTime || f.needsReview,
          reviewReason: !f.airline ? 'Missing airline' : !f.flightNo ? 'Missing flight number' : !f.from ? 'Missing origin airport' : !f.to ? 'Missing destination airport' : !f.date ? 'Missing flight date' : !f.depTime ? 'Missing departure time' : !f.arrTime ? 'Missing arrival time' : f.reviewReason
        })),
        accommodations: (parsed.accommodations || []).map(s => ({
          ...s,
          meal: s.meal || 'B&B',
          nights: s.nights || 1,
          needsReview: !s.hotel || !s.roomType || !s.cin || !s.cout || s.needsReview,
          reviewReason: !s.hotel ? 'Missing property name' : !s.roomType ? 'Missing room type' : !s.cin ? 'Missing check-in date' : !s.cout ? 'Missing check-out date' : s.reviewReason
        })),
        transfers: parsed.transfers || [],
        activities: parsed.activities || []
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
    updated[idx] = { ...updated[idx], ...updates };
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

  const handleMarkAllReviewed = () => {
    if (!payload) return;
    setPayload({
      ...payload,
      client: { ...payload.client, needsReview: false },
      travellers: payload.travellers.map(t => ({ ...t, needsReview: false, isReviewed: true })),
      flights: (payload.flights || []).map(f => ({ ...f, needsReview: false, isReviewed: true })),
      accommodations: (payload.accommodations || []).map(s => ({ ...s, needsReview: false, isReviewed: true }))
    });
  };

  // Apply to Master Workspace State
  const handleConfirmAndApply = () => {
    if (!payload) return;

    const hasExistingData = Boolean(currentState.client.name.trim()) || currentState.guests.length > 0 || currentState.flights.length > 0 || currentState.rooms.length > 0 || currentState.transfers.length > 0 || currentState.activities.length > 0;
    if (hasExistingData && !window.confirm('This booking already contains data. The import will merge into existing records, update matching records with supplied information, and keep records that are not in the import. Missing imported fields will not intentionally clear existing values. Continue?')) return;

    // 1. Build Guests with stable IDs
    const guestIdMap = new Map<string, number>();
    const newGuests: Guest[] = payload.travellers.map((tg, idx) => {
      const gId = Date.now() + idx + 1;
      const fullName = `${tg.first} ${tg.last}`.trim().toLowerCase();
      guestIdMap.set(fullName, gId);
      guestIdMap.set(tg.first.trim().toLowerCase(), gId);

      return {
        id: gId,
        first: tg.first,
        last: tg.last,
        preferredName: tg.preferredName || '',
        nationality: tg.nationality || payload.client.country || '🇿🇦 South Africa',
        country: tg.country || payload.client.country || '🇿🇦 South Africa',
        age: tg.age || 'Adult',
        exactAge: tg.exactAge,
        dob: tg.dob || '',
        passportNo: tg.passportNo || '',
        passportExpiry: tg.passportExpiry || '',
        relationshipToLead: tg.relationshipToLead || (tg.isLead ? 'Primary Contact' : 'Family Member'),
        individualEmail: tg.individualEmail || '',
        individualPhone: tg.individualPhone || '',
        languagesSpoken: ['English'],
        isLead: tg.isLead ?? (idx === 0),
        notes: tg.notes || '',
        diet: tg.dietary || [],
        customFoodRequirements: tg.customFoodRequirements || [],
        customAccessibilityRequirements: tg.customAccessibilityRequirements || [],
        customAccommodationRequirements: tg.customAccommodationRequirements || [],
        accessibilityMobility: [],
        accessibilityVision: [],
        accessibilityHearing: [],
        medicalOperationalNotes: '',
        dietaryReligious: [],
        dietaryLifestyle: tg.dietary || [],
        dietaryMedical: [],
        dietaryPreferences: [],
        preferencesAccommodation: [],
        preferencesTransport: [],
        preferencesInterests: []
      };
    });

    const leadGuest = newGuests.find(g => g.isLead) || newGuests[0];
    const allGuestIds = newGuests.map(g => g.id);

    // 2. Build Flights
    const newFlights: Flight[] = (payload.flights || []).map((f, idx) => {
      // Match passenger names to guest IDs
      let paxIds: number[] = [];
      if (f.paxNames && f.paxNames.length > 0) {
        f.paxNames.forEach(pName => {
          const matchId = guestIdMap.get(pName.trim().toLowerCase());
          if (matchId) paxIds.push(matchId);
        });
      }
      if (paxIds.length === 0) paxIds = allGuestIds;

      return {
        id: Date.now() + 100 + idx,
        direction: f.direction || 'Inbound',
        airline: f.airline,
        flightNo: f.flightNo,
        pnr: f.pnr || '',
        from: f.from || 'CPT',
        to: f.to || 'JNB',
        date: f.date || payload.client.startDate || new Date().toISOString().split('T')[0],
        depTime: f.depTime || '10:00',
        arrTime: f.arrTime || '12:00',
        duration: '2h',
        cabin: f.cabin || 'Business',
        status: 'Booked',
        paxIds,
        cost: f.cost || 4500,
        markup: 500,
        qty: paxIds.length,
        notes: f.notes || '',
        stops: []
      };
    });

    // 3. Build Rooms / Stays
    const newRooms: Room[] = (payload.accommodations || []).map((s, idx) => {
      let guestIds: number[] = [];
      if (s.assignedPaxNames && s.assignedPaxNames.length > 0) {
        s.assignedPaxNames.forEach(pName => {
          const matchId = guestIdMap.get(pName.trim().toLowerCase());
          if (matchId) guestIds.push(matchId);
        });
      }
      if (guestIds.length === 0) guestIds = allGuestIds;

      return {
        id: Date.now() + 200 + idx,
        hotel: s.hotel,
        conf: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        pay: 'Deposit Paid',
        roomType: s.roomType || 'Standard',
        bed: 'King',
        meal: s.meal || 'B&B',
        cin: s.cin || payload.client.startDate || new Date().toISOString().split('T')[0],
        cout: s.cout || payload.client.endDate || new Date().toISOString().split('T')[0],
        nights: s.nights || 1,
        guestIds,
        rate: s.rate || 6500,
        supp: 0,
        reqs: [],
        notes: s.notes || ''
      };
    });

    // 4. Build Transfers
    const newTransfers: Transfer[] = (payload.transfers || []).map((t, idx) => {
      return {
        id: Date.now() + 300 + idx,
        type: t.type || 'Airport Arrival',
        date: t.date || payload.client.startDate || new Date().toISOString().split('T')[0],
        time: t.time || '10:00',
        status: 'Confirmed',
        from: t.from,
        to: t.to,
        meet: 'Main Arrivals Hall',
        sign: payload.client.name.toUpperCase(),
        flight: t.flight || '',
        dist: '25 km',
        dur: '30 min',
        vehicle: t.vehicle || 'Mercedes V-Class — 7 Seater',
        driver: 'Assigned Driver',
        driverPhone: '+27 82 555 0100',
        paxCount: newGuests.length,
        paxIds: allGuestIds,
        bagHand: newGuests.length,
        bagCheck: newGuests.length * 2,
        bagOver: 0,
        seats: [],
        special: ['Water & Refreshments', 'Wi-Fi'],
        cost: 1500,
        tolls: 0,
        parking: 0,
        notes: t.notes || '',
        waypoints: []
      };
    });

    // 5. Build Activities
    const newActivities: Activity[] = (payload.activities || []).map((a, idx) => {
      return {
        id: Date.now() + 400 + idx,
        day: a.day || 1,
        slot: a.slot || 'Morning',
        name: a.name,
        desc: a.desc || '',
        pickup: '09:00',
        start: '09:30',
        dur: a.dur || '3 hours',
        pickupLoc: 'Hotel Lobby',
        status: 'Confirmed',
        conf: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier: 'Viemma Experiences',
        supPhone: '+27 21 555 8820',
        paxIds: allGuestIds,
        pAdult: a.pAdult || 500,
        pChild: 250,
        nAdult: newGuests.length,
        nChild: 0,
        flat: 0,
        total: (a.pAdult || 500) * newGuests.length,
        inc: ['Transport', 'Guide', 'Entrance Fees'],
        backup: 'Indoor Gallery Experience',
        notes: a.notes || '',
        isFree: false
      };
    });

    // 6. Calculate Duration Text
    let durationText = currentState.client.durationText;
    if (payload.client.startDate && payload.client.endDate) {
      const s = new Date(payload.client.startDate);
      const e = new Date(payload.client.endDate);
      const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      durationText = `${diffDays} Days / ${Math.max(0, diffDays - 1)} Nights`;
    }

    // Apply partial update
    onApplyItinerary({
      ref: payload.tripRef || currentState.ref,
      title: payload.tripTitle || `${payload.client.name} Luxury Itinerary`,
      client: {
        ...currentState.client,
        name: payload.client.name,
        email: payload.client.email || currentState.client.email,
        phone: payload.client.phone || currentState.client.phone,
        country: payload.client.country || currentState.client.country,
        startDate: payload.client.startDate || currentState.client.startDate,
        endDate: payload.client.endDate || currentState.client.endDate,
        durationText,
        occasion: payload.client.occasion || currentState.client.occasion
      },
      guests: newGuests,
      flights: newFlights,
      rooms: newRooms,
      transfers: newTransfers,
      activities: newActivities
    });

    onClose();
  };

  // Count items needing review
  const flaggedCount = payload ? (
    (payload.client.needsReview ? 1 : 0) +
    payload.travellers.filter(t => t.needsReview).length +
    (payload.flights || []).filter(f => f.needsReview).length +
    (payload.accommodations || []).filter(s => s.needsReview).length
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
                            value={tg.age || 'Adult'}
                            onChange={(e) => handleUpdateTraveller(idx, { age: e.target.value as any })}
                            className="p-1.5 rounded-lg border bg-white text-xs"
                          >
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800">{f.airline}</span>
                          <span className="font-mono bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
                            {f.flightNo}
                          </span>
                          <span className="text-gray-500 font-mono text-[11px]">
                            {f.from} → {f.to}
                          </span>
                          <span className="text-gray-500 text-[11px]">({f.date} {f.depTime})</span>
                          <span className="text-[10px] bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                            {f.cabin}
                          </span>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800">{s.hotel}</span>
                          <span className="text-gray-500 text-[11px] font-medium">{s.roomType}</span>
                          <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">
                            {s.cin} to {s.cout} ({s.nights}N)
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            {s.meal}
                          </span>
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

              {/* SECTION: TRANSFERS & EXPERIENCES QUICK STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <h5 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                    <Car size={13} className="text-emerald-700" />
                    Transfers to Create ({payload.transfers?.length || 0})
                  </h5>
                  <p className="text-[11px] text-gray-600">
                    {payload.transfers && payload.transfers.length > 0 
                      ? payload.transfers.map(t => `${t.type}: ${t.from} → ${t.to}`).join('; ')
                      : 'No ground transfers specified.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <h5 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                    <Route size={13} className="text-[#D4AF37]" />
                    Experiences to Create ({payload.activities?.length || 0})
                  </h5>
                  <p className="text-[11px] text-gray-600">
                    {payload.activities && payload.activities.length > 0
                      ? payload.activities.map(a => `Day ${a.day}: ${a.name}`).join('; ')
                      : 'No daily experiences specified.'}
                  </p>
                </div>
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

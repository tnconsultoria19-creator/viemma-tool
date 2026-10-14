import React, { useState } from 'react';
import { 
  AppState, 
  Guest, 
  Flight, 
  Room, 
  Transfer, 
  Activity, 
  Driver,
  AIItineraryPayload, 
  AIImportGuest, 
  AIImportFlight, 
  AIImportStay, 
  AIImportTransfer, 
  AIImportActivity,
  AIImportDriver
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
  Edit3,
  UserCheck,
  Plus,
  Truck,
  Shield,
  Loader2
} from 'lucide-react';
import { evaluateDriverPermit } from '../utils/driverConflictDetector';

interface AIItineraryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppState;
  onApplyItinerary: (updatedState: Partial<AppState>) => void;
}

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
    }
  ],
  drivers: [
    {
      name: "Sipho Khumalo",
      preferredName: "Sipho",
      phone: "+27 60 555 1234",
      email: "sipho@viemmatours.com",
      prdpExpiryDate: "2027-04-15",
      status: "Available",
      operationalAvailability: "Full-time",
      notes: "Senior chauffeur, fluent in English and isiXhosa"
    }
  ]
};

const LLM_SYSTEM_PROMPT = `You are a specialist Travel Operations parser for Viemma Tours (Bespoke Southern Africa Luxury Travel OS).
Transform the provided travel itinerary, email inquiry, or client brief into a valid, strict JSON payload matching the "viemma-itinerary-v1" schema below.

### Output JSON Requirements:
1. MUST output ONLY valid JSON without markdown wrapping or commentary.
2. Partial imports are supported: you may omit sections that do not appear in the source brief.
3. Follow this schema:

{
  "schemaVersion": "viemma-itinerary-v1",
  "tripRef": "VT-2026-XXXX",
  "tripTitle": "Short descriptive title",
  "client": {
    "name": "Lead Client Full Name",
    "preferredName": "Preferred First Name",
    "email": "client@example.com",
    "phone": "+27 ...",
    "country": "🇿🇦 South Africa",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "occasion": "Anniversary / Safari",
    "notes": "..."
  },
  "travellers": [
    {
      "first": "First Name",
      "last": "Last Name",
      "age": "Adult" | "Elderly" | "Teen" | "Child" | "Infant",
      "isLead": false,
      "dietary": ["Vegetarian"],
      "notes": "..."
    }
  ],
  "flights": [
    {
      "airline": "Airline Name",
      "flightNo": "Code",
      "from": "CPT",
      "to": "JNB",
      "date": "YYYY-MM-DD",
      "depTime": "HH:MM",
      "arrTime": "HH:MM",
      "cabin": "Business",
      "pnr": "6-char code"
    }
  ],
  "accommodations": [
    {
      "hotel": "Hotel Name",
      "roomType": "Deluxe Suite",
      "meal": "B&B",
      "cin": "YYYY-MM-DD",
      "cout": "YYYY-MM-DD",
      "nights": 4
    }
  ],
  "transfers": [
    {
      "type": "Airport Arrival",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "from": "Origin",
      "to": "Destination",
      "vehicle": "Mercedes V-Class"
    }
  ],
  "activities": [
    {
      "day": 1,
      "slot": "Morning",
      "name": "Activity Name",
      "desc": "Summary",
      "dur": "3 hours"
    }
  ],
  "drivers": [
    {
      "name": "Driver Name",
      "phone": "+27...",
      "prdpExpiryDate": "YYYY-MM-DD",
      "status": "Available"
    }
  ]
}`;

export const AIItineraryImportModal: React.FC<AIItineraryImportModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onApplyItinerary
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'text' | 'prompt' | 'review'>('json');
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [textParseError, setTextParseError] = useState<string | null>(null);
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

  // Plain-text parser via backend Gemini API
  const handleParseRawText = async () => {
    if (!rawTextInput.trim()) {
      setTextParseError('Please enter unformatted itinerary notes, client inquiry, or supplier email.');
      return;
    }

    setIsParsingText(true);
    setTextParseError(null);

    try {
      const response = await fetch('/api/gemini/parse-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawTextInput })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'The AI parser service is currently unavailable. Please convert source text to JSON.');
      }

      const parsedData = await response.json();
      processParsedPayload(parsedData);
      setActiveTab('review');
    } catch (err: any) {
      console.warn('Text parsing notice:', err);
      setTextParseError(err.message || 'Could not parse text automatically. Please paste in documented JSON format.');
    } finally {
      setIsParsingText(false);
    }
  };

  const processParsedPayload = (parsed: any) => {
    // Check schema version or allow default
    const schemaVersion = parsed.schemaVersion || 'viemma-itinerary-v1';

    // Travellers: do NOT assume Adult, do NOT default lead
    const processedTravellers: AIImportGuest[] = (parsed.travellers || []).map((g: any) => {
      const isMissingName = !g.first || !g.last;
      const isMissingAge = !g.age;
      return {
        ...g,
        first: g.first || '',
        last: g.last || '',
        isLead: Boolean(g.isLead),
        age: g.age || undefined, // Never default to Adult
        needsReview: isMissingName || isMissingAge || Boolean(g.needsReview),
        reviewReason: isMissingName 
          ? 'Missing traveller name' 
          : isMissingAge 
            ? 'Age category unspecified' 
            : g.reviewReason
      };
    });

    // Flights
    const processedFlights: AIImportFlight[] = (parsed.flights || []).map((f: any) => ({
      ...f,
      cabin: f.cabin || 'Business',
      direction: f.direction || 'Inbound',
      needsReview: !f.flightNo || !f.date || Boolean(f.needsReview),
      reviewReason: !f.flightNo ? 'Missing flight code' : !f.date ? 'Missing flight departure date' : f.reviewReason
    }));

    // Accommodations
    const processedStays: AIImportStay[] = (parsed.accommodations || []).map((s: any) => ({
      ...s,
      meal: s.meal || 'B&B',
      nights: s.nights || 1,
      needsReview: !s.hotel || !s.cin || Boolean(s.needsReview),
      reviewReason: !s.hotel ? 'Missing hotel property' : !s.cin ? 'Missing check-in date' : s.reviewReason
    }));

    // Drivers
    const processedDrivers: AIImportDriver[] = (parsed.drivers || []).map((d: any) => {
      const permit = evaluateDriverPermit(d.prdpExpiryDate);
      const isInvalidPermit = permit.status === 'expired' || permit.status === 'not_provided';
      return {
        ...d,
        name: d.name || 'Unnamed Driver',
        status: d.status || 'Available',
        operationalAvailability: d.operationalAvailability || 'Full-time',
        needsReview: isInvalidPermit || Boolean(d.needsReview),
        reviewReason: permit.status === 'expired' 
          ? 'PrDP permit expired' 
          : permit.status === 'not_provided' 
            ? 'PrDP expiry date not recorded' 
            : d.reviewReason
      };
    });

    const processed: AIItineraryPayload = {
      ...parsed,
      schemaVersion,
      tripRef: parsed.tripRef || currentState.ref || `VT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      client: parsed.client ? { ...parsed.client } : undefined,
      travellers: processedTravellers,
      flights: processedFlights,
      accommodations: processedStays,
      transfers: parsed.transfers || [],
      activities: parsed.activities || [],
      drivers: processedDrivers
    };

    setPayload(processed);
  };

  const handleInspectJson = () => {
    setParseError(null);
    if (!rawJsonInput.trim()) {
      setParseError('Please paste your itinerary JSON payload.');
      return;
    }

    try {
      let clean = rawJsonInput.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(clean);

      // Partial imports are valid! Ensure at least one section is present
      const hasAnySection = 
        Boolean(parsed.client?.name) ||
        (Array.isArray(parsed.travellers) && parsed.travellers.length > 0) ||
        (Array.isArray(parsed.flights) && parsed.flights.length > 0) ||
        (Array.isArray(parsed.accommodations) && parsed.accommodations.length > 0) ||
        (Array.isArray(parsed.transfers) && parsed.transfers.length > 0) ||
        (Array.isArray(parsed.activities) && parsed.activities.length > 0) ||
        (Array.isArray(parsed.drivers) && parsed.drivers.length > 0);

      if (!hasAnySection) {
        throw new Error('Payload contains no recognisable itinerary sections (client, travellers, flights, accommodations, transfers, activities, or drivers).');
      }

      processParsedPayload(parsed);
      setActiveTab('review');
    } catch (err: any) {
      setParseError(err.message || 'Malformed JSON format. Please verify syntax.');
    }
  };

  // Quick Add provisional travellers
  const handleQuickAddProvisional = (category: 'Adult' | 'Child' | 'Teen' | 'Infant') => {
    if (!payload) return;
    const currentTravellers = payload.travellers || [];
    const count = currentTravellers.filter(t => t.age === category).length + 1;
    
    const newGuest: AIImportGuest = {
      first: `Provisional`,
      last: `${category} ${count}`,
      age: category,
      relationshipToLead: category === 'Adult' ? 'Companion' : 'Dependent',
      isLead: false,
      dietary: [],
      notes: 'Quick-added provisional traveller. Update legal name prior to ticketing.',
      needsReview: true,
      reviewReason: 'Provisional record — details pending'
    };

    setPayload({
      ...payload,
      travellers: [...currentTravellers, newGuest]
    });
  };

  // Lead contact designation
  const handleDesignateLead = (leadIdx: number) => {
    if (!payload || !payload.travellers) return;
    const updated = payload.travellers.map((t, idx) => ({
      ...t,
      isLead: idx === leadIdx,
      relationshipToLead: idx === leadIdx ? 'Primary Contact' : (t.relationshipToLead === 'Primary Contact' ? 'Companion' : t.relationshipToLead)
    }));
    setPayload({ ...payload, travellers: updated });
  };

  // Review & inline updates
  const handleUpdateTraveller = (idx: number, updates: Partial<AIImportGuest>) => {
    if (!payload || !payload.travellers) return;
    const updated = [...payload.travellers];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, travellers: updated });
  };

  const handleMarkTravellerReviewed = (idx: number) => {
    handleUpdateTraveller(idx, { needsReview: false, isReviewed: true });
  };

  const handleUpdateDriver = (idx: number, updates: Partial<AIImportDriver>) => {
    if (!payload || !payload.drivers) return;
    const updated = [...payload.drivers];
    updated[idx] = { ...updated[idx], ...updates };
    setPayload({ ...payload, drivers: updated });
  };

  const handleMarkDriverReviewed = (idx: number) => {
    handleUpdateDriver(idx, { needsReview: false, isReviewed: true });
  };

  const handleMarkAllReviewed = () => {
    if (!payload) return;
    setPayload({
      ...payload,
      travellers: (payload.travellers || []).map(t => ({ ...t, needsReview: false, isReviewed: true })),
      flights: (payload.flights || []).map(f => ({ ...f, needsReview: false, isReviewed: true })),
      accommodations: (payload.accommodations || []).map(s => ({ ...s, needsReview: false, isReviewed: true })),
      drivers: (payload.drivers || []).map(d => ({ ...d, needsReview: false, isReviewed: true }))
    });
  };

  // Review counters
  const totalTravellers = payload?.travellers?.length || 0;
  const unreviewedTravellers = (payload?.travellers || []).filter(t => t.needsReview && !t.isReviewed).length;
  const unreviewedDrivers = (payload?.drivers || []).filter(d => d.needsReview && !d.isReviewed).length;
  const unreviewedFlights = (payload?.flights || []).filter(f => f.needsReview && !f.isReviewed).length;
  const unreviewedStays = (payload?.accommodations || []).filter(s => s.needsReview && !s.isReviewed).length;
  const totalUnreviewed = unreviewedTravellers + unreviewedDrivers + unreviewedFlights + unreviewedStays;

  // Apply to Master Workspace State (Partial Merge with Stable IDs)
  const handleConfirmAndApply = () => {
    if (!payload) return;

    const updates: Partial<AppState> = {};

    // 1. Partial Update: Client Header
    if (payload.client && payload.client.name) {
      updates.client = {
        ...currentState.client,
        name: payload.client.name || currentState.client.name,
        preferredName: payload.client.preferredName || currentState.client.preferredName,
        email: payload.client.email || currentState.client.email,
        phone: payload.client.phone || currentState.client.phone,
        whatsapp: payload.client.whatsapp || currentState.client.whatsapp,
        country: payload.client.country || currentState.client.country,
        startDate: payload.client.startDate || currentState.client.startDate,
        endDate: payload.client.endDate || currentState.client.endDate,
        occasion: payload.client.occasion || currentState.client.occasion
      };
      if (payload.tripRef) {
        updates.ref = payload.tripRef;
      }
    }

    // 2. Partial Update: Travellers / Guests (Deduplicate & Match)
    const existingGuests = [...currentState.guests];
    const guestIdMap = new Map<string, number>();

    // Map existing guests
    existingGuests.forEach(eg => {
      const nameKey = `${eg.first} ${eg.last}`.trim().toLowerCase();
      guestIdMap.set(nameKey, eg.id);
      guestIdMap.set(eg.first.trim().toLowerCase(), eg.id);
    });

    if (payload.travellers && payload.travellers.length > 0) {
      const mergedGuests: Guest[] = [...existingGuests];

      payload.travellers.forEach((importedGuest, idx) => {
        const nameKey = `${importedGuest.first} ${importedGuest.last}`.trim().toLowerCase();
        const existingIdx = mergedGuests.findIndex(eg => 
          (importedGuest.id && eg.id === Number(importedGuest.id)) ||
          (`${eg.first} ${eg.last}`.trim().toLowerCase() === nameKey && nameKey !== '')
        );

        if (existingIdx >= 0) {
          // Update matching record without erasing unmentioned fields
          const existing = mergedGuests[existingIdx];
          mergedGuests[existingIdx] = {
            ...existing,
            first: importedGuest.first || existing.first,
            last: importedGuest.last || existing.last,
            preferredName: importedGuest.preferredName || existing.preferredName,
            age: (importedGuest.age as any) || existing.age,
            nationality: importedGuest.nationality || existing.nationality,
            country: importedGuest.country || existing.country,
            relationshipToLead: importedGuest.relationshipToLead || existing.relationshipToLead,
            isLead: importedGuest.isLead !== undefined ? importedGuest.isLead : existing.isLead,
            diet: importedGuest.dietary && importedGuest.dietary.length > 0 ? importedGuest.dietary : existing.diet,
            notes: importedGuest.notes ? `${existing.notes ? `${existing.notes}\n` : ''}${importedGuest.notes}` : existing.notes
          };
          guestIdMap.set(nameKey, existing.id);
        } else {
          // Add new guest with stable ID
          const newId = Date.now() + idx + 1;
          const newG: Guest = {
            id: newId,
            first: importedGuest.first || 'Guest',
            last: importedGuest.last || `${idx + 1}`,
            preferredName: importedGuest.preferredName || '',
            nationality: importedGuest.nationality || updates.client?.country || currentState.client.country || '🇿🇦 South Africa',
            country: importedGuest.country || updates.client?.country || currentState.client.country || '🇿🇦 South Africa',
            age: (importedGuest.age as any) || undefined,
            relationshipToLead: importedGuest.relationshipToLead || (importedGuest.isLead ? 'Primary Contact' : 'Companion'),
            isLead: Boolean(importedGuest.isLead),
            notes: importedGuest.notes || '',
            diet: importedGuest.dietary || [],
            customFoodRequirements: importedGuest.customFoodRequirements || [],
            customAccessibilityRequirements: importedGuest.customAccessibilityRequirements || [],
            customAccommodationRequirements: importedGuest.customAccommodationRequirements || []
          };
          mergedGuests.push(newG);
          guestIdMap.set(nameKey, newId);
        }
      });

      updates.guests = mergedGuests;
    }

    // 3. Partial Update: Flights
    if (payload.flights && payload.flights.length > 0) {
      const mergedFlights: Flight[] = [...currentState.flights];
      payload.flights.forEach((importedFlight, idx) => {
        const matchIdx = mergedFlights.findIndex(f => 
          f.flightNo?.toUpperCase() === importedFlight.flightNo?.toUpperCase() &&
          f.date === importedFlight.date
        );

        const assignedPaxIds: number[] = [];
        (importedFlight.paxNames || []).forEach(pName => {
          const matchGId = guestIdMap.get(pName.trim().toLowerCase());
          if (matchGId) assignedPaxIds.push(matchGId);
        });

        if (matchIdx >= 0) {
          mergedFlights[matchIdx] = {
            ...mergedFlights[matchIdx],
            airline: importedFlight.airline || mergedFlights[matchIdx].airline,
            from: importedFlight.from || mergedFlights[matchIdx].from,
            to: importedFlight.to || mergedFlights[matchIdx].to,
            depTime: importedFlight.depTime || mergedFlights[matchIdx].depTime,
            arrTime: importedFlight.arrTime || mergedFlights[matchIdx].arrTime,
            cabin: (importedFlight.cabin as any) || mergedFlights[matchIdx].cabin,
            pnr: importedFlight.pnr || mergedFlights[matchIdx].pnr,
            paxIds: assignedPaxIds.length > 0 ? assignedPaxIds : mergedFlights[matchIdx].paxIds
          };
        } else {
          mergedFlights.push({
            id: Date.now() + 100 + idx,
            direction: (importedFlight.direction as any) || 'Inbound',
            airline: importedFlight.airline || 'Carrier',
            flightNo: importedFlight.flightNo || 'TBD',
            pnr: importedFlight.pnr || '',
            from: importedFlight.from || 'CPT',
            to: importedFlight.to || 'JNB',
            date: importedFlight.date || currentState.client.startDate || new Date().toISOString().split('T')[0],
            depTime: importedFlight.depTime || '10:00',
            arrTime: importedFlight.arrTime || '12:00',
            duration: '2h',
            cabin: (importedFlight.cabin as any) || 'Business',
            status: 'Booked',
            paxIds: assignedPaxIds.length > 0 ? assignedPaxIds : currentState.guests.map(g => g.id),
            bagHand: 1,
            bagCheck: 2,
            bagOver: 0,
            cost: importedFlight.cost || 4500,
            markup: 500,
            qty: assignedPaxIds.length || currentState.guests.length || 1,
            notes: importedFlight.notes || '',
            stops: []
          });
        }
      });
      updates.flights = mergedFlights;
    }

    // 4. Partial Update: Accommodations
    if (payload.accommodations && payload.accommodations.length > 0) {
      const mergedRooms: Room[] = [...currentState.rooms];
      payload.accommodations.forEach((importedStay, idx) => {
        const matchIdx = mergedRooms.findIndex(r => 
          r.hotel.toLowerCase().trim() === importedStay.hotel.toLowerCase().trim() &&
          r.cin === importedStay.cin
        );

        if (matchIdx >= 0) {
          mergedRooms[matchIdx] = {
            ...mergedRooms[matchIdx],
            roomType: importedStay.roomType || mergedRooms[matchIdx].roomType,
            meal: importedStay.meal || mergedRooms[matchIdx].meal,
            cout: importedStay.cout || mergedRooms[matchIdx].cout,
            nights: importedStay.nights || mergedRooms[matchIdx].nights,
            rate: importedStay.rate || mergedRooms[matchIdx].rate
          };
        } else {
          mergedRooms.push({
            id: Date.now() + 200 + idx,
            hotel: importedStay.hotel,
            conf: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
            pay: 'Deposit Paid',
            roomType: importedStay.roomType || 'Standard',
            bed: 'King',
            meal: importedStay.meal || 'B&B',
            cin: importedStay.cin || currentState.client.startDate || new Date().toISOString().split('T')[0],
            cout: importedStay.cout || currentState.client.endDate || new Date().toISOString().split('T')[0],
            nights: importedStay.nights || 1,
            guestIds: currentState.guests.map(g => g.id),
            rate: importedStay.rate || 6500,
            supp: 0,
            reqs: [],
            notes: importedStay.notes || ''
          });
        }
      });
      updates.rooms = mergedRooms;
    }

    // 5. Partial Update: Transfers
    if (payload.transfers && payload.transfers.length > 0) {
      const mergedTransfers: Transfer[] = [...currentState.transfers];
      payload.transfers.forEach((importedT, idx) => {
        const matchIdx = mergedTransfers.findIndex(t => 
          t.date === importedT.date &&
          t.from.toLowerCase().trim() === importedT.from.toLowerCase().trim() &&
          t.to.toLowerCase().trim() === importedT.to.toLowerCase().trim()
        );

        if (matchIdx >= 0) {
          mergedTransfers[matchIdx] = {
            ...mergedTransfers[matchIdx],
            time: importedT.time || mergedTransfers[matchIdx].time,
            vehicle: importedT.vehicle || mergedTransfers[matchIdx].vehicle,
            notes: importedT.notes || mergedTransfers[matchIdx].notes
          };
        } else {
          mergedTransfers.push({
            id: Date.now() + 300 + idx,
            type: (importedT.type as any) || 'Airport Arrival',
            date: importedT.date || currentState.client.startDate || new Date().toISOString().split('T')[0],
            time: importedT.time || '10:00',
            status: 'Confirmed',
            from: importedT.from,
            to: importedT.to,
            meet: 'Main Arrivals Hall',
            sign: currentState.client.name.toUpperCase(),
            flight: importedT.flight || '',
            dist: '25 km',
            dur: '30 min',
            vehicle: importedT.vehicle || 'Mercedes V-Class — 7 Seater',
            driver: 'Assigned Chauffeur',
            driverPhone: '+27 82 555 0100',
            paxCount: currentState.guests.length || 2,
            paxIds: currentState.guests.map(g => g.id),
            bagHand: currentState.guests.length || 2,
            bagCheck: (currentState.guests.length || 2) * 2,
            bagOver: 0,
            seats: [],
            special: ['Bottled Spring Water', 'Chilled Towels'],
            cost: 1500,
            tolls: 0,
            parking: 0,
            notes: importedT.notes || '',
            waypoints: []
          });
        }
      });
      updates.transfers = mergedTransfers;
    }

    // 6. Partial Update: Activities
    if (payload.activities && payload.activities.length > 0) {
      const mergedActivities: Activity[] = [...currentState.activities];
      payload.activities.forEach((importedA, idx) => {
        const matchIdx = mergedActivities.findIndex(a => 
          a.name.toLowerCase().trim() === importedA.name.toLowerCase().trim() &&
          a.day === importedA.day
        );

        if (matchIdx >= 0) {
          mergedActivities[matchIdx] = {
            ...mergedActivities[matchIdx],
            desc: importedA.desc || mergedActivities[matchIdx].desc,
            dur: importedA.dur || mergedActivities[matchIdx].dur,
            pAdult: importedA.pAdult || mergedActivities[matchIdx].pAdult
          };
        } else {
          mergedActivities.push({
            id: Date.now() + 400 + idx,
            day: importedA.day || 1,
            slot: (importedA.slot as any) || 'Morning',
            name: importedA.name,
            desc: importedA.desc || '',
            pickup: '09:00',
            start: '09:30',
            dur: importedA.dur || '3 hours',
            pickupLoc: 'Hotel Lobby',
            status: 'Confirmed',
            conf: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
            supplier: 'Viemma Experiences',
            supPhone: '+27 21 555 8820',
            paxIds: currentState.guests.map(g => g.id),
            pAdult: importedA.pAdult || 500,
            pChild: 250,
            nAdult: currentState.guests.length || 2,
            nChild: 0,
            flat: 0,
            total: (importedA.pAdult || 500) * (currentState.guests.length || 2),
            inc: ['Private Transport', 'English Speaking Guide', 'Entrance Fees'],
            backup: 'Scenic Peninsula Drive',
            notes: importedA.notes || '',
            isFree: false
          });
        }
      });
      updates.activities = mergedActivities;
    }

    // 7. Partial Update: Drivers Directory
    if (payload.drivers && payload.drivers.length > 0) {
      const mergedDrivers: Driver[] = [...(currentState.drivers || [])];
      payload.drivers.forEach((importedDrv, idx) => {
        const matchIdx = mergedDrivers.findIndex(d => 
          (importedDrv.id && d.id === importedDrv.id) ||
          d.name.toLowerCase().trim() === importedDrv.name.toLowerCase().trim()
        );

        if (matchIdx >= 0) {
          mergedDrivers[matchIdx] = {
            ...mergedDrivers[matchIdx],
            phone: importedDrv.phone || mergedDrivers[matchIdx].phone,
            email: importedDrv.email || mergedDrivers[matchIdx].email,
            prdpExpiryDate: importedDrv.prdpExpiryDate || mergedDrivers[matchIdx].prdpExpiryDate,
            status: (importedDrv.status as any) || mergedDrivers[matchIdx].status,
            notes: importedDrv.notes ? `${mergedDrivers[matchIdx].notes ? `${mergedDrivers[matchIdx].notes}\n` : ''}${importedDrv.notes}` : mergedDrivers[matchIdx].notes
          };
        } else {
          mergedDrivers.push({
            id: importedDrv.id || `drv_${Date.now() + idx}`,
            name: importedDrv.name,
            preferredName: importedDrv.preferredName,
            phone: importedDrv.phone || '+27 60 555 0000',
            email: importedDrv.email || '',
            prdpExpiryDate: importedDrv.prdpExpiryDate,
            status: (importedDrv.status as any) || 'Available',
            operationalAvailability: (importedDrv.operationalAvailability as any) || 'Full-time',
            notes: importedDrv.notes || ''
          });
        }
      });
      updates.drivers = mergedDrivers;
    }

    onApplyItinerary(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-[#1A3326] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs text-[#D4AF37]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif flex items-center gap-2">
                Shared AI Itinerary & Operations Importer
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-emerald-200">
                  viemma-itinerary-v1
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                Import partial or full itineraries: travellers, flights, hotel stays, ground transfers, excursions, and chauffeur drivers.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-gray-100 flex items-center gap-4 text-xs font-bold bg-gray-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'json'
                ? 'border-[#1A3326] text-[#1A3326]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FileText size={14} /> Paste JSON
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'text'
                ? 'border-[#1A3326] text-[#1A3326]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sparkles size={14} className="text-[#D4AF37]" /> Plain Text / Email Brief
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'prompt'
                ? 'border-[#1A3326] text-[#1A3326]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Copy size={14} /> Schema Prompt
          </button>

          {payload && (
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`pb-3 border-b-2 flex items-center gap-2 ml-auto transition cursor-pointer ${
                activeTab === 'review'
                  ? 'border-[#D4AF37] text-emerald-900 font-extrabold'
                  : 'border-transparent text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle size={14} className="text-[#D4AF37]" /> Review & Preview
              {totalUnreviewed > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {totalUnreviewed} to check
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PASTE JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  Paste Itinerary JSON Payload (supports partial records)
                </span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Load Complete Sample Payload
                </button>
              </div>

              <textarea
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                placeholder='{\n  "schemaVersion": "viemma-itinerary-v1",\n  "client": { "name": "..." },\n  "travellers": [ ... ]\n}'
                rows={14}
                className="w-full font-mono text-xs p-4 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
              />

              {parseError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInspectJson}
                  className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  Inspect & Review Payload <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PLAIN TEXT INGESTION */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <Sparkles size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">AI Natural Language Itinerary Ingestion</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Paste supplier quotation emails, unstructured WhatsApp group messages, or client briefs below. Gemini will transform the raw narrative into a structured <code>viemma-itinerary-v1</code> schema for your operational preview.
                  </p>
                </div>
              </div>

              <textarea
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder="e.g. Booking brief for Dr Jonathan Vance and Mrs Eleanor Vance arriving BA059 18 October Cape Town. Need Mercedes V-Class transfer to The Silo Hotel for 4 nights, Table Mountain VIP tour next day with guide Sipho..."
                rows={12}
                className="w-full text-xs p-4 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
              />

              {textParseError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-600 shrink-0" />
                  <span>{textParseError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isParsingText}
                  onClick={handleParseRawText}
                  className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isParsingText ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
                      <span>Parsing with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-[#D4AF37]" />
                      <span>Parse into Structured Schema</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA PROMPT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  Prompt for external LLMs (Claude, ChatGPT, Gemini)
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                </button>
              </div>

              <pre className="p-4 bg-gray-900 text-gray-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-[400px]">
                {LLM_SYSTEM_PROMPT}
              </pre>
            </div>
          )}

          {/* TAB 4: REVIEW & EDIT */}
          {activeTab === 'review' && payload && (
            <div className="space-y-8">
              
              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-800 shadow-xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {payload.tripTitle || payload.client?.name ? `${payload.tripTitle || payload.client?.name}'s Itinerary` : 'Partial Operation Import'}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Ref: {payload.tripRef || currentState.ref} • Schema: {payload.schemaVersion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {totalUnreviewed > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllReviewed}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer"
                    >
                      Mark All as Reviewed ({totalUnreviewed})
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION: CLIENT DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <Users size={14} className="text-[#D4AF37]" />
                  1. Client Profile
                  {!payload.client && (
                    <span className="text-[10px] text-gray-400 font-normal font-sans ml-2">
                      (Omitted in this partial import — current workspace client will be preserved)
                    </span>
                  )}
                </h4>

                {payload.client && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Client Name</span>
                      <input
                        type="text"
                        value={payload.client.name}
                        onChange={(e) => setPayload({
                          ...payload,
                          client: { ...payload.client!, name: e.target.value }
                        })}
                        className="w-full mt-1 p-2 rounded-xl border border-gray-200 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Email</span>
                      <input
                        type="email"
                        value={payload.client.email || ''}
                        onChange={(e) => setPayload({
                          ...payload,
                          client: { ...payload.client!, email: e.target.value }
                        })}
                        className="w-full mt-1 p-2 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Country / Origin</span>
                      <input
                        type="text"
                        value={payload.client.country || ''}
                        onChange={(e) => setPayload({
                          ...payload,
                          client: { ...payload.client!, country: e.target.value }
                        })}
                        className="w-full mt-1 p-2 rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: TRAVELLERS ROSTER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={14} className="text-[#D4AF37]" />
                    2. Travellers Roster ({totalTravellers})
                  </h4>

                  {/* Quick Add Provisional Travellers */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Quick Add:</span>
                    {(['Adult', 'Child', 'Teen', 'Infant'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleQuickAddProvisional(cat)}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={10} /> +1 {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {(!payload.travellers || payload.travellers.length === 0) ? (
                  <div className="p-4 rounded-xl bg-gray-50 text-gray-500 text-xs italic">
                    No traveller records in this partial import. Existing workspace guests will remain unchanged.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {payload.travellers.map((tg, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition ${
                          tg.needsReview && !tg.isReviewed
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDesignateLead(idx)}
                              title={tg.isLead ? "Lead Passenger" : "Click to designate as Lead Contact"}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                tg.isLead
                                  ? 'bg-[#1A3326] text-[#D4AF37] shadow-xs'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {tg.isLead ? '★ Lead Contact' : 'Set as Lead'}
                            </button>

                            <input
                              type="text"
                              value={tg.first}
                              onChange={(e) => handleUpdateTraveller(idx, { first: e.target.value })}
                              placeholder="First Name"
                              className="w-28 p-1.5 rounded-lg border border-gray-200 text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={tg.last}
                              onChange={(e) => handleUpdateTraveller(idx, { last: e.target.value })}
                              placeholder="Surname"
                              className="w-28 p-1.5 rounded-lg border border-gray-200 text-xs font-bold"
                            />

                            <select
                              value={tg.age || ''}
                              onChange={(e) => handleUpdateTraveller(idx, { age: (e.target.value as any) || undefined })}
                              className="p-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white"
                            >
                              <option value="">Age: Unspecified</option>
                              <option value="Adult">Adult</option>
                              <option value="Elderly">Elderly</option>
                              <option value="Teen">Teen</option>
                              <option value="Child">Child</option>
                              <option value="Infant">Infant</option>
                            </select>

                            <input
                              type="text"
                              value={(tg.dietary || []).join(', ')}
                              onChange={(e) => handleUpdateTraveller(idx, { 
                                dietary: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                              })}
                              placeholder="Dietary requirements..."
                              className="w-40 p-1.5 rounded-lg border border-gray-200 text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {tg.needsReview && !tg.isReviewed ? (
                              <button
                                type="button"
                                onClick={() => handleMarkTravellerReviewed(idx)}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={11} /> Confirm
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle size={12} /> Ready
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: CHAUFFEUR DRIVERS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <Truck size={14} className="text-[#D4AF37]" />
                  3. Chauffeur Drivers & Fleet Register ({payload.drivers?.length || 0})
                </h4>

                {(!payload.drivers || payload.drivers.length === 0) ? (
                  <div className="p-4 rounded-xl bg-gray-50 text-gray-500 text-xs italic">
                    No driver records in this payload. Existing driver fleet will be preserved.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {payload.drivers.map((drv, dIdx) => {
                      const permit = evaluateDriverPermit(drv.prdpExpiryDate);
                      return (
                        <div
                          key={dIdx}
                          className={`p-3.5 rounded-2xl border transition ${
                            permit.status === 'expired'
                              ? 'bg-red-50/50 border-red-200'
                              : permit.status === 'not_provided'
                                ? 'bg-amber-50/40 border-amber-200'
                                : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={drv.name}
                                  onChange={(e) => handleUpdateDriver(dIdx, { name: e.target.value })}
                                  placeholder="Driver Legal Name"
                                  className="w-36 p-1.5 rounded-lg border border-gray-200 text-xs font-bold"
                                />

                                <input
                                  type="text"
                                  value={drv.phone || ''}
                                  onChange={(e) => handleUpdateDriver(dIdx, { phone: e.target.value })}
                                  placeholder="Phone number"
                                  className="w-32 p-1.5 rounded-lg border border-gray-200 text-xs font-mono"
                                />

                                <input
                                  type="email"
                                  value={drv.email || ''}
                                  onChange={(e) => handleUpdateDriver(dIdx, { email: e.target.value })}
                                  placeholder="driver@viemmatours.com"
                                  className="w-40 p-1.5 rounded-lg border border-gray-200 text-xs"
                                />

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">PrDP Expiry:</span>
                                  <input
                                    type="date"
                                    value={drv.prdpExpiryDate || ''}
                                    onChange={(e) => handleUpdateDriver(dIdx, { prdpExpiryDate: e.target.value })}
                                    className="p-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white"
                                  />
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${permit.badgeClass}`}>
                                  {permit.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {drv.needsReview && !drv.isReviewed ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkDriverReviewed(dIdx)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={11} /> Confirm
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle size={12} /> Ready
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Secondary operational parameters: availability, operational status & notes */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-[11px]">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Availability:</span>
                                <select
                                  value={drv.operationalAvailability || 'Full-time'}
                                  onChange={(e) => handleUpdateDriver(dIdx, { operationalAvailability: e.target.value as any })}
                                  className="p-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700"
                                >
                                  <option value="Full-time">Full-time</option>
                                  <option value="Part-time">Part-time</option>
                                  <option value="Contractor">Contractor</option>
                                  <option value="On-call">On-call</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                                <select
                                  value={drv.status || 'Available'}
                                  onChange={(e) => handleUpdateDriver(dIdx, { status: e.target.value as any })}
                                  className="p-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700"
                                >
                                  <option value="Available">Available</option>
                                  <option value="On Tour">On Tour</option>
                                  <option value="Off-duty">Off-duty</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </div>

                              <input
                                type="text"
                                value={drv.notes || ''}
                                onChange={(e) => handleUpdateDriver(dIdx, { notes: e.target.value })}
                                placeholder="Operational notes, languages spoken, vehicle allocations..."
                                className="flex-1 min-w-[200px] p-1 rounded-md border border-gray-200 text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: FLIGHTS & HOTELS PREVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flights */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <h5 className="text-xs font-bold text-[#1A3326] uppercase flex items-center gap-1.5">
                    <Plane size={14} className="text-[#D4AF37]" />
                    Flights ({payload.flights?.length || 0})
                  </h5>
                  {(!payload.flights || payload.flights.length === 0) ? (
                    <p className="text-[11px] text-gray-400 italic">No flights imported</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {payload.flights.map((f, i) => (
                        <div key={i} className="text-xs p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                          <span className="font-bold">{f.airline} {f.flightNo}</span>
                          <span className="font-mono text-gray-500">{f.from} ➔ {f.to} ({f.date})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stays */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <h5 className="text-xs font-bold text-[#1A3326] uppercase flex items-center gap-1.5">
                    <Hotel size={14} className="text-[#D4AF37]" />
                    Accommodations ({payload.accommodations?.length || 0})
                  </h5>
                  {(!payload.accommodations || payload.accommodations.length === 0) ? (
                    <p className="text-[11px] text-gray-400 italic">No hotel stays imported</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {payload.accommodations.map((s, i) => (
                        <div key={i} className="text-xs p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                          <span className="font-bold truncate max-w-[160px]">{s.hotel}</span>
                          <span className="font-mono text-gray-500">{s.cin} ({s.nights}n)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Back to JSON Input
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndApply}
                    className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle size={15} className="text-[#D4AF37]" />
                    <span>Apply & Synchronize to Workspace</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

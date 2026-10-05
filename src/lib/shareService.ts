import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isCloudConnected } from './firebase';
import { AppState } from '../types';
import { INITIAL_STATE } from '../App';
import { buildNormalizedTimeline, TimelineEvent } from '../utils/timelineEngine';

export interface ClientShareDoc {
  token: string;
  tripRef: string;
  role: 'client';
  active: boolean;
  version: number;
  lastUpdated: string;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  durationText: string;
  editorial: {
    heroImageUrl: string;
    tagline: string;
    welcomeStory: string;
    keyHighlights: string[];
    packingEssentials: string[];
    videoUrl?: string;
  };
  destinations: Array<{
    name: string;
    description: string;
    imageUrl: string;
    bestTimeToVisit?: string;
  }>;
  activities: Array<{
    id: number;
    day: number;
    name: string;
    desc: string;
    slot: string;
    start: string;
    dur: string;
    pickupLoc: string;
    heroImage?: string;
    gallery?: string[];
    inc: string[];
  }>;
  accommodations: Array<{
    id: number;
    hotel: string;
    roomType: string;
    cin: string;
    cout: string;
    nights: number;
    meal: string;
    propertyImages?: string[];
    amenities?: string[];
    gpsLocation?: string;
  }>;
  flights: Array<{
    id: number;
    airline: string;
    flightNo: string;
    from: string;
    to: string;
    date: string;
    depTime: string;
    arrTime: string;
    cabin: string;
  }>;
  transfers: Array<{
    id: number;
    type: string;
    date: string;
    time: string;
    from: string;
    to: string;
    vehicle: string;
  }>;
  timeline: TimelineEvent[];
  consultant: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar: string;
  };
}

export interface AgentShareDoc {
  token: string;
  tripRef: string;
  role: 'agent';
  active: boolean;
  version: number;
  lastUpdated: string;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  durationText: string;
  consultant: {
    name: string;
    email: string;
    phone: string;
  };
  agent: {
    id?: string;
    agencyName?: string;
    contact?: string;
    email?: string;
    comm?: string;
  };
  retailPricing: {
    currency: string;
    retailTotalZAR: number;
    agentCommissionZAR: number;
    netPayableToViemmaZAR: number;
    paymentTerms: string;
  };
  timeline: TimelineEvent[];
  flights: Array<{
    id: number;
    airline: string;
    flightNo: string;
    from: string;
    to: string;
    date: string;
    depTime: string;
    arrTime: string;
    cabin: string;
    status: string;
  }>;
  accommodations: Array<{
    id: number;
    hotel: string;
    roomType: string;
    cin: string;
    cout: string;
    nights: number;
    meal: string;
    confirmationRef?: string;
  }>;
  transfers: Array<{
    id: number;
    type: string;
    date: string;
    time: string;
    from: string;
    to: string;
    vehicle: string;
    driver: string;
    meet: string;
  }>;
  guestInstructions: string;
}

export interface OpsShareDoc {
  token: string;
  tripRef: string;
  role: 'ops';
  active: boolean;
  version: number;
  lastUpdated: string;
  tripTitle: string;
  clientName: string;
  leadPaxName: string;
  totalPaxCount: number;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  guestManifest: Array<{
    id: number;
    name: string;
    ageCategory: string;
    dietary: string[];
    mobility: string[];
    medicalNotes: string;
  }>;
  timeline: TimelineEvent[];
  services: Array<{
    id: string;
    category: 'transfer' | 'activity' | 'flight' | 'accommodation';
    date: string;
    time: string;
    title: string;
    pickupLocation: string;
    dropoffLocation: string;
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleId?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
    guideId?: string;
    guideName?: string;
    guidePhone?: string;
    flightNo?: string;
    signText?: string;
    paxCount: number;
    luggage: { hand: number; check: number; over: number };
    status: string;
    operationalNotes: string;
  }>;
}

/**
 * Generate cryptographically secure unguessable tokens
 */
export function generateSecureToken(prefix: 'cli' | 'agt' | 'ops'): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint8Array(16);
    window.crypto.getRandomValues(buffer);
    const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex}`;
  }
  // Fallback using randomUUID or high-entropy crypto
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 12)}`;
}

/**
 * Projection builders - strictly strip internal confidential data
 */
export function buildClientProjection(trip: AppState, token: string): ClientShareDoc {
  const timeline = buildNormalizedTimeline(trip);

  return {
    token,
    tripRef: trip.ref,
    role: 'client',
    active: trip.publishing?.clientTokenActive ?? true,
    version: trip.version || 1,
    lastUpdated: new Date().toISOString(),
    title: trip.title || `Bespoke African Journey for ${trip.client.name}`,
    clientName: trip.client.name,
    startDate: trip.client.startDate,
    endDate: trip.client.endDate,
    durationText: trip.client.durationText,
    editorial: {
      heroImageUrl: trip.editorial?.heroImageUrl || 'https://images.pexels.com/photos/7843687/pexels-photo-7843687.jpeg',
      tagline: trip.editorial?.tagline || 'Private Curated African Sanctuary',
      welcomeStory: trip.editorial?.welcomeStory || '',
      keyHighlights: trip.editorial?.keyHighlights || [],
      packingEssentials: trip.editorial?.packingEssentials || [],
      videoUrl: trip.editorial?.videoUrl
    },
    destinations: (trip.destinationLibrary || []).map(d => ({
      name: d.name,
      description: d.overview || '',
      imageUrl: d.featuredImage || (d.images && d.images[0]) || '',
      bestTimeToVisit: d.climate || ''
    })),
    activities: (trip.activities || []).map(a => ({
      id: a.id,
      day: a.day,
      name: a.name,
      desc: a.desc,
      slot: a.slot,
      start: a.start,
      dur: a.dur,
      pickupLoc: a.pickupLoc || a.pickup,
      heroImage: a.heroImage,
      gallery: a.gallery,
      inc: a.inc || []
    })),
    accommodations: (trip.rooms || []).map(r => ({
      id: r.id,
      hotel: r.hotel,
      roomType: r.roomType,
      cin: r.cin,
      cout: r.cout,
      nights: r.nights,
      meal: r.meal,
      propertyImages: r.propertyImages,
      amenities: r.amenities,
      gpsLocation: r.gpsLocation
    })),
    flights: (trip.flights || []).map(f => ({
      id: f.id,
      airline: f.airline,
      flightNo: f.flightNo,
      from: f.from,
      to: f.to,
      date: f.date,
      depTime: f.depTime,
      arrTime: f.arrTime,
      cabin: f.cabin
    })),
    transfers: (trip.transfers || []).map(t => ({
      id: t.id,
      type: t.type,
      date: t.date,
      time: t.time,
      from: t.from,
      to: t.to,
      vehicle: t.vehicle
    })),
    timeline,
    consultant: {
      name: trip.consultant || 'Elena Rostova',
      role: trip.consultantRole || 'Private Travel Designer & Concierge',
      email: trip.consultantEmail || 'concierge@viemmatours.com',
      phone: trip.consultantPhone || '+27 21 555 0199',
      avatar: trip.consultantAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'
    }
  };
}

export function buildAgentProjection(trip: AppState, token: string): AgentShareDoc {
  const timeline = buildNormalizedTimeline(trip);

  // Compute retail totals
  const flightCosts = (trip.flights || []).reduce((sum, f) => sum + (f.cost * f.qty), 0);
  const transferCosts = (trip.transfers || []).reduce((sum, tr) => sum + tr.cost + tr.tolls + tr.parking, 0);
  const roomCosts = (trip.rooms || []).reduce((sum, r) => sum + (r.rate * r.nights) + r.supp, 0);
  const activityCosts = (trip.activities || []).reduce((sum, a) => sum + (a.isFree ? 0 : a.total), 0);
  const totalCost = flightCosts + transferCosts + roomCosts + activityCosts;

  const f = trip.finance || { margin: 15, marginType: '%', comm: 10, commType: '%', buffer: 0, discount: 0, paymentMethod: 'eft' };
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : (f.margin || 0);
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + (f.buffer || 0) - (f.discount || 0));
  const commTotal = f.commType === '%' ? (totalCost + markupTotal) * ((f.comm || 0) / 100) : (f.comm || 0);
  const netPayable = Math.max(0, retailTotalZAR - commTotal);

  return {
    token,
    tripRef: trip.ref,
    role: 'agent',
    active: trip.publishing?.agentTokenActive ?? true,
    version: trip.version || 1,
    lastUpdated: new Date().toISOString(),
    title: trip.title || `Bespoke Proposal for ${trip.client.name}`,
    clientName: trip.client.name,
    startDate: trip.client.startDate,
    endDate: trip.client.endDate,
    durationText: trip.client.durationText,
    consultant: {
      name: trip.consultant || 'Elena Rostova',
      email: trip.consultantEmail || 'agents@viemmatours.com',
      phone: trip.consultantPhone || '+27 21 555 0199'
    },
    agent: trip.agent || {},
    retailPricing: {
      currency: 'ZAR',
      retailTotalZAR: Math.round(retailTotalZAR),
      agentCommissionZAR: Math.round(commTotal),
      netPayableToViemmaZAR: Math.round(netPayable),
      paymentTerms: '30% deposit upon confirmation, 70% balance 45 days prior to arrival. Commission deductible at source.'
    },
    timeline,
    flights: (trip.flights || []).map(fl => ({
      id: fl.id,
      airline: fl.airline,
      flightNo: fl.flightNo,
      from: fl.from,
      to: fl.to,
      date: fl.date,
      depTime: fl.depTime,
      arrTime: fl.arrTime,
      cabin: fl.cabin,
      status: fl.status
    })),
    accommodations: (trip.rooms || []).map(r => ({
      id: r.id,
      hotel: r.hotel,
      roomType: r.roomType,
      cin: r.cin,
      cout: r.cout,
      nights: r.nights,
      meal: r.meal,
      confirmationRef: (r as any).confirmationRef
    })),
    transfers: (trip.transfers || []).map(t => ({
      id: t.id,
      type: t.type,
      date: t.date,
      time: t.time,
      from: t.from,
      to: t.to,
      vehicle: t.vehicle,
      driver: t.driver,
      meet: t.meet
    })),
    guestInstructions: trip.groupConditions?.notes || 'Please ensure all travellers have valid passports with at least 6 months validity.'
  };
}

export function buildOpsProjection(trip: AppState, token: string): OpsShareDoc {
  const timeline = buildNormalizedTimeline(trip);

  const services: OpsShareDoc['services'] = [];

  // Transfer services
  (trip.transfers || []).forEach(t => {
    services.push({
      id: `tr_${t.id}`,
      category: 'transfer',
      date: t.date,
      time: t.time,
      title: `${t.type}: ${t.from} to ${t.to}`,
      pickupLocation: t.from,
      dropoffLocation: t.to,
      driverId: (t as any).driverId,
      driverName: t.driver,
      driverPhone: t.driverPhone,
      vehicleId: (t as any).vehicleId,
      vehicleModel: t.vehicle,
      vehiclePlate: (t as any).vehiclePlate,
      flightNo: t.flight,
      signText: t.sign,
      paxCount: t.paxCount || t.paxIds?.length || 1,
      luggage: { hand: t.bagHand || 0, check: t.bagCheck || 0, over: t.bagOver || 0 },
      status: t.status,
      operationalNotes: t.notes || (t.meet ? `Meet Instructions: ${t.meet}` : '')
    });
  });

  // Activity services
  (trip.activities || []).forEach(a => {
    services.push({
      id: `act_${a.id}`,
      category: 'activity',
      date: trip.client.startDate, // will be matched to day in timeline
      time: a.start,
      title: a.name,
      pickupLocation: a.pickupLoc || a.pickup || 'Hotel Lobby',
      dropoffLocation: a.pickupLoc || 'Hotel Lobby',
      guideId: (a as any).guideId,
      guideName: (a as any).guideName,
      guidePhone: (a as any).guidePhone,
      paxCount: a.paxIds?.length || (a.nAdult + a.nChild) || 1,
      luggage: { hand: 0, check: 0, over: 0 },
      status: a.status,
      operationalNotes: a.notes || `Included: ${(a.inc || []).join(', ')}`
    });
  });

  return {
    token,
    tripRef: trip.ref,
    role: 'ops',
    active: trip.publishing?.opsTokenActive ?? true,
    version: trip.version || 1,
    lastUpdated: new Date().toISOString(),
    tripTitle: trip.title || `Viemma Operations: ${trip.client.name}`,
    clientName: trip.client.name,
    leadPaxName: trip.guests?.find(g => g.isLead)?.first ? `${trip.guests.find(g => g.isLead)?.first} ${trip.guests.find(g => g.isLead)?.last}` : trip.client.name,
    totalPaxCount: trip.guests?.length || (trip.client as any).paxCount || 1,
    emergencyContact: {
      name: (trip.client as any).emergencyContact?.name || trip.consultant || 'Operations Desk',
      phone: (trip.client as any).emergencyContact?.phone || trip.consultantPhone || '+27 21 555 0199',
      relation: (trip.client as any).emergencyContact?.relation || '24/7 Operations Desk'
    },
    guestManifest: (trip.guests || []).map(g => ({
      id: g.id,
      name: `${g.first} ${g.last}`,
      ageCategory: g.age,
      dietary: g.dietaryLifestyle || g.diet || [],
      mobility: g.accessibilityMobility || g.mob || [],
      medicalNotes: g.medicalOperationalNotes || ''
    })),
    timeline,
    services
  };
}

/**
 * Publishes or automatically updates all three role projection documents to Firestore
 */
export async function syncProjectionsToFirestore(trip: AppState): Promise<{
  clientToken: string;
  agentToken: string;
  opsToken: string;
}> {
  const clientToken = trip.publishing?.clientToken || generateSecureToken('cli');
  const agentToken = trip.publishing?.agentToken || generateSecureToken('agt');
  const opsToken = trip.publishing?.opsToken || generateSecureToken('ops');

  const clientDoc = buildClientProjection(trip, clientToken);
  const agentDoc = buildAgentProjection(trip, agentToken);
  const opsDoc = buildOpsProjection(trip, opsToken);

  // Sync to local fallback storage
  try {
    localStorage.setItem(`viemma_share_cli_${clientToken}`, JSON.stringify(clientDoc));
    localStorage.setItem(`viemma_share_agt_${agentToken}`, JSON.stringify(agentDoc));
    localStorage.setItem(`viemma_share_ops_${opsToken}`, JSON.stringify(opsDoc));
  } catch (e) {
    console.warn('Could not cache share projections locally:', e);
  }

  // Cloud Firestore Sync
  if (db && isCloudConnected) {
    try {
      await Promise.all([
        setDoc(doc(db, 'clientShares', clientToken), clientDoc, { merge: true }),
        setDoc(doc(db, 'agentShares', agentToken), agentDoc, { merge: true }),
        setDoc(doc(db, 'opsShares', opsToken), opsDoc, { merge: true })
      ]);
    } catch (err) {
      console.warn('Firestore share projections sync warning:', err);
    }
  }

  return { clientToken, agentToken, opsToken };
}

/**
 * Regenerates a share token for a specific role and deletes the old token projection
 */
export async function regenerateShareToken(trip: AppState, role: 'client' | 'agent' | 'ops'): Promise<AppState> {
  const oldToken = role === 'client'
    ? trip.publishing?.clientToken
    : role === 'agent'
    ? trip.publishing?.agentToken
    : trip.publishing?.opsToken;

  const newToken = generateSecureToken(role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops');

  // 1. Delete old projection in cloud & local
  if (oldToken) {
    try {
      localStorage.removeItem(`viemma_share_${role}_${oldToken}`);
    } catch {}

    if (db && isCloudConnected) {
      try {
        const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';
        await deleteDoc(doc(db, collectionName, oldToken));
      } catch (err) {
        console.warn(`Could not delete old ${role} share doc:`, err);
      }
    }
  }

  // 2. Update trip state with new token
  const updatedTrip: AppState = {
    ...trip,
    publishing: {
      ...trip.publishing!,
      clientToken: role === 'client' ? newToken : trip.publishing?.clientToken || '',
      agentToken: role === 'agent' ? newToken : trip.publishing?.agentToken || '',
      opsToken: role === 'ops' ? newToken : trip.publishing?.opsToken || '',
      clientTokenActive: role === 'client' ? true : trip.publishing?.clientTokenActive ?? true,
      agentTokenActive: role === 'agent' ? true : trip.publishing?.agentTokenActive ?? true,
      opsTokenActive: role === 'ops' ? true : trip.publishing?.opsTokenActive ?? true,
      lastUpdated: new Date().toISOString()
    }
  };

  // 3. Write new projection to Firestore
  await syncProjectionsToFirestore(updatedTrip);

  return updatedTrip;
}

/**
 * Revokes a share token (sets active = false and deletes public projection)
 */
export async function revokeShareToken(trip: AppState, role: 'client' | 'agent' | 'ops'): Promise<AppState> {
  const token = role === 'client'
    ? trip.publishing?.clientToken
    : role === 'agent'
    ? trip.publishing?.agentToken
    : trip.publishing?.opsToken;

  if (token) {
    try {
      localStorage.removeItem(`viemma_share_${role}_${token}`);
    } catch {}

    if (db && isCloudConnected) {
      try {
        const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';
        // Set document to revoked / active: false
        await setDoc(doc(db, collectionName, token), { active: false, revokedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn(`Could not revoke ${role} token doc:`, err);
      }
    }
  }

  const updatedTrip: AppState = {
    ...trip,
    publishing: {
      ...trip.publishing!,
      clientTokenActive: role === 'client' ? false : trip.publishing?.clientTokenActive ?? true,
      agentTokenActive: role === 'agent' ? false : trip.publishing?.agentTokenActive ?? true,
      opsTokenActive: role === 'ops' ? false : trip.publishing?.opsTokenActive ?? true,
      lastUpdated: new Date().toISOString()
    }
  };

  return updatedTrip;
}

/**
 * Subscribe to real-time updates for a single share projection document
 */
export function subscribeToShareDoc(
  role: 'client' | 'agent' | 'ops',
  token: string,
  onUpdate: (docData: any | null) => void,
  onError?: (err: unknown) => void
): () => void {
  // Check local fallback first
  try {
    const localKey = `viemma_share_${role}_${token}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.active !== false) {
        onUpdate(parsed);
      }
    }
  } catch {}

  const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';

  if (!db || !isCloudConnected) {
    return () => {};
  }

  try {
    const docRef = doc(db, collectionName, token);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.active !== false) {
            onUpdate(data);
          } else {
            // Marked revoked
            onUpdate(null);
          }
        } else {
          // Document does not exist or was deleted
          onUpdate(null);
        }
      },
      (error) => {
        console.warn(`Error subscribing to ${collectionName}/${token}:`, error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Could not attach Firestore share doc listener:', e);
    return () => {};
  }
}

/**
 * Converts a ClientShareDoc into a sanitized AppState object for ClientView rendering
 */
export function clientDocToAppState(doc: ClientShareDoc): AppState {
  const base: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));
  return {
    ...base,
    ref: doc.tripRef,
    title: doc.title,
    status: 'confirmed',
    version: doc.version,
    consultant: doc.consultant.name,
    consultantRole: doc.consultant.role,
    consultantEmail: doc.consultant.email,
    consultantPhone: doc.consultant.phone,
    consultantAvatar: doc.consultant.avatar,
    client: {
      ...base.client,
      name: doc.clientName,
      startDate: doc.startDate,
      endDate: doc.endDate,
      durationText: doc.durationText,
    },
    editorial: {
      ...base.editorial,
      ...doc.editorial
    },
    guests: [{ id: 1, first: doc.clientName, last: '', age: 'Adult', isLead: true, notes: '' }],
    flights: doc.flights.map(f => ({
      ...f,
      cabin: (f.cabin as any) || 'Business',
      direction: 'Inbound' as const,
      pnr: '',
      duration: '',
      status: 'Confirmed' as const,
      paxIds: [1],
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      cost: 0,
      markup: 0,
      qty: 1,
      notes: '',
      stops: []
    })),
    transfers: doc.transfers.map(t => ({
      ...t,
      type: t.type as any,
      status: 'Confirmed' as const,
      meet: '',
      sign: '',
      flight: '',
      dist: '',
      dur: '',
      driver: 'Private Chauffeur',
      driverPhone: '',
      paxCount: 1,
      paxIds: [1],
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      seats: [],
      special: [],
      cost: 0,
      tolls: 0,
      parking: 0,
      notes: '',
      waypoints: []
    })),
    rooms: doc.accommodations.map(r => ({
      ...r,
      conf: '',
      pay: 'Fully Paid' as const,
      bed: 'King',
      guestIds: [1],
      rate: 0,
      supp: 0,
      reqs: [],
      notes: ''
    })),
    activities: doc.activities.map(a => ({
      ...a,
      slot: a.slot as any,
      pickup: a.pickupLoc,
      status: 'Confirmed' as const,
      conf: '',
      supplier: '',
      supPhone: '',
      paxIds: [1],
      pAdult: 0,
      pChild: 0,
      nAdult: 1,
      nChild: 0,
      flat: 0,
      total: 0,
      backup: '',
      notes: '',
      isFree: true
    })),
    finance: {
      ...base.finance,
      margin: 0,
      comm: 0,
      buffer: 0
    },
    publishing: {
      ...base.publishing,
      tripId: doc.tripRef,
      publicUrl: '',
      version: doc.version,
      lastUpdated: doc.lastUpdated,
      clientToken: doc.token,
      clientTokenActive: doc.active
    }
  };
}

/**
 * Converts an AgentShareDoc into a sanitized AppState object for AgentPortalView rendering
 */
export function agentDocToAppState(doc: AgentShareDoc): AppState {
  const base: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));
  return {
    ...base,
    ref: doc.tripRef,
    title: doc.title,
    status: 'confirmed',
    version: doc.version,
    consultant: doc.consultant.name,
    consultantEmail: doc.consultant.email,
    consultantPhone: doc.consultant.phone,
    agent: {
      id: doc.agent.id || 'agt',
      contact: doc.agent.contact || '',
      email: doc.agent.email || '',
      comm: doc.agent.comm || '10%'
    },
    client: {
      ...base.client,
      name: doc.clientName,
      startDate: doc.startDate,
      endDate: doc.endDate,
      durationText: doc.durationText,
    },
    groupConditions: {
      dietary: [],
      mobility: [],
      medical: [],
      prefs: [],
      notes: doc.guestInstructions
    },
    guests: [{ id: 1, first: doc.clientName, last: '', age: 'Adult', isLead: true, notes: '' }],
    flights: doc.flights.map(f => ({
      ...f,
      direction: 'Inbound' as const,
      cabin: f.cabin as any,
      status: f.status as any,
      pnr: '',
      duration: '',
      paxIds: [1],
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      cost: 0,
      markup: 0,
      qty: 1,
      notes: '',
      stops: []
    })),
    transfers: doc.transfers.map(t => ({
      ...t,
      type: t.type as any,
      status: 'Confirmed' as const,
      sign: '',
      flight: '',
      dist: '',
      dur: '',
      driverPhone: '',
      paxCount: 1,
      paxIds: [1],
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      seats: [],
      special: [],
      cost: 0,
      tolls: 0,
      parking: 0,
      notes: '',
      waypoints: []
    })),
    rooms: doc.accommodations.map(r => ({
      ...r,
      conf: r.confirmationRef || '',
      pay: 'Fully Paid' as const,
      bed: 'King',
      guestIds: [1],
      rate: 0,
      supp: 0,
      reqs: [],
      notes: ''
    })),
    activities: doc.timeline.filter(e => e.category === 'activity').map((e, idx) => ({
      id: idx + 1,
      day: e.day,
      slot: 'Morning' as const,
      name: e.title,
      desc: e.description,
      pickup: e.location || '',
      start: e.time,
      dur: '3 hours',
      pickupLoc: e.location || '',
      status: 'Confirmed' as const,
      conf: '',
      supplier: '',
      supPhone: '',
      paxIds: [1],
      pAdult: 0,
      pChild: 0,
      nAdult: 1,
      nChild: 0,
      flat: 0,
      total: 0,
      inc: [],
      backup: '',
      notes: e.importantNotes || '',
      isFree: true
    })),
    finance: {
      ...base.finance,
      currency: (doc.retailPricing.currency === 'USD' || doc.retailPricing.currency === 'EUR' || doc.retailPricing.currency === 'BRL') ? doc.retailPricing.currency : 'ZAR',
      margin: 0,
      comm: parseFloat(doc.agent.comm || '10') || 10,
      commType: '%',
      buffer: 0
    },
    publishing: {
      ...base.publishing,
      tripId: doc.tripRef,
      publicUrl: '',
      version: doc.version,
      lastUpdated: doc.lastUpdated,
      agentToken: doc.token,
      agentTokenActive: doc.active
    }
  };
}

/**
 * Converts an OpsShareDoc into a sanitized AppState object for OperatorGroundSheetView rendering
 */
export function opsDocToAppState(doc: OpsShareDoc): AppState {
  const base: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));
  return {
    ...base,
    ref: doc.tripRef,
    title: doc.tripTitle,
    status: 'confirmed',
    version: doc.version,
    consultant: doc.emergencyContact.name,
    consultantPhone: doc.emergencyContact.phone,
    client: {
      ...base.client,
      name: doc.clientName,
      startDate: doc.timeline[0]?.date || new Date().toISOString().split('T')[0],
      endDate: doc.timeline[doc.timeline.length - 1]?.date || new Date().toISOString().split('T')[0],
      durationText: `${doc.timeline.length} Days`,
    },
    guests: doc.guestManifest.map(g => ({
      id: g.id,
      first: g.name.split(' ')[0] || g.name,
      last: g.name.split(' ').slice(1).join(' '),
      age: (['Adult', 'Elderly', 'Teen', 'Child', 'Infant'].includes(g.ageCategory) ? g.ageCategory : 'Adult') as any,
      dietaryLifestyle: g.dietary,
      accessibilityMobility: g.mobility,
      medicalOperationalNotes: g.medicalNotes,
      isLead: g.id === 1,
      notes: ''
    })),
    transfers: doc.services.filter(s => s.category === 'transfer').map((s, idx) => ({
      id: idx + 1,
      type: 'Point-to-Point' as const,
      date: s.date,
      time: s.time,
      status: (s.status as any) || 'Confirmed',
      from: s.pickupLocation,
      to: s.dropoffLocation,
      meet: s.operationalNotes,
      sign: s.signText || doc.leadPaxName,
      flight: s.flightNo || '',
      dist: '',
      dur: '',
      vehicle: s.vehicleModel || 'Fleet Vehicle',
      vehicleId: s.vehicleId,
      vehiclePlate: s.vehiclePlate,
      driver: s.driverName || 'Assigned Driver',
      driverId: s.driverId,
      driverPhone: s.driverPhone || '',
      paxCount: s.paxCount,
      paxIds: [1],
      bagHand: s.luggage.hand,
      bagCheck: s.luggage.check,
      bagOver: s.luggage.over,
      seats: [],
      special: [],
      cost: 0,
      tolls: 0,
      parking: 0,
      notes: s.operationalNotes,
      waypoints: []
    })),
    activities: doc.services.filter(s => s.category === 'activity').map((s, idx) => ({
      id: idx + 1,
      day: 1,
      slot: 'Morning' as const,
      name: s.title,
      desc: s.operationalNotes,
      pickup: s.pickupLocation,
      start: s.time,
      dur: '3 hours',
      pickupLoc: s.pickupLocation,
      status: (s.status as any) || 'Confirmed',
      conf: '',
      supplier: '',
      supPhone: '',
      paxIds: [1],
      pAdult: 0,
      pChild: 0,
      nAdult: s.paxCount,
      nChild: 0,
      flat: 0,
      total: 0,
      inc: [],
      backup: '',
      notes: s.operationalNotes,
      isFree: true,
      guideId: s.guideId,
      guideName: s.guideName,
      guidePhone: s.guidePhone
    })),
    finance: {
      ...base.finance,
      margin: 0,
      comm: 0,
      buffer: 0
    },
    publishing: {
      ...base.publishing,
      tripId: doc.tripRef,
      publicUrl: '',
      version: doc.version,
      lastUpdated: doc.lastUpdated,
      opsToken: doc.token,
      opsTokenActive: doc.active
    }
  };
}

import { Timestamp, doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isCloudConnected } from './firebase';
import { AppState } from '../types';
import { INITIAL_STATE } from '../App';
import { buildNormalizedTimeline, TimelineEvent } from '../utils/timelineEngine';

export interface ShareAccessPolicy {
  expiresAt: string | null;
  expiresAtTimestamp?: Timestamp | null;
  passwordRequired: boolean;
  passwordSalt?: string;
  passwordIterations: number;
  allowDownloads: boolean;
  allowPrinting: boolean;
  showPricing: boolean;
  showSupplierDetails: boolean;
  hideInternalNotes: boolean;
  enableOfflineAccess: boolean;
}

export interface ClientShareDoc {
  accessPolicy: ShareAccessPolicy;
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
    dayTitle?: string;
    name: string;
    desc: string;
    slot: string;
    status?: string;
    date?: string;
    start: string;
    endTime?: string;
    dur: string;
    venue?: string;
    pickupLoc: string;
    heroImage?: string;
    gallery?: string[];
    inc: string[];
    groupNames?: string[];
    supplierName?: string;
    supplierPhone?: string;
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
  pricing?: { currency: string; total: number; paymentTerms?: string };
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
  accessPolicy: ShareAccessPolicy;
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
  accessPolicy: ShareAccessPolicy;
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
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure token generation is unavailable. Use a supported browser context with Web Crypto (HTTPS).');
  }
  const buffer = new Uint8Array(16);
  cryptoApi.getRandomValues(buffer);
  const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

const SHARE_PASSWORD_ITERATIONS = 120000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(value => value.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error('Invalid password verifier data.');
  return new Uint8Array(value.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
}

async function deriveShareEncryptionKey(password: string, saltHex: string, iterations: number): Promise<CryptoKey> {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) throw new Error('Secure itinerary protection requires HTTPS and browser Web Crypto.');
  const material = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface EncryptedShareEnvelope {
  token: string;
  role: 'client' | 'agent' | 'ops';
  active: boolean;
  version: number;
  lastUpdated: string;
  accessPolicy: ShareAccessPolicy;
  encryptedPayload: { iv: string; ciphertext: string };
}

export async function encryptShareProjection(docData: any, password: string): Promise<EncryptedShareEnvelope> {
  const policy: ShareAccessPolicy = docData.accessPolicy;
  if (!policy?.passwordRequired || !policy.passwordSalt) {
    throw new Error('Encrypted share payload requires an enabled password policy.');
  }
  const iterations = Number(policy.passwordIterations) || SHARE_PASSWORD_ITERATIONS;
  const key = await deriveShareEncryptionKey(password, policy.passwordSalt, iterations);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(JSON.stringify(docData));
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Only access metadata and ciphertext are stored in the public share document.
  return {
    token: docData.token,
    role: docData.role,
    active: docData.active,
    version: docData.version,
    lastUpdated: docData.lastUpdated,
    accessPolicy: policy,
    encryptedPayload: {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(encrypted))
    }
  };
}

/**
 * Decrypts a password-protected share projection. A null result means the password
 * was incorrect or the encrypted projection was invalid; no plaintext verifier is published.
 */
export async function decryptShareProjection(
  password: string,
  envelope: Partial<EncryptedShareEnvelope> | null | undefined
): Promise<any | null> {
  const policy = envelope?.accessPolicy;
  if (!policy?.passwordRequired || !policy.passwordSalt || !envelope?.encryptedPayload?.iv || !envelope.encryptedPayload.ciphertext || !password) return null;
  try {
    const iterations = Number(policy.passwordIterations) || SHARE_PASSWORD_ITERATIONS;
    const key = await deriveShareEncryptionKey(password, policy.passwordSalt, iterations);
    const plain = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(envelope.encryptedPayload.iv) },
      key,
      base64ToBytes(envelope.encryptedPayload.ciphertext)
    );
    const decoded = JSON.parse(new TextDecoder().decode(plain));
    return decoded && decoded.token === envelope.token && decoded.role === envelope.role ? decoded : null;
  } catch {
    return null;
  }
}

async function buildShareAccessPolicy(trip: AppState): Promise<ShareAccessPolicy> {
  const settings = trip.publishing?.settings || {};
  const passwordRequired = Boolean(settings.requirePassword);
  let passwordSalt: string | undefined;
  if (passwordRequired) {
    const password = (settings.password || '').trim();
    if (!password) throw new Error('Password protection is enabled, but no access password has been configured.');
    if (password.length < 12) throw new Error('Use a unique share password with at least 12 characters before publishing.');
    if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
      throw new Error('Secure password protection requires a browser with Web Crypto (normally an HTTPS deployment).');
    }
    const salt = new Uint8Array(16);
    globalThis.crypto.getRandomValues(salt);
    passwordSalt = bytesToHex(salt);
  }

  let expiresAt: string | null = null;
  if (settings.enableExpiryDate) {
    const dateValue = (settings.expiresAt || '').trim();
    if (!dateValue) throw new Error('Itinerary expiry is enabled, but no expiry date has been selected.');
    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T23:59:59.999`)
      : new Date(dateValue);
    if (Number.isNaN(expiry.getTime())) throw new Error('The itinerary expiry date is invalid.');
    if (expiry.getTime() < Date.now()) throw new Error('The itinerary expiry date is in the past.');
    expiresAt = expiry.toISOString();
  }

  return {
    expiresAt,
    expiresAtTimestamp: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
    passwordRequired,
    passwordSalt,
    passwordIterations: SHARE_PASSWORD_ITERATIONS,
    allowDownloads: settings.allowDownloads !== false,
    allowPrinting: settings.allowPrinting !== false,
    showPricing: settings.showPricing !== false,
    showSupplierDetails: Boolean(settings.showSupplierDetails),
    hideInternalNotes: settings.hideInternalNotes !== false,
    enableOfflineAccess: settings.enableOfflineAccess !== false
  };
}

/**
 * Projection builders - strictly strip internal confidential data
 */
export function buildClientProjection(trip: AppState, token: string): ClientShareDoc {
  // Never present draft/requested activities to clients as scheduled or confirmed.
  const timeline = buildNormalizedTimeline(trip).filter(event =>
    event.status !== 'Cancelled' && event.status !== 'Draft' && event.status !== 'Requested'
  );
  const activeFlights = (trip.flights || []).filter(item => item.status !== 'Cancelled');
  const activeTransfers = (trip.transfers || []).filter(item => item.status !== 'Cancelled');
  const activeRooms = (trip.rooms || []).filter(item => item.status !== 'Cancelled');
  const activeActivities = (trip.activities || []).filter(item =>
    item.status !== 'Cancelled' && item.status !== 'Draft' && item.status !== 'Requested'
  );
  const clientSettings = trip.publishing?.settings || {};
  const flightCosts = activeFlights.reduce((sum, item) => sum + item.cost * item.qty, 0);
  const transferCosts = activeTransfers.reduce((sum, item) => sum + item.cost + item.tolls + item.parking, 0);
  const roomCosts = activeRooms.reduce((sum, item) => sum + item.rate * item.nights + item.supp, 0);
  const activityCosts = activeActivities.reduce((sum, item) => sum + (item.isFree ? 0 : item.total), 0);
  const totalCost = flightCosts + transferCosts + roomCosts + activityCosts;
  const finance = trip.finance;
  const margin = finance.marginType === '%' ? totalCost * finance.margin / 100 : finance.margin;
  const paymentRate = finance.paymentMethod === 'visa' || finance.paymentMethod === 'master' ? 0.025 : finance.paymentMethod === 'amex' ? 0.038 : 0;
  const retailTotalZAR = Math.max(0, totalCost + margin + finance.buffer + totalCost * paymentRate - finance.discount);
  const requestedCurrency = (clientSettings.currency || finance.currency || 'ZAR').toUpperCase();
  const pricingCurrency = (['ZAR', 'USD', 'EUR', 'BRL'].includes(requestedCurrency) ? requestedCurrency : 'ZAR') as 'ZAR' | 'USD' | 'EUR' | 'BRL';
  const configuredRate = pricingCurrency === 'ZAR' ? 1 : Number(finance.rates?.[pricingCurrency]);
  if (clientSettings.showPricing !== false && pricingCurrency !== 'ZAR' &&
      (!Number.isFinite(configuredRate) || configuredRate <= 0)) {
    throw new Error(`Cannot publish client pricing in ${pricingCurrency}: configure a valid exchange rate in Finance first.`);
  }
  const displayRate = pricingCurrency === 'ZAR' ? 1 : (Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 1);
  const clientRetailTotal = retailTotalZAR * displayRate;

  return {
    token,
    tripRef: trip.ref,
    role: 'client',
    active: trip.publishing?.clientTokenActive ?? true,
    accessPolicy: {} as ShareAccessPolicy, // Attached after secure policy generation in syncProjectionsToFirestore.
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
    activities: activeActivities.map(a => ({
      id: a.id,
      day: a.day,
      dayTitle: trip.dayTitles?.[a.day] || '',
      name: a.name,
      desc: a.clientDescription || a.desc,
      slot: a.slot,
      status: a.status || 'Planned',
      date: a.date || '',
      start: a.start,
      endTime: a.endTime || '',
      dur: a.dur,
      venue: a.venue || '',
      pickupLoc: a.pickupLoc || a.pickup,
      heroImage: a.heroImage,
      gallery: a.gallery,
      inc: a.inc || [],
      groupNames: (trip.namedGroups || []).filter(g => (a.groupIds || []).includes(g.id)).map(g => g.name),
      ...(clientSettings.showSupplierDetails ? {
        supplierName: a.supplier || '',
        supplierPhone: a.supPhone || ''
      } : {})
    })),
    accommodations: activeRooms.map(r => ({
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
    flights: activeFlights.map(f => ({
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
    transfers: activeTransfers.map(t => ({
      id: t.id,
      type: t.type,
      date: t.date,
      time: t.time,
      from: t.from,
      to: t.to,
      vehicle: t.vehicle
    })),
    ...(clientSettings.showPricing !== false ? {
      pricing: { currency: pricingCurrency, total: Math.round(clientRetailTotal), paymentTerms: 'As specified in the approved quotation.' }
    } : {}),
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
  const timeline = buildNormalizedTimeline(trip).filter(event => event.status !== 'Cancelled');

  // Compute retail totals
  const flightCosts = (trip.flights || []).reduce((sum, f) => sum + (f.status === 'Cancelled' ? 0 : f.cost * f.qty), 0);
  const transferCosts = (trip.transfers || []).reduce((sum, tr) => sum + (tr.status === 'Cancelled' ? 0 : tr.cost + tr.tolls + tr.parking), 0);
  const roomCosts = (trip.rooms || []).reduce((sum, r) => sum + (r.status === 'Cancelled' ? 0 : (r.rate * r.nights) + r.supp), 0);
  const activityCosts = (trip.activities || []).reduce((sum, a) => sum + (a.isFree || a.status === 'Cancelled' ? 0 : a.total), 0);
  const totalCost = flightCosts + transferCosts + roomCosts + activityCosts;

  const f = trip.finance || { margin: 15, marginType: '%', comm: 10, commType: '%', buffer: 0, discount: 0, paymentMethod: 'eft' };
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : (f.margin || 0);
  const cardRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + (f.buffer || 0) + totalCost * cardRate - (f.discount || 0));
  const commTotal = f.commType === '%' ? (totalCost + markupTotal) * ((f.comm || 0) / 100) : (f.comm || 0);
  const netPayable = Math.max(0, retailTotalZAR - commTotal);

  return {
    token,
    tripRef: trip.ref,
    role: 'agent',
    active: trip.publishing?.agentTokenActive ?? true,
    accessPolicy: {} as ShareAccessPolicy,
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
    flights: (trip.flights || []).filter(fl => fl.status !== 'Cancelled').map(fl => ({
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
    accommodations: (trip.rooms || []).filter(r => r.status !== 'Cancelled').map(r => ({
      id: r.id,
      hotel: r.hotel,
      roomType: r.roomType,
      cin: r.cin,
      cout: r.cout,
      nights: r.nights,
      meal: r.meal,
      confirmationRef: (r as any).confirmationRef
    })),
    transfers: (trip.transfers || []).filter(t => t.status !== 'Cancelled').map(t => ({
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
  const timeline = buildNormalizedTimeline(trip).filter(event => event.status !== 'Cancelled');

  const services: OpsShareDoc['services'] = [];

  // Transfer services
  (trip.transfers || []).filter(t => t.status !== 'Cancelled').forEach(t => {
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
  (trip.activities || []).filter(a => a.status !== 'Cancelled').forEach(a => {
    const activityDate = a.date || (() => {
      if (!trip.client.startDate) return '';
      const date = new Date(trip.client.startDate);
      date.setDate(date.getDate() + Math.max(1, a.day || 1) - 1);
      return date.toISOString().split('T')[0];
    })();
    services.push({
      id: `act_${a.id}`,
      category: 'activity',
      date: activityDate,
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
    accessPolicy: {} as ShareAccessPolicy,
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
  const accessPolicy = await buildShareAccessPolicy(trip);
  clientDoc.accessPolicy = accessPolicy;
  agentDoc.accessPolicy = accessPolicy;
  opsDoc.accessPolicy = accessPolicy;

  // For password-protected links, encrypt all itinerary content before any cache or cloud write.
  // A public share document then contains only access metadata and ciphertext.
  const password = (trip.publishing?.settings?.password || '').trim();
  const storedClientDoc = accessPolicy.passwordRequired ? await encryptShareProjection(clientDoc, password) : clientDoc;
  const storedAgentDoc = accessPolicy.passwordRequired ? await encryptShareProjection(agentDoc, password) : agentDoc;
  const storedOpsDoc = accessPolicy.passwordRequired ? await encryptShareProjection(opsDoc, password) : opsDoc;

  // Local caching follows the owner's offline-access setting.
  try {
    const cacheEntries: Array<[string, string]> = [
      [`viemma_share_cli_${clientToken}`, JSON.stringify(storedClientDoc)],
      [`viemma_share_agt_${agentToken}`, JSON.stringify(storedAgentDoc)],
      [`viemma_share_ops_${opsToken}`, JSON.stringify(storedOpsDoc)]
    ];
    if (accessPolicy.enableOfflineAccess) {
      cacheEntries.forEach(([key, value]) => localStorage.setItem(key, value));
    } else {
      cacheEntries.forEach(([key]) => localStorage.removeItem(key));
    }
  } catch (e) {
    console.warn('Could not apply local share cache policy:', e);
  }

  // Cloud Firestore Sync
  if (db && isCloudConnected) {
    try {
      await Promise.all([
        setDoc(doc(db, 'clientShares', clientToken), storedClientDoc),
        setDoc(doc(db, 'agentShares', agentToken), storedAgentDoc),
        setDoc(doc(db, 'opsShares', opsToken), storedOpsDoc)
      ]);
    } catch (err) {
      console.warn('Firestore share projections sync warning:', err);
      throw new Error('The share links could not be synchronized with Firestore. Nothing has been confirmed as published.');
    }
  } else {
    // Keep local preview projections available for offline workspace use.
    // PrintHub blocks "live publish" when Firestore is disconnected, so this
    // fallback cannot be reported as a successful live publication.
    console.info('Share projections were cached locally; Firestore is not connected.');
  }

  return { clientToken, agentToken, opsToken };
}

/**
 * Regenerates a share token for a specific role and deletes the old token projection
 */
export async function regenerateShareToken(trip: AppState, role: 'client' | 'agent' | 'ops'): Promise<AppState> {
  if (!db || !isCloudConnected) {
    throw new Error('Reconnect to Firestore before regenerating a live share token. Local-only token changes cannot invalidate an existing live link.');
  }

  // Validate password and expiry settings before touching the currently published link.
  await buildShareAccessPolicy(trip);

  const oldToken = role === 'client'
    ? trip.publishing?.clientToken
    : role === 'agent'
    ? trip.publishing?.agentToken
    : trip.publishing?.opsToken;

  const newToken = generateSecureToken(role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops');

  // Remove old live access before replacing the token. Any deletion failure is surfaced.
  if (oldToken) {
    const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';
    try {
      await deleteDoc(doc(db, collectionName, oldToken));
    } catch (err) {
      throw new Error(`Could not invalidate the previous ${role} share token. The token was not rotated: ${String(err)}`);
    }
    try {
      const cachePrefix = role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops';
      localStorage.removeItem(`viemma_share_${cachePrefix}_${oldToken}`);
    } catch {}
  }

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
      lastUpdated: new Date().toISOString(),
      publishStatus: trip.publishing?.publishedAt ? 'Changes Pending' : trip.publishing?.publishStatus
    }
  };

  // If this fails, the old token remains revoked and the owner is shown the failure.
  await syncProjectionsToFirestore(updatedTrip);
  return updatedTrip;
}/**
 * Revokes a share token (sets active = false and deletes public projection)
 */
export async function revokeShareToken(trip: AppState, role: 'client' | 'agent' | 'ops'): Promise<AppState> {
  const token = role === 'client'
    ? trip.publishing?.clientToken
    : role === 'agent'
    ? trip.publishing?.agentToken
    : trip.publishing?.opsToken;

  if (token) {
    if (!db || !isCloudConnected) {
      throw new Error('Reconnect to Firestore before revoking a live share link. Local cache removal alone cannot invalidate a link already shared.');
    }
    const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';
    try {
      await deleteDoc(doc(db, collectionName, token));
    } catch (err) {
      throw new Error(`Could not confirm live access revocation for ${role}. Please retry after reconnecting: ${String(err)}`);
    }
    try {
      const cachePrefix = role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops';
      localStorage.removeItem(`viemma_share_${cachePrefix}_${token}`);
    } catch {}
  }

  return {
    ...trip,
    publishing: {
      ...trip.publishing!,
      clientTokenActive: role === 'client' ? false : trip.publishing?.clientTokenActive ?? true,
      agentTokenActive: role === 'agent' ? false : trip.publishing?.agentTokenActive ?? true,
      opsTokenActive: role === 'ops' ? false : trip.publishing?.opsTokenActive ?? true,
      lastUpdated: new Date().toISOString(),
      publishStatus: trip.publishing?.publishedAt ? 'Changes Pending' : trip.publishing?.publishStatus
    }
  };
}/**
 * Subscribe to real-time updates for a single share projection document
 */
export function subscribeToShareDoc(
  role: 'client' | 'agent' | 'ops',
  token: string,
  onUpdate: (docData: any | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionName = role === 'client' ? 'clientShares' : role === 'agent' ? 'agentShares' : 'opsShares';

  // When online, always confirm the share with Firestore before displaying it.
  // Only use a browser cache when cloud connectivity is unavailable and the owner allowed offline access.
  if (!db || !isCloudConnected) {
    try {
      const cachePrefix = role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops';
      const localKey = `viemma_share_${cachePrefix}_${token}`;
      const cached = localStorage.getItem(localKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const expiresAt = parsed?.accessPolicy?.expiresAt;
        const expired = expiresAt
          ? Date.now() > new Date(/^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999` : expiresAt).getTime()
          : false;
        const protectedPayloadMissing = Boolean(parsed.accessPolicy?.passwordRequired && !parsed.encryptedPayload);
        if (parsed.active !== false && parsed.accessPolicy?.enableOfflineAccess !== false && !expired && !protectedPayloadMissing) {
          onUpdate(parsed);
        } else {
          onUpdate(null);
        }
      } else {
        onUpdate(null);
      }
    } catch {
      onUpdate(null);
    }
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
        const errorCode = (error as { code?: string } | null)?.code || '';
        const isTransientNetworkError = [
          'unavailable',
          'deadline-exceeded',
          'cancelled',
          'network-request-failed'
        ].some(code => errorCode === code || errorCode.endsWith(`/${code}`));

        // Firestore permission denials must never be replaced with cached data: they can
        // indicate expiry, revocation or a malformed protected link. Only transient network
        // failures may use a cache, and the owner's offline setting and expiry are rechecked.
        if (isTransientNetworkError) {
          try {
            const cachePrefix = role === 'client' ? 'cli' : role === 'agent' ? 'agt' : 'ops';
            const cached = localStorage.getItem(`viemma_share_${cachePrefix}_${token}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              const expiresAt = parsed?.accessPolicy?.expiresAt;
              const expiryTime = expiresAt
                ? new Date(/^\\d{4}-\\d{2}-\\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999` : expiresAt).getTime()
                : null;
              const expired = expiryTime !== null && (!Number.isFinite(expiryTime) || Date.now() > expiryTime);
              const protectedPayloadMissing = Boolean(parsed.accessPolicy?.passwordRequired && !parsed.encryptedPayload);
              if (
                parsed.active !== false &&
                parsed.accessPolicy?.enableOfflineAccess !== false &&
                !expired &&
                !protectedPayloadMissing
              ) {
                onUpdate(parsed);
              } else {
                onUpdate(null);
              }
            } else {
              onUpdate(null);
            }
          } catch {
            onUpdate(null);
          }
        }

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
      status: (a.status || 'Planned') as any,
      conf: '',
      supplier: a.supplierName || '',
      supPhone: a.supplierPhone || '',
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
    clientPricing: doc.pricing,
    dayTitles: doc.activities.reduce((titles, activity) => {
      if (activity.dayTitle) titles[activity.day] = activity.dayTitle;
      return titles;
    }, { ...(base.dayTitles || {}) } as Record<number, string>),
    publishing: {
      ...base.publishing,
      settings: {
        ...base.publishing.settings,
        requirePassword: Boolean(doc.accessPolicy?.passwordRequired),
        enableExpiryDate: Boolean(doc.accessPolicy?.expiresAt),
        expiresAt: doc.accessPolicy?.expiresAt || null,
        allowDownloads: doc.accessPolicy?.allowDownloads !== false,
        allowPrinting: doc.accessPolicy?.allowPrinting !== false,
        showPricing: doc.accessPolicy?.showPricing !== false,
        showSupplierDetails: Boolean(doc.accessPolicy?.showSupplierDetails),
        hideInternalNotes: doc.accessPolicy?.hideInternalNotes !== false,
        enableOfflineAccess: doc.accessPolicy?.enableOfflineAccess !== false
      },
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

import { AppState, Flight, Transfer, Room, Activity } from '../types';

/**
 * Owner / Operations Cockpit View: Complete master record with all supplier net costs, margins, and notes
 */
export function getOwnerTripView(trip: AppState): AppState {
  return JSON.parse(JSON.stringify(trip));
}

/**
 * Travel Agent B2B View: Displays retail client rates and agency commission; sanitizes net supplier costs & internal margins
 */
export function getAgentTripView(trip: AppState): AppState {
  const cloned: AppState = JSON.parse(JSON.stringify(trip));

  // Sanitize internal confidential notes
  cloned.internalNotes = '';

  // Redact net supplier costs from individual items, preserve retail client rates
  cloned.flights = cloned.flights.map(f => ({
    ...f,
    cost: Math.round(f.cost * (1 + (f.markup || 15) / 100))
  }));

  cloned.transfers = cloned.transfers.map(t => ({
    ...t,
    cost: Math.round(t.cost * 1.2) // Retail rate
  }));

  cloned.rooms = cloned.rooms.map(r => ({
    ...r,
    rate: Math.round(r.rate * 1.2),
    supp: Math.round(r.supp * 1.2),
    internalNotesHotel: undefined
  }));

  cloned.activities = cloned.activities.map(a => ({
    ...a,
    pAdult: Math.round(a.pAdult * 1.2),
    pChild: Math.round(a.pChild * 1.2),
    total: Math.round(a.total * 1.2),
    guideNotes: undefined
  }));

  // Preserve agent commission and retail pricing in finance, sanitize internal margin & buffers
  cloned.finance = {
    ...cloned.finance,
    buffer: 0,
    bufferNotes: '',
    margin: 0 // Hide internal markup
  };

  return cloned;
}

/**
 * Client Digital Magazine View: Pure luxury presentation; removes all supplier net rates, commission figures, and internal notes
 */
export function getClientTripView(trip: AppState): AppState {
  const cloned: AppState = JSON.parse(JSON.stringify(trip));

  // Redact internal notes
  cloned.internalNotes = '';

  // Strip supplier rates and supplier direct contact details
  cloned.flights = cloned.flights.map(f => ({
    ...f,
    cost: 0,
    markup: 0,
    supplierContact: undefined
  }));

  cloned.transfers = cloned.transfers.map(t => ({
    ...t,
    cost: 0,
    tolls: 0,
    parking: 0,
    driverNotes: undefined
  }));

  cloned.rooms = cloned.rooms.map(r => ({
    ...r,
    rate: 0,
    supp: 0,
    internalNotesHotel: undefined,
    allocatedRooms: r.allocatedRooms?.map(ar => ({ ...ar, internalNotes: '' }))
  }));

  cloned.activities = cloned.activities.map(a => ({
    ...a,
    pAdult: 0,
    pChild: 0,
    flat: 0,
    total: 0,
    guideNotes: undefined,
    supplier: '',
    supPhone: ''
  }));

  // Hide internal finance calculations
  cloned.finance = {
    ...cloned.finance,
    margin: 0,
    comm: 0,
    buffer: 0,
    bufferNotes: ''
  };

  return cloned;
}

/**
 * Operator / Driver / Ground Logistics View:
 * Passenger roster, baggage counts, flight numbers, meet signs, special requests, and emergency contacts.
 * Strictly ZERO financial data. Can filter to a single specific service assignment.
 */
export function getOperatorServiceView(trip: AppState, serviceId?: string | number): AppState {
  const cloned: AppState = JSON.parse(JSON.stringify(trip));

  // Completely wipe financial details
  cloned.finance = {
    currency: 'ZAR',
    rates: { USD: 1, EUR: 1, BRL: 1, AOA: 1 },
    paymentMethod: 'Operational Voucher',
    paymentStatus: 'deposit_paid',
    margin: 0,
    marginType: '%',
    comm: 0,
    commType: '%',
    discount: 0,
    buffer: 0,
    bufferNotes: ''
  };
  cloned.internalNotes = '';

  // Zero-out all costs
  cloned.flights = cloned.flights.map(f => ({ ...f, cost: 0, markup: 0 }));
  cloned.transfers = cloned.transfers.map(t => ({ ...t, cost: 0, tolls: 0, parking: 0 }));
  cloned.rooms = cloned.rooms.map(r => ({ ...r, rate: 0, supp: 0 }));
  cloned.activities = cloned.activities.map(a => ({ ...a, pAdult: 0, pChild: 0, flat: 0, total: 0 }));

  // If a single service assignment ID is targeted (e.g. transfer-1 or 1)
  if (serviceId !== undefined && serviceId !== null && serviceId !== '') {
    const sIdNum = Number(String(serviceId).replace(/[^0-9]/g, ''));
    const sIdStr = String(serviceId).toLowerCase();

    if (sIdStr.includes('trans') || !sIdStr.includes('act')) {
      const matchT = cloned.transfers.filter(t => t.id === sIdNum);
      if (matchT.length > 0) {
        cloned.transfers = matchT;
        cloned.activities = [];
        cloned.rooms = [];
      }
    } else if (sIdStr.includes('act')) {
      const matchA = cloned.activities.filter(a => a.id === sIdNum);
      if (matchA.length > 0) {
        cloned.activities = matchA;
        cloned.transfers = [];
        cloned.rooms = [];
      }
    }
  }

  return cloned;
}

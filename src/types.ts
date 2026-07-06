// Viemma Tours - Workspace OS Types

export interface Client {
  name: string;
  email: string;
  phone: string;
  country: string;
  contactMethod: 'whatsapp' | 'email' | 'call';
  tripType: 'multi' | 'day' | 'transfer';
  startDate: string;
  endDate: string;
  durationText: string;
  occasion: string;
  otherOccasion: string;
  tags: string[];
}

export interface GroupConditions {
  dietary: string[];
  mobility: string[];
  medical: string[];
  prefs: string[];
  notes: string;
}

export interface Guest {
  id: number;
  first: string;
  last: string;
  age: 'Adult' | 'Elderly' | 'Teen' | 'Child' | 'Infant';
  country: string;
  diet: string[];
  mob: string[];
  med: string[];
  pref: string[];
  notes: string;
  isLead: boolean;
}

export interface Stop {
  id: number;
  airport: string;
  arrTime: string;
  depTime: string;
  duration: string;
  changeFlightNo: string;
}

export interface Flight {
  id: number;
  direction: 'Inbound' | 'Outbound' | 'Internal';
  airline: string;
  flightNo: string;
  pnr: string;
  from: string;
  to: string;
  date: string;
  depTime: string;
  arrTime: string;
  duration: string;
  cabin: 'Economy' | 'Premium Economy' | 'Business' | 'First';
  status: 'Quoted' | 'Booked' | 'Ticketed' | 'Cancelled';
  paxIds: number[];
  bagHand: number;
  bagCheck: number;
  bagOver: number;
  cost: number;
  markup: number;
  qty: number;
  notes: string;
  stops: Stop[];
}

export interface Waypoint {
  id: number;
  location: string;
  waitTime: string;
}

export interface Transfer {
  id: number;
  type: 'Airport Arrival' | 'Airport Departure' | 'Inter-Hotel' | 'Activity Transfer' | 'Full-Day Vehicle' | 'Point-to-Point';
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  from: string;
  to: string;
  meet: string;
  sign: string;
  flight: string;
  dist: string;
  dur: string;
  vehicle: string;
  driver: string;
  driverPhone: string;
  paxCount: number;
  paxIds: number[];
  bagHand: number;
  bagCheck: number;
  bagOver: number;
  seats: string[];
  special: string[];
  cost: number;
  tolls: number;
  parking: number;
  notes: string;
  waypoints: Waypoint[];
}

export interface Room {
  id: number;
  hotel: string;
  conf: string;
  pay: 'Unpaid' | 'Deposit Paid' | 'Fully Paid';
  roomType: string;
  bed: string;
  meal: string;
  cin: string;
  cout: string;
  nights: number;
  guestIds: number[];
  rate: number;
  supp: number;
  reqs: string[];
  notes: string;
}

export interface Activity {
  id: number;
  day: number;
  slot: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day';
  name: string;
  desc: string;
  pickup: string;
  start: string;
  dur: string;
  pickupLoc: string;
  status: 'Planned' | 'Requested' | 'Confirmed' | 'Cancelled';
  conf: string;
  supplier: string;
  supPhone: string;
  paxIds: number[];
  pAdult: number;
  pChild: number;
  nAdult: number;
  nChild: number;
  flat: number;
  total: number;
  inc: string[];
  backup: string;
  notes: string;
  isFree: boolean;
}

export interface AppState {
  ref: string;
  consultant: string;
  priority: 'hot' | 'confirmed' | 'exploratory' | 'pending';
  source: 'direct' | 'agent' | 'referral' | 'website' | 'social';
  agent: {
    id: string;
    contact: string;
    email: string;
    comm: string;
  };
  client: Client;
  groupConditions: GroupConditions;
  guests: Guest[];
  flights: Flight[];
  transfers: Transfer[];
  rooms: Room[];
  activities: Activity[];
  finance: {
    currency: 'ZAR' | 'USD' | 'EUR' | 'BRL';
    rates: {
      USD: number;
      EUR: number;
      BRL: number;
      AOA: number;
    };
    paymentMethod: string;
    margin: number;
    marginType: '%' | 'Fixed';
    comm: number;
    commType: '%' | 'Fixed';
    discount: number;
    buffer: number;
    bufferNotes: string;
  };
  internalNotes: string;
}

// Viemma Tours - Enterprise Multi-Trip Operations OS Types

export type ServiceStatus = 
  | 'draft' 
  | 'quoted' 
  | 'requested' 
  | 'held' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled';

export type TripStatus = 
  | 'draft' 
  | 'quoted' 
  | 'confirmed' 
  | 'in_travel' 
  | 'completed' 
  | 'archived';

export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'consultant' 
  | 'agent' 
  | 'client' 
  | 'operator' 
  | 'driver' 
  | 'guide';

export type DataVisibility = 
  | 'PUBLIC' 
  | 'CLIENT' 
  | 'AGENT' 
  | 'OPERATIONAL' 
  | 'INTERNAL' 
  | 'SENSITIVE_INTERNAL';

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
  defaultEmergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Guest {
  id: number;
  first: string;
  last: string;
  preferredName?: string;
  nationality?: string;
  country?: string;
  age: 'Adult' | 'Elderly' | 'Teen' | 'Child' | 'Infant';
  exactAge?: number;
  languagesSpoken?: string[];
  isLead: boolean;
  notes: string;

  // Smart Group Inheritance Overrides
  inheritCountry?: boolean;
  inheritNationality?: boolean;
  inheritEmergencyContact?: boolean;
  inheritDietary?: boolean;
  inheritMedical?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Accessibility & Mobility
  accessibilityMobility?: string[];
  accessibilityVision?: string[];
  accessibilityHearing?: string[];
  medicalOperationalNotes?: string;

  // Dietary Requirements
  dietaryReligious?: string[];
  dietaryLifestyle?: string[];
  dietaryMedical?: string[];
  dietaryPreferences?: string[];

  // Comfort & Experience Preferences
  preferencesAccommodation?: string[];
  preferencesTransport?: string[];
  preferencesInterests?: string[];

  // Backwards compatibility legacy fields
  diet?: string[];
  mob?: string[];
  med?: string[];
  pref?: string[];
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
  status: 'Quoted' | 'Booked' | 'Ticketed' | 'Cancelled' | 'Confirmed' | 'Pending';
  serviceStatus?: ServiceStatus;
  paxIds: number[];
  bagHand: number;
  bagCheck: number;
  bagOver: number;
  cost: number;
  markup: number;
  qty: number;
  notes: string;
  supplierContact?: string;
  confirmationRef?: string;
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
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Assigned' | 'EN ROUTE' | 'ARRIVED' | 'PASSENGERS COLLECTED' | 'STARTED';
  serviceStatus?: ServiceStatus;
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

  // Linked flight for change tracking
  linkedFlightId?: number;

  // Improved Vehicle Details
  vehicleCategory?: string;
  vehiclePassengerCapacity?: number;
  vehicleLuggageCapacity?: number;
  vehicleTrailerAvailability?: boolean;
  vehicleAirConditioning?: boolean;
  vehicleWifi?: boolean;
  vehicleUsbCharging?: boolean;
  vehicleChildSeats?: boolean;
  vehicleWheelchairLift?: boolean;
  // Structured Staff & Vehicle Identifiers
  driverId?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  driverNotes?: string; // Role-specific notes
}

export interface AllocatedRoom {
  id: number;
  roomName: string;
  roomType: string;
  occupancy: string;
  maxOccupancy: number;
  adults: number;
  children: number;
  price: number;
  currency: string;
  mealBasis: string;
  isAccessible: boolean;
  isInterleading: boolean;
  hasPrivatePool: boolean;
  hasBalcony: boolean;
  view: string;
  smokingPolicy: 'Smoking' | 'Non-smoking';
  specialBenefits: string;
  internalNotes: string;
  guestIds: number[]; // Assigned travelers
}

export interface Room {
  id: number;
  hotel: string;
  conf: string;
  pay: 'Unpaid' | 'Deposit Paid' | 'Fully Paid';
  status?: 'Requested' | 'Held' | 'Confirmed' | 'Cancelled';
  serviceStatus?: ServiceStatus;
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

  // Smart Room Allocation
  allocatedRooms?: AllocatedRoom[];

  // Improved Hotel Info
  propertyImages?: string[];
  gpsLocation?: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
  restaurants?: string[];
  spa?: boolean;
  gym?: boolean;
  pool?: boolean;
  wifi?: boolean;
  accessibilityFeatures?: string[];
  childFriendly?: boolean;
  sustainabilityRating?: string;
  emergencyContact?: string;
  nightManager?: string;
  cancellationPolicy?: string;
  internalNotesHotel?: string;
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
  serviceStatus?: ServiceStatus;
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

  // Improved Activities Fields
  heroImage?: string;
  gallery?: string[];
  difficulty?: string;
  suitableAges?: string;
  accessibility?: string[];
  weatherDependency?: string;
  dropoffLoc?: string;
  excluded?: string[];
  packingAdvice?: string;
  dressCode?: string;
  safetyNotes?: string;
  photographyOpportunities?: string;
  seasonalAvailability?: string;
  faqs?: { question: string; answer: string }[];
  guideNotes?: string; // Role-specific notes
  guideId?: string;
  guideName?: string;
  guidePhone?: string;
}

export interface ExperienceLibraryItem {
  id: string;
  name: string;
  category: string;
  destination: string;
  duration: string;
  difficulty: 'Easy' | 'Moderate' | 'Strenuous' | 'N/A';
  location: string;
  images: string[];
  featuredImage: string;
  highlights: string[];
  luxuryDescription: string;
  shortDescription: string;
  seoDescription: string;
  familyDescription: string;
  adventureDescription: string;
  faqs: { question: string; answer: string }[];
  priceAdult: number;
  priceChild: number;
  supplier: string;
}

export interface DestinationLibraryItem {
  id: string;
  name: string;
  region: string;
  country: string;
  images: string[];
  featuredImage: string;
  overview: string;
  culture: string;
  climate: string;
  currency: string;
  emergencyContacts: string;
  localTips: string[];
  packingAdvice: string[];
}

export interface GroupManagement {
  groupType: 'Couples' | 'Families' | 'Friends' | 'Corporate' | 'Incentive' | 'Wedding' | 'VIP' | 'School' | 'Photography' | 'Other';
  sharingPreferences: string;
  requiresPrivateRoomIds: number[];
  staffIds: number[];
  notes: string;
}

export interface TripChangeLogEntry {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  category: 'Flight' | 'Hotel' | 'Transfer' | 'Activity' | 'Guest' | 'Finance' | 'Publishing';
  action: string;
  description: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'Luxury SUV' | 'Minibus / Quantum' | 'Mercedes V-Class' | 'Sedan' | 'Coach' | '4x4 Safari' | 'Other';
  registration: string;
  capacity: number;
  luggageCapacity: number;
  assignedDriverId?: string;
  status: 'Available' | 'Assigned' | 'In Service' | 'Maintenance' | 'Inactive';
  notes: string;
  imageUrl?: string;
}

export interface Guide {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  languages: {
    portuguese: boolean;
    spanish: boolean;
    english: boolean | null;
  };
  sourceAgentId?: string;
  sourceAgentName?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNo: string;
  assignedVehicleId?: string;
  status: 'Available' | 'Assigned' | 'Off Duty' | 'Unavailable';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes: string;
  photoUrl?: string;
}

export interface AppState {
  id?: string;
  ref: string;
  title?: string;
  status?: TripStatus;
  version?: number;
  consultant: string;
  consultantRole?: string;
  consultantEmail?: string;
  consultantPhone?: string;
  consultantAvatar?: string;
  priority: 'hot' | 'confirmed' | 'exploratory' | 'pending';
  source: 'direct' | 'agent' | 'referral' | 'website' | 'social';
  agent: {
    id: string;
    agencyName?: string;
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
  vehicles: Vehicle[];
  guides?: Guide[];
  drivers: Driver[];
  experienceLibrary: ExperienceLibraryItem[];
  destinationLibrary: DestinationLibraryItem[];
  finance: {
    currency: 'ZAR' | 'USD' | 'EUR' | 'BRL';
    rates: {
      USD: number;
      EUR: number;
      BRL: number;
      AOA: number;
    };
    paymentMethod: string;
    paymentStatus?: 'unpaid' | 'deposit_due' | 'deposit_paid' | 'fully_paid' | 'overdue';
    margin: number;
    marginType: '%' | 'Fixed';
    comm: number;
    commType: '%' | 'Fixed';
    discount: number;
    buffer: number;
    bufferNotes: string;
    restaurantNotes?: string;
  };
  internalNotes: string;
  editorial?: {
    heroImageUrl: string;
    tagline: string;
    welcomeStory: string;
    keyHighlights: string[];
    packingEssentials: string[];
    localCurrencyTips: string;
    conciergeIntro: string;
    videoUrl?: string;
  };
  groupManagement?: GroupManagement;
  changeLog?: TripChangeLogEntry[];
  publishing?: {
    tripId: string;
    publicUrl: string;
    publishStatus: 'Draft' | 'Not Published' | 'Published' | 'Changes Pending' | 'Republishing' | 'Archived';
    version: number;
    publishedAt: string;
    lastUpdated: string;
    accessToken: string;
    clientToken?: string;
    agentToken?: string;
    opsToken?: string;
    clientTokenActive?: boolean;
    agentTokenActive?: boolean;
    opsTokenActive?: boolean;
    passwordProtected: boolean;
    expiresAt: string | null;
    settings: {
      requirePassword?: boolean;
      password?: string;
      enableExpiryDate?: boolean;
      expiresAt?: string | null;
      allowDownloads?: boolean;
      allowPrinting?: boolean;
      hideInternalNotes?: boolean;
      showPricing?: boolean;
      showSupplierDetails?: boolean;
      enableOfflineAccess?: boolean;
      language?: string;
      currency?: string;
    };
    versions: {
      version: number;
      date: string;
      note: string;
      status: string;
    }[];
  };
}

export interface TripSummaryItem {
  id: string;
  ref: string;
  title: string;
  clientName: string;
  dates: string;
  paxCount: number;
  status: TripStatus;
  totalValueZAR: number;
  readinessScore: number;
  consultant: string;
  lastUpdated: string;
}


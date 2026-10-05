import { AppState } from '../types';
import { DEFAULT_EXPERIENCES, DEFAULT_DESTINATIONS } from './libraryDefaults';

export const INITIAL_TRIPS: AppState[] = [];

export const TEMPLATE_TRIPS: AppState[] = [
  {
    ref: "VT-2026-9999",
    title: "Harrison South African Safari & Coastal Expedition [TEMPLATE]",
    status: "confirmed",
    version: 4,
    consultant: "Elena Rostova",
    consultantRole: "Senior Private Travel Designer & Concierge",
    consultantEmail: "elena.rostova@viemmatours.com",
    consultantPhone: "+27 21 555 0199",
    consultantAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
    priority: "confirmed",
    source: "agent",
    agent: { 
      id: "safari_dreams", 
      agencyName: "Safari Dreams Luxury Travel", 
      contact: "Emma Williams", 
      email: "emma@safaridreams.co.uk", 
      comm: "12%" 
    },
    client: {
      name: "The Harrison Family (Template)",
      email: "lead@harrisonfamily.com",
      phone: "+1 415 888 2234",
      country: "🇺🇸 United States",
      contactMethod: "whatsapp",
      tripType: "multi",
      startDate: "2026-05-20",
      endDate: "2026-05-26",
      durationText: "7 Days / 6 Nights",
      occasion: "Anniversary",
      otherOccasion: "",
      tags: ["Family", "Adventure & Safari", "VIP Reserve"]
    },
    groupConditions: {
      dietary: ["Vegetarian"],
      mobility: ["Step Assistance"],
      medical: [],
      prefs: ["Front of Vehicle"],
      notes: "The family prefers scenic drives, leisurely starts after 9:00 AM, and premium wine pairings."
    },
    editorial: {
      heroImageUrl: "https://images.pexels.com/photos/7843687/pexels-photo-7843687.jpeg",
      tagline: "Exclusive Cape Town & Private Safari Sanctuary",
      welcomeStory: "Welcome to your bespoke South African expedition. From the dramatic cliffs of the Cape Peninsula and the historic vineyards of Franschhoek to the untouched wilderness of the private game reserve, every chapter has been crafted for your family's comfort and wonder.",
      keyHighlights: [
        "Private VIP fast-track upon arrival at Cape Town International",
        "Penthouse & Marina suites at One&Only Cape Town overlooking Table Bay",
        "Helicopter transfer to Franschhoek for private sommelier tasting",
        "Big Five game drives with master trackers in private reserves"
      ],
      packingEssentials: [
        "Lightweight neutral layers for morning and evening game drives",
        "Polarized sunglasses and broad-brimmed safari hat",
        "High-SPF sunscreen and binoculars (8x42 or 10x42 recommended)"
      ],
      localCurrencyTips: "Credit cards (Visa & Mastercard) are widely accepted everywhere in South Africa. Tipping for private guides and lodge staff is customary in ZAR cash at end of stay.",
      conciergeIntro: "Elena Rostova is on standby 24/7 throughout your journey to coordinate private dining, spa bookings, and bespoke requests."
    },
    guests: [
      { 
        id: 1, 
        first: "James", 
        last: "Harrison", 
        preferredName: "Jim",
        age: "Adult", 
        nationality: "🇺🇸 United States",
        country: "🇺🇸 United States", 
        diet: [], 
        mob: [], 
        med: [], 
        pref: ["Aisle Seat"], 
        notes: "Lead guest. Likes sparkling water in vehicle.", 
        isLead: true,
        inheritCountry: true,
        inheritNationality: true,
        inheritEmergencyContact: true,
        emergencyContactName: "Robert Harrison",
        emergencyContactPhone: "+1 415 555 0100"
      }
    ],
    flights: [],
    transfers: [],
    rooms: [],
    activities: [],
    vehicles: [],
    drivers: [],
    experienceLibrary: DEFAULT_EXPERIENCES,
    destinationLibrary: DEFAULT_DESTINATIONS,
    finance: {
      currency: "ZAR",
      rates: { USD: 0.053, EUR: 0.049, BRL: 0.27, AOA: 0.045 },
      paymentMethod: "Credit Card",
      margin: 22,
      marginType: "%",
      comm: 12,
      commType: "%",
      discount: 0,
      buffer: 5,
      bufferNotes: "Contingency reserve for private transfers."
    },
    internalNotes: "Template trip for new bookings."
  }
];

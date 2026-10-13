// Dynamic Catalogue Service for Airlines & Cape Town Hotels
// Loads from /data/airlines.txt and /data/cape-town-hotels.txt with safe fallbacks

let airlinesCache: string[] | null = null;
let hotelsCache: string[] | null = null;

const DEFAULT_AIRLINES_FALLBACK = [
  "Air Botswana", "Air France", "Air Mauritius", "Airlink", "All Nippon Airways (ANA)",
  "American Airlines", "British Airways", "Cathay Pacific", "CemAir", "Delta Air Lines",
  "Emirates", "Ethiopian Airlines", "Etihad Airways", "FlySafair", "Iberia", "Kenya Airways",
  "KLM Royal Dutch Airlines", "LAM Mozambique Airlines", "LATAM Airlines", "Lufthansa",
  "Proflight Zambia", "Qantas", "Qatar Airways", "RwandAir", "Singapore Airlines",
  "South African Airways (SAA)", "Swiss International Air Lines", "TAAG Angola Airlines",
  "TAP Air Portugal", "Turkish Airlines", "United Airlines", "Virgin Atlantic"
];

const DEFAULT_HOTELS_FALLBACK = [
  "Belmond Mount Nelson Hotel (Gardens)", "Cape Grace Hotel (V&A Waterfront)",
  "Ellerman House (Bantry Bay)", "Gorgeous George (City Centre / CBD)",
  "Hotel Verde Cape Town Airport (Airport Area)", "One&Only Cape Town (V&A Waterfront)",
  "Pepperclub Hotel (City Centre / CBD)", "Queen Victoria Hotel & Manor House (V&A Waterfront)",
  "Radisson Blu Hotel Waterfront (Granger Bay / Waterfront)", "Radisson RED Hotel V&A Waterfront (Silo District)",
  "Silo Hotel (V&A Waterfront / Silo District)", "Southern Sun The Cullinan (Foreshore)",
  "Table Bay Hotel (V&A Waterfront)", "Taj Cape Town (City Centre / St George's Mall)",
  "Tintswalo Atlantic (Chapman's Peak Drive / Hout Bay)", "Twelve Apostles Hotel and Spa (Victoria Road / Camps Bay)",
  "Vineyard Hotel (Newlands / Southern Suburbs)"
];

export async function fetchAirlinesCatalogue(): Promise<string[]> {
  if (airlinesCache && airlinesCache.length > 0) return airlinesCache;
  try {
    const res = await fetch('/data/airlines.txt');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
    
    // Deduplicate and sort
    airlinesCache = Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));
    return airlinesCache;
  } catch (err) {
    console.warn("Could not load /data/airlines.txt, using fallback catalogue:", err);
    airlinesCache = [...DEFAULT_AIRLINES_FALLBACK].sort();
    return airlinesCache;
  }
}

export function addCustomAirlineToCatalogue(newAirline: string): string[] {
  const clean = newAirline.trim();
  if (!clean) return airlinesCache || DEFAULT_AIRLINES_FALLBACK;
  if (!airlinesCache) airlinesCache = [...DEFAULT_AIRLINES_FALLBACK];
  if (!airlinesCache.includes(clean)) {
    airlinesCache = [...airlinesCache, clean].sort((a, b) => a.localeCompare(b));
  }
  return airlinesCache;
}

export async function fetchHotelsCatalogue(): Promise<string[]> {
  if (hotelsCache && hotelsCache.length > 0) return hotelsCache;
  try {
    const res = await fetch('/data/cape-town-hotels.txt');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
    
    hotelsCache = Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));
    return hotelsCache;
  } catch (err) {
    console.warn("Could not load /data/cape-town-hotels.txt, using fallback catalogue:", err);
    hotelsCache = [...DEFAULT_HOTELS_FALLBACK].sort();
    return hotelsCache;
  }
}

export function addCustomHotelToCatalogue(newHotel: string): string[] {
  const clean = newHotel.trim();
  if (!clean) return hotelsCache || DEFAULT_HOTELS_FALLBACK;
  if (!hotelsCache) hotelsCache = [...DEFAULT_HOTELS_FALLBACK];
  if (!hotelsCache.includes(clean)) {
    hotelsCache = [...hotelsCache, clean].sort((a, b) => a.localeCompare(b));
  }
  return hotelsCache;
}

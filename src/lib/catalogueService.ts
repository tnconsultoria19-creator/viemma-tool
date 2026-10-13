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
  "12 Apostles Hotel & Spa (Camps Bay)",
  "21 Nettleton (Clifton)",
  "African Pride 15 on Orange Hotel (Gardens)",
  "Atlantic Gold Villa (Camps Bay)",
  "Bantry Bay Suite Hotel (Bantry Bay)",
  "Bay Hotel (Camps Bay)",
  "Belmond Mount Nelson Hotel (Gardens)",
  "Camps Bay Retreat (Camps Bay)",
  "Camps Bay Villa (Camps Bay)",
  "Cape Cadogan Boutique Hotel (Gardens)",
  "Cape Grace Hotel (V&A Waterfront)",
  "Cape Heritage Hotel (City Centre / CBD)",
  "Cape Royale Luxury Suites (Green Point)",
  "Cape Town Marriott Hotel Crystal Towers (Century City)",
  "Capital 15 on Orange (Gardens)",
  "Capital Mirage (De Waterkant)",
  "Cloud 9 Boutique Hotel & Spa (Tamboerskloof)",
  "Colona Castle (Lakeside / False Bay)",
  "Commodore Hotel (V&A Waterfront)",
  "Cullinan Southern Sun (Foreshore / CBD)",
  "Derwent House Boutique Hotel (Tamboerskloof)",
  "Dock House Boutique Hotel (V&A Waterfront)",
  "DoubleTree by Hilton Cape Town Upper Eastside (Woodstock)",
  "Dysart Boutique Hotel (Green Point)",
  "Ellerman House (Bantry Bay)",
  "Gorgeous George (City Centre / CBD)",
  "Harbour Bridge Hotel & Suites (Foreshore)",
  "Hilton Cape Town City Centre (CBD)",
  "Hotel Verde Cape Town Airport (Airport Area)",
  "Kensington Place (Oranjezicht)",
  "Kloof Street Hotel (Gardens)",
  "Labotessa Luxury Boutique Hotel (Church Square / CBD)",
  "Lagoon Beach Hotel & Spa (Milnerton)",
  "Last Word Constantia (Southern Suburbs)",
  "Marly Boutique Hotel & Spa (Camps Bay)",
  "Milton Canyon Villa (Clifton)",
  "More Quarters Hotel (Gardens)",
  "Mount Nelson, A Belmond Hotel (Gardens)",
  "New Kings Hotel (Sea Point)",
  "Ocean View House (Camps Bay)",
  "One&Only Cape Town (V&A Waterfront)",
  "O’Two Hotel (Mouille Point)",
  "Park Inn by Radisson Cape Town Foreshore (Foreshore)",
  "Pepperclub Hotel (City Centre / CBD)",
  "Pod Camps Bay (Camps Bay)",
  "Portside Hotel (Green Point)",
  "President Hotel (Bantry Bay)",
  "Protea Hotel by Marriott Cape Town Waterfront Breakwater Lodge (V&A Waterfront)",
  "Protea Hotel Fire & Ice! by Marriott Cape Town (Tamboerskloof)",
  "Protea Hotel Mowbray (Southern Suburbs)",
  "Protea Hotel Sea Point (Sea Point)",
  "Queen Victoria Hotel & Manor House (V&A Waterfront)",
  "Radisson Blu Hotel Waterfront (Granger Bay / Waterfront)",
  "Radisson Blu Le Vendome Hotel (Sea Point)",
  "Radisson RED Hotel V&A Waterfront (Silo District)",
  "Riva Suites (Sea Point)",
  "Road Lodge Cape Town International Airport (Airport Area)",
  "Rondebosch Guest House (Rondebosch / Southern Suburbs)",
  "Salt River Loft Apartments (Woodstock / Salt River)",
  "Sea Point Atlantic Suites (Sea Point)",
  "Silo Hotel (V&A Waterfront / Silo District)",
  "Southern Sun Cape Sun (City Centre / CBD)",
  "Southern Sun Newlands (Newlands / Southern Suburbs)",
  "Southern Sun The Cullinan (Foreshore)",
  "Southern Sun Waterfront (Foreshore)",
  "St Andrews Boutique Hotel (Green Point)",
  "Steenberg Hotel & Spa (Constantia)",
  "SunSquare Cape Town City Bowl (City Centre / CBD)",
  "Table Bay Hotel (V&A Waterfront)",
  "Taj Cape Town (City Centre / St George's Mall)",
  "Tintswalo Atlantic (Chapman's Peak Drive / Hout Bay)",
  "Townhouse Hotel (CBD)",
  "Twelve Apostles Hotel and Spa (Victoria Road / Camps Bay)",
  "Urban Elephant Serviced Apartments (City Bowl)",
  "Victoria & Alfred Hotel (V&A Waterfront)",
  "Villa Eden Luxury Retreat (Clifton)",
  "Villa Zest Boutique Hotel (Green Point)",
  "Vineyard Hotel (Newlands / Southern Suburbs)",
  "Winchester Boutique Hotel (Sea Point)",
  "Woodstock Exchange Residences (Woodstock)",
  "Zest Boutique Hotel (Green Point)",
  "Babylonstoren (Franschhoek Wine Valley)",
  "Delaire Graff Estate (Stellenbosch)",
  "La Residence (Franschhoek)",
  "Leeu Estates (Franschhoek)",
  "Mont Rochelle (Franschhoek)",
  "Lanzerac Hotel & Spa (Stellenbosch)",
  "Boschendal Farm Estate (Franschhoek)",
  "Grande Roche Hotel (Paarl)",
  "Birkenhead House (Hermanus)",
  "Grootbos Private Nature Reserve (Gansbaai / Overberg)",
  "Sanbona Wildlife Reserve (Little Karoo)",
  "Aquila Private Game Reserve (Touws River)",
  "Inverdoorn Private Game Reserve (Ceres Karoo)"
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
  let savedCustom: string[] = [];
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('viemma.customHotels') : null;
    if (raw) savedCustom = JSON.parse(raw).filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()));
  } catch { /* Storage can be unavailable in private browsing; the in-memory catalogue still works. */ }
  try {
    const res = await fetch('/data/cape-town-hotels.txt');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'));
    hotelsCache = Array.from(new Set([...lines, ...savedCustom])).sort((a, b) => a.localeCompare(b));
    return hotelsCache;
  } catch (err) {
    console.warn("Could not load /data/cape-town-hotels.txt, using bundled fallback catalogue:", err);
    hotelsCache = Array.from(new Set([...DEFAULT_HOTELS_FALLBACK, ...savedCustom])).sort((a, b) => a.localeCompare(b));
    return hotelsCache;
  }
}

export function addCustomHotelToCatalogue(newHotel: string): string[] {
  const clean = newHotel.trim();
  if (!hotelsCache) hotelsCache = [...DEFAULT_HOTELS_FALLBACK];
  if (!clean) return hotelsCache;
  if (!hotelsCache.some(h => h.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
    hotelsCache = [...hotelsCache, clean].sort((a, b) => a.localeCompare(b));
  }
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('viemma.customHotels');
      const saved: string[] = raw ? JSON.parse(raw) : [];
      const merged = Array.from(new Set([...saved, clean]));
      window.localStorage.setItem('viemma.customHotels', JSON.stringify(merged));
    }
  } catch { /* Local persistence is optional; the property remains available for the current session. */ }
  return hotelsCache;
}

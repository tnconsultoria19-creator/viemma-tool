import { ExperienceLibraryItem, DestinationLibraryItem } from '../types';

export const DEFAULT_DESTINATIONS: DestinationLibraryItem[] = [
  {
    id: "dest_ct",
    name: "Cape Town",
    region: "Western Cape",
    country: "South Africa",
    images: [
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1562135676-2e2e86c0e44a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
    overview: "Affectionately known as the Mother City, Cape Town is a visual masterpiece where the dramatic cliffs of Table Mountain plunge directly into the roaring Atlantic and Indian Oceans. It is a cosmopolitan sanctuary combining cutting-edge contemporary culture, award-winning culinary innovation, historical complexity, and wild, untouched coastal biodiversity.",
    culture: "A rich tapestry woven from Indigenous Khoisan heritages, Cape Malay traditions, European colonial histories, and vibrant contemporary African design. From the brightly painted facades of the historic Bo-Kaap neighborhood to the bustling world-class galleries of the Silo District, Cape Town is a collision of stories and creative expression.",
    climate: "Mediterranean. Summers (November to March) are warm, dry, and windy with temperatures around 26°C (79°F). Winters (June to August) are mild, wet, and cool, averaging 18°C (64°F). Spring and autumn represent golden, calm, transitional seasons perfect for hiking and sightseeing.",
    currency: "ZAR (South African Rand)",
    emergencyContacts: "National Emergency Number: 112 (from mobile); Cape Town Tourism Helpline: +27 (0)21 487 6800",
    localTips: [
      "Always carry a light windbreaker jacket; the Cape of Good Hope is famous for the 'Cape Doctor' wind which can roll in unexpectedly.",
      "Book your Table Mountain Cableway tickets online in advance and check the live weather tracker, as operations halt when high winds or cloud tableclotting occurs.",
      "Take Uber or private drivers for seamless, safe transport around the city bowl and coastal areas."
    ],
    packingAdvice: [
      "Comfortable, sturdy walking shoes for historical city walks and coastal trails.",
      "Elegant resort-casual attire for Michelin-caliber dining in Constantia and the Waterfront.",
      "Broad-spectrum high-SPF sunscreen, a wide-brimmed hat, and high-quality polarized sunglasses to guard against intense maritime UV reflections."
    ]
  },
  {
    id: "dest_kr",
    name: "Kruger National Park",
    region: "Mpumalanga / Limpopo",
    country: "South Africa",
    images: [
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    overview: "The majestic crown jewel of African conservation, the Greater Kruger National Park is an ancient ecosystem sprawling across nearly two million hectares of wild savannah. Here, the raw laws of nature dictate daily life, offering some of the planet's most immersive, premium, and reliable encounters with the iconic Big Five and countless other species in their true, untamed habitat.",
    culture: "Rooted in deep ancient tribal heritages including the Shangaan, Swazi, and Sotho peoples, who have coexisted with this pristine bushveld for millennia. Luxury lodges here pride themselves on story-led hospitality, highlighting local folklore, bush survival craft, and cutting-edge conservation biology.",
    climate: "Subtropical. Dry, sunny winters (May to September) feature warm days (23°C / 73°F) and cold, crisp nights (8°C / 46°F), which is the absolute best time for game viewing. Wet, hot summers (October to April) bring lush green landscapes, spectacular afternoon thunderstorms, and rich newborn wildlife activity.",
    currency: "ZAR (South African Rand)",
    emergencyContacts: "Kruger Park Head Office: +27 (0)13 735 4000; SANParks General Helpline: +27 (0)12 428 9111",
    localTips: [
      "Keep quiet and remain seated at all times while inside open game-drive vehicles; animals perceive the vehicle as a single, harmless giant entity.",
      "The Greater Kruger is a malaria-risk region; seek preventative medical advice and always apply insect repellent at dawn and dusk.",
      "Never feed or interact with the local wildlife, particularly cheeky vervet monkeys and baboons around picnic sites and unfenced camps."
    ],
    packingAdvice: [
      "Lightweight, breathable clothing in neutral earthy colors (khaki, olive, beige, brown) to blend in with the bush. Avoid bright whites or dark blues.",
      "A warm fleece, wool hat, and gloves for crisp, chilly early-morning open-vehicle game drives.",
      "High-magnification binoculars and a DSLR camera with a telephoto zoom lens (minimum 300mm) to capture distant leopard sightings."
    ]
  },
  {
    id: "dest_fh",
    name: "Franschhoek",
    region: "Cape Winelands",
    country: "South Africa",
    images: [
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
    overview: "Nestled in a amphitheater of towering purple mountains, Franschhoek is the culinary capital of South Africa. This picture-perfect valley, originally settled by French Huguenot refugees in 1688, exudes old-world European romance coupled with bold, new-world winemaking passion. Elegant Cape Dutch homesteads flank oak-lined avenues featuring boutique galleries, historic vineyards, and gourmet tasting sanctuaries.",
    culture: "A beautiful fusion of historic French heritage and traditional South African hospitality. Cape Dutch architectural elegance is meticulously preserved, and the valley maintains a slow, deliberate rhythm dedicated to the appreciation of art, fine wine, artisan food, and heritage preservation.",
    climate: "Mediterranean-temperate. Warm, dry summers (November to March) are perfect for dining alfresco under historic oak trees. Mild, rainy, and dramatic winters (June to August) fill the mountain waterfalls and make historic fireplaces the center of cozy winery experiences.",
    currency: "ZAR (South African Rand)",
    emergencyContacts: "Franschhoek Police Station: +27 (0)21 876 8060; Winelands Emergency: +27 (0)21 887 4440",
    localTips: [
      "Book your dining reservations months in advance; Franschhoek hosts some of the continent's most decorated Michelin-style multi-course restaurants.",
      "Use the historic double-decker Franschhoek Wine Tram to visit vineyards safely and beautifully without needing a designated driver.",
      "Take some time to stroll down Huguenot Street to meet artisan chocolatiers, master glassblowers, and local wood sculptors."
    ],
    packingAdvice: [
      "Smart-casual elegant attire for gourmet lunches and award-winning estate tastings.",
      "Comfortable flat walking shoes or wedges for exploring historic gravel estates and grassy picnic lawns.",
      "An extra empty bag or luggage protector sleeve for shipping back award-winning bottles of local Cap Classique."
    ]
  }
];

export const DEFAULT_EXPERIENCES: ExperienceLibraryItem[] = [
  {
    id: "exp_tm",
    name: "Table Mountain Cableway",
    category: "Sightseeing",
    destination: "Cape Town",
    duration: "3 hours",
    difficulty: "Easy",
    location: "Tafelberg Road, Cape Town",
    images: [
      "https://images.unsplash.com/photo-1562135676-2e2e86c0e44a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1562135676-2e2e86c0e44a?auto=format&fit=crop&w=1200&q=80",
    highlights: ["✨ 360-Degree Rotating Cabins", "🦁 Panoramic Views of Lions Head & Atlantic", "🌿 Rare Fynbos Flora Spotting", "🌅 Incredible Sunset Photo Opportunities"],
    luxuryDescription: "Ascend one of the New Seven Wonders of Nature in elegant, state-of-the-art rotating cable cabins that glide smoothly to the 1,086-meter flat summit of Table Mountain. The brief journey reveals breathtaking, unobstructed 360-degree views of Cape Town's glittering city bowl, the deep blue of Table Bay, and the wild cliffs of the Twelve Apostles.\n\nOnce on the summit, you will explore ancient flat stone pathways winding through rare, fragrant Fynbos vegetation—part of the Cape Floral Kingdom, which has higher plant biodiversity per square meter than the Amazon. Keep an eye out for 'dassies' (rock hyraxes), the mountain's adorable resident mammals whose closest genetic relative is actually the African elephant, while sipping a custom-poured Cap Classique under the golden Cape sun.",
    shortDescription: "Ascend Cape Town's iconic, flat-topped landmark in high-tech rotating cable cars to explore dramatic peaks, unique botanical wonders, and unmatched 360-degree ocean views.",
    seoDescription: "Glide to the summit of Table Mountain for Cape Town's most breathtaking, luxury panoramic experiences.",
    familyDescription: "An absolute delight for all ages! The rotating cabins are fully enclosed, stable, and stroller-accessible. Kids will love searching the rocks for cute dassies, while flat, paved walkways ensure grandparents can wander safely and comfortably.",
    adventureDescription: "For the active adventurer, bypass the cableway on the return leg and embark on a thrilling, guided descent via Platteklip Gorge, or explore the secret, rocky trails leading to Maclear's Beacon, the mountain's highest geographic point.",
    faqs: [
      { question: "Is the cableway wheelchair and stroller friendly?", answer: "Yes, both the lower and upper stations are fully equipped with ramps, lifts, and accessible pathways." },
      { question: "What happens if the weather turns bad?", answer: "Operations halt immediately for safety if high winds or thick clouds occur. Tickets are valid for 7 days, or we will pivot to an indoor art and wine excursion." }
    ],
    priceAdult: 420,
    priceChild: 210,
    supplier: "Table Mountain Aerial Cableway Company"
  },
  {
    id: "exp_bb",
    name: "Boulders Beach Penguins",
    category: "Nature & Wildlife",
    destination: "Cape Town",
    duration: "2 hours",
    difficulty: "Easy",
    location: "Kleintuin Road, Simon's Town",
    images: [
      "https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🐧 Nesting African Penguin Colony", "🏝️ Towering 540-Million-Year-Old Granite Boulders", "🌊 Crystal-Clear Sheltered Swimming Coves", "📸 Safe boardwalks for close-up photography"],
    luxuryDescription: "Venture to the historic naval outpost of Simon's Town to meet one of the planet's only land-based colonies of African Penguins. Wind your way along curated, eco-sensitive wooden boardwalks that lead directly through nesting dunes and white sandy beaches, bringing you within inches of these charming, tuxedo-clad birds as they preen, socialize, and plunge into the turquoise surf.\n\nFramed by massive, wind-polished granite boulders that date back over 540 million years, Boulders Beach is a spectacular natural sanctuary. The surrounding waters are sheltered from cold ocean currents, offering a rare opportunity to sunbathe on soft white sands or swim in clear, calm coves right alongside these curious marine creatures, all while learning about crucial local marine conservation efforts.",
    shortDescription: "Walk on custom conservation boardwalks to observe Simon's Town's famous, endearing African Penguin colony nesting among majestic granite boulders.",
    seoDescription: "Observe Cape Town's iconic, wild African Penguins in their pristine granite-boulder beach sanctuary.",
    familyDescription: "Children will be absolutely enchanted by the comical waddling of the penguins! Boardwalks are completely fenced and safe, and the adjacent Windmill Beach offers shallow, warm, wind-sheltered pools perfect for safe splashing.",
    adventureDescription: "Take your penguin encounter further with a private, guided sea-kayaking expedition launching from Simon's Town harbor, paddling right alongside penguins as they hunt in the open ocean waters.",
    faqs: [
      { question: "Can we touch or pet the penguins?", answer: "Strictly no. They are wild animals with razor-sharp beaks and can bite if cornered. Always maintain a respectful 2-meter distance." },
      { question: "When is the best time of day to visit?", answer: "Early morning or late afternoon when the penguins are most active on the beach, and crowds are at a minimum." }
    ],
    priceAdult: 190,
    priceChild: 95,
    supplier: "SANParks Table Mountain National Park"
  },
  {
    id: "exp_wt",
    name: "Franschhoek Wine Tram",
    category: "Gastronomy",
    destination: "Franschhoek",
    duration: "5 hours",
    difficulty: "Easy",
    location: "32 Huguenot Road, Franschhoek",
    images: [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🍷 Hop-on Hop-off Historical Tram & Open-Air Tram-Buses", "🍇 Elite Boutique Wine Estates Visits", "🧀 Premium Artisan Wine & Cheese Pairings", "🖼️ Rolling mountain and valley views"],
    luxuryDescription: "Board the beautiful, vintage-style open-air double-decker Franschhoek Wine Tram for a leisurely, bespoke journey through the sun-drenched vineyards of the Franschhoek Valley. Rolling along tracks originally laid in 1904 to help farmers transport their produce, this slow-paced, atmospheric rail system offers a romantic, completely hands-free way to explore the valley's elite boutique estates.\n\nYou have the freedom to curate your own tasting path: hop off at historic French Huguenot estates to sample award-winning Cap Classique sparkling wines, wander through manicured rose gardens, and indulge in artisan olive oil and cheese flights. As you glide past ancient vineyards framed by towering mountain peaks, your onboard guide shares the rich, local folklore of this spectacular culinary sanctuary.",
    shortDescription: "Hop aboard vintage open-air double-decker trams to discover the valley's most exclusive boutique wine estates and gourmet tasting rooms.",
    seoDescription: "Curate your own wine adventure on the world-famous historic Franschhoek Wine Tram.",
    familyDescription: "While centered on wine, kids absolutely adore the novelty of riding the double-decker tram and tractor-pulled buses! Many stops (like Boschendal) feature majestic kids' playgrounds, farm animal encounters, and delicious non-alcoholic artisanal cordials.",
    adventureDescription: "Skip the tram for a segment and rent high-quality mountain bikes to cycle between the historic estates, enjoying a crisp, active exploration of the valley floor.",
    faqs: [
      { question: "Does the ticket price include wine tastings?", answer: "No, the ticket covers the tram transportation and narrative guide. Individual estate tasting fees range from R80 to R200, often waived with bottle purchases." },
      { question: "Is booking in advance essential?", answer: "Highly recommended, especially on weekends and during the sunny summer holiday season, as routes sell out weeks in advance." }
    ],
    priceAdult: 300,
    priceChild: 150,
    supplier: "Franschhoek Wine Tram (Pty) Ltd"
  },
  {
    id: "exp_cp",
    name: "Cape Peninsula & Chapman's Peak Coastal Drive",
    category: "Scenic & Adventure",
    destination: "Cape Town",
    duration: "6 hours",
    difficulty: "Easy",
    location: "Chapman's Peak Drive to Cape Point",
    images: [
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=1200",
    highlights: ["🌊 Dramatic Clifftop Chapman's Peak Drive", "🌍 Standing at the historic Cape of Good Hope", "🦓 Cape Mountain Zebra & Ostrich Spotting", "🚢 Historic Flying Dutchman Funicular"],
    luxuryDescription: "Embark on one of the planet's most jaw-dropping coastal road trips along the legendary Chapman's Peak Drive, carved directly into the sheer vertical cliffs of the Atlantic coast.\n\nYour private chauffeur guides you past secluded surf coves and dramatic rocky headlands to the Cape of Good Hope Nature Reserve. Here, wild ostriches wander along windswept beaches and rare Cape mountain zebras graze among fragrant coastal fynbos. Ride the Flying Dutchman Funicular up to the iconic historic lighthouse for infinite vistas over the roaring Atlantic ocean.",
    shortDescription: "Private guided coastal expedition winding along Chapman's Peak to the dramatic clifftops of the Cape of Good Hope.",
    seoDescription: "Private luxury chauffeur tour of Chapman's Peak Drive and the Cape Point Nature Reserve.",
    familyDescription: "Great for all ages with smooth private vehicle transit, frequent scenic pull-offs for fresh sea air, and fun funicular rides to the lighthouse.",
    adventureDescription: "Include a private guided coastal hike along the dramatic shipwreck trail from Dias Beach to the Cape Point lighthouse.",
    faqs: [
      { question: "Is lunch included?", answer: "Lunch is arranged at Two Oceans Restaurant or Harbour House in Kalk Bay." },
      { question: "Are toll gate fees covered?", answer: "All Chapman's Peak toll fees and National Park entry permits are fully included." }
    ],
    priceAdult: 1250,
    priceChild: 650,
    supplier: "Viemma Private Chauffeur Fleet"
  },
  {
    id: "exp_ri",
    name: "Robben Island Historic Ferry & Museum Tour",
    category: "Culture & Heritage",
    destination: "Cape Town",
    duration: "4 hours",
    difficulty: "Easy",
    location: "Nelson Mandela Gateway, V&A Waterfront",
    images: [
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
    highlights: ["⛴️ Scenic Table Bay Catamaran Ferry", "🕊️ Nelson Mandela's Maximum Security Cell", "🏛️ Guided by Former Political Prisoners", "📸 Spectacular return views of Table Mountain"],
    luxuryDescription: "Board the high-speed ferry from the V&A Waterfront across Table Bay to World Heritage Site Robben Island. Upon arrival, embark on an emotional, deeply moving tour led by former political prisoners who share firsthand testimonies of resilience, human dignity, and the triumph of the human spirit over apartheid.\n\nVisit Nelson Mandela's 8x7-foot cell where he spent 18 of his 27 years of incarceration, the lime quarry where political prisoners forged their unity, and the historic Robert Sobukwe complex.",
    shortDescription: "Profound, private-access journey to Robben Island guided by former political prisoners.",
    seoDescription: "Official Robben Island Ferry and Nelson Mandela Cell Museum tour from Cape Town.",
    familyDescription: "An essential educational experience for older children and teens; includes comfortable bus tour of the entire island.",
    adventureDescription: "Take in the historic island circuit followed by a private curator briefing at the District Six Museum.",
    faqs: [
      { question: "How long is the ferry ride?", answer: "Approximately 35 minutes across Table Bay each way." },
      { question: "What if the sea is rough?", answer: "If strong swells occur, the ferry is rescheduled or replaced with the Zeitz MOCAA private art walk." }
    ],
    priceAdult: 600,
    priceChild: 310,
    supplier: "Robben Island Museum Council"
  },
  {
    id: "exp_kb",
    name: "Kirstenbosch National Botanical Gardens Guided Walk",
    category: "Nature & Wildlife",
    destination: "Cape Town",
    duration: "3 hours",
    difficulty: "Easy",
    location: "Rhodes Drive, Newlands, Cape Town",
    images: [
      "https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1590418606746-018840f9cd0f?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🌿 'Boomslang' Elevated Canopy Treetop Walkway", "🌺 7,000+ Indigenous Southern African Plant Species", "🦅 Rare Sunbirds and Sugarbirds Spotting", "☕ Curated Protea Tea & Scone Tasting"],
    luxuryDescription: "Nestled against the lush eastern slopes of Table Mountain, Kirstenbosch is acclaimed as one of the great botanical sanctuaries of the world. Stroll along the award-winning Centenary Tree Canopy Walkway ('The Boomslang'), rising above the forest floor with panoramic views of mountain crags and garden vistas.\n\nAccompanied by an expert botanist, discover living collections of rare cycads, King Proteas, and medicinal Fynbos flora before relaxing with artisan botanical teas at the Tea Room.",
    shortDescription: "Botanist-led garden stroll along the elevated treetop canopy walkway under Table Mountain.",
    seoDescription: "Guided walking experience at Kirstenbosch National Botanical Garden in Cape Town.",
    familyDescription: "Completely stroller-friendly with expansive grassy lawns for children to explore safely.",
    adventureDescription: "Extend into the mountain with a guided hike up Skeleton Gorge to Table Mountain's reservoirs.",
    faqs: [
      { question: "Is it wheelchair accessible?", answer: "Yes, paved paths connect the main conservatory and canopy walkway." }
    ],
    priceAdult: 250,
    priceChild: 120,
    supplier: "SANBI Kirstenbosch Botanical Institute"
  },
  {
    id: "exp_cat",
    name: "V&A Waterfront Private Sunset Catamaran Cruise",
    category: "Coastal & Marine",
    destination: "Cape Town",
    duration: "2.5 hours",
    difficulty: "Easy",
    location: "Quay 5, V&A Waterfront, Cape Town",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🍾 Chilled Local Cap Classique & Artisan Canapés", "🐬 Frequent Dolphin & Cape Fur Seal Sightings", "🌅 Golden Hour Illumination of Table Mountain", "⚓ Luxurious 40ft Catamaran with Private Skipper"],
    luxuryDescription: "Set sail from the vibrant V&A Waterfront into Table Bay aboard a private 40-foot luxury catamaran. As the Cape sun sinks below the Atlantic horizon, enjoy chilled Méthode Cap Classique sparkling wine and fresh local oysters.\n\nKeep your camera ready for playful Cape fur seals, pods of endemic Heaviside's dolphins, and the amber glow reflecting across the entire face of Table Mountain and Lion's Head.",
    shortDescription: "Private luxury sailing charter across Table Bay with sparkling wine and sunset mountain views.",
    seoDescription: "Private sunset catamaran yacht cruise departing from Cape Town's V&A Waterfront.",
    familyDescription: "Safe, stable twin-hull catamaran with enclosed saloon and life jackets for all passenger sizes.",
    adventureDescription: "Take the helm with the skipper or enjoy an afternoon offshore marine wildlife safari.",
    faqs: [
      { question: "What should we wear?", answer: "Layers and a light windbreaker; the evening breeze over the ocean can be cool." }
    ],
    priceAdult: 1800,
    priceChild: 900,
    supplier: "Viemma Marine Charters"
  },
  {
    id: "exp_kruger",
    name: "Greater Kruger Open-Vehicle Sunrise Game Drive",
    category: "Wildlife & Safari",
    destination: "Kruger National Park",
    duration: "4 hours",
    difficulty: "Easy",
    location: "Kruger National Park Main Gate",
    images: [
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🦁 Big Five Wildlife Tracking", "🌅 Golden African Dawn Bushveld Coffee Stop", "🔭 Certified Master Tracker & Field Guide", "📸 Tiered 4x4 Vehicle with Camera Mounts"],
    luxuryDescription: "Depart at first light in a customized, open-sided 4x4 safari cruiser equipped with fleece blankets and hot water bottles. Accompanied by a veteran FGASA-accredited ranger and indigenous Shangaan master tracker, venture into the pristine bushveld as apex predators conclude their nocturnal hunts.\n\nTrack lion prides, leopards draped in leadwood trees, massive elephant herds, and white rhinos. Pause at a scenic river vantage point for piping-hot bush coffee and traditional rusks.",
    shortDescription: "Dawn game drive in customized 4x4 safari cruiser tracking the iconic Big Five.",
    seoDescription: "Luxury private open-vehicle morning safari game drive in Greater Kruger National Park.",
    familyDescription: "Children aged 6+ welcome on private vehicle drives; ranger provides interactive spoor identification books.",
    adventureDescription: "Combine with a mid-morning guided bush walk focusing on micro-fauna and medicinal plants.",
    faqs: [
      { question: "What time is departure?", answer: "05:30 in summer / 06:00 in winter from lodge reception." }
    ],
    priceAdult: 2800,
    priceChild: 1400,
    supplier: "Kruger Private Ranger Operations"
  },
  {
    id: "exp_kissama",
    name: "Kissama National Park Safari & River Trail",
    category: "Wildlife & Safari",
    destination: "Angola",
    duration: "7 hours",
    difficulty: "Moderate",
    location: "Kissama (Quiçama) National Park, Angola",
    images: [
      "https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🐘 Resettled Elephant & Giraffe Tracking", "🚤 Kwanza River Boat Excursion", "🌳 Majestic Ancient Baobab Forests", "🍱 Traditional Angolan Bush Picnic"],
    luxuryDescription: "Journey south from Luanda across the mighty Kwanza River into Kissama National Park, Angola's premier wildlife rehabilitation sanctuary. Spanning almost 10,000 square kilometers of coastal savannah and dense baobab forest, the park is home to relocated elephant herds, giraffes, zebras, and eland.\n\nEnjoy an open-vehicle 4x4 game drive followed by a private boat excursion along the Kwanza River observing waterbirds, monitor lizards, and lush mangrove ecology.",
    shortDescription: "Pioneering private safari drive and Kwanza river cruise in Angola's flagship national park.",
    seoDescription: "Kissama National Park safari game drive and Kwanza river tour from Luanda.",
    familyDescription: "Full day excursion; comfortable air-conditioned 4x4 transfers with snacks provided.",
    adventureDescription: "Inquire about overnight lodge stays for evening spotlight game drives.",
    faqs: [
      { question: "How far is Kissama from Luanda?", answer: "Approximately 75 km (1.5 - 2 hours driving) each way." }
    ],
    priceAdult: 3200,
    priceChild: 1600,
    supplier: "Viemma Angola Ground Operations"
  },
  {
    id: "exp_kalandula",
    name: "Kalandula Waterfalls & Malanje River Canyon",
    category: "Scenic & Adventure",
    destination: "Angola",
    duration: "9 hours",
    difficulty: "Moderate",
    location: "Lucala River, Malanje Province, Angola",
    images: [
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80"
    ],
    featuredImage: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
    highlights: ["🌊 Africa's Second Largest Waterfall by Volume", "🌈 Perpetual Rainbow Mists Over the Horseshoe Canyon", "🪨 Black Rocks of Pungo Andongo Scenic Stop", "🍽️ Private Gourmet Riverside Lunch"],
    luxuryDescription: "Venture east into Malanje Province to stand before the roaring Kalandula Falls, one of Africa's most breathtaking natural wonders. Horseshoe-shaped and tumbling 105 meters over sheer basalt cliffs across a 400-meter span on the Lucala River, the falls generate thunderous spray and perpetual rainbows.\n\nTake the guided cliffside trail for panoramic viewpoints, visit the historic Black Rocks of Pungo Andongo, and savor a catered gourmet lunch overlooking the cascades.",
    shortDescription: "Bespoke day expedition to Africa's colossal 105-meter horseshoe waterfall in Malanje.",
    seoDescription: "Kalandula Falls private guided tour and Pungo Andongo Black Rocks in Angola.",
    familyDescription: "Scenic viewpoints are easily accessible; sturdy walking shoes required for the lower trail.",
    adventureDescription: "Descend to the base of the gorge with local guides to feel the immense power of the spray.",
    faqs: [
      { question: "When is the water volume highest?", answer: "Between February and May during the rainy season, though spectacular year-round." }
    ],
    priceAdult: 4500,
    priceChild: 2200,
    supplier: "Viemma Angola Expeditions"
  }
];


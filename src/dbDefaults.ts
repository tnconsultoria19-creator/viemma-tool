// Viemma Tours - Static Database Defaults & Lists

export const COUNTRIES = [
  "🇿🇦 South Africa", "🇦🇴 Angola", "🇺🇸 United States", "🇬🇧 United Kingdom", "🇩🇪 Germany", 
  "🇧🇷 Brazil", "🇫🇷 France", "🇦🇺 Australia", "🇨🇦 Canada", "🇳🇱 Netherlands", "🇮🇹 Italy",
  "🇦🇫 Afghanistan", "🇦🇱 Albania", "🇩🇿 Algeria", "🇦🇩 Andorra", "🇦🇬 Antigua and Barbuda", 
  "🇦🇷 Argentina", "🇦🇲 Armenia", "🇦🇹 Austria", "🇦🇿 Azerbaijan", "🇧🇸 Bahamas", "🇧🇭 Bahrain", 
  "🇧🇩 Bangladesh", "🇧🇧 Barbados", "🇧🇾 Belarus", "🇧🇪 Belgium", "🇧🇿 Belize", "🇧🇯 Benin", 
  "🇧🇹 Bhutan", "🇧🇴 Bolivia", "🇧🇦 Bosnia and Herzegovina", "🇧🇼 Botswana", "🇧🇳 Brunei", 
  "🇧🇬 Bulgaria", "🇧🇫 Burkina Faso", "🇧🇮 Burundi", "🇰🇭 Cambodia", "🇨🇲 Cameroon", "🇨🇻 Cape Verde", 
  "🇨🇫 Central African Republic", "🇹🇩 Chad", "🇨🇱 Chile", "🇨🇳 China", "🇨🇴 Colombia", "🇰🇲 Comoros", 
  "🇨🇬 Congo", "🇨🇷 Costa Rica", "🇭🇷 Croatia", "🇨🇺 Cuba", "🇨🇾 Cyprus", "🇨🇿 Czech Republic", 
  "🇩🇰 Denmark", "🇩🇯 Djibouti", "🇩🇲 Dominica", "🇩🇴 Dominican Republic", "🇪🇨 Ecuador", "🇪🇬 Egypt", 
  "🇸🇻 El Salvador", "🇬🇶 Equatorial Guinea", "🇪🇷 Eritrea", "🇪🇪 Estonia", "🇪🇹 Ethiopia", "🇫🇯 Fiji", 
  "🇫🇮 Finland", "🇬🇦 Gabon", "🇬🇲 Gambia", "🇬🇪 Georgia", "🇬🇭 Ghana", "🇬🇷 Greece", "🇬🇩 Grenada", 
  "🇬🇹 Guatemala", "🇬🇳 Guinea", "🇬🇾 Guyana", "🇭🇹 Haiti", "🇭🇳 Honduras", "🇭🇺 Hungary", "🇮🇸 Iceland", 
  "🇮🇳 India", "🇮🇩 Indonesia", "🇮🇷 Iran", "🇮🇶 Iraq", "🇮🇪 Ireland", "🇮🇱 Israel", "🇯🇲 Jamaica", 
  "🇯🇵 Japan", "🇯🇴 Jordan", "🇰🇿 Kazakhstan", "🇰🇪 Kenya", "🇰🇼 Kuwait", "🇰🇬 Kyrgyzstan", "🇱🇦 Laos", 
  "🇱🇻 Latvia", "🇱🇧 Lebanon", "🇱🇸 Lesotho", "🇱🇷 Liberia", "🇱🇾 Libya", "🇱🇮 Liechtenstein", 
  "🇱🇹 Lithuania", "🇱🇺 Luxembourg", "🇲🇬 Madagascar", "🇲🇼 Malawi", "🇲🇾 Malaysia", "🇲🇻 Maldives", 
  "🇲🇱 Mali", "🇲🇹 Malta", "🇲🇽 Mexico", "🇲🇩 Moldova", "🇲🇨 Monaco", "🇲🇳 Mongolia", "🇲🇪 Montenegro", 
  "🇲🇦 Morocco", "🇲🇿 Mozambique", "🇲🇲 Myanmar", "🇳🇦 Namibia", "🇳🇵 Nepal", "🇳🇿 New Zealand", 
  "🇳🇮 Nicaragua", "🇳🇪 Niger", "🇳🇬 Nigeria", "🇰🇵 North Korea", "🇲🇰 North Macedonia", "🇳🇴 Norway", 
  "🇴🇲 Oman", "🇵🇰 Pakistan", "🇵🇦 Panama", "🇵🇬 Papua New Guinea", "🇵🇾 Paraguay", "🇵🇪 Peru", 
  "🇵🇭 Philippines", "🇵🇱 Poland", "🇵🇹 Portugal", "🇶🇦 Qatar", "🇷🇴 Romania", "🇷🇺 Russia", "🇷🇼 Rwanda", 
  "🇸🇦 Saudi Arabia", "🇸🇳 Senegal", "🇷🇸 Serbia", "🇸🇬 Singapore", "🇸🇰 Slovakia", "🇸🇮 Slovenia", 
  "🇰🇷 South Korea", "🇪🇸 Spain", "🇱🇰 Sri Lanka", "🇸🇩 Sudan", "🇸🇪 Sweden", "🇨🇭 Switzerland", 
  "🇸🇾 Syria", "🇹🇼 Taiwan", "🇹🇿 Tanzania", "🇹🇭 Thailand", "🇹🇬 Togo", "🇹🇹 Trinidad and Tobago", 
  "🇹🇳 Tunisia", "🇹🇷 Turkey", "🇺🇬 Uganda", "🇺🇦 Ukraine", "🇦🇪 United Arab Emirates", "🇺🇾 Uruguay", 
  "🇺🇿 Uzbekistan", "🇻🇪 Venezuela", "🇻🇳 Vietnam", "🇾🇪 Yemen", "🇿🇲 Zambia", "🇿🇼 Zimbabwe"
];

export const DB_DEFAULT = {
  hotels: [
    { id: 1, name: "The Silo Hotel (Cape Town)", stars: 5, area: "V&A Waterfront" },
    { id: 2, name: "Hotel Baía (Luanda, Angola)", stars: 4, area: "Luanda Bay" },
    { id: 3, name: "Belmond Mount Nelson", stars: 5, area: "Gardens, Cape Town" }
  ],
  activities: [
    { id: "tm", name: "Table Mountain Cableway", adPrice: 420, chPrice: 210, desc: "Aerial cableway offering panoramic views over Cape Town." },
    { id: "cp", name: "Cape Peninsula Scenic Tour", adPrice: 1250, chPrice: 650, desc: "Private coastal drive via Chapman's Peak to historic Cape Point." },
    { id: "ki", name: "Kissama National Park Safari (Angola)", adPrice: 3200, chPrice: 1600, desc: "Thrilling game drive spotting elephants and zebras in Angola." },
    { id: "lf", name: "Kalandula Waterfalls Expedition", adPrice: 4500, chPrice: 2200, desc: "Venture to Malanje to view the massive, breathtaking cascades." },
    { id: "bb", name: "Boulders Beach Penguins", adPrice: 190, chPrice: 95, desc: "Walk on boardwalks alongside nesting African Penguins." },
    { id: "wt", name: "Franschhoek Wine Tram", adPrice: 300, chPrice: 150, desc: "Bespoke hop-on-hop-off historical winery tram." }
  ],
  extras: [
    { id: "ex1", name: "Bespoke Welcome Flower Bouquet", basePrice: 350 },
    { id: "ex2", name: "Artisan Luanda Chocolate Collection", basePrice: 280 },
    { id: "ex3", name: "Premium Welcome South African Cabernet", basePrice: 480 }
  ],
  agents: [
    { id: "safari_dreams", name: "Safari Dreams Travel", contact: "Emma Williams", email: "emma@safaridreams.co.uk", phone: "+44 20 7946 0192", comm: "12%" },
    { id: "wanderlust", name: "Wanderlust Adventures", contact: "Hans Müller", email: "hans@wanderlust.de", comm: "10%" },
    { id: "cape_connect", name: "Cape Connect Tours", contact: "Mike Johnson", email: "mike@capeconnect.com", comm: "15%" },
    { id: "bespoke_africa", name: "Bespoke Africa Partners", contact: "Claire Thompson", email: "claire@bespokeafrica.au", comm: "8%" }
  ],
  drivers: [
    { id: "sipho", name: "Sipho Khumalo", phone: "+27 60 555 1234" },
    { id: "johan", name: "Johan Botha", phone: "+27 83 777 5678" },
    { id: "peter", name: "Peter Parker", phone: "+27 82 123 4567" }
  ],
  vehicles: [
    { id: "v1", name: "Toyota Quantum — 13 Seater" },
    { id: "v2", name: "Mercedes V-Class — 7 Seater" },
    { id: "v3", name: "Toyota Fortuner — 5 Seater" },
    { id: "v4", name: "Mercedes Sprinter — 22 Seater" },
    { id: "v5", name: "Sedan — 4 Seater" },
    { id: "v6", name: "SUV — 5 Seater" }
  ]
};

export const GUEST_DIETARY_OPTIONS = [
  "None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-Free", "Dairy-Free", "Nut Allergy", "Shellfish Allergy", "Pescatarian", "No Pork", "No Beef"
];

export const GUEST_MOBILITY_OPTIONS = [
  "None", "Wheelchair Required", "Walking Difficulty", "Walking Stick/Frame", "Cannot Climb Stairs", "Visual Impairment", "Hearing Impairment", "Requires Assistance"
];

export const GUEST_MEDICAL_OPTIONS = [
  "None", "Heart Condition", "Asthma", "Diabetes", "Epilepsy", "Pregnant", "Fear of Heights", "Fear of Water", "Motion Sickness", "Carries Medication"
];

export const GUEST_PREF_OPTIONS = [
  "Window Seat", "Aisle Seat", "Front of Vehicle", "Extra Legroom", "Quiet/No Music", "Child Seat Needed", "Booster Seat Needed"
];

export const ROOM_TYPE_OPTIONS = [
  "Standard", "Superior", "Deluxe", "Junior Suite", "Executive Suite", "Presidential", "Family Room", "Villa", "Cottage", "Safari Tent", "Lodge", "Day Room"
];

export const BED_CONFIG_OPTIONS = [
  "King", "Queen", "Twin", "Double", "Single", "Triple", "Bunk", "King + Extra", "Twin + Extra", "King + Cot"
];

export const MEAL_PLAN_OPTIONS = [
  "RO", "B&B", "HB", "FB", "AI"
];

export const ROOM_REQUEST_OPTIONS = [
  "Sea View", "Mountain View", "Garden View", "Pool View", "High Floor", "Ground Floor", "Balcony", "Connecting", "Adjacent", "Quiet Side", "Wheelchair Access", "Roll-in Shower", "Bathtub", "Non-Smoking", "Late Check-out", "Early Check-in", "Honeymoon Setup", "Birthday Setup", "Extra Pillows", "Hypoallergenic", "Coffee Machine", "Mini Fridge"
];

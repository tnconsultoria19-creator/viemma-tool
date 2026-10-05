import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, ExperienceLibraryItem } from '../types';
import { getClientTripView } from '../utils/roleFiltering';
import { ImageLightbox, LightboxImage } from './ImageLightbox';
import { 
  Hotel, 
  Clock, 
  MapPin, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  Play, 
  Compass, 
  Luggage, 
  Users, 
  Info, 
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Shield,
  Send,
  ExternalLink,
  ChevronDown,
  Sun,
  DollarSign,
  FileCheck,
  Car,
  Plane,
  HeartHandshake
} from 'lucide-react';

interface Props {
  state: AppState;
  onBackToWorkspace?: () => void;
  onBackToAdmin?: () => void;
}

// Curated South Africa Luxury Destination Fallback Images
const SOUTH_AFRICA_DESTINATION_HEROES = [
  'https://images.pexels.com/photos/32456962/pexels-photo-32456962.jpeg?auto=compress&cs=tinysrgb&w=1920', // African Safari Wildlife
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1920&auto=format&fit=crop', // Luxury Safari Camp Sunset
  'https://images.pexels.com/photos/259414/pexels-photo-259414.jpeg?auto=compress&cs=tinysrgb&w=1920', // Cape Town Atlantic Coast
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1920&auto=format&fit=crop', // Sabi Sands Safari Lion
];

const DESTINATION_DEFAULTS: Record<string, { img: string; title: string; desc: string; gallery: string[] }> = {
  'cape town': {
    img: 'https://images.pexels.com/photos/259414/pexels-photo-259414.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Cape Town & Peninsula',
    desc: 'Cradled between towering mountains and two oceans, the Mother City boasts world-class culinary excellence, dramatic coastal drives, and rich heritage.',
    gallery: [
      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop'
    ]
  },
  'winelands': {
    img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop',
    title: 'Cape Winelands & Franschhoek',
    desc: 'Centuries-old Cape Dutch estates nestled beneath dramatic mountain peaks, renowned for world-class gastronomy, private cellars, and tranquil olive groves.',
    gallery: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop'
    ]
  },
  'kruger': {
    img: 'https://images.pexels.com/photos/32456962/pexels-photo-32456962.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Sabi Sand & Greater Kruger',
    desc: 'Unrivalled private wildlife conservation sanctuary where Africa’s Big Five roam freely across pristine bushveld, guided by master trackers.',
    gallery: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800&auto=format&fit=crop',
      'https://images.pexels.com/photos/32456962/pexels-photo-32456962.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
  }
};

export const ClientView: React.FC<Props> = ({ state: rawState, onBackToWorkspace, onBackToAdmin }) => {
  const handleBack = onBackToAdmin || onBackToWorkspace;

  // Role-based security filtering (removes supplier costs, margins, and operational notes)
  const state = useMemo(() => getClientTripView(rawState), [rawState]);

  const [activeDay, setActiveDay] = useState<number>(1);
  const [heroSlideIdx, setHeroSlideIdx] = useState<number>(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatSent, setChatSent] = useState<boolean>(false);

  // Full-screen Image Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxInitialIdx, setLightboxInitialIdx] = useState<number>(0);

  // Essential info accordion open states
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({
    concierge: true,
    destination: false,
    weather: false,
    currency: false,
    packing: false,
    emergency: false
  });

  const toggleInfo = (key: string) => {
    setExpandedInfo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openLightbox = (images: (string | LightboxImage)[], index: number = 0) => {
    const list: LightboxImage[] = images.map(img => {
      if (typeof img === 'string') return { url: img, title: 'South African Experience' };
      return img;
    }).filter(item => Boolean(item.url));

    if (list.length > 0) {
      setLightboxImages(list);
      setLightboxInitialIdx(index);
      setLightboxOpen(true);
    }
  };

  // Safely extract libraries
  const experienceLibrary = state.experienceLibrary || [];
  const destinationLibrary = state.destinationLibrary || [];

  // Group activities by day
  const days: number[] = useMemo(() => {
    const dList = Array.from(new Set(state.activities.map(a => a.day)))
      .map(Number)
      .sort((a, b) => a - b);
    return dList.length > 0 ? dList : [1];
  }, [state.activities]);

  const currentDay = activeDay || days[0];

  const dayActivities = useMemo(() => {
    return state.activities.filter(a => a.day === currentDay).sort((a, b) => {
      return (a.start || '').localeCompare(b.start || '');
    });
  }, [currentDay, state.activities]);

  // Destination resolver for current day
  const activeDestinationInfo = useMemo(() => {
    const locationStr = (dayActivities[0]?.pickupLoc || dayActivities[0]?.name || '').toLowerCase();
    
    // Check destination library first
    const libMatch = destinationLibrary.find(d => 
      locationStr.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes('cape')
    );
    if (libMatch) {
      return {
        name: libMatch.name,
        desc: libMatch.overview || 'Scenic exploration with private naturalist guides.',
        img: libMatch.featuredImage || libMatch.images?.[0] || SOUTH_AFRICA_DESTINATION_HEROES[1],
        gallery: libMatch.images || []
      };
    }

    if (locationStr.includes('kruger') || locationStr.includes('safari') || locationStr.includes('sabi')) {
      return {
        name: DESTINATION_DEFAULTS.kruger.title,
        desc: DESTINATION_DEFAULTS.kruger.desc,
        img: DESTINATION_DEFAULTS.kruger.img,
        gallery: DESTINATION_DEFAULTS.kruger.gallery
      };
    } else if (locationStr.includes('wine') || locationStr.includes('franschhoek') || locationStr.includes('stellenbosch')) {
      return {
        name: DESTINATION_DEFAULTS.winelands.title,
        desc: DESTINATION_DEFAULTS.winelands.desc,
        img: DESTINATION_DEFAULTS.winelands.img,
        gallery: DESTINATION_DEFAULTS.winelands.gallery
      };
    }

    return {
      name: DESTINATION_DEFAULTS['cape town'].title,
      desc: DESTINATION_DEFAULTS['cape town'].desc,
      img: DESTINATION_DEFAULTS['cape town'].img,
      gallery: DESTINATION_DEFAULTS['cape town'].gallery
    };
  }, [dayActivities, destinationLibrary]);

  // Distinct destination stops for the Trip Overview (Screen 3 style)
  const destinationStops = useMemo(() => {
    const stops: { name: string; dayRange: string; img: string }[] = [];
    const totalD = days.length;
    
    if (totalD <= 3) {
      stops.push({
        name: 'Cape Town & Peninsula',
        dayRange: `Days 1–${totalD}`,
        img: DESTINATION_DEFAULTS['cape town'].img
      });
    } else if (totalD <= 6) {
      stops.push({
        name: 'Cape Town Atlantic Coast',
        dayRange: 'Days 1–3',
        img: DESTINATION_DEFAULTS['cape town'].img
      });
      stops.push({
        name: 'Cape Winelands Estates',
        dayRange: `Days 4–${totalD}`,
        img: DESTINATION_DEFAULTS.winelands.img
      });
    } else {
      stops.push({
        name: 'Cape Town & Atlantic Seaboard',
        dayRange: 'Days 1–3',
        img: DESTINATION_DEFAULTS['cape town'].img
      });
      stops.push({
        name: 'Franschhoek Winelands',
        dayRange: 'Days 4–5',
        img: DESTINATION_DEFAULTS.winelands.img
      });
      stops.push({
        name: 'Sabi Sand Private Big 5 Safari',
        dayRange: `Days 6–${totalD}`,
        img: DESTINATION_DEFAULTS.kruger.img
      });
    }
    return stops;
  }, [days]);

  // Hero carousel slides
  const heroSlides = useMemo(() => {
    const custom = state.editorial?.heroImageUrl;
    if (custom && custom.trim().length > 0 && !custom.includes('7843687')) {
      return [custom, ...SOUTH_AFRICA_DESTINATION_HEROES.slice(0, 3)];
    }
    return SOUTH_AFRICA_DESTINATION_HEROES;
  }, [state.editorial?.heroImageUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const consultantName = state.consultant || 'Elena Rostova';
  const consultantRole = state.consultantRole || 'Senior Private Travel Designer';
  const consultantPhone = state.consultantPhone || '+27 21 555 0199';
  const consultantEmail = state.consultantEmail || 'concierge@viemmatours.com';
  const consultantAvatar = state.consultantAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop';

  const handleSendConciergeChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatSent(true);
    setTimeout(() => {
      setChatMessage('');
      setChatSent(false);
    }, 4000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-gray-900 pb-28 font-sans antialiased selection:bg-[#D4AF37] selection:text-white relative">
      
      {/* Top Editorial Sticky Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 px-4 md:px-8 py-2.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1A3326] text-[#D4AF37] font-serif font-black flex items-center justify-center text-sm shadow-xs">
              V
            </div>
            <div>
              <span className="font-serif font-black tracking-wide text-xs md:text-sm text-[#1A3326] block leading-tight">VIEMMA TOURS</span>
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] block">
                Bespoke African Journeys
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToSection('trip-overview')}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#1A3326] text-[11px] font-bold border border-emerald-200/80 transition"
            >
              <Compass size={12} className="text-[#D4AF37]" /> Trip Overview
            </button>

            <button
              onClick={() => scrollToSection('itinerary-timeline')}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#1A3326] text-[11px] font-bold border border-emerald-200/80 transition"
            >
              <Calendar size={12} className="text-[#D4AF37]" /> Daily Itinerary
            </button>

            {handleBack && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded-lg bg-[#1A3326] hover:bg-[#234533] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
              >
                Owner Cockpit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN EDITORIAL TRAVEL MAGAZINE HERO (Reference Screen 2 Inspired) */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[92vh] sm:h-[82vh] md:h-[700px] bg-slate-950 flex flex-col justify-between overflow-hidden">
        
        {/* Background Image Carousel with Ken Burns subtle motion */}
        {heroSlides.map((imgUrl, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out transform ${
              heroSlideIdx === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ backgroundImage: `url('${imgUrl}')` }}
          />
        ))}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-black/50" />

        {/* Top Story Indicator Bars */}
        <div className="relative z-20 pt-4 px-4 md:px-8 max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-1 max-w-xs">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlideIdx(i)}
                className="h-1 flex-1 rounded-full overflow-hidden bg-white/30 focus:outline-none"
                aria-label={`Go to hero photo ${i + 1}`}
              >
                <div 
                  className={`h-full bg-[#D4AF37] transition-all duration-300 ${
                    heroSlideIdx === i ? 'w-full' : 'w-0'
                  }`} 
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wide border border-white/20">
              Ref: {state.ref}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#D4AF37] text-[#1A3326] text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
              {state.guests.length} Guests
            </span>
          </div>
        </div>

        {/* Hero Center Editorial Magazine Polaroid Frame */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 py-6 w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          
          <div className="space-y-3.5 text-left w-full md:max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest border border-[#D4AF37]/30">
              <Sparkles size={12} /> Bespoke South African Expedition
            </div>

            {/* Large Editorial Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
              {state.title || `${state.client.name || 'Private VIP'}'s South African Journey`}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-200 font-medium leading-relaxed max-w-xl drop-shadow-md">
              {state.editorial?.tagline || "Exclusive Cape Town, Scenic Coastline & Private Safari Sanctuary"}
            </p>

            {/* Quick Trip Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-200 pt-2 border-t border-white/20">
              <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                <Calendar size={13} className="text-[#D4AF37]" /> {state.client.startDate} – {state.client.endDate} ({days.length} Days)
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                <MapPin size={13} className="text-[#D4AF37]" /> South Africa
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                <Users size={13} className="text-[#D4AF37]" /> {state.client.name}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => openLightbox(heroSlides, heroSlideIdx)}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center gap-2 border border-white/25 active:scale-95 shadow-md"
              >
                <Compass size={13} /> View Gallery ({heroSlides.length})
              </button>

              <button 
                onClick={() => scrollToSection('itinerary-timeline')}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-[#1A3326] text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                Explore Itinerary <ArrowRight size={13} />
              </button>
            </div>

          </div>

          {/* Editorial Polaroid Badge Card (Visual Reference Screen 2 Aesthetic) */}
          <div 
            onClick={() => openLightbox(heroSlides, 0)}
            className="hidden sm:flex flex-col items-center bg-white p-3 pb-4 rounded-xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer border border-gray-200/80 w-56 shrink-0 group"
          >
            <div className="w-full h-44 rounded-lg overflow-hidden relative">
              <img 
                src={heroSlides[0]} 
                alt="South Africa Itinerary" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
              />
              <div className="absolute inset-0 bg-[#1A3326]/20 group-hover:bg-transparent transition-colors" />
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                Tap to Expand
              </span>
            </div>
            <div className="text-center pt-2.5">
              <span className="text-[10px] tracking-[0.2em] font-serif font-black uppercase text-[#1A3326] block">
                VIEMMA TOURS
              </span>
              <span className="text-xs font-serif font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                <MapPin size={11} className="text-[#D4AF37]" /> SOUTH AFRICA
              </span>
            </div>
          </div>

        </div>

        {/* Scroll Indicator Prompt */}
        <div className="relative z-20 pb-4 text-center text-gray-400 text-[11px] font-medium flex items-center justify-center gap-1 animate-bounce">
          <span>Scroll to explore your journey</span>
          <ChevronDown size={14} />
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. TRIP OVERVIEW SPREAD (Reference Screen 3 Inspired) */}
      {/* ========================================================================= */}
      <section id="trip-overview" className="max-w-6xl mx-auto px-4 md:px-8 pt-8 space-y-6">
        
        {/* Arched Luxury Overview Card */}
        <div className="bg-[#1A3326] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
          
          {/* Subtle Arch Ambient Light Background */}
          <div className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
              <div>
                <span className="text-[10px] font-serif font-bold uppercase tracking-[0.25em] text-[#D4AF37] block">
                  TRIP OVERVIEW
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                  Your Bespoke Expedition
                </h2>
              </div>

              {/* Curated Consultant Mini Card */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D4AF37] shrink-0">
                  <img src={consultantAvatar} alt={consultantName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block leading-none">Curated By</span>
                  <span className="text-xs font-bold text-white block leading-tight">{consultantName}</span>
                  <span className="text-[10px] text-gray-300">{consultantRole}</span>
                </div>
              </div>
            </div>

            {/* Destination Milestone Timeline (Circular badges as in Screen 3) */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
                Destination Route & Stays
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {destinationStops.map((stop, sIdx) => (
                  <div 
                    key={sIdx}
                    onClick={() => openLightbox([stop.img], 0)}
                    className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/15 transition duration-300 flex items-center gap-3.5 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[#D4AF37] shadow-md relative">
                      <img src={stop.img} alt={stop.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                        {stop.dayRange}
                      </span>
                      <h4 className="text-sm font-serif font-bold text-white truncate leading-snug">
                        {stop.name}
                      </h4>
                      <span className="text-[10px] text-gray-300 block truncate mt-0.5">
                        Tap photo to enlarge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Trip Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-black/30 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <span className="text-lg sm:text-2xl font-serif font-bold text-[#D4AF37] block">{days.length}</span>
                <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Days & Nights</span>
              </div>

              <div className="bg-black/30 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <span className="text-lg sm:text-2xl font-serif font-bold text-[#D4AF37] block">{state.guests.length}</span>
                <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Travelers</span>
              </div>

              <div className="bg-black/30 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <span className="text-lg sm:text-2xl font-serif font-bold text-[#D4AF37] block">{state.rooms.length || 1}</span>
                <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Luxury Lodges</span>
              </div>

              <div className="bg-black/30 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <span className="text-lg sm:text-2xl font-serif font-bold text-[#D4AF37] block">{state.activities.length}</span>
                <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Experiences</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. DAILY SCHEDULE SELECTOR (Reference Screen 1 Aesthetic) */}
      {/* ========================================================================= */}
      <section id="itinerary-timeline" className="max-w-6xl mx-auto px-4 md:px-8 pt-8 space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-[0.25em] text-[#D4AF37] block">
              DAILY SCHEDULE
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#1A3326]">
              Day-by-Day Journey
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Tap a day to view scheduled highlights
          </span>
        </div>

        {/* Horizontal Scroll Day Pills with Gold active ring */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-14 z-30 bg-[#FDFBF7]/95 backdrop-blur-md py-2">
          {days.map(d => {
            const isCurrent = activeDay === d;
            return (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 text-left ${
                  isCurrent
                    ? 'bg-[#1A3326] border-[#D4AF37] text-white shadow-lg ring-2 ring-[#D4AF37]/50 scale-102'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800 shadow-2xs hover:bg-gray-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isCurrent ? 'bg-[#D4AF37] text-[#1A3326]' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  D{d}
                </div>
                <div>
                  <span className="text-xs font-bold block leading-none">Day {d}</span>
                  <span className={`text-[10px] font-medium block truncate max-w-[110px] mt-0.5 ${
                    isCurrent ? 'text-[#D4AF37]' : 'text-gray-500'
                  }`}>
                    {d === 1 ? 'Arrival' : d === days.length ? 'Farewell' : 'Exploration'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. ACTIVE DAY VISUAL STORYTELLING PAGE */}
        {/* ========================================================================= */}
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Day Destination Cover Photo Banner (Arched top or full bleed) */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl h-64 sm:h-80 md:h-96 bg-gray-900 group">
            <img 
              src={activeDestinationInfo.img} 
              alt={activeDestinationInfo.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Click to expand lightbox button */}
            <button
              onClick={() => openLightbox([activeDestinationInfo.img, ...activeDestinationInfo.gallery], 0)}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition"
            >
              <Compass size={13} /> Open Day Gallery
            </button>

            {/* Overlay Day Title */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-[#1A3326] font-extrabold text-xs uppercase tracking-wider">
                  Day {currentDay} of {days.length}
                </span>
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1">
                  <MapPin size={12} className="text-[#D4AF37]" /> {activeDestinationInfo.name}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                {activeDestinationInfo.name} Experience
              </h3>

              <p className="text-xs sm:text-sm text-gray-200 max-w-2xl line-clamp-2 sm:line-clamp-none font-medium">
                {activeDestinationInfo.desc}
              </p>
            </div>
          </div>

          {/* Activities Timeline Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Excursions & Experiences */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl p-5 md:p-7 border border-gray-200/80 shadow-md space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                      Programmed Highlights
                    </span>
                    <h4 className="text-lg font-serif font-bold text-gray-900">
                      Day {currentDay} Experiences
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200">
                    {dayActivities.length} Included
                  </span>
                </div>

                {dayActivities.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-600 space-y-2">
                    <Compass size={28} className="mx-auto text-emerald-800" />
                    <h5 className="font-serif font-bold text-gray-900 text-base">Leisure & Sanctuary Time</h5>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Enjoy a relaxed day at your lodge, indulge in wellness therapies, or consult your private chauffeur for spontaneous scenic drives.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dayActivities.map((act) => {
                      const libMatch = experienceLibrary.find(i => i.name === act.name);
                      const actHero = act.heroImage || libMatch?.featuredImage || SOUTH_AFRICA_DESTINATION_HEROES[2];
                      const actGallery = act.gallery && act.gallery.length > 0 
                        ? act.gallery 
                        : libMatch?.images && libMatch.images.length > 0 
                          ? libMatch.images 
                          : [actHero];

                      return (
                        <div key={act.id} className="bg-[#FAF9F6] rounded-2xl p-4 md:p-6 border border-gray-200/80 space-y-4 shadow-xs">
                          
                          {/* Slot header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-[#1A3326] text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider">
                                {act.slot}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Clock size={13} className="text-emerald-700" /> {act.start || '10:00 AM'} ({act.dur || 'Half Day'})
                              </span>
                            </div>

                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                              ✓ VIP Private Excursion
                            </span>
                          </div>

                          {/* Large / Medium Activity Photo (Tap to expand) */}
                          <div 
                            onClick={() => openLightbox([actHero, ...actGallery], 0)}
                            className="w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-gray-200 relative cursor-pointer group shadow-sm"
                          >
                            <img 
                              src={actHero} 
                              alt={act.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = SOUTH_AFRICA_DESTINATION_HEROES[0];
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1">
                              <Compass size={12} className="text-[#D4AF37]" /> Tap to view photos
                            </div>
                          </div>

                          {/* Activity Details */}
                          <div className="space-y-2">
                            <h5 className="text-lg font-serif font-bold text-gray-900 leading-snug">
                              {act.name}
                            </h5>
                            
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                              {act.desc || libMatch?.luxuryDescription || 'Exclusive private guided excursion customized for your party with premium access and dedicated specialist guide.'}
                            </p>

                            {/* Meeting point */}
                            {act.pickupLoc && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium pt-1">
                                <MapPin size={13} className="text-[#D4AF37] shrink-0" />
                                <span>Meeting / Departure: <strong>{act.pickupLoc}</strong></span>
                              </div>
                            )}

                            {/* Inclusions */}
                            {act.inc && act.inc.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {act.inc.map((inc, k) => (
                                  <span key={k} className="text-[10px] px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-800 font-medium flex items-center gap-1">
                                    <Check size={11} className="text-emerald-700" /> {inc}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Gallery Thumbnails Strip (Tap any thumbnail to open lightbox!) */}
                            {actGallery.length > 1 && (
                              <div className="pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                                  Experience Photo Gallery (Tap to expand)
                                </span>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                  {actGallery.map((thumbUrl, tIdx) => (
                                    <div
                                      key={tIdx}
                                      onClick={() => openLightbox(actGallery, tIdx)}
                                      className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 hover:border-[#D4AF37] cursor-pointer group relative shadow-2xs"
                                    >
                                      <img src={thumbUrl} alt={`Gallery ${tIdx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Accommodation & Transfers */}
            <div className="space-y-4">
              
              {/* Accommodation Card */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-200/80 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <Hotel size={16} className="text-[#D4AF37]" /> Your Accommodation
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Confirmed
                  </span>
                </div>

                {state.rooms[0] ? (
                  <div className="space-y-3">
                    <div 
                      onClick={() => openLightbox(state.rooms[0].propertyImages || [SOUTH_AFRICA_DESTINATION_HEROES[1]], 0)}
                      className="h-44 rounded-2xl overflow-hidden bg-gray-100 relative cursor-pointer group shadow-xs"
                    >
                      <img 
                        src={state.rooms[0].propertyImages?.[0] || SOUTH_AFRICA_DESTINATION_HEROES[1]} 
                        alt={state.rooms[0].hotel} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        {state.rooms[0].nights} Nights Stay
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        Tap for Photos
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-gray-900 text-base">{state.rooms[0].hotel}</h4>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.rooms[0].hotel + ' South Africa')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4AF37] hover:text-[#1A3326] transition text-xs font-bold flex items-center gap-0.5"
                          title="Open in Google Maps"
                        >
                          <MapPin size={13} /> Maps
                        </a>
                      </div>
                      
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        {state.rooms[0].roomType} • {state.rooms[0].meal} Basis
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Check-In:</span>
                        <strong className="text-gray-800">{state.rooms[0].cin}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Check-Out:</span>
                        <strong className="text-gray-800">{state.rooms[0].cout}</strong>
                      </div>
                    </div>

                    {/* Room Gallery Thumbnails */}
                    {state.rooms[0].propertyImages && state.rooms[0].propertyImages.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {state.rooms[0].propertyImages.map((pImg, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => openLightbox(state.rooms[0].propertyImages!, pIdx)}
                            className="w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-200 cursor-pointer hover:border-[#D4AF37]"
                          >
                            <img src={pImg} alt="Hotel thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Luxury stay details confirmed in your master dossier.</p>
                )}
              </div>

              {/* Private Transfers Journey Segment */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                  <Car size={15} className="text-emerald-800" /> Private Transfers
                </div>

                <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-gray-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>VIP Ground Chauffeur</span>
                    <span className="text-emerald-800 text-[11px]">Included</span>
                  </div>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Dedicated luxury Mercedes vehicle and professional English-speaking chauffeur on standby for all scheduled movements.
                  </p>
                </div>
              </div>

              {/* Dedicated Concierge Message Desk */}
              <div id="concierge-chat" className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-gray-900 text-sm">24/7 VIP Concierge</h5>
                    <p className="text-[10px] text-gray-500">{consultantName}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Request dining reservations, schedule adjustments, or special preferences.
                </p>

                {chatSent ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                    Request received. Elena is attending to your request.
                  </div>
                ) : (
                  <form onSubmit={handleSendConciergeChat} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1A3326] focus:bg-white resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#1A3326] hover:bg-[#234533] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                    >
                      <Send size={13} /> Dispatch to Concierge
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. ESSENTIAL TRAVEL INFORMATION ACCORDIONS */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-10 space-y-4">
        
        <div>
          <span className="text-[10px] font-serif font-bold uppercase tracking-[0.25em] text-[#D4AF37] block">
            ESSENTIAL INFORMATION
          </span>
          <h3 className="text-xl font-serif font-bold text-[#1A3326]">
            Travel Notes & Guest Essentials
          </h3>
        </div>

        <div className="space-y-2.5">
          
          {/* Destination Guide */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleInfo('destination')}
              className="w-full p-4 text-left flex items-center justify-between font-serif font-bold text-gray-900 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                <Compass size={16} className="text-[#D4AF37]" /> Destination Guide & Etiquette
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.destination ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.destination && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-2">
                <p>South Africa combines world-class urban sophistication with wild untamed wilderness. English is widely spoken throughout all luxury lodges, restaurants, and guided excursions.</p>
                <p>Private game drives follow strict conservation etiquette: always remain seated in the open 4x4 vehicles and follow your tracker’s instructions for animal encounters.</p>
              </div>
            )}
          </div>

          {/* Weather & Climate */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleInfo('weather')}
              className="w-full p-4 text-left flex items-center justify-between font-serif font-bold text-gray-900 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                <Sun size={16} className="text-[#D4AF37]" /> Weather & Seasonal Climate
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.weather ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.weather && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-2">
                <p>Cape Town features a Mediterranean climate with warm sunny days and cool Atlantic breezes. Kruger Safari regions feature pleasant warm daytime temperatures (24–28°C) with brisk early morning game drive chills.</p>
              </div>
            )}
          </div>

          {/* Currency & Gratuities */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleInfo('currency')}
              className="w-full p-4 text-left flex items-center justify-between font-serif font-bold text-gray-900 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                <DollarSign size={16} className="text-[#D4AF37]" /> Currency & Payment Tips
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.currency ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.currency && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-2">
                <p>The local currency is the South African Rand (ZAR). Visa, Mastercard, and American Express are seamlessly accepted across all luxury properties, boutiques, and fine dining venues.</p>
                <p>Tipping at restaurants is customary at 10%–15% for exceptional service. Safari ranger and tracker gratuity envelopes are provided directly at your lodge.</p>
              </div>
            )}
          </div>

          {/* Packing Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleInfo('packing')}
              className="w-full p-4 text-left flex items-center justify-between font-serif font-bold text-gray-900 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                <Luggage size={16} className="text-[#D4AF37]" /> Packing Advice & Safari Attire
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.packing ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.packing && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Neutral earthy tones (khaki, olive, beige) for bushveld game drives.</li>
                  <li>Light windproof jacket or fleece for morning drives and coastal boat cruises.</li>
                  <li>Polarized sunglasses, wide-brim sunhat, and high SPF protection.</li>
                  <li>Smart casual attire for Cape Town fine dining and wine tastings.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Emergency & Concierge Contacts */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleInfo('emergency')}
              className="w-full p-4 text-left flex items-center justify-between font-serif font-bold text-gray-900 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                <Shield size={16} className="text-[#D4AF37]" /> 24/7 Emergency & VIP Hotline
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.emergency ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.emergency && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-3">
                <p>For immediate assistance during your trip, your dedicated travel team is on standby 24 hours a day.</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${consultantPhone}`}
                    className="px-3.5 py-2 rounded-xl bg-[#1A3326] text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone size={13} className="text-[#D4AF37]" /> Call Concierge ({consultantPhone})
                  </a>
                  <a
                    href={`mailto:${consultantEmail}`}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold flex items-center gap-1.5 hover:bg-gray-200"
                  >
                    <Mail size={13} /> Email ({consultantEmail})
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </section>

      {/* Floating Bottom Quick Concierge Bar on Mobile */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#1A3326]/95 backdrop-blur-md rounded-2xl p-2.5 border border-[#D4AF37]/30 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 pl-1.5">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
            <Shield size={15} />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block leading-none">VIP Concierge</span>
            <span className="text-xs font-bold text-white block leading-tight">{consultantName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${consultantPhone}`}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#1A3326] text-xs font-extrabold flex items-center gap-1 active:scale-95 shadow-sm"
          >
            <Phone size={12} /> Call
          </a>
          <button
            onClick={() => scrollToSection('concierge-chat')}
            className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold flex items-center gap-1 active:scale-95 border border-white/20"
          >
            <MessageSquare size={12} /> Message
          </button>
        </div>
      </div>

      {/* Interactive Full-Screen Image Lightbox Modal */}
      <ImageLightbox
        isOpen={lightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxInitialIdx}
        onClose={() => setLightboxOpen(false)}
      />

    </div>
  );
};

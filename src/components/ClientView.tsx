import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, ExperienceLibraryItem } from '../types';
import { getClientTripView } from '../utils/roleFiltering';
import { createArchitecturalFallbackDataUri } from '../utils/pdfExportEngine';
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
  HeartHandshake,
  Printer,
  Download
} from 'lucide-react';

interface Props {
  state: AppState;
  onBackToWorkspace?: () => void;
  onBackToAdmin?: () => void;
}

export const ClientView: React.FC<Props> = ({ state: rawState, onBackToWorkspace, onBackToAdmin }) => {
  const handleBack = onBackToAdmin || onBackToWorkspace;

  // Role-based security filtering (removes supplier costs, margins, and operational notes)
  const state = useMemo(() => getClientTripView(rawState), [rawState]);

  const [activeDay, setActiveDay] = useState<number>(1);
  const [heroSlideIdx, setHeroSlideIdx] = useState<number>(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatSent, setChatSent] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
      if (typeof img === 'string') return { url: img, title: 'Itinerary image' };
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
    const dList = Array.from(new Set(state.activities.filter(a => a.status !== 'Cancelled').map(a => a.day)))
      .map(Number)
      .sort((a, b) => a - b);
    return dList.length > 0 ? dList : [1];
  }, [state.activities]);

  const currentDay = activeDay || days[0];

  const dayActivities = useMemo(() => {
    return state.activities.filter(a => a.day === currentDay && a.status !== 'Cancelled').sort((a, b) => {
      return (a.start || '').localeCompare(b.start || '');
    });
  }, [currentDay, state.activities]);

  // Destination resolver for current day
  const activeDestinationInfo = useMemo(() => {
    const primaryActivity = dayActivities.find(activity => Boolean((activity.destination || activity.venue || '').trim())) || dayActivities[0];
    const locationStr = (primaryActivity?.destination || primaryActivity?.venue || '').trim();
    const experienceMatch = primaryActivity
      ? experienceLibrary.find(item => item.name.toLowerCase() === primaryActivity.name.toLowerCase())
      : undefined;
    const normalizedLocation = locationStr.toLowerCase();
    const libMatch = normalizedLocation
      ? destinationLibrary.find(destination => {
          const name = destination.name.toLowerCase();
          const region = (destination.region || '').toLowerCase();
          return normalizedLocation === name ||
            normalizedLocation.includes(name) ||
            name.includes(normalizedLocation) ||
            (region.length > 2 && normalizedLocation.includes(region));
        })
      : undefined;

    if (libMatch) {
      return {
        name: libMatch.name,
        desc: primaryActivity?.clientDescription || primaryActivity?.desc || libMatch.overview || 'Destination details will be confirmed by Viemma Tours.',
        img: primaryActivity?.heroImage || experienceMatch?.featuredImage || libMatch.featuredImage || libMatch.images?.[0] || '',
        gallery: primaryActivity?.gallery?.length ? primaryActivity.gallery : experienceMatch?.images?.length ? experienceMatch.images : libMatch.images || []
      };
    }

    const fallbackName = locationStr || primaryActivity?.name || 'Day at a glance';
    const fallbackDescription = primaryActivity?.clientDescription || primaryActivity?.desc ||
      'Confirmed activity and destination details will appear here when they are added to the itinerary.';
    return {
      name: fallbackName,
      desc: fallbackDescription,
      img: primaryActivity?.heroImage || experienceMatch?.featuredImage || experienceMatch?.images?.[0] || '',
      gallery: primaryActivity?.gallery?.length ? primaryActivity.gallery : experienceMatch?.images || []
    };
  }, [dayActivities, destinationLibrary, experienceLibrary]);

  // Build the route overview only from destinations and stays saved on this trip.
  // Never infer a route from trip length alone.
  const destinationStops = useMemo(() => {
    const byLocation = new Map<string, { name: string; minDay: number; maxDay: number; img: string; kind: 'Experience' | 'Stay' }>();
    const addStop = (nameValue: string, dayValue: number, imageValue: string, kind: 'Experience' | 'Stay') => {
      const name = (nameValue || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase();
      const current = byLocation.get(key);
      const safeDay = Math.max(1, dayValue || 1);
      if (current) {
        current.minDay = Math.min(current.minDay, safeDay);
        current.maxDay = Math.max(current.maxDay, safeDay);
        if (!current.img && imageValue) current.img = imageValue;
      } else {
        byLocation.set(key, { name, minDay: safeDay, maxDay: safeDay, img: imageValue || '', kind });
      }
    };

    (state.activities || [])
      .filter(activity => activity.status !== 'Cancelled')
      .forEach(activity => {
        const location = activity.destination || activity.venue || '';
        if (!location.trim()) return;
        const dest = destinationLibrary.find(item => {
          const a = location.toLowerCase();
          const b = item.name.toLowerCase();
          return a === b || a.includes(b) || b.includes(a);
        });
        const experience = experienceLibrary.find(item => item.name === activity.name);
        const image = activity.heroImage || experience?.featuredImage || experience?.images?.[0] || dest?.featuredImage || dest?.images?.[0] || '';
        addStop(location, activity.day || 1, image, 'Experience');
      });

    (state.rooms || [])
      .filter(room => room.status !== 'Cancelled' && Boolean(room.hotel?.trim()))
      .forEach(room => {
        let day = 1;
        if (state.client?.startDate && room.cin) {
          const startDate = new Date(state.client.startDate);
          const checkInDate = new Date(room.cin);
          if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(checkInDate.getTime())) {
            day = Math.floor((checkInDate.getTime() - startDate.getTime()) / 86400000) + 1;
          }
        }
        const image = room.propertyImages?.[0] || '';
        addStop(room.hotel, day, image, 'Stay');
      });

    return Array.from(byLocation.values())
      .filter(stop => Boolean(stop.img))
      .sort((a, b) => a.minDay - b.minDay || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map(stop => ({
        name: stop.name,
        dayRange: stop.minDay === stop.maxDay ? `Day ${stop.minDay} · ${stop.kind}` : `Days ${stop.minDay}–${stop.maxDay} · ${stop.kind}`,
        img: stop.img
      }));
  }, [state.activities, state.rooms, state.client?.startDate, destinationLibrary, experienceLibrary]);

  // Hero carousel slides
  const heroSlides = useMemo(() => {
    const custom = state.editorial?.heroImageUrl?.trim();
    const activityImages = (state.activities || [])
      .filter(activity => activity.status !== 'Cancelled' && activity.status !== 'Draft' && activity.status !== 'Requested')
      .flatMap(activity => [activity.heroImage, ...(activity.gallery || [])]);
    const accommodationImages = (state.rooms || [])
      .filter(room => room.status !== 'Cancelled')
      .flatMap(room => room.propertyImages || []);
    const realImages = Array.from(new Set([custom, ...activityImages, ...accommodationImages]
      .filter((url): url is string => Boolean(url && url.trim())))).slice(0, 4);
    return realImages.length > 0
      ? realImages
      : [createArchitecturalFallbackDataUri(state.title || 'Viemma Tours itinerary', 'hero')];
  }, [state.editorial?.heroImageUrl, state.activities, state.rooms, state.title]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const consultantName = state.consultant?.trim() || 'Viemma Tours';
  const consultantRole = state.consultantRole?.trim() || 'Travel Concierge';
  const consultantPhone = state.consultantPhone?.trim() || '';
  const consultantEmail = state.consultantEmail?.trim() || '';
  const consultantAvatar = state.consultantAvatar?.trim() || '';

  const handleSendConciergeChat = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatMessage.trim();
    if (!message) return;
    setChatError(null);
    if (!consultantEmail) {
      setChatError('Direct email is not configured for this itinerary. Please use the contact details provided by Viemma Tours.');
      return;
    }
    const subject = encodeURIComponent(`Itinerary request — ${state.title || state.ref}`);
    const body = encodeURIComponent(`Trip: ${state.title || state.ref}\nClient: ${state.client?.name || 'Client'}\n\nRequest:\n${message}`);
    window.location.href = `mailto:${consultantEmail}?subject=${subject}&body=${body}`;
    setChatSent(true);
    setChatMessage('');
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

            {state.publishing?.settings?.allowPrinting !== false && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#1A3326] text-[11px] font-bold border border-slate-200 transition"
                title="Open print dialog"
              >
                <Printer size={12} /> Print
              </button>
            )}
            {state.publishing?.settings?.allowDownloads !== false && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29d2b] text-[#1A3326] text-[11px] font-bold transition"
                title="Use the print dialog to save the itinerary as PDF"
              >
                <Download size={12} /> Save PDF
              </button>
            )}
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
              {state.title || `${state.client.name || 'Your'} Journey`}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-200 font-medium leading-relaxed max-w-xl drop-shadow-md">
              {state.editorial?.tagline || "A thoughtfully planned itinerary built around your travel preferences and confirmed arrangements."}
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
                  {consultantAvatar ? (
                    <img src={consultantAvatar} alt={consultantName} className="w-full h-full object-cover" onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full bg-[#1A3326] text-[#D4AF37] flex items-center justify-center"><Users size={18} /></div>
                  )}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block leading-none">Curated By</span>
                  <span className="text-xs font-bold text-white block leading-tight">{consultantName}</span>
                  <span className="text-[10px] text-gray-300">{consultantRole}</span>
                </div>
              </div>
            </div>

            {state.clientPricing && (
              <div className="rounded-2xl border border-[#D4AF37]/40 bg-white/10 backdrop-blur-md p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37] block">Approved Journey Price</span>
                  <span className="text-xs text-gray-200 block mt-1">{state.clientPricing.paymentTerms || 'Pricing as per the approved quotation.'}</span>
                </div>
                <strong className="text-xl md:text-2xl font-bold text-white shrink-0">
                  {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: state.clientPricing.currency || 'ZAR', maximumFractionDigits: 0 }).format(state.clientPricing.total)}
                </strong>
              </div>
            )}

            {/* Destination Milestone Timeline (Circular badges as in Screen 3) */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
                Destination Route & Stays
              </span>

              {destinationStops.length === 0 ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-xs text-gray-300">
                  Destination stops will appear here when the programme contains confirmed venue or accommodation details.
                </div>
              ) : (
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
              )}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 bg-gradient-to-br from-slate-800 to-[#1A3326]">
              <Compass size={30} className="text-[#D4AF37]" />
              <span className="text-xs font-semibold">Destination image not provided</span>
            </div>
            {activeDestinationInfo.img && (
              <img
                src={activeDestinationInfo.img}
                alt={activeDestinationInfo.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Click to expand lightbox button */}
            {(activeDestinationInfo.img || activeDestinationInfo.gallery.length > 0) && (
              <button
                onClick={() => openLightbox([activeDestinationInfo.img, ...activeDestinationInfo.gallery].filter(Boolean), 0)}
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition"
              >
                <Compass size={13} /> Open Day Gallery
              </button>
            )}

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
                {state.dayTitles?.[currentDay] || (activeDestinationInfo.name === 'Day at a glance' ? 'Programme for the day' : `${activeDestinationInfo.name} Experience`)}
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
                      const actHero = act.heroImage || libMatch?.featuredImage || libMatch?.images?.[0] || '';
                      const actGallery = act.gallery && act.gallery.length > 0
                        ? act.gallery
                        : libMatch?.images && libMatch.images.length > 0
                          ? libMatch.images
                          : actHero ? [actHero] : [];
                      const activityStatusLabel = act.status === 'Confirmed' ? 'Confirmed'
                        : act.status === 'Postponed' ? 'Postponed'
                        : act.status === 'Completed' ? 'Completed'
                        : act.status === 'Draft' ? 'Draft'
                        : 'Scheduled';

                      return (
                        <div key={act.id} className="bg-[#FAF9F6] rounded-2xl p-4 md:p-6 border border-gray-200/80 space-y-4 shadow-xs">
                          
                          {/* Slot header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-[#1A3326] text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider">
                                {act.slot}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Clock size={13} className="text-emerald-700" /> {act.start || 'Time to be confirmed'}{act.endTime ? `–${act.endTime}` : ''} ({act.dur || 'Duration to be confirmed'})
                              </span>
                            </div>

                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                              {activityStatusLabel}
                            </span>
                          </div>

                          {/* Large / Medium Activity Photo (Tap to expand) */}
                          <div
                            onClick={() => { if (actHero || actGallery.length > 0) openLightbox([actHero, ...actGallery].filter(Boolean), 0); }}
                            className={`w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-gray-200 relative group shadow-sm ${actHero || actGallery.length > 0 ? 'cursor-pointer' : ''}`}
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                              <Compass size={26} className="text-[#1A3326]" />
                              <span className="text-xs font-semibold">Activity photo not provided</span>
                            </div>
                            {actHero && (
                              <img
                                src={actHero}
                                alt={act.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors pointer-events-none" />
                            {(actHero || actGallery.length > 0) && (
                              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1">
                                <Compass size={12} className="text-[#D4AF37]" /> Tap to view photos
                              </div>
                            )}
                          </div>

                          {/* Activity Details */}
                          <div className="space-y-2">
                            <h5 className="text-lg font-serif font-bold text-gray-900 leading-snug">
                              {act.name}
                            </h5>
                            
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                              {act.desc || libMatch?.luxuryDescription || 'Description to be confirmed by Viemma Tours.'}
                            </p>

                            {/* Meeting point */}
                            {act.pickupLoc && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium pt-1">
                                <MapPin size={13} className="text-[#D4AF37] shrink-0" />
                                <span>Meeting / Departure: <strong>{act.pickupLoc}</strong></span>
                              </div>
                            )}

                            {act.venue && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium pt-1">
                                <MapPin size={13} className="text-[#D4AF37] shrink-0" />
                                <span>Venue: <strong>{act.venue}</strong></span>
                              </div>
                            )}

                            {act.groupNames && act.groupNames.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned group(s):</span>
                                {act.groupNames.map(groupName => (
                                  <span key={groupName} className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">{groupName}</span>
                                ))}
                              </div>
                            )}

                            {(() => {
                              const groupNames = act.groupNames?.length
                                ? act.groupNames
                                : (state.namedGroups || []).filter(g => (act.groupIds || []).includes(g.id)).map(g => g.name);
                              return groupNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 self-center">Assigned group(s)</span>
                                  {groupNames.map(groupName => <span key={groupName} className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">{groupName}</span>)}
                                </div>
                              ) : null;
                            })()}

                            {act.supplier && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium pt-1">
                                <Info size={13} className="text-[#D4AF37] shrink-0" />
                                <span>Supplier: <strong>{act.supplier}</strong>{act.supPhone ? ` · ${act.supPhone}` : ''}</span>
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
                    {state.rooms[0].status || 'Status to be confirmed'}
                  </span>
                </div>

                {state.rooms[0] ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => {
                        const images = (state.rooms[0].propertyImages || []).filter(Boolean);
                        if (images.length > 0) openLightbox(images, 0);
                      }}
                      className={`h-44 rounded-2xl overflow-hidden bg-gray-100 relative group shadow-xs ${state.rooms[0].propertyImages?.some(Boolean) ? 'cursor-pointer' : ''}`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                        <Hotel size={24} className="text-[#1A3326]" />
                        <span className="text-xs font-semibold">Accommodation photo not provided</span>
                      </div>
                      {state.rooms[0].propertyImages?.[0] && (
                        <img
                          src={state.rooms[0].propertyImages[0]}
                          alt={state.rooms[0].hotel}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        {state.rooms[0].nights} Nights Stay
                      </span>
                      {state.rooms[0].propertyImages?.some(Boolean) && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                          Tap for Photos
                        </span>
                      )}
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
                    <h5 className="font-serif font-bold text-gray-900 text-sm">Contact Viemma Tours</h5>
                    <p className="text-[10px] text-gray-500">{consultantName}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Prepare an email request for dining reservations, schedule adjustments, or other trip preferences.
                </p>

                {chatSent && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                    Your email application should open with a prepared draft. Send that email to submit the request.
                  </div>
                )}
                {chatError && <p role="alert" className="text-xs text-rose-700">{chatError}</p>}
                <form onSubmit={handleSendConciergeChat} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Type your request..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1A3326] focus:bg-white resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1A3326] hover:bg-[#234533] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <Send size={13} /> Prepare Email Request
                  </button>
                </form>
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
                <p>Local customs, language and etiquette vary by destination. Review the activity and destination notes included in your itinerary, and ask your guide or concierge to clarify any arrangements before departure.</p>
                <p>For guided excursions, follow the instructions provided by your guide and the venue or activity operator. Any activity-specific requirements recorded for this trip appear alongside the scheduled experience.</p>
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
                {state.activities.filter(activity => activity.status !== 'Cancelled' && activity.status !== 'Draft' && activity.status !== 'Requested' && activity.weatherDependency?.trim()).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {state.activities.filter(activity => activity.status !== 'Cancelled' && activity.status !== 'Draft' && activity.status !== 'Requested' && activity.weatherDependency?.trim()).map(activity => (
                      <li key={activity.id}><strong>{activity.name}:</strong> {activity.weatherDependency}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No activity-specific weather requirements have been recorded for this itinerary. Check the local forecast for each destination shortly before travel.</p>
                )}
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
                <p>Use the currency and payment terms in your approved quotation. Local cash requirements, card acceptance and tipping practices vary by destination and supplier.</p>
                <p>Before departure, confirm any cash needs and payment methods with Viemma, your accommodation or your guide. Do not rely on an assumed exchange rate or a payment method being accepted everywhere.</p>
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
                <Luggage size={16} className="text-[#D4AF37]" /> Activity Packing & Dress Notes
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.packing ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.packing && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-2">
                {state.activities.filter(activity => activity.status !== 'Cancelled' && activity.status !== 'Draft' && activity.status !== 'Requested' && (activity.packingAdvice?.trim() || activity.dressCode?.trim() || activity.safetyNotes?.trim())).length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {state.activities.filter(activity => activity.status !== 'Cancelled' && activity.status !== 'Draft' && activity.status !== 'Requested' && (activity.packingAdvice?.trim() || activity.dressCode?.trim() || activity.safetyNotes?.trim())).map(activity => (
                      <li key={activity.id}>
                        <strong>{activity.name}:</strong>
                        {activity.packingAdvice?.trim() && <span> Packing: {activity.packingAdvice}</span>}
                        {activity.dressCode?.trim() && <span> Dress: {activity.dressCode}</span>}
                        {activity.safetyNotes?.trim() && <span> Safety: {activity.safetyNotes}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No activity-specific packing, dress or safety notes have been added to this itinerary yet. Confirm any special requirements with Viemma before departure.</p>
                )}
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
                <Shield size={16} className="text-[#D4AF37]" /> Concierge & Emergency Contact
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${expandedInfo.emergency ? 'rotate-180' : ''}`} />
            </button>
            {expandedInfo.emergency && (
              <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 space-y-3">
                <p>Use the contact details entered for this itinerary. If no direct phone or email is listed, contact Viemma Tours through your agreed communication channel.</p>
                <div className="flex flex-wrap gap-2">
                  {consultantPhone && (
                    <a
                      href={`tel:${consultantPhone}`}
                      className="px-3.5 py-2 rounded-xl bg-[#1A3326] text-white font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone size={13} className="text-[#D4AF37]" /> Call Concierge
                    </a>
                  )}
                  {consultantEmail && (
                    <a
                      href={`mailto:${consultantEmail}`}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold flex items-center gap-1.5 hover:bg-gray-200"
                    >
                      <Mail size={13} /> Email Concierge
                    </a>
                  )}
                  {!consultantPhone && !consultantEmail && <span className="text-amber-800">No direct contact details have been supplied for this itinerary.</span>}
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

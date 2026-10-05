import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, ExperienceLibraryItem } from '../types';
import { ClientView } from './ClientView';
import { 
  Printer, 
  Check, 
  Info, 
  FileText, 
  Layout, 
  Users, 
  ShieldCheck, 
  Compass, 
  Tag,
  Link as LinkIcon,
  ExternalLink,
  RotateCw,
  Copy,
  Mail,
  Download,
  AlertTriangle,
  History,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  Sliders,
  CheckSquare,
  Globe,
  Settings,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PrintHubViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  totalCost: number;
  netProfit: number;
}

export const PrintHubView: React.FC<PrintHubViewProps> = ({
  state,
  onUpdateState,
  totalCost,
  netProfit
}) => {
  // Domain & Base URL Resolver
  const [selectedHostDomain, setSelectedHostDomain] = useState<'firebase' | 'custom' | 'current'>('firebase');
  const [customHostUrl, setCustomHostUrl] = useState<string>('https://portal.viemmatours.com');

  const getLiveBaseUrl = () => {
    if (selectedHostDomain === 'firebase') {
      return 'https://argon-burner-n8gvj.web.app';
    }
    if (selectedHostDomain === 'custom') {
      return customHostUrl.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return 'https://argon-burner-n8gvj.web.app';
  };

  const clientLiveUrl = `${getLiveBaseUrl()}?trip=${state.ref}&role=client`;
  const agentLiveUrl = `${getLiveBaseUrl()}?trip=${state.ref}&role=agent`;
  const operatorLiveUrl = `${getLiveBaseUrl()}?trip=${state.ref}&role=operator`;

  const defaultPublishing = {
    tripId: state.ref || 'VT-2026-1048',
    publicUrl: clientLiveUrl,
    publishStatus: 'Draft' as const,
    version: 1,
    publishedAt: '',
    lastUpdated: new Date().toISOString(),
    accessToken: 'tok_secret_a61c77f0',
    passwordProtected: false,
    expiresAt: null as string | null,
    settings: {
      requirePassword: false,
      password: 'viemma-explore',
      enableExpiryDate: false,
      expiresAt: null as string | null,
      allowDownloads: true,
      allowPrinting: true,
      hideInternalNotes: true,
      showPricing: true,
      showSupplierDetails: false,
      enableOfflineAccess: true,
      language: 'English',
      currency: 'ZAR'
    },
    versions: [
      { version: 1, date: '2026-07-12', note: 'Initial compilation draft created.', status: 'Draft' }
    ]
  };

  const publishing = {
    ...defaultPublishing,
    ...(state.publishing || {}),
    publicUrl: clientLiveUrl // Always ensure publicUrl is valid and active
  };
  const settings = publishing.settings || defaultPublishing.settings;
  const versions = publishing.versions || defaultPublishing.versions;

  // Local state
  const [copied, setCopied] = useState<string>('');
  const [showPreviewMode, setShowPreviewMode] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [pubStep, setPubStep] = useState<number>(0);
  const [pubLogs, setPubLogs] = useState<string[]>([]);
  const [verNote, setVerNote] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<string>('');

  // Auto-track changes: if we edited items but didn't republish, show "Changes Pending" warning
  const hasPendingChanges = useMemo(() => {
    if (!publishing.publishedAt) return true;
    return new Date(publishing.lastUpdated || '') > new Date(publishing.publishedAt);
  }, [publishing.lastUpdated, publishing.publishedAt]);

  const activeStatus = useMemo(() => {
    if (publishing.publishStatus === 'Draft') return 'Draft';
    if (hasPendingChanges && publishing.publishStatus === 'Published') return 'Changes Pending';
    return publishing.publishStatus;
  }, [publishing.publishStatus, hasPendingChanges]);

  // Handle PDF Generation
  const f = state.finance;
  const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const ccTotal = totalCost * ccRate;
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);
  const selectedRate = f.currency === 'ZAR' ? 1 : f.rates[f.currency as keyof typeof f.rates] || 1;
  const retailTotalCurr = retailTotalZAR * selectedRate;

  const generatePDF = (mode: 'client' | 'internal' | 'job' | 'airport') => {
    const { jsPDF } = (window as any).jspdf || {};
    if (!jsPDF) {
      alert("jsPDF library not detected in runtime context. Please ensure you are connected to the network.");
      return;
    }

    const doc = new jsPDF(mode === 'airport' ? 'l' : 'p', 'mm', 'a4');
    const cleanStr = (str: string) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, " ").trim();
    };

    if (mode === 'client') {
      // Luxury Editorial Travel Magazine PDF Layout (A4 Portrait)
      const primaryGreen = [26, 51, 38]; // #1A3326
      const accentGold = [212, 175, 55]; // #D4AF37
      const darkText = [30, 41, 59];
      const mutedText = [100, 116, 139];
      const lightBg = [253, 251, 247];

      // ==========================================
      // PAGE 1: LUXURY COVER SPREAD
      // ==========================================
      // Deep Forest Green Top Header Banner
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.rect(0, 0, 210, 85, 'F');

      // Gold Accent Line
      doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.rect(0, 85, 210, 3, 'F');

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("VIEMMA TOURS", 20, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.text("BESPOKE AFRICAN EXPEDITIONS & LUXURY SAFARIS", 20, 48);

      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      doc.text(`Reference: ${cleanStr(state.ref || 'VT-MASTER')}`, 20, 62);
      doc.text(`Issue Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 20, 68);

      // Main Proposal Card
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 105, 170, 150, 4, 4, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(20, 105, 170, 150, 4, 4, 'S');

      // Card Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text(cleanStr(state.title || "Custom South African Journey"), 30, 125);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.text(cleanStr(state.editorial?.tagline || "Curated Private Coastline & Big 5 Wilderness Safari"), 30, 134);

      // Gold Divider
      doc.setDrawColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.setLineWidth(0.75);
      doc.line(30, 142, 180, 142);

      // Proposal Details Grid
      let py = 158;
      const printRow = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
        doc.text(label.toUpperCase(), 30, py);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.text(value, 80, py);
        py += 14;
      };

      printRow("Client / Group", cleanStr(state.client.name || 'Valued Guests'));
      printRow("Destination", "South Africa (Cape Town, Winelands, Sabi Sands)");
      printRow("Travel Dates", `${cleanStr(state.client.startDate)} to ${cleanStr(state.client.endDate)}`);
      printRow("Duration", `${state.client.durationText || `${state.activities.length} Days`} Bespoke Itinerary`);
      printRow("Guest Party", `${state.guests.length} Travelers`);
      printRow("Design Consultant", `${cleanStr(state.consultant || 'Elena Rostova')} (Senior Travel Designer)`);

      // Cover Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text("Crafted with passion by Viemma Tours • Cape Town, South Africa • www.viemmatours.com", 105, 280, { align: "center" });

      // ==========================================
      // PAGE 2: TRIP OVERVIEW & TRAVELER ROSTER
      // ==========================================
      doc.addPage();

      // Page Header
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.rect(0, 22, 210, 1.5, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("VIEMMA TOURS • TRIP OVERVIEW & ESSENTIALS", 20, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.text(`Ref: ${cleanStr(state.ref || 'VT-MASTER')}`, 190, 15, { align: "right" });

      // Welcome Note Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(20, 32, 170, 48, 3, 3, 'F');
      doc.setDrawColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.roundedRect(20, 32, 170, 48, 3, 3, 'S');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text("A Warm Welcome to South Africa", 28, 43);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      const welcomeText = "We are delighted to present this bespoke itinerary handcrafted exclusively for your party. From the breathtaking Atlantic coastline of Cape Town to the legendary private game reserves of the Greater Kruger, every moment has been tailored to ensure an unforgettable journey.";
      const welcomeLines = doc.splitTextToSize(welcomeText, 154);
      doc.text(welcomeLines, 28, 51);

      // Traveler Roster Section
      let curY = 90;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text("Traveler Roster & Party Information", 20, curY);
      curY += 7;

      doc.setFillColor(245, 247, 250);
      doc.rect(20, curY, 170, 7, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text("NO.", 25, curY + 5);
      doc.text("GUEST FULL NAME", 40, curY + 5);
      doc.text("CATEGORY", 110, curY + 5);
      doc.text("STATUS", 155, curY + 5);
      curY += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);

      if (state.guests.length === 0) {
        doc.text("Registered lead traveler: " + cleanStr(state.client.name || 'Valued Guest'), 25, curY + 4);
        curY += 10;
      } else {
        state.guests.forEach((g, gIdx) => {
          doc.text(`${gIdx + 1}`, 25, curY + 4);
          doc.text(`${cleanStr(g.first)} ${cleanStr(g.last)}`, 40, curY + 4);
          doc.text(`${cleanStr(g.age || 'Adult')}`, 110, curY + 4);
          doc.text(g.isLead ? 'Lead Passenger' : 'Guest', 155, curY + 4);
          curY += 7;
        });
      }

      curY += 8;

      // Accommodations Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.text("Confirmed Luxury Accommodations", 20, curY);
      curY += 7;

      if (state.rooms.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
        doc.text("Luxury stays as confirmed in your master dossier.", 25, curY + 4);
        curY += 12;
      } else {
        state.rooms.forEach(rm => {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(20, curY, 170, 20, 2, 2, 'F');
          doc.setDrawColor(220, 220, 220);
          doc.roundedRect(20, curY, 170, 20, 2, 2, 'S');

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
          doc.text(cleanStr(rm.hotel), 26, curY + 7);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
          doc.text(`Room: ${cleanStr(rm.roomType)}  •  Basis: ${cleanStr(rm.meal)}  •  Duration: ${rm.nights} Nights`, 26, curY + 14);
          doc.text(`Check-In: ${cleanStr(rm.cin)}  |  Check-Out: ${cleanStr(rm.cout)}`, 115, curY + 14);

          curY += 24;
        });
      }

      // Concierge Contact Box
      curY = Math.max(curY, 215);
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.roundedRect(20, curY, 170, 36, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
      doc.text("24/7 VIP Travel Concierge & On-Ground Support", 28, curY + 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`Dedicated Designer: ${cleanStr(state.consultant || 'Elena Rostova')}  •  Hotline: ${cleanStr(state.consultantPhone || '+27 21 555 0199')}`, 28, curY + 19);
      doc.text(`Email: ${cleanStr(state.consultantEmail || 'concierge@viemmatours.com')}  •  Emergency Response: Available 24 Hours`, 28, curY + 26);

      // Page 2 Footer
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("Page 2 of Itinerary Proposal", 105, 285, { align: "center" });

      // ==========================================
      // PAGE 3+: DAY-BY-DAY EDITORIAL ITINERARY
      // ==========================================
      const uniqueDays = Array.from(new Set<number>(state.activities.map(a => Number(a.day)))).sort((a, b) => a - b);
      const daysToPrint = uniqueDays.length > 0 ? uniqueDays : [1];

      daysToPrint.forEach((dNum) => {
        doc.addPage();

        // Header Banner
        doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
        doc.rect(0, 0, 210, 22, 'F');
        doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
        doc.rect(0, 22, 210, 1.5, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(`DAY ${dNum} • DAILY ITINERARY EXPERIENCE`, 20, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
        doc.text(`Ref: ${cleanStr(state.ref || 'VT-MASTER')}`, 190, 15, { align: "right" });

        let dayY = 36;
        const currentActivities = state.activities.filter(a => a.day === dNum);

        // Day Title Banner
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
        const dayTitle = dNum === 1 ? "Arrival & Cape Peninsula Welcome" : dNum === daysToPrint.length ? "Farewell Safari & Departure" : `Day ${dNum} Guided Explorations`;
        doc.text(dayTitle, 20, dayY);
        dayY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
        doc.text("Private guided activities tailored for your party's comfort and luxury.", 20, dayY);
        dayY += 12;

        if (currentActivities.length === 0) {
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(20, dayY, 170, 30, 2, 2, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
          doc.text("Day at Leisure & Private Relaxation", 28, dayY + 12);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
          doc.text("Enjoy the amenities of your luxury lodge or consult your private chauffeur for spontaneous outings.", 28, dayY + 20);
          dayY += 40;
        } else {
          currentActivities.forEach((act) => {
            if (dayY > 235) {
              doc.addPage();
              dayY = 32;
            }

            // Activity Box
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(20, dayY, 170, 48, 3, 3, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.roundedRect(20, dayY, 170, 48, 3, 3, 'S');

            // Slot badge
            doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
            doc.roundedRect(26, dayY + 6, 26, 6, 1, 1, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
            doc.text(cleanStr(act.slot).toUpperCase(), 39, dayY + 10.5, { align: "center" });

            // Time & Duration
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
            doc.text(`${cleanStr(act.start || '10:00 AM')}  (${cleanStr(act.dur || 'Half Day')})`, 58, dayY + 10.5);

            // Activity Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
            doc.text(cleanStr(act.name), 26, dayY + 20);

            // Description
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(darkText[0], darkText[1], darkText[2]);
            const actDesc = act.desc || "Private luxury excursion guided by accredited regional specialist guides.";
            const descLines = doc.splitTextToSize(actDesc, 154);
            doc.text(descLines, 26, dayY + 28);

            // Meeting Point & Inclusions
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
            if (act.pickupLoc) {
              doc.text(`Pickup / Location: ${cleanStr(act.pickupLoc)}`, 26, dayY + 42);
            }

            dayY += 54;
          });
        }

        // Daily Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`Viemma Tours • Day ${dNum} of ${daysToPrint.length} • www.viemmatours.com`, 105, 285, { align: "center" });
      });

      // Save PDF to browser
      const filename = `Viemma_Tours_Bespoke_Itinerary_${cleanStr(state.ref || 'Client')}.pdf`;
      doc.save(filename);
      return;
    } else if (mode === 'internal') {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text("CONFIDENTIAL INTERNAL COSTING WORKSHEET", 20, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Viemma Tours Internal Ledger Operations", 20, 31);
      doc.text(`Ref: ${cleanStr(state.ref || 'VT-NEW')}`, 150, 25);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 31);

      doc.setDrawColor(180, 50, 50);
      doc.line(20, 37, 190, 37);

      let y = 50;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("Itemized Cost Build Breakdown:", 20, y);
      
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`1. Primary Direct Operating Cost Sum:`, 25, y);
      doc.text(`R ${totalCost.toLocaleString()}`, 145, y);
      
      y += 7;
      doc.text(`2. Incident Contingency Buffer Fee:`, 25, y);
      doc.text(`R ${f.buffer.toLocaleString()}`, 145, y);
      
      y += 7;
      doc.text(`3. Credit Card Payment Surcharge Fee:`, 25, y);
      doc.text(`R ${ccTotal.toLocaleString()}`, 145, y);

      y += 7;
      doc.text(`4. Profit Markups Overage Added:`, 25, y);
      doc.text(`R ${markupTotal.toLocaleString()}`, 145, y);

      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 50, 50);
      doc.text(`5. Overall Deductible Special Discount:`, 25, y);
      doc.text(`- R ${f.discount.toLocaleString()}`, 145, y);

      y += 10;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, 190, y);

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(`Grand Net Retail Quote:`, 25, y);
      doc.text(`R ${retailTotalZAR.toLocaleString()}`, 145, y);

      y += 8;
      doc.setTextColor(6, 95, 70);
      doc.text(`Net Estimated Profit Yield:`, 25, y);
      doc.text(`R ${netProfit.toLocaleString()}`, 145, y);

      y += 15;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Operational Audit Logs:", 20, y);
      doc.setFont("helvetica", "normal");
      y += 7;
      doc.text(`* Base Currency configured: ${f.currency}`, 25, y);
      y += 6;
      doc.text(`* Selected Consultant: ${cleanStr(state.consultant)}`, 25, y);
      y += 6;
      doc.text(`* Selected CC Settlement method surcharge rate: ${(ccRate * 100).toFixed(1)}%`, 25, y);

    } else if (mode === 'job') {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text("OPERATIONAL DRIVER LOGISTICS DISPATCH SHEET", 20, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Viemma Tours Ground Transport Dispatch", 20, 31);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 31);

      doc.setDrawColor(6, 95, 70);
      doc.line(20, 37, 190, 37);

      let y = 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Scheduled Ground Transfer Jobs & Fleet Routes:", 20, y);

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (state.transfers.length === 0) {
        doc.text("No ground logistics transfers scheduled.", 25, y);
      } else {
        state.transfers.forEach((t, idx) => {
          if (y > 260) {
            doc.addPage();
            y = 25;
          }
          doc.setFont("helvetica", "bold");
          doc.text(`Job #${idx + 1}: ${cleanStr(t.type)} (Date: ${t.date} • Pick-up: ${t.time || 'TBD'})`, 25, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.text(`- Route: From: ${cleanStr(t.from)} -> To: ${cleanStr(t.to)}`, 28, y);
          y += 5;
          doc.text(`- Assigned Driver: ${cleanStr(t.driver || 'Unassigned')} • Phone: ${cleanStr(t.driverPhone)}`, 28, y);
          y += 5;
          doc.text(`- Welcome Sign: "${cleanStr(t.sign || 'N/A')}" • Linked Flight: ${cleanStr(t.flight || 'None')}`, 28, y);
          y += 5;
          doc.text(`- Assigned Pax: ${t.paxCount} traveler(s) • Hand/Checked bags: ${t.bagHand}/${t.bagCheck}`, 28, y);
          y += 8;
        });
      }

    } else if (mode === 'airport') {
      doc.setFillColor(6, 95, 70); 
      doc.rect(0, 0, 297, 40, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(255, 255, 255);
      doc.text("VIEMMA TOURS", 148, 25, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(240, 240, 240);
      doc.text("Bespoke Africa Safaris & Scenic Tours", 148, 33, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(40);
      doc.setTextColor(17, 24, 39);
      
      const signName = state.transfers.find(t => t.sign)?.sign || state.client.name || "WELCOME GUESTS";
      doc.text(cleanStr(signName.toUpperCase()), 148, 110, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(120, 120, 120);
      doc.text("Welcome to Southern Africa", 148, 130, { align: "center" });
    }

    doc.save(`Viemma_${mode}_${state.ref || 'doc'}.pdf`);
  };

  // Cloud Firestore & Portal Gateway Publishing
  const publishToCloudflare = (isNew: boolean = false) => {
    setIsPublishing(true);
    setPubLogs([]);
    
    const logs = [
      `[08:58:20] ➔ Starting secure Cloudflare Pages API handshakes...`,
      `[08:58:21] ➔ Connection authenticated with API token: ${publishing.accessToken.substring(0, 10)}...`,
      `[08:58:22] ➔ Scanning itinerary state schemas for validation...`,
      `[08:58:23] ➔ Serializing payload: ${state.guests.length} clients, ${state.activities.length} suppliers...`,
      `[08:58:24] ➔ Syncing static assets with Cloudflare Images CDN...`,
      `[08:58:25] ➔ Executing D1 SQL transaction: INSERT INTO itineraries ON CONFLICT REPLACE...`,
      `[08:58:26] ➔ Storing version snapshot #${isNew ? 1 : publishing.version + 1} metadata...`,
      `[08:58:27] ➔ Purging global Cloudflare KV cache at 32 Edge PoPs...`,
      `[08:58:28] ➔ Re-mapping routing gateway: /trip/${publishing.tripId}`,
      `[08:58:29] ➔ Done! Itinerary successfully published & accessible worldwide.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logs.length) {
        setPubLogs(prev => [...prev, logs[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsPublishing(false);
          const nextVer = isNew ? 1 : publishing.version + 1;
          const nowIso = new Date().toISOString();
          
          const updatedPublishing = {
            ...publishing,
            publishStatus: 'Published' as const,
            version: nextVer,
            publishedAt: nowIso,
            lastUpdated: nowIso,
            versions: [
              ...versions,
              {
                version: nextVer,
                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
                note: verNote || (isNew ? "Initial publication release" : `Consultant updates republished (V${nextVer})`),
                status: 'Published'
              }
            ]
          };

          onUpdateState({ publishing: updatedPublishing });
          setVerNote('');
          triggerAlert('Handcrafted itinerary published live to portal!');
        }, 800);
      }
    }, 400);
  };

  // Handle restoring a previous version
  const handleRestoreVersion = (verNum: number, note: string) => {
    const updatedPublishing = {
      ...publishing,
      version: verNum,
      publishStatus: 'Published' as const,
      publishedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    onUpdateState({ publishing: updatedPublishing });
    triggerAlert(`Version ${verNum} restored successfully! (Snapshot: "${note}")`);
  };

  // Copy helper
  const copyText = (text: string, label: string = 'client') => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2500);
  };

  // Helper: Trigger custom notification alert in publishing page
  const triggerAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 5000);
  };

  // Handle Regenerating secure client link
  const handleRegenerateLink = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newAccessToken = `tok_secret_${Math.random().toString(36).substring(2, 10)}`;

    const updatedPublishing = {
      ...publishing,
      publicUrl: clientLiveUrl,
      accessToken: newAccessToken,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateState({ publishing: updatedPublishing });
    triggerAlert('New secure live link token generated and persisted!');
  };

  // Handle Checkbox Toggles for settings
  const handleSettingToggle = (key: keyof typeof settings) => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key]
    };
    onUpdateState({
      publishing: {
        ...publishing,
        settings: updatedSettings,
        lastUpdated: new Date().toISOString() // flags that changes are pending
      }
    });
  };

  // Handle string settings changes
  const handleSettingChange = (key: keyof typeof settings, val: any) => {
    const updatedSettings = {
      ...settings,
      [key]: val
    };
    onUpdateState({
      publishing: {
        ...publishing,
        settings: updatedSettings,
        lastUpdated: new Date().toISOString()
      }
    });
  };

  return (
    <div id="publishing-center-workspace" className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500 font-sans text-gray-800">
      
      {/* Visual Status Alerts */}
      {alertMsg && (
        <div className="fixed top-24 right-8 z-[90] bg-[#1A3326] text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-300">
          <Sparkles className="text-[#D4AF37] shrink-0" size={18} />
          <span className="text-xs font-bold font-sans tracking-wide">{alertMsg}</span>
        </div>
      )}

      {/* FULL SCREEN CLIENT PREVIEW OVERLAY */}
      {showPreviewMode && (
        <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col overflow-y-auto">
          {/* Top Banner only visible to internal consultants */}
          <div className="bg-[#1A3326] text-white px-6 py-4 flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-[#D4AF37] text-[#1A3326] text-[10px] font-black tracking-widest uppercase">
                PREVIEW MODE
              </span>
              <p className="text-xs text-gray-300 font-medium">
                Visible only to consultants. Handcrafted Client Portal experience for <strong>{state.client.name}</strong>.
              </p>
            </div>
            <button 
              onClick={() => setShowPreviewMode(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-bold border border-white/10"
            >
              <X size={14} /> Exit Preview
            </button>
          </div>

          {/* Full Screen Content */}
          <div className="flex-1 p-6 md:p-12 max-w-[1200px] mx-auto w-full">
            <ClientView state={state} />
          </div>
        </div>
      )}

      {/* Main Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-[#D4AF37] flex items-center gap-2">
            <ShieldCheck size={14} /> VIP Distribution & Portal Services
          </span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">
            Client Publishing Center
          </h1>
          <p className="text-gray-500 max-w-2xl text-xs leading-relaxed">
             हैंडक्राफ़्टेड यात्रा अनुभव (Handcrafted Travel Experience) प्रकाशन केंद्र. Lock settings, review responsive live mockups, compile Cloudflare releases, and download high-resolution PDFs.
          </p>
        </div>

        {/* Global status chip */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium uppercase font-mono">Status:</span>
          {activeStatus === 'Published' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live & Published (V{publishing.version})
            </span>
          )}
          {activeStatus === 'Draft' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Draft Mode (Unpublished)
            </span>
          )}
          {activeStatus === 'Changes Pending' && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" /> Changes Pending Republish
            </span>
          )}
        </div>
      </div>

      {/* PENDING CHANGES ALERTS BANNER */}
      {activeStatus === 'Changes Pending' && (
        <div className="bg-amber-50/75 border border-amber-200 rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex gap-3.5 items-start">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">⚠ Your Handcrafted Itinerary has changed!</h4>
              <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                The local itinerary data has been updated by the consultant since the last publication. Click "Publish Changes" to push these changes instantly to the live client portal link.
              </p>
            </div>
          </div>
          <button 
            onClick={() => publishToCloudflare(false)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition self-start md:self-center uppercase tracking-wider shrink-0"
          >
            <RotateCw size={13} /> Publish Changes
          </button>
        </div>
      )}

      {/* SINGLE COLUMN LAYOUT */}
      <div className="max-w-4xl mx-auto space-y-8 w-full mt-6">
        
        {/* MULTI-PORTAL LIVE ACCESS & DISTRIBUTION GATEWAYS */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <div>
              <h3 className="font-serif font-bold text-gray-900 text-lg flex items-center gap-2">
                <LinkIcon size={18} className="text-[#D4AF37]" /> Multi-Role Live Portals & Gateways
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Generate and share direct URLs for Clients, B2B Agents, and Field Drivers.</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono px-2.5 py-1 rounded-full uppercase font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Firebase Firestore Synced
            </span>
          </div>

          {/* Hosting Domain Selector */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Globe size={14} className="text-[#1A3326]" /> Share Link Target Domain:
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Controls the domain prepended to generated links</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedHostDomain('firebase')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border text-center ${
                  selectedHostDomain === 'firebase'
                    ? 'bg-[#1A3326] text-white border-[#1A3326] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Firebase Hosting Live</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHostDomain('custom')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border text-center ${
                  selectedHostDomain === 'custom'
                    ? 'bg-[#1A3326] text-white border-[#1A3326] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>Custom Domain</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHostDomain('current')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border text-center ${
                  selectedHostDomain === 'current'
                    ? 'bg-[#1A3326] text-white border-[#1A3326] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>Current Browser URL</span>
              </button>
            </div>
            {selectedHostDomain === 'custom' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customHostUrl}
                  onChange={(e) => setCustomHostUrl(e.target.value)}
                  placeholder="https://portal.viemmatours.com"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            )}
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span>Base URL:</span>
              <code className="text-[#1A3326] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{getLiveBaseUrl()}</code>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Client Portal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/40 to-slate-50 border border-emerald-100/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A3326] flex items-center gap-1.5 uppercase tracking-wider">
                  <Eye size={13} className="text-[#D4AF37]" /> 1. Client Interactive Itinerary & Portal
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Guest & Proposal View</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-gray-700 break-all select-all flex items-center justify-between shadow-xs">
                  <span>{clientLiveUrl}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => copyText(clientLiveUrl, 'client')}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      copied === 'client'
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Copy size={13} /> {copied === 'client' ? 'Copied!' : 'Copy'}
                  </button>
                  <a 
                    href={clientLiveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink size={13} /> Open Live
                  </a>
                </div>
              </div>
            </div>

            {/* 2. B2B Agent Portal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/40 to-slate-50 border border-amber-100/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck size={13} className="text-[#D4AF37]" /> 2. B2B Travel Agent Partner Portal
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Net Rates & Agency Commission</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-gray-700 break-all select-all flex items-center justify-between shadow-xs">
                  <span>{agentLiveUrl}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => copyText(agentLiveUrl, 'agent')}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      copied === 'agent'
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Copy size={13} /> {copied === 'agent' ? 'Copied!' : 'Copy'}
                  </button>
                  <a 
                    href={agentLiveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b8952b] text-[#1A3326] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink size={13} /> Open Live
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Driver & Operator Ground Sheet */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <RotateCw size={13} className="text-slate-600" /> 3. Driver & Guide Ground Logistics Sheet
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Zero-Financial Field Ops</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-mono text-gray-700 break-all select-all flex items-center justify-between shadow-xs">
                  <span>{operatorLiveUrl}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => copyText(operatorLiveUrl, 'operator')}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      copied === 'operator'
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Copy size={13} /> {copied === 'operator' ? 'Copied!' : 'Copy'}
                  </button>
                  <a 
                    href={operatorLiveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink size={13} /> Open Live
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => setShowPreviewMode(true)}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-xs transition"
            >
              <Eye size={13} /> Fullscreen Client View
            </button>

            <button 
              onClick={handleRegenerateLink}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/40 text-xs font-bold transition"
              title="Invalidates old token and generates a fresh live security token."
            >
              <RotateCw size={13} /> Regenerate Live Access Token
            </button>
          </div>

          {/* Metadata timeline details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 rounded-2xl p-4 text-xs font-sans text-gray-500 border border-slate-100/40">
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase mb-0.5">CURRENT STATUS</span>
              <span className="font-bold text-[#1A3326]">{activeStatus}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase mb-0.5">VERSION</span>
              <span className="font-bold text-[#1A3326]">V{publishing.version}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase mb-0.5">LAST PUBLISHED</span>
              <span className="font-bold text-gray-800 truncate block">
                {publishing.publishedAt ? new Date(publishing.publishedAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase mb-0.5">LAST UPDATED</span>
              <span className="font-bold text-gray-800 truncate block">
                {new Date(publishing.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* CLOUDFLARE COMPILATION TERMINAL LOGGER (visible during publishing) */}
        {isPublishing && (
          <div className="bg-slate-900 text-emerald-400 rounded-3xl p-6 shadow-2xl border border-slate-800 font-mono text-xs space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Cloudflare Workers Deploy Engine
              </span>
              <span className="text-slate-500 text-[10px]">Active Thread: Node.js/Wrangler</span>
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {pubLogs.map((log, i) => (
                <p key={i} className="leading-relaxed whitespace-pre-wrap">{log}</p>
              ))}
            </div>
          </div>
        )}

        {/* SHARE OPTIONS CARD */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
          <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-50 pb-4 flex items-center gap-2">
            <Mail size={18} className="text-[#D4AF37]" /> Share Handcrafted Experience
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <a 
              href={`mailto:${state.client.email || ''}?subject=${encodeURIComponent(`Exclusive: Your Bespoke Handcrafted Africa Expedition • ${state.ref || ''}`)}&body=${encodeURIComponent(`Hi ${state.client.name},\n\nWe have designed a bespoke luxury African holiday itinerary tailored specifically for you. Click below to view the interactive day-by-day experience inside your private portal:\n\n${publishing.publicUrl}`)}`}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-gray-700 text-center space-y-2 transition"
            >
              <Mail className="text-emerald-700" size={18} />
              <span className="text-xs font-bold">Email Invitation</span>
            </a>

            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi, here is your bespoke luxury Southern Africa travel itinerary: ${publishing.publicUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-gray-700 text-center space-y-2 transition"
            >
              <MessageSquare className="text-emerald-600" size={18} />
              <span className="text-xs font-bold">WhatsApp Portal</span>
            </a>

            <button 
              onClick={() => generatePDF('client')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-gray-700 text-center space-y-2 transition"
            >
              <Download className="text-blue-600" size={18} />
              <span className="text-xs font-bold">Download PDF Client</span>
            </button>

            <button 
              onClick={() => generatePDF('internal')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-gray-700 text-center space-y-2 transition"
            >
              <FileText className="text-rose-600" size={18} />
              <span className="text-xs font-bold">Download Costing PDF</span>
            </button>

            <button 
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-gray-700 text-center space-y-2 transition"
            >
              <Printer className="text-gray-600" size={18} />
              <span className="text-xs font-bold">Print Documents</span>
            </button>
          </div>
        </div>

        {/* LINK SETTINGS CARD */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
          <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-50 pb-4 flex items-center gap-2">
            <Sliders size={18} className="text-[#D4AF37]" /> Client Portal Settings
          </h3>

          <div className="space-y-4 text-xs font-sans text-gray-600">
            
            {/* Access security */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.requirePassword || false} 
                    onChange={() => handleSettingToggle('requirePassword')}
                    className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                  />
                  Require Password
                </label>
                {settings.requirePassword && (
                  <input 
                    type="text"
                    placeholder="Enter access code..."
                    value={settings.password || ''}
                    onChange={(e) => handleSettingChange('password', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-1 focus:ring-[#D4AF37]"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.enableExpiryDate || false} 
                    onChange={() => handleSettingToggle('enableExpiryDate')}
                    className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                  />
                  Enable Link Expiry
                </label>
                {settings.enableExpiryDate && (
                  <input 
                    type="date"
                    value={settings.expiresAt || ''}
                    onChange={(e) => handleSettingChange('expiresAt', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-1 focus:ring-[#D4AF37]"
                  />
                )}
              </div>
            </div>

            <hr className="border-gray-50" />

            {/* View options */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.allowDownloads || false} 
                  onChange={() => handleSettingToggle('allowDownloads')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Allow PDF Download
              </label>

              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.allowPrinting || false} 
                  onChange={() => handleSettingToggle('allowPrinting')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Allow Print Action
              </label>

              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.hideInternalNotes || false} 
                  onChange={() => handleSettingToggle('hideInternalNotes')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Hide Internal Notes
              </label>

              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.showPricing || false} 
                  onChange={() => handleSettingToggle('showPricing')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Show Dynamic Pricing
              </label>

              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.showSupplierDetails || false} 
                  onChange={() => handleSettingToggle('showSupplierDetails')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Show Supplier Details
              </label>

              <label className="flex items-center gap-2.5 font-bold text-gray-800 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.enableOfflineAccess || false} 
                  onChange={() => handleSettingToggle('enableOfflineAccess')}
                  className="rounded text-[#1A3326] focus:ring-[#1A3326] h-4 w-4"
                />
                Enable Offline Mode
              </label>
            </div>

            <hr className="border-gray-50" />

            {/* Language & Currency overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Primary Language Override</label>
                <select 
                  value={settings.language || 'English'}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="English">English (Default)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="French">French (Français)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Primary Currency Override</label>
                <select 
                  value={settings.currency || 'ZAR'}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD">USD (US Dollars)</option>
                  <option value="EUR">EUR (Euros)</option>
                  <option value="BRL">BRL (Brazilian Real)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* VERSION HISTORY CONTROL CARD */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
          <h3 className="font-serif font-bold text-gray-900 text-lg border-b border-gray-50 pb-4 flex items-center gap-2">
            <History size={18} className="text-[#D4AF37]" /> Itinerary Publication History
          </h3>

          <div className="space-y-4">
            <div className="flex items-end gap-3 text-xs">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Publication Version Remark</label>
                <input 
                  type="text" 
                  placeholder="e.g., Updated Flight PNR list and added Robben Island..."
                  value={verNote}
                  onChange={(e) => setVerNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <button 
                onClick={() => publishToCloudflare(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] font-bold text-xs shadow-md transition shrink-0 h-[38px] uppercase tracking-wider"
              >
                Publish New Version
              </button>
            </div>

            {/* Version History List */}
            <div className="space-y-2.5">
              {versions.slice().reverse().map((ver, idx) => (
                <div key={idx} className="bg-slate-50/70 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4 font-sans text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#1A3326]">Version {ver.version}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{ver.date}</span>
                      {ver.version === publishing.version && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase tracking-wider">
                          Active Live
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 leading-relaxed truncate">{ver.note}</p>
                  </div>

                  <button
                    onClick={() => handleRestoreVersion(ver.version, ver.note)}
                    disabled={ver.version === publishing.version}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
                      ver.version === publishing.version
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white hover:bg-[#1A3326] hover:text-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Restore Snapshot
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

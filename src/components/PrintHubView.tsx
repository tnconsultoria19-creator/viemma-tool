import React from 'react';
import { AppState } from '../types';
import { Printer, Check, Info, FileText, Layout, Users, ShieldCheck } from 'lucide-react';

interface PrintHubViewProps {
  state: AppState;
  totalCost: number;
  netProfit: number;
}

export const PrintHubView: React.FC<PrintHubViewProps> = ({
  state,
  totalCost,
  netProfit
}) => {
  const f = state.finance;

  // CC fee
  const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const ccTotal = totalCost * ccRate;

  // Markup
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;

  // Total Retail price (ZAR)
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);

  // Selected Currency Rate
  const selectedRate = f.currency === 'ZAR' ? 1 : f.rates[f.currency as keyof typeof f.rates] || 1;
  const retailTotalCurr = retailTotalZAR * selectedRate;

  const generatePDF = (mode: 'client' | 'internal' | 'job' | 'airport') => {
    const { jsPDF } = (window as any).jspdf || {};
    if (!jsPDF) {
      alert("jsPDF library not detected in runtime context. Please ensure you are connected to the network.");
      return;
    }

    const doc = new jsPDF(mode === 'airport' ? 'l' : 'p', 'mm', 'a4');
    
    // Clean strings helper (removes non-ASCII characters to avoid jsPDF unicode crash)
    const cleanStr = (str: string) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, " ").trim();
    };

    if (mode === 'client') {
      // CLIENT PROPOSAL
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(6, 95, 70); // Emerald color
      doc.text("VIEMMA TOURS", 20, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Bespoke Africa Travel Proposals", 20, 31);
      doc.text(`Ref: ${cleanStr(state.ref || 'VT-NEW')}`, 150, 25);
      doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 150, 31);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 37, 190, 37);

      // Client details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text("Travel Proposal For:", 20, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Group / Client Name: ${cleanStr(state.client.name || 'Valued Guests')}`, 20, 55);
      doc.text(`Origin Country: ${cleanStr(state.client.country || 'International')}`, 20, 61);
      doc.text(`Itinerary Duration: ${cleanStr(state.client.startDate && state.client.endDate ? state.client.durationText : 'TBD')}`, 20, 67);

      // Traveler Roster
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Traveler Roster:", 20, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let y = 87;
      if (state.guests.length === 0) {
        doc.text("No travelers registered on roster.", 25, y);
        y += 7;
      } else {
        state.guests.forEach((g, idx) => {
          doc.text(`${idx + 1}. ${cleanStr(g.first)} ${cleanStr(g.last)} (${cleanStr(g.age)}) ${g.isLead ? '[Lead]' : ''}`, 25, y);
          y += 6;
        });
      }

      // Stays
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Hotel Stays & Accommodations:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (state.rooms.length === 0) {
        doc.text("No accommodations booked.", 25, y);
        y += 7;
      } else {
        state.rooms.forEach(r => {
          doc.text(`* ${cleanStr(r.hotel)} - Room: ${cleanStr(r.roomType)} (${cleanStr(r.meal)}) - ${r.nights} Nights`, 25, y);
          y += 6;
        });
      }

      // Schedule Activities
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Daily Excursions & Experiences Timeline:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (state.activities.length === 0) {
        doc.text("No experiences scheduled.", 25, y);
        y += 7;
      } else {
        state.activities.forEach(act => {
          if (y > 270) {
            doc.addPage();
            y = 25;
          }
          const priceText = act.isFree ? "Leisure / Free Time" : "Scheduled";
          doc.text(`* Day ${act.day} (${cleanStr(act.slot)}): ${cleanStr(act.name)} - ${priceText}`, 25, y);
          y += 6;
        });
      }

      // Pricing
      y += 8;
      if (y > 260) {
        doc.addPage();
        y = 25;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, 190, y);
      y += 8;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(6, 95, 70);
      const formattedPrice = f.currency === 'ZAR' 
        ? `R ${retailTotalZAR.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
        : `${f.currency} ${retailTotalCurr.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
      doc.text(`Estimated Proposal Retail Value: ${formattedPrice}`, 20, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      y += 6;
      doc.text("Please contact Viemma Tours directly for bookings and settlement conditions.", 20, y);

    } else if (mode === 'internal') {
      // INTERNAL COSTING SHEET
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
      // OPERATIONAL JOB SHEET
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
      // AIRPORT WELCOME SIGN (Landscape!)
      // Emerald background header block
      doc.setFillColor(6, 95, 70); // Emerald color
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
      
      // Sign name
      const signName = state.transfers.find(t => t.sign)?.sign || state.client.name || "WELCOME GUESTS";
      doc.text(cleanStr(signName.toUpperCase()), 148, 110, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(120, 120, 120);
      doc.text("Welcome to Southern Africa", 148, 130, { align: "center" });
    }

    doc.save(`Viemma_${mode}_${state.ref || 'doc'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Document Center</span>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Print Hub & Document Compiler</h1>
      </div>

      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-md p-4 text-xs text-[#2563eb] space-y-1">
        <p className="font-bold flex items-center gap-1.5"><Info size={14} /> Professional Document Compiler Active</p>
        <p className="text-gray-600">Export highly polished PDFs immediately relative to the workspace state. Emojis and unicode assets are automatically cleaned during render to prevent document compilation errors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-up">
        
        {/* DOCUMENT CARD 1 */}
        <div className="card flex flex-col justify-between p-5 hover:shadow transition">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-accent flex items-center gap-1.5"><FileText size={14} /> Client Proposal Sheet</span>
              <span className="badge bg-emerald-50 text-[#065f46] border border-[#a7f3d0]">Ready</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Produces a gorgeous proposal document for travelers, containing the roster details, flight links, hotel nights, scheduled excursions/timeline, and the total retail quote in the selected currency.
            </p>
          </div>
          <button onClick={() => generatePDF('client')} className="btn1 justify-center w-full">
            <Printer size={14} /> Download Client Proposal PDF
          </button>
        </div>

        {/* DOCUMENT CARD 2 */}
        <div className="card flex flex-col justify-between p-5 hover:shadow transition">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5"><Layout size={14} /> Confidential Costing Sheet</span>
              <span className="badge bg-emerald-50 text-[#065f46] border border-[#a7f3d0]">Ready</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Provides an itemized financial analysis sheet for internal audit. Lists base operating costs, markups,CC surcharges, contingency buffers, discounts offered, commissions, and final net operational yields.
            </p>
          </div>
          <button onClick={() => generatePDF('internal')} className="btn1 justify-center w-full !bg-red-700 hover:bg-red-950 border-none text-white">
            <Printer size={14} /> Download Internal Costing PDF
          </button>
        </div>

        {/* DOCUMENT CARD 3 */}
        <div className="card flex flex-col justify-between p-5 hover:shadow transition">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><Users size={14} /> Operational Driver Job Sheet</span>
              <span className="badge bg-emerald-50 text-[#065f46] border border-[#a7f3d0]">Ready</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Generates a route dispatch list for drivers. Contains scheduled times, vehicle specifications, drivers, passenger roster segments, paging welcome boards, meet locations, and detailed stop waypoints.
            </p>
          </div>
          <button onClick={() => generatePDF('job')} className="btn1 justify-center w-full !bg-amber-600 hover:bg-amber-800 border-none text-white">
            <Printer size={14} /> Download Driver Dispatch PDF
          </button>
        </div>

        {/* DOCUMENT CARD 4 */}
        <div className="card flex flex-col justify-between p-5 hover:shadow transition">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><ShieldCheck size={14} /> Airport Welcome Board Sign</span>
              <span className="badge bg-emerald-50 text-[#065f46] border border-[#a7f3d0]">Ready</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Compiles a wide-landscape arrivals greeting board displaying the Viemma corporate logo and the welcome signage (e.g. "HARRISON FAMILY") in high-contrast giant typography, perfect for tablet display.
            </p>
          </div>
          <button onClick={() => generatePDF('airport')} className="btn1 justify-center w-full !bg-gray-800 hover:bg-black border-none text-white">
            <Printer size={14} /> Download Arrivals Greeting Board
          </button>
        </div>

      </div>
    </div>
  );
};

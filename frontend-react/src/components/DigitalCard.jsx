import React from 'react';
import { ShieldAlert, CheckCircle2, Wifi } from 'lucide-react';

export default function DigitalCard({ card, userName = 'CARDHOLDER' }) {
  const brand = card.card_brand || 'Visa';
  const cardType = card.card_type || 'Credit';
  const isMostUsed = card.is_most_used_card;
  const isDarkWeb = card.card_on_dark_web;
  const limit = card.credit_limit || 0;
  const expires = card.expires || '12/28';
  const cardIndex = card.card_index ?? 0;

  const getBrandDetails = () => {
    const b = brand.toLowerCase();
    if (b.includes('amex') || b.includes('american express')) {
      return {
        brandName: 'AMERICAN EXPRESS',
        gradient: 'from-[#14151C] via-[#0E0F14] to-[#0A0A0E] border-[#2A2D3A]',
        chipBg: 'from-amber-200 via-amber-400 to-amber-600',
        textColor: 'text-zinc-200'
      };
    }
    if (b.includes('mastercard')) {
      return {
        brandName: 'MASTERCARD',
        gradient: 'from-[#141416] via-[#0D0D10] to-[#09090C] border-[#252833]',
        chipBg: 'from-amber-300 via-yellow-500 to-amber-600',
        textColor: 'text-zinc-200'
      };
    }
    if (b.includes('discover')) {
      return {
        brandName: 'DISCOVER',
        gradient: 'from-[#161413] via-[#0F0D0C] to-[#0A0909] border-[#2E2420]',
        chipBg: 'from-amber-200 via-orange-400 to-amber-600',
        textColor: 'text-zinc-200'
      };
    }
    return {
      brandName: 'VISA SIGNATURE',
      gradient: 'from-[#0D111A] via-[#0A0C13] to-[#08090E] border-[#1C2538]',
      chipBg: 'from-amber-200 via-amber-400 to-amber-600',
      textColor: 'text-zinc-200'
    };
  };

  const details = getBrandDetails();

  return (
    <div className="flex flex-col gap-3">
      {/* Physical Digital Card Surface */}
      <div
        className={`w-full h-52 rounded-xl p-6 border bg-gradient-to-br ${details.gradient} relative overflow-hidden flex flex-col justify-between shadow-lg select-none`}
      >
        {/* Subtle Metallic Brushed Texture Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 font-mono">
              {cardType}
            </span>
            {isMostUsed && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                PRIMARY
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-zinc-400 rotate-90" />
            <span className="font-extrabold font-mono text-sm tracking-wider text-white">
              {details.brandName}
            </span>
          </div>
        </div>

        {/* Center: EMV Chip & Dark Web Compromise Indicator */}
        <div className="flex items-center justify-between relative z-10 my-1">
          {/* Microchip */}
          <div className={`w-11 h-8 rounded bg-gradient-to-br ${details.chipBg} p-0.5 shadow-sm flex items-center justify-center border border-amber-500/40`}>
            <div className="w-full h-full border border-amber-900/40 rounded-sm flex flex-col justify-between p-0.5">
              <div className="w-full h-[1px] bg-amber-950/40" />
              <div className="w-full h-[1px] bg-amber-950/40" />
            </div>
          </div>

          {isDarkWeb && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              COMPROMISED
            </span>
          )}
        </div>

        {/* Card Number & Metadata */}
        <div className="relative z-10">
          <p className="font-mono text-lg tracking-[0.2em] text-white font-bold mb-2 tabular-nums">
            •••• •••• •••• {String(4000 + cardIndex).slice(-4)}
          </p>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <div>
              <p className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">Cardholder</p>
              <p className="font-semibold text-white tracking-wide truncate max-w-[150px] text-xs">
                {userName.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">Valid Thru</p>
              <p className="font-semibold text-white tracking-wider text-xs">{expires}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">Credit Facility</p>
              <p className="font-bold text-emerald-400 font-mono text-sm tabular-nums">
                ${limit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Card Usage Telemetry Grid */}
      {card.total_spend !== undefined && (
        <div className="grid grid-cols-4 gap-3 px-4 py-2.5 rounded-lg bg-[#000000] border border-[#1E2028] text-xs font-mono">
          <div>
            <span className="text-[11px] text-zinc-400 block uppercase font-semibold">Spend</span>
            <span className="text-white font-bold text-sm tabular-nums">
              ${card.total_spend.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block uppercase font-semibold">Swipes</span>
            <span className="text-zinc-200 font-bold text-sm tabular-nums">
              {card.transaction_count?.toLocaleString() || 0}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block uppercase font-semibold">Wallet %</span>
            <span className="text-blue-400 font-bold text-sm tabular-nums">
              {card.share_of_wallet_pct || 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block uppercase font-semibold">Fraud</span>
            <span className={`font-bold text-sm tabular-nums ${card.fraud_transactions_count > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
              {card.fraud_transactions_count || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

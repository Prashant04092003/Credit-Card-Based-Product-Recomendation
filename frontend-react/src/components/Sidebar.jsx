import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Sliders,
  Users,
  Compass,
  ShieldAlert,
  CreditCard,
  Terminal,
  Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'portfolio',    label: 'Portfolio Overview',         icon: LayoutDashboard, badge: '24.4M' },
  { id: 'customer-360', label: 'Customer Profiles (360°)',    icon: UserCheck,       badge: '2k' },
  { id: 'simulator',    label: 'Rewards Calculator',         icon: Sliders,         badge: 'Simulator' },
  { id: 'segments',     label: 'Customer Personas',          icon: Users,           badge: '6 Cohorts' },
  { id: 'similarity',   label: 'Card Comparison & Directory', icon: Compass,         badge: '354' },
  { id: 'fraud',        label: 'Customer Risk Profiles',     icon: ShieldAlert,     badge: '29.7k' },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-80 bg-[#090A0D] border-r border-[#1E2028] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Console Header */}
        <div className="p-6 border-b border-[#1E2028]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#006FCF] flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-wider text-white">CREDIT<span className="text-[#006FCF]">360</span></span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#161822] text-zinc-200 border border-[#252838]">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-tight mt-1">
                Customer Demographics & Spending Analytics
              </p>
            </div>
          </div>

          {/* Operational Status Box */}
          <div className="mt-5 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#000000] border border-[#1E2028]">
            <div className="flex items-center gap-2.5">
              <span className="status-dot status-dot-emerald"></span>
              <span className="text-zinc-300 font-semibold text-xs tracking-wider uppercase">Population Ledger</span>
            </div>
            <span className="font-mono text-zinc-200 font-bold text-sm">24.38M Records</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          <div className="px-3 pt-2 pb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Analytics & Customer Modules
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-[#006FCF] text-white shadow-md shadow-blue-900/40'
                      : 'text-zinc-300 hover:text-white hover:bg-[#12131A] border border-transparent hover:border-[#1E2028]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      className={`w-5 h-5 transition-colors shrink-0 ${
                        isActive ? 'text-white' : 'text-zinc-400'
                      }`}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold ${
                        isActive
                          ? 'bg-black/35 text-white'
                          : 'bg-[#15161E] text-zinc-400 border border-[#1E2028]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Operational Audit Footer */}
      <div className="p-5 border-t border-[#1E2028] bg-[#000000]/60 space-y-2">
        <div className="flex items-center justify-between text-zinc-300 text-xs font-mono">
          <span className="flex items-center gap-2 text-zinc-400">
            <Terminal className="w-4 h-4 text-zinc-400" />
            OPERATOR
          </span>
          <span className="text-white font-bold">ANALYST-8821</span>
        </div>
        <div className="flex items-center justify-between text-zinc-300 text-xs font-mono">
          <span className="text-zinc-400">CLUSTER</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            PRD-US-EAST
          </span>
        </div>
      </div>
    </aside>
  );
}

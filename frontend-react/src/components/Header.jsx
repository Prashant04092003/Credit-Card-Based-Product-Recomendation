import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ChevronRight, Download, Calendar, RefreshCw } from 'lucide-react';
import { searchCustomers } from '../services/api';

export default function Header({ activeTab, selectedUserId, onSelectUser, onSelectCustomer }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [timeframe, setTimeframe] = useState('All-Time');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectHandler = onSelectUser || onSelectCustomer || (() => {});

  // Keyboard shortcut Cmd+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchCustomers(query);
        setResults(res.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (user) => {
    selectHandler(user.user_id);
    setIsOpen(false);
    setQuery('');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'portfolio':
        return 'Portfolio Performance';
      case 'customer-360':
      case 'customer360':
        return 'Customer Profile & Cards';
      case 'simulator':
        return 'Rewards Calculator';
      case 'segments':
        return 'Customer Spending Personas';
      case 'similarity':
        return 'Card Comparison & Directory';
      case 'fraud':
        return 'Customer Risk Profiles';
      default:
        return 'Credit360 Enterprise';
    }
  };

  return (
    <header className="h-24 border-b border-[#1E2028] bg-[#090A0D] sticky top-0 z-30 px-8 flex items-center justify-between gap-6">
      {/* Title & Audit Scope */}
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {getPageTitle()}
        </h2>
        <p className="text-sm text-zinc-400 font-medium mt-0.5 font-mono">
          24,386,900 Transactions · 2,000 Customer Accounts
        </p>
      </div>

      {/* Prominent, Large Center Search Bar */}
      <div className="flex-1 max-w-3xl mx-4" ref={dropdownRef}>
        <div className="relative w-full">
          <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer by name, account ID, or city... (⌘K)"
            className="w-full h-14 pl-14 pr-20 text-lg bg-[#000000] border-2 border-[#1E2028] hover:border-[#006FCF] focus:border-[#006FCF] rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#006FCF]/20 transition-all font-medium shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-[#006FCF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <kbd className="text-sm bg-[#15161E] border border-[#252838] px-2.5 py-1 rounded-lg text-zinc-300 font-mono font-bold shadow-sm">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown - Large & High Contrast */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full mt-2.5 left-0 right-0 bg-[#090A0D] border-2 border-[#252838] rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="px-6 py-3 text-sm uppercase font-bold tracking-wider text-zinc-400 border-b border-[#1E2028] bg-[#000000]">
              Matching Customer Accounts ({results.length})
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[#1E2028]/70">
              {results.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => handleSelect(u)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#14151C] transition-colors group"
                >
                  <div>
                    <span className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                      {u.person}
                    </span>
                    <p className="text-base text-zinc-300 mt-1">
                      Account #{u.user_id} · {u.city}, {u.state} · FICO <strong className="text-emerald-400 font-bold">{u.fico_score}</strong> · Income <strong className="text-white font-mono">${Number(u.yearly_income).toLocaleString()}</strong>
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scope / Filter */}
      <div className="hidden xl:flex items-center bg-[#000000] border border-[#1E2028] rounded-xl p-1 text-sm font-semibold shrink-0">
        {['All-Time', 'Historical Scope'].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === t
                ? 'bg-[#181920] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </header>
  );
}

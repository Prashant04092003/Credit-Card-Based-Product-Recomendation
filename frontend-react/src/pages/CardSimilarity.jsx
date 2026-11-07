import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ArrowRight,
  TrendingUp,
  Award,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowLeftRight,
  Store,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Building2,
  Layers
} from 'lucide-react';
import {
  getCommercialCatalog,
  getCardSubstitutes,
  compareTwoCards
} from '../services/api';
import StatCard from '../components/StatCard';

// ── CUSTOM DARK SEARCHABLE CARD PICKER MENU ──
function DarkCardPickerMenu({ label, selectedId, onSelect, cardsList }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  const selectedCard = cardsList.find((c) => c.card_id === selectedId);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredCards = cardsList.filter((c) =>
    c.card_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.issuer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.card_brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={menuRef}>
      <label className="text-sm uppercase font-semibold tracking-wider text-zinc-300 block mb-2">
        {label}
      </label>

      {/* Selected Box Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#090A0D] border border-[#1E2028] hover:border-[#006FCF] text-white font-medium text-base rounded-xl px-4 py-3.5 text-left transition-colors"
      >
        <div className="truncate pr-2">
          {selectedCard ? (
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-white text-base">{selectedCard.card_name}</span>
              <span className="text-sm text-zinc-400 font-mono">
                ({selectedCard.issuer_name} · ${selectedCard.annual_fee}/yr)
              </span>
            </div>
          ) : (
            <span className="text-zinc-500">Choose a commercial card...</span>
          )}
        </div>
        <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
      </button>

      {/* Dark Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-[#090A0D] border border-[#1E2028] rounded-xl shadow-2xl p-2 max-h-80 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#1E2028]">
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search card name, bank, or category..."
                className="w-full bg-[#000000] border border-[#1E2028] rounded-xl pl-11 pr-4 py-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#006FCF] font-medium"
              />
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-[#1E2028]/60 mt-1 max-h-60">
            {filteredCards.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">No matching commercial cards</div>
            ) : (
              filteredCards.map((c) => {
                const isSelected = c.card_id === selectedId;
                return (
                  <button
                    key={c.card_id}
                    type="button"
                    onClick={() => {
                      onSelect(c.card_id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-sm transition-colors ${
                      isSelected ? 'bg-[#006FCF]/20 text-white font-semibold' : 'hover:bg-[#14151C] text-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-base text-white">{c.card_name}</p>
                      <p className="text-sm text-zinc-400 mt-0.5 font-medium">
                        {c.issuer_name} · {c.card_brand} · ${c.annual_fee}/year · Max {c.max_multiplier || 1}x
                      </p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#006FCF] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardSimilarity({ onSelectUser }) {
  // Navigation Sub-tab: 'compare' | 'substitutes' | 'catalog'
  const [activeSubTab, setActiveSubTab] = useState('compare');

  // Catalog State
  const [catalog, setCatalog] = useState([]);
  const [marketStats, setMarketStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedProductType, setSelectedProductType] = useState('All');
  const [selectedFeeType, setSelectedFeeType] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total_records: 354, total_pages: 15 });

  // Comparator State (Card 1 vs Card 2)
  const [allCardsList, setAllCardsList] = useState([]);
  const [card1Id, setCard1Id] = useState(3); // Default: Aeroplan Card
  const [card2Id, setCard2Id] = useState(120); // Default: Citi Strata Premier
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparingLoading, setComparingLoading] = useState(false);

  // Substitute Explorer State
  const [substituteCardId, setSubstituteCardId] = useState(3);
  const [substitutesData, setSubstitutesData] = useState(null);
  const [substitutesLoading, setSubstitutesLoading] = useState(false);

  // Load catalog cards
  const loadCatalog = async (p = 1, search = '', brand = 'All', pType = 'All', fee = 'all') => {
    setLoading(true);
    try {
      const res = await getCommercialCatalog({
        page: p,
        limit: 12,
        search,
        brand,
        product_type: pType,
        fee_type: fee
      });
      setCatalog(res.data || []);
      setMarketStats(res.market_stats || {});
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Comparison between two specific cards
  const executeComparison = async (c1 = card1Id, c2 = card2Id) => {
    if (c1 === c2) return;
    setComparingLoading(true);
    try {
      const res = await compareTwoCards(c1, c2);
      setComparisonResult(res);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setComparingLoading(false);
    }
  };

  // Load substitutes for a given target card
  const executeLoadSubstitutes = async (targetId = substituteCardId) => {
    setSubstitutesLoading(true);
    try {
      const res = await getCardSubstitutes(targetId, 3);
      setSubstitutesData(res);
    } catch (err) {
      console.error('Substitutes error:', err);
    } finally {
      setSubstitutesLoading(false);
    }
  };

  // Load initial catalog & comparison
  useEffect(() => {
    loadCatalog(1, '', 'All', 'All', 'all');

    // Load full list for dropdowns
    async function loadDropdowns() {
      try {
        const res = await getCommercialCatalog({ limit: 354 });
        setAllCardsList(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadDropdowns();
  }, []);

  // Run Comparison when card1 or card2 changes
  useEffect(() => {
    if (card1Id && card2Id && card1Id !== card2Id) {
      executeComparison(card1Id, card2Id);
    }
  }, [card1Id, card2Id]);

  // Load substitutes when selected substitute card changes
  useEffect(() => {
    if (substituteCardId) {
      executeLoadSubstitutes(substituteCardId);
    }
  }, [substituteCardId]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setPage(1);
    loadCatalog(1, val, selectedBrand, selectedProductType, selectedFeeType);
  };

  const handleBrandFilter = (b) => {
    setSelectedBrand(b);
    setPage(1);
    loadCatalog(1, searchTerm, b, selectedProductType, selectedFeeType);
  };

  const handleFeeFilter = (f) => {
    setSelectedFeeType(f);
    setPage(1);
    loadCatalog(1, searchTerm, selectedBrand, selectedProductType, f);
  };

  // Action handlers triggered from catalog or substitutes
  const handleCompareFromCatalog = (card) => {
    setCard2Id(card.card_id);
    setActiveSubTab('compare');
    executeComparison(card1Id, card.card_id);
  };

  const handleSubstitutesFromCatalog = (card) => {
    setSubstituteCardId(card.card_id);
    setActiveSubTab('substitutes');
    executeLoadSubstitutes(card.card_id);
  };

  const handleCompareFromSubstitutes = (targetCardId, rivalCardId) => {
    setCard1Id(targetCardId);
    setCard2Id(rivalCardId);
    setActiveSubTab('compare');
    executeComparison(targetCardId, rivalCardId);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Header */}
      <div className="bank-panel p-7">
        <div className="flex items-center space-x-2 text-sm font-semibold text-amex-blue uppercase tracking-wider mb-1.5">
          <CreditCard className="w-4 h-4" />
          <span>MARKET BENCHMARKS · 354 COMMERCIAL CARDS · PRODUCT COMPARATOR & DIRECTORY</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Commercial Card Comparison & Market Directory
        </h1>
        <p className="text-base text-zinc-300 mt-1 max-w-4xl">
          Audited benchmark directory of 354 commercial credit cards. Run side-by-side product comparisons, discover direct competitor alternatives with matched fee tiers, or browse the commercial catalog.
        </p>
      </div>

      {/* 2. Market Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Modeled Commercial Cards"
          value={`${marketStats.total_cards || 354} Cards`}
          subtitle="Full competitive market universe"
          icon={CreditCard}
          badgeText="MARKET SIZE"
          badgeType="info"
        />
        <StatCard
          title="Zero-Annual-Fee Cards"
          value={`${marketStats.no_fee_count || 142} Cards`}
          subtitle="40.1% of market with $0 fee"
          icon={DollarSign}
          badgeText="NO-FEE"
          badgeType="success"
        />
        <StatCard
          title="Premium & Rewards Tier"
          value={`${marketStats.premium_count || 212} Cards`}
          subtitle="Fee-bearing cards ($1 - $695/yr)"
          icon={Award}
          badgeText="REWARDS"
          badgeType="warning"
        />
        <StatCard
          title="Average Market Fee"
          value={`$${marketStats.avg_fee || 98.4}/yr`}
          subtitle="Across 354 commercial cards"
          icon={TrendingUp}
          badgeText="BENCHMARK"
          badgeType="info"
        />
      </div>

      {/* 3. Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1E2028] pb-4">
        <button
          onClick={() => setActiveSubTab('compare')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-base transition-all ${
            activeSubTab === 'compare'
              ? 'bg-[#006FCF] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
              : 'bg-[#090A0D] text-zinc-400 hover:text-white border border-[#1E2028] hover:border-zinc-700'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Head-to-Head Comparison</span>
          {comparisonResult && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('substitutes')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-base transition-all ${
            activeSubTab === 'substitutes'
              ? 'bg-[#006FCF] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
              : 'bg-[#090A0D] text-zinc-400 hover:text-white border border-[#1E2028] hover:border-zinc-700'
          }`}
        >
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Card Substitutes & Alternatives</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            3 Rivals
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-base transition-all ${
            activeSubTab === 'catalog'
              ? 'bg-[#006FCF] text-white shadow-lg shadow-blue-900/30 border border-blue-400/30'
              : 'bg-[#090A0D] text-zinc-400 hover:text-white border border-[#1E2028] hover:border-zinc-700'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Commercial Card Directory</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {pagination.total_records || 354}
          </span>
        </button>
      </div>

      {/* ── TAB 1: HEAD-TO-HEAD COMPARISON ── */}
      {activeSubTab === 'compare' && (
        <div className="bank-panel p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2028] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-amex-blue" />
                Side-by-Side Head-to-Head Card Comparator
              </h2>
              <p className="text-sm text-zinc-300 mt-1">
                Select any two cards to evaluate annual fee differences and category reward multiplier advantages.
              </p>
            </div>
            <button
              onClick={() => executeComparison(card1Id, card2Id)}
              disabled={comparingLoading || card1Id === card2Id}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006FCF] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-md shadow-blue-900/30 disabled:opacity-40 shrink-0"
            >
              {comparingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Comparison</span>
                </>
              )}
            </button>
          </div>

          {/* Card Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-[#000000] border border-[#1E2028]">
            <DarkCardPickerMenu
              label="Select Card Option A (Baseline)"
              selectedId={card1Id}
              onSelect={(id) => setCard1Id(id)}
              cardsList={allCardsList}
            />

            <DarkCardPickerMenu
              label="Select Card Option B (Comparison Target)"
              selectedId={card2Id}
              onSelect={(id) => setCard2Id(id)}
              cardsList={allCardsList}
            />
          </div>

          {card1Id === card2Id && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium">
              Please choose two different commercial cards above to compare their specifications.
            </div>
          )}

          {/* Side-by-Side Comparison Display */}
          {comparisonResult && card1Id !== card2Id && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1 Specs */}
                <div className="p-5 rounded-xl bg-[#000000] border border-[#1E2028] space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-amex-blue text-sm uppercase tracking-wider">Option A</span>
                    <span className="px-2.5 py-1 rounded border border-[#1E2028] bg-bank-panel text-zinc-200 text-xs font-semibold">
                      {comparisonResult.card1.card_brand} · {comparisonResult.card1.product_type}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{comparisonResult.card1.card_name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">Issued by {comparisonResult.card1.issuer_name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1E2028] text-center tabular-nums">
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Annual Fee</span>
                      <span className="text-2xl font-extrabold text-white">${comparisonResult.card1.annual_fee}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Top Multiplier</span>
                      <span className="text-2xl font-extrabold text-emerald-400">{comparisonResult.card1.max_multiplier}x</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Welcome Bonus</span>
                      <span className="text-lg font-bold text-sky-400">
                        {comparisonResult.card1.signup_bonus > 0 ? `${comparisonResult.card1.signup_bonus.toLocaleString()} pts` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2 Specs */}
                <div className="p-5 rounded-xl bg-[#000000] border border-[#1E2028] space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-emerald-400 text-sm uppercase tracking-wider">Option B</span>
                    <span className="px-2.5 py-1 rounded border border-[#1E2028] bg-bank-panel text-zinc-200 text-xs font-semibold">
                      {comparisonResult.card2.card_brand} · {comparisonResult.card2.product_type}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{comparisonResult.card2.card_name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">Issued by {comparisonResult.card2.issuer_name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1E2028] text-center tabular-nums">
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Annual Fee</span>
                      <span className="text-2xl font-extrabold text-white">${comparisonResult.card2.annual_fee}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Top Multiplier</span>
                      <span className="text-2xl font-extrabold text-emerald-400">{comparisonResult.card2.max_multiplier}x</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Welcome Bonus</span>
                      <span className="text-lg font-bold text-sky-400">
                        {comparisonResult.card2.signup_bonus > 0 ? `${comparisonResult.card2.signup_bonus.toLocaleString()} pts` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Multiplier Comparison Matrix */}
              <div className="p-5 rounded-xl bg-[#000000] border border-[#1E2028]">
                <h4 className="text-base font-bold text-white mb-4">Category Multiplier Comparison & Advantage Winner</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-zinc-400 border-b border-[#1E2028]">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-sm">Spend Category</th>
                        <th className="py-3 px-4 text-center font-semibold text-sm">{comparisonResult.card1.card_name}</th>
                        <th className="py-3 px-4 text-center font-semibold text-sm">{comparisonResult.card2.card_name}</th>
                        <th className="py-3 px-4 text-right font-semibold text-sm">Advantage Winner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2028] text-zinc-200 tabular-nums">
                      {comparisonResult.category_comparison.map((row) => (
                        <tr key={row.category} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white text-base">{row.category}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-base">
                            {row.card1_multiplier > 0 ? `${row.card1_multiplier}x` : '1x Base'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-base">
                            {row.card2_multiplier > 0 ? `${row.card2_multiplier}x` : '1x Base'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {row.winner === 'Tie' ? (
                              <span className="text-xs text-zinc-400 font-medium">Equal Yield</span>
                            ) : (
                              <span className="px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                                {row.winner}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CARD SUBSTITUTES ── */}
      {activeSubTab === 'substitutes' && (
        <div className="bank-panel p-7 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              Direct Competitor Alternatives ("Card Substitutes")
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Select any commercial card to discover the 3 closest rival products with equivalent annual fee and rewards tiering.
            </p>
          </div>

          {/* Target Card Dropdown Selector */}
          <div className="p-5 rounded-xl bg-[#000000] border border-[#1E2028]">
            <DarkCardPickerMenu
              label="Select Card to Find Competitor Substitutes For"
              selectedId={substituteCardId}
              onSelect={(id) => {
                setSubstituteCardId(id);
                executeLoadSubstitutes(id);
              }}
              cardsList={allCardsList}
            />
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400">Popular Shortcuts:</span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 3, name: 'Aeroplan® Card (Chase · $95)' },
                { id: 9, name: 'Amazon Visa (Chase · $0)' },
                { id: 2, name: 'Aer Lingus Visa (Chase · $95)' },
                { id: 4, name: 'Air France KLM (BofA · $89)' },
                { id: 7, name: 'Allways Rewards (BofA · $59)' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSubstituteCardId(c.id);
                    executeLoadSubstitutes(c.id);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    substituteCardId === c.id
                      ? 'bg-amex-blue border-blue-400/40 text-white shadow-md'
                      : 'bg-[#000000] border-[#1E2028] text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Substitutes Results Grid */}
          {substitutesLoading ? (
            <div className="py-16 text-center text-zinc-400 text-sm">
              <div className="w-8 h-8 border-2 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Finding closest commercial card substitutes...
            </div>
          ) : substitutesData && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#090A0D] border border-[#1E2028] flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold text-zinc-400">Target Card</span>
                  <h3 className="text-lg font-bold text-white">{substitutesData.target_card.card_name}</h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    {substitutesData.target_card.issuer_name} · ${substitutesData.target_card.annual_fee}/year · Max {substitutesData.target_card.max_multiplier}x
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold">
                  Baseline Product
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {substitutesData.substitutes.map((sub, idx) => (
                  <div
                    key={sub.card_id}
                    className="p-5 rounded-xl bg-[#000000] border border-[#1E2028] hover:border-zinc-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-semibold px-2.5 py-1 rounded border border-[#1E2028] bg-bank-panel text-zinc-300 text-xs">
                          SUBSTITUTE #{idx + 1}
                        </span>
                        <span className="text-emerald-400 font-semibold text-xs tabular-nums">
                          {sub.fee_diff === 0 ? 'Exact Fee Match' : sub.fee_diff > 0 ? `+$${sub.fee_diff}` : `-$${Math.abs(sub.fee_diff)} Lower`}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-white">{sub.card_name}</h4>
                      <p className="text-sm text-zinc-400 mt-1">
                        {sub.issuer_name} · {sub.card_brand}
                      </p>

                      <div className="mt-4 pt-3.5 border-t border-[#1E2028] grid grid-cols-2 gap-3 text-center tabular-nums">
                        <div>
                          <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Annual Fee</span>
                          <span className="text-xl font-bold text-white">${sub.annual_fee}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Top Multiplier</span>
                          <span className="text-xl font-bold text-emerald-400">{sub.max_multiplier}x</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompareFromSubstitutes(substitutesData.target_card.card_id, sub.card_id)}
                      className="mt-5 w-full py-2.5 rounded-lg bg-bank-panel hover:bg-zinc-800 border border-[#1E2028] text-amex-blue hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Compare Head-to-Head
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COMMERCIAL CARD DIRECTORY ── */}
      {activeSubTab === 'catalog' && (
        <div className="bank-panel p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Commercial Card Directory ({pagination.total_records} Products)</h2>
              <p className="text-sm text-zinc-300 mt-1">
                Browse, search, and filter commercial products across Visa, Mastercard, American Express, and Discover.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-96 lg:w-[480px]">
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search commercial cards by name or issuer..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#000000] border border-[#1E2028] rounded-xl text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-amex-blue font-medium"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#1E2028]">
            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mr-1">Brand:</span>
            {['All', 'Visa', 'Mastercard', 'American Express', 'Discover'].map((b) => (
              <button
                key={b}
                onClick={() => handleBrandFilter(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedBrand === b
                    ? 'bg-amex-blue border-blue-400/40 text-white'
                    : 'bg-[#000000] border-[#1E2028] text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {b}
              </button>
            ))}

            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 ml-4 mr-1">Fee:</span>
            {[
              { id: 'all', label: 'All Fees' },
              { id: 'no_fee', label: '$0 No Fee' },
              { id: 'under_100', label: '$1 - $100' },
              { id: 'premium', label: '$100+ Premium' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFeeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedFeeType === f.id
                    ? 'bg-amex-blue border-blue-400/40 text-white'
                    : 'bg-[#000000] border-[#1E2028] text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {loading ? (
              <div className="col-span-3 py-16 text-center text-zinc-400 text-sm">
                <div className="w-8 h-8 border-2 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading commercial cards...
              </div>
            ) : catalog.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-zinc-400 text-sm">
                No commercial cards found matching your search.
              </div>
            ) : (
              catalog.map((card) => (
                <div
                  key={card.card_id}
                  className="p-5 rounded-xl bg-[#000000] border border-[#1E2028] hover:border-zinc-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="px-2.5 py-1 rounded border border-[#1E2028] bg-bank-panel text-zinc-300 text-xs font-semibold">
                        {card.card_brand}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400 uppercase">
                        {card.product_type}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-white leading-snug">{card.card_name}</h4>
                    <p className="text-sm text-zinc-400 mt-1">Issued by {card.issuer_name}</p>

                    <div className="mt-4 pt-3 border-t border-[#1E2028] flex items-center justify-between tabular-nums">
                      <div>
                        <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Annual Fee</span>
                        <span className="text-base font-bold text-white">
                          {card.annual_fee === 0 ? 'No Fee ($0)' : `$${card.annual_fee}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Top Multiplier</span>
                        <span className="text-base font-bold text-emerald-400">
                          {card.max_multiplier > 0 ? `${card.max_multiplier}x` : '1x Base'}
                        </span>
                      </div>
                    </div>

                    {/* Multiplier tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(card.multipliers || {})
                        .filter(([_, rate]) => rate > 1)
                        .slice(0, 3)
                        .map(([cat, rate]) => (
                          <span key={cat} className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                            {cat}: {rate}x
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1E2028] flex items-center gap-2">
                    <button
                      onClick={() => handleCompareFromCatalog(card)}
                      className="flex-1 py-2 rounded-lg bg-bank-panel hover:bg-zinc-800 border border-[#1E2028] text-sm text-amex-blue hover:text-white font-semibold transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Compare
                    </button>
                    <button
                      onClick={() => handleSubstitutesFromCatalog(card)}
                      className="flex-1 py-2 rounded-lg bg-bank-panel hover:bg-zinc-800 border border-[#1E2028] text-sm text-zinc-300 hover:text-white font-semibold transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      Substitutes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#1E2028] text-sm text-zinc-400">
              <div>
                Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{pagination.total_pages}</strong> ({pagination.total_records} cards)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    loadCatalog(p, searchTerm, selectedBrand, selectedProductType, selectedFeeType);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#000000] border border-[#1E2028] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.total_pages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    loadCatalog(p, searchTerm, selectedBrand, selectedProductType, selectedFeeType);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#000000] border border-[#1E2028] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

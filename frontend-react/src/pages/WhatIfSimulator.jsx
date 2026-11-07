import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  Award,
  RefreshCw,
  Calculator,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { simulateRecommendations } from '../services/api';

const DEFAULT_SPEND = {
  Dining: 450,
  Groceries: 650,
  Travel: 350,
  Transportation: 180,
  Shopping: 500,
  Entertainment: 120,
  Utilities: 220,
};

const BRANDS = ['All', 'Visa', 'Mastercard', 'American Express', 'Discover'];

export default function WhatIfSimulator({ userId, onSelectUser }) {
  const [spend, setSpend] = useState(DEFAULT_SPEND);
  const [preferredBrand, setPreferredBrand] = useState('All');
  const [maxAnnualFee, setMaxAnnualFee] = useState(550);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateRecommendations({
        monthly_spend: spend,
        preferred_brand: preferredBrand,
        max_annual_fee: maxAnnualFee === 1000 ? null : maxAnnualFee,
      });
      setResults(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [spend, preferredBrand, maxAnnualFee]);

  const handleSliderChange = (cat, val) => {
    setSpend((prev) => ({
      ...prev,
      [cat]: Number(val),
    }));
  };

  const totalMonthly = Object.values(spend).reduce((a, b) => a + b, 0);
  const totalAnnual = totalMonthly * 12;
  const topCards = results?.top_recommended_cards || [];

  return (
    <div className="space-y-8 w-full animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="bank-panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amex-blue uppercase tracking-wider mb-1.5">
              <Calculator className="w-4 h-4" />
              <span>SIMULATION ENGINE · 354 COMMERCIAL CARD REWARD BENCHMARKS</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Card Rewards & Net Yield Calculator
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-4xl">
              Adjust monthly category spending budgets to model net annual cash value across all commercial market products.
            </p>
          </div>
          <button
            onClick={() => setSpend(DEFAULT_SPEND)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-semibold self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel (5 Cols) */}
        <div className="lg:col-span-5 bank-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-bank-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Monthly Spending Budget
              </h3>
              <p className="text-sm text-zinc-300 mt-0.5">Adjust category spend sliders</p>
            </div>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg tabular-nums">
              ${totalMonthly.toLocaleString()}/mo · ${totalAnnual.toLocaleString()}/yr
            </span>
          </div>

          {/* Sliders List */}
          <div className="space-y-4">
            {Object.entries(spend).map(([cat, val]) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-zinc-200 text-sm">{cat}</span>
                  <span className="font-bold text-white bg-black border border-bank-border px-3 py-1 rounded-lg text-sm tabular-nums">
                    ${val} / month
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2500"
                  step="25"
                  value={val}
                  onChange={(e) => handleSliderChange(cat, e.target.value)}
                  className="w-full accent-amex-blue cursor-pointer h-2 bg-zinc-800 rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* Constraints & Filters */}
          <div className="pt-5 border-t border-bank-border space-y-5 text-sm">
            <div>
              <label className="text-zinc-300 block mb-2 text-xs font-semibold uppercase tracking-wider">
                Preferred Card Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BRANDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setPreferredBrand(b)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                      preferredBrand === b
                        ? 'bg-amex-blue border-blue-400/40 text-white shadow-sm'
                        : 'bg-black border-bank-border text-zinc-300 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-zinc-300 mb-2 text-xs font-semibold">
                <span className="uppercase tracking-wider">Maximum Annual Fee Cap</span>
                <span className="text-white text-sm font-bold tabular-nums">
                  {maxAnnualFee === 1000 ? 'No Limit' : `$${maxAnnualFee}`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={maxAnnualFee}
                onChange={(e) => setMaxAnnualFee(Number(e.target.value))}
                className="w-full accent-amex-blue cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Dynamic Results Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Comparison Chart - Large 420px Height */}
          <div className="bank-panel p-6">
            <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Estimated Annual Rewards Value (After Annual Fee)
                </h3>
                <p className="text-sm text-zinc-300 mt-1">
                  Net cash yield minus annual fees based on your modeled spending distribution
                </p>
              </div>
            </div>

            <div className="h-[420px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCards} margin={{ top: 10, right: 20, left: 15, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" />
                  <XAxis
                    dataKey="card_name"
                    stroke="#94A3B8"
                    fontSize={13}
                    tickFormatter={(val) => (val.length > 20 ? val.slice(0, 20) + '...' : val)}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={13}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090A0D',
                      borderColor: '#1E2028',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#F1F5F9',
                      padding: '10px 14px'
                    }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Net Value']}
                  />
                  <Bar dataKey="net_annual_value" radius={[6, 6, 0, 0]}>
                    {topCards.map((_, index) => (
                      <Cell
                        key={`sim-cell-${index}`}
                        fill={index === 0 ? '#10B981' : '#006FCF'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Dynamic Recommendations Cards List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-amex-blue" />
              Highest-Value Cards for this Spending Plan
            </h4>

            {topCards.map((card) => (
              <div
                key={card.card_id}
                className="p-4 rounded-xl bank-panel hover:border-amex-blue transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      card.rank === 1
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-black border border-bank-border text-zinc-300'
                    }`}
                  >
                    #{card.rank}
                  </div>
                  <div>
                    <h5 className="font-bold text-base text-white">
                      {card.card_name}
                    </h5>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {card.issuer_name} · {card.card_brand} · Fee: ${card.annual_fee} · Yield: {card.effective_reward_rate_pct}%
                    </p>
                  </div>
                </div>

                <div className="text-right tabular-nums">
                  <span className="text-xs text-zinc-400 block font-medium uppercase tracking-wider">Net Annual Value</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">
                    ${card.net_annual_value?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

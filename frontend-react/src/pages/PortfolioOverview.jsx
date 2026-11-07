import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Users,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
  Store,
  Download,
  Copy,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard';
import { getPortfolioSummary, generatePortfolioAIInsight } from '../services/api';

// Safe number helpers
const fmt = (n, decimals = 0) => n != null && !isNaN(n) ? Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : '—';
const fmtM = (n) => n != null && !isNaN(n) ? `$${(n / 1e6).toFixed(2)}M` : '—';
const fmtK = (n) => n != null && !isNaN(n) ? `$${(n / 1e3).toFixed(1)}k` : '—';
const fmtD = (n, d = 2) => n != null && !isNaN(n) ? `$${Number(n).toFixed(d)}` : '—';

const BRAND_COLORS = {
  Visa: '#006FCF',
  Mastercard: '#F59E0B',
  'American Express': '#38BDF8',
  Discover: '#F97316',
  Unknown: '#64748B',
};

const CATEGORY_COLORS = [
  '#006FCF', '#0284C7', '#10B981', '#F59E0B', '#818CF8',
  '#64748B', '#F43F5E', '#14B8A6', '#A855F7', '#EAB308',
  '#06B6D4', '#D946EF', '#84CC16', '#FB923C'
];

export default function PortfolioOverview({ onSelectUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiMemo, setAiMemo] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPortfolioSummary();
      setData(res.data);
    } catch (err) {
      console.error('Portfolio load failed:', err);
      setError(err.message || 'Failed to load portfolio data. Is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await generatePortfolioAIInsight();
      setAiMemo(res.data?.portfolio_executive_memo || res.data?.memo || JSON.stringify(res.data));
    } catch (err) {
      setAiMemo('AI generation failed. Set GEMINI_API_KEY in your .env file and restart the backend.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyMemo = () => {
    if (!aiMemo) return;
    navigator.clipboard.writeText(aiMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleExportPortfolioCSV = () => {
    if (!data?.category_distribution) return;
    const headers = ['Category', 'Spend Volume', 'Transaction Count'];
    const rows = (data.category_distribution || []).map((c) => [
      `"${c.category}"`,
      c.volume,
      c.count || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'portfolio_category_breakdown.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-base">Synthesizing 24,386,900 transaction records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg bank-panel p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-400 font-mono text-base mb-2 font-bold">Backend Connection Error</p>
          <p className="text-zinc-300 text-sm mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-lg bg-amex-blue text-white text-sm font-semibold hover:bg-amex-hover transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const categories = data?.category_distribution || [];
  const brands = data?.brand_distribution || [];
  const monthly = (data?.monthly_trend || []).slice(-48); // last 48 months

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="bank-panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm font-semibold text-amex-blue uppercase tracking-wider mb-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>PORTFOLIO RISK & PERFORMANCE · 24.38M VERIFIED TRANSACTIONS · 2,000 ACCOUNTS</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Executive Portfolio Performance & Card Overview
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-4xl">
              Enterprise-wide telemetry across 6,146 active cards and 354 benchmark commercial products.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPortfolioCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-medium"
              title="Export Category Breakdown (CSV)"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Total Managed Spend"
          value={fmtM(kpis.total_spend_volume)}
          subtitle={`${fmt(kpis.total_transactions)} transactions`}
          icon={DollarSign}
          badgeText="LIFETIME"
          badgeType="info"
        />
        <StatCard
          title="Customer Accounts"
          value={fmt(kpis.total_customers)}
          subtitle={`${fmt(kpis.total_cards)} total portfolio cards`}
          icon={Users}
          badgeText="100% POPULATION"
          badgeType="neutral"
        />
        <StatCard
          title="Average Ticket"
          value={fmtD(kpis.avg_transaction_amount)}
          subtitle="Mean transaction size"
          icon={CreditCard}
          badgeText="GROUND-TRUTH"
          badgeType="neutral"
        />
        <StatCard
          title="Confirmed Fraud"
          value={fmtK(kpis.total_fraud_volume)}
          subtitle={`${fmt(kpis.total_fraud_transactions)} cases · ${kpis.fraud_rate_pct}% rate`}
          icon={ShieldAlert}
          badgeText="CONFIRMED"
          badgeType="danger"
        />
        <StatCard
          title="Unique Merchants"
          value={fmt(kpis.unique_merchants)}
          subtitle="Distinct acceptance points"
          icon={Store}
          badgeText="354 COMMERCIAL"
          badgeType="success"
        />
      </div>

      {/* Charts Row - Significantly Increased Chart Heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Spend (8 cols) - Large 460px Height */}
        <div className="lg:col-span-8 bank-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-amex-blue" />
                  Spend Allocation by Merchant Category
                </h2>
                <p className="text-sm text-zinc-300 mt-1">Total volume across 16 merchant super-categories</p>
              </div>
              <span className="text-base font-mono text-zinc-200 font-bold tabular-nums">
                {fmtM(kpis.total_spend_volume)} Total
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="h-[440px] flex items-center justify-center text-zinc-400 text-base">No category data</div>
            ) : (
              <div className="h-[440px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categories.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 10, right: 35, left: 140, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`}
                      stroke="#94A3B8"
                      tick={{ fill: '#CBD5E1', fontSize: 13, fontWeight: 500 }}
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      stroke="#94A3B8"
                      tick={{ fill: '#F1F5F9', fontSize: 14, fontWeight: 600 }}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090A0D', borderColor: '#1E2028', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', padding: '10px 14px' }}
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Spend Volume']}
                    />
                    <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
                      {categories.slice(0, 10).map((_, idx) => (
                        <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Brand Donut (4 cols) - Large 460px Height */}
        <div className="lg:col-span-4 bank-panel p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b border-bank-border pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <PieIcon className="w-5 h-5 text-amex-blue" />
                Network Brand Exposure
              </h2>
              <p className="text-sm text-zinc-300 mt-1">Card brand market share by settled volume</p>
            </div>

            {brands.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-zinc-400 text-base">No brand data</div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brands}
                      dataKey="volume"
                      nameKey="brand"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                    >
                      {brands.map((entry, idx) => (
                        <Cell key={idx} fill={BRAND_COLORS[entry.brand] || '#71717A'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090A0D', borderColor: '#1E2028', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', padding: '10px 14px' }}
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Volume']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-bank-border pt-4">
            {brands.map((b) => (
              <div key={b.brand} className="flex items-center justify-between text-sm tabular-nums">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[b.brand] || '#71717A' }} />
                  <span className="text-zinc-200 font-semibold text-sm">{b.brand}</span>
                </div>
                <span className="text-zinc-400 font-mono text-sm">
                  {fmtM(b.volume)} · {fmt(b.card_count)} cards
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Longitudinal Trend - Large 400px Height */}
      <div className="bank-panel p-6">
        <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Monthly Spend & Growth Trend (48-Month Trajectory)
            </h2>
            <p className="text-sm text-zinc-300 mt-1">Historical monthly spend volume across the entire customer base</p>
          </div>
          <span className="text-sm font-mono text-zinc-400 tabular-nums">{monthly.length} months indexed</span>
        </div>

        {monthly.length === 0 ? (
          <div className="h-[380px] flex items-center justify-center text-zinc-400 text-base">No monthly data</div>
        ) : (
          <div className="h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006FCF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#006FCF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 13 }}
                  minTickGap={40}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 13 }}
                  tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090A0D', borderColor: '#1E2028', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', padding: '10px 14px' }}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Monthly Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#006FCF"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#volumeGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#38BDF8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* AI Strategy Briefing Panel */}
      <div className="bank-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bank-border pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-bank-panel border border-bank-border text-amex-blue">
              <Sparkles className="w-5 h-5 text-amex-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Executive Portfolio Strategy Memo</h2>
              <p className="text-sm text-zinc-300">Synthesizes growth vectors, risk exposures, and portfolio upgrade opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {aiMemo && (
              <button
                onClick={handleCopyMemo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Copy Strategy Memo"
              >
                {copiedMemo ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>Copy Memo</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amex-blue hover:bg-amex-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 border border-blue-400/30"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Memo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Executive Memo
                </>
              )}
            </button>
          </div>
        </div>

        {aiMemo && (
          <div className="mt-5 p-5 rounded-lg bg-black border border-bank-border text-sm text-zinc-200 leading-relaxed whitespace-pre-line tabular-nums">
            {aiMemo}
          </div>
        )}
      </div>
    </div>
  );
}

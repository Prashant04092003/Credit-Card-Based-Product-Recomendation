import React, { useEffect, useState } from 'react';
import {
  User,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Store,
  Calendar,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import DigitalCard from '../components/DigitalCard';
import {
  getCustomer360,
  getCustomerCards,
  getCustomerTransactions,
  generateCustomerAIInsight,
} from '../services/api';

// Institutional Financial Palette
const CATEGORY_COLORS = [
  '#006FCF', // Amex Royal Blue
  '#0284C7', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#818CF8', // Indigo
  '#64748B', // Slate
  '#F43F5E', // Rose
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#EAB308', // Gold
  '#71717A'  // Muted Zinc
];

const getBureauBrand = (score) => {
  if (score >= 740) return { agency: 'EXPERIAN PRIME', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
  if (score >= 670) return { agency: 'TRANSUNION GOOD', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10' };
  if (score >= 580) return { agency: 'EQUIFAX FAIR', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
  return { agency: 'SUBPRIME ALERT', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' };
};

export default function Customer360({ userId, onSelectUser, onSelectCustomer }) {
  const [data, setData] = useState(null);
  const [cardsData, setCardsData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);
      setError(null);
      setAiInsight(null);
      try {
        const [res360, resCards, resTxns] = await Promise.all([
          getCustomer360(userId),
          getCustomerCards(userId),
          getCustomerTransactions(userId, { limit: 25 }),
        ]);
        setData(res360.data);
        setCardsData(resCards.data || []);
        setTransactions(resTxns.data || []);
      } catch (err) {
        console.error('Customer 360 load failed:', err);
        setError(err.message || 'Failed to fetch customer data. Check backend service.');
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [userId]);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await generateCustomerAIInsight(userId);
      setAiInsight(res.data);
    } catch (err) {
      console.error('AI insight failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ['Date', 'Time', 'Merchant', 'City', 'State', 'Category', 'Method', 'Amount', 'Status'];
    const rows = transactions.map((t) => [
      t.date,
      t.time,
      `"${(t.merchant_name || '').replace(/"/g, '""')}"`,
      `"${(t.merchant_city || '').replace(/"/g, '""')}"`,
      t.merchant_state,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.use_chip || '').replace(/"/g, '""')}"`,
      t.amount,
      t.is_fraud ? 'FRAUD' : 'CLEARED'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_${userId}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summary = `CUSTOMER PROFILE #${userId}
Name: ${demo.person}
FICO: ${demo.fico_score} (${demo.fico_band})
Income: $${demo.yearly_income?.toLocaleString()}
Total Debt: $${demo.total_debt?.toLocaleString()} (DTI: ${demo.debt_income_ratio}x)
Lifetime Spend: $${spend.total_spend?.toLocaleString()} (${spend.total_transactions} txns)
Persona: ${persona.persona_name}
Risk Profile: ${risk.risk_band}
Cards in Wallet: ${cardsData.length}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-base">
            Loading Customer 360 profile across 24.38M records for Account #{userId}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg bank-panel p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Customer Profile Not Found</h3>
          <p className="text-zinc-300 text-sm mb-4">No records found for customer ID #{userId}.</p>
        </div>
      </div>
    );
  }

  const demo = data.demographics || {};
  const persona = data.persona || {};
  const spend = data.spending_overview || {};
  const risk = data.risk_profile || {};
  const topRecos = data.top_recommendations || [];
  const categories = spend.category_distribution || [];
  const bureau = getBureauBrand(demo.fico_score || 700);

  return (
    <div className="space-y-8 w-full animate-fadeIn pb-16">
      {/* 1. Customer Profile Header */}
      <div className="bank-panel p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Demographics */}
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-bank-border text-white flex items-center justify-center font-bold text-2xl shrink-0 text-amex-blue">
              {demo.person?.split(' ').map((n) => n[0]).join('') || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
                  ACCOUNT #{demo.user_id}
                </span>
                <span className="text-zinc-600">·</span>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {demo.person}
                </h1>
                <span className="text-sm px-3 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 font-semibold">
                  {persona.persona_name}
                </span>
                <span
                  className={`text-sm px-3 py-1 rounded font-semibold border flex items-center gap-2 ${
                    risk.risk_band === 'Critical'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : risk.risk_band === 'High'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`status-dot ${
                      risk.risk_band === 'Critical'
                        ? 'status-dot-rose'
                        : risk.risk_band === 'High'
                        ? 'status-dot-amber'
                        : 'status-dot-emerald'
                    }`}
                  />
                  RISK PROFILE: {risk.risk_band?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1.5 font-medium">
                {demo.age} yrs · {demo.gender} · {demo.city}, {demo.state} {demo.zipcode} · {demo.life_stage}
              </p>
            </div>
          </div>

          {/* Underwriting Metrics Grid & Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 p-4 rounded-xl bg-black border border-bank-border tabular-nums text-left">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-semibold">
                  Bureau Tier
                </span>
                <span className="text-base font-bold text-white mt-1 block">
                  {demo.fico_score}
                  <span className={`text-xs ml-1.5 px-2 py-0.5 rounded border ${bureau.bg} ${bureau.border} ${bureau.color} font-semibold`}>
                    {demo.fico_band}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-semibold">
                  Annual Income
                </span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  ${demo.yearly_income?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-semibold">
                  Total Debt
                </span>
                <span className="text-base font-bold text-zinc-200 mt-1 block">
                  ${demo.total_debt?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-semibold">
                  Debt-to-Income
                </span>
                <span className="text-base font-bold text-sky-400 mt-1 block">
                  {demo.debt_income_ratio}x
                </span>
              </div>
            </div>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 font-medium"
              title="Copy Customer Profile Summary to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copy Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistical Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Lifetime Spend"
          value={`$${spend.total_spend?.toLocaleString()}`}
          subtitle={`${spend.total_transactions?.toLocaleString()} transactions`}
          icon={DollarSign}
          badgeText="VERIFIED"
          badgeType="info"
        />
        <StatCard
          title="Average Spend per Swipe"
          value={`$${spend.avg_ticket?.toFixed(2)}`}
          subtitle="Mean transaction size"
          icon={CreditCard}
          badgeText="AVG SPEND"
          badgeType="neutral"
        />
        <StatCard
          title="Cards in Wallet"
          value={cardsData.length}
          subtitle={`Primary: Card #${cardsData.find((c) => c.is_most_used_card)?.card_index ?? 0}`}
          icon={CreditCard}
          badgeText="IN WALLET"
          badgeType="success"
        />
        <StatCard
          title="Confirmed Fraud"
          value={risk.confirmed_fraud_transactions || 0}
          subtitle={`$${risk.confirmed_fraud_volume?.toLocaleString() || 0} volume (${risk.fraud_rate_pct || 0}%)`}
          icon={ShieldAlert}
          badgeText={risk.risk_band}
          badgeType={risk.risk_band === 'Critical' ? 'danger' : 'warning'}
        />
        <StatCard
          title="Merchant Loyalty"
          value={`${spend.habits?.top3_merchants_pct || 0}%`}
          subtitle={`Top 3 stores / ${spend.habits?.unique_merchants || 0} total`}
          icon={Store}
          badgeText="CONCENTRATION"
          badgeType="neutral"
        />
      </div>

      {/* 3. Spend Breakdown vs. Current Wallet (2 Cols) - Large Chart Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Spend Attribution Donut (4 Cols) - 360px Height */}
        <div className="lg:col-span-5 bank-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 border-b border-bank-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-amex-blue" />
                Spending Allocation by Category
              </h3>
            </div>
            <p className="text-sm text-zinc-300 mt-1">
              Share of wallet across top merchant sectors
            </p>
          </div>

          <div className="h-[340px] w-full my-3">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.slice(0, 7)}
                    dataKey="share_pct"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {categories.slice(0, 7).map((entry, index) => (
                      <Cell
                        key={`cat-cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090A0D',
                      borderColor: '#1E2028',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#F1F5F9',
                      fontWeight: 600,
                      padding: '10px 14px'
                    }}
                    formatter={(val) => [`${val}%`, 'Budget Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                No categorized spend records available
              </div>
            )}
          </div>

          {/* Top Spend Categories List */}
          <div className="space-y-3 border-t border-bank-border pt-4">
            <p className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
              Top Spending Buckets
            </p>
            {categories.slice(0, 4).map((c, idx) => (
              <div key={c.category} className="flex items-center justify-between text-sm tabular-nums">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[idx] }}
                  />
                  <span className="text-zinc-200 font-semibold">{c.category}</span>
                </div>
                <span className="text-zinc-300 font-bold">
                  {c.share_pct}% (${(c.total_spend / 1e3).toFixed(1)}k)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Digital Wallet Carousel (7 Cols) */}
        <div className="lg:col-span-7 bank-panel p-6">
          <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-amex-blue" />
                Current Digital Wallet ({cardsData.length} Issued Cards)
              </h3>
              <p className="text-sm text-zinc-300 mt-1">
                Physical cards currently active with live spend, swipe counts, and dark web surveillance
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider font-semibold">
              100% RECONCILED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {cardsData.map((c) => (
              <DigitalCard key={c.card_index} card={c} userName={demo.person} />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Top 5 Tailored Card Recommendations */}
      <div className="bank-panel p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bank-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Award className="w-5 h-5 text-emerald-400" />
              Recommended Card Upgrades & Product Fit (Next-Best-Card)
            </h3>
            <p className="text-sm text-zinc-300 mt-1">
              Ranked by net annual reward value earned against this customer's historic category spending footprint
            </p>
          </div>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amex-blue hover:bg-amex-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 border border-blue-400/30"
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Strategic Assessment
              </>
            )}
          </button>
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-xl bg-black border border-bank-border text-sm">
            <div className="space-y-2 border-r border-bank-border pr-5">
              <p className="text-amex-blue font-bold uppercase tracking-wider flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-amex-blue" />
                Banker Strategic Memo
              </p>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line text-sm">
                {aiInsight.banker_memo}
              </p>
            </div>
            <div className="space-y-2 pl-3">
              <p className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Customer Value Pitch
              </p>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line text-sm">
                {aiInsight.customer_pitch}
              </p>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 pt-2">
          {topRecos.map((reco) => (
            <div
              key={reco.card_id}
              className="p-5 rounded-xl bg-black border border-bank-border hover:border-amex-blue transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold px-2.5 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs">
                    RANK #{reco.rank}
                  </span>
                  <span className="text-zinc-400 uppercase font-semibold text-xs">{reco.brand}</span>
                </div>

                <h4 className="font-bold text-base text-white tracking-tight line-clamp-2">
                  {reco.card_name}
                </h4>
                <p className="text-xs text-zinc-400 uppercase font-semibold mt-1">
                  Tier: {reco.card_tier}
                </p>

                <div className="mt-4 pt-3.5 border-t border-bank-border space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Annual Fee:</span>
                    <span className="text-zinc-100 font-semibold">${reco.annual_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Est. Rewards:</span>
                    <span className="text-emerald-400 font-bold">
                      ${reco.est_annual_rewards?.toFixed(0)}/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Net Value:</span>
                    <span
                      className={`font-bold ${
                        reco.net_annual_value >= 0 ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      ${reco.net_annual_value?.toFixed(0)}/yr
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-bank-border">
                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  {reco.why_recommended}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Transaction History Feed */}
      <div className="bank-panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-bank-border pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-amex-blue" />
              Transaction Audit Ledger
            </h3>
            <p className="text-sm text-zinc-300 mt-1">
              Verified records extracted from 24,386,900 population transactions via DuckDB
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-medium"
              title="Export Transaction Ledger to CSV"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Export Ledger (CSV)</span>
            </button>
            <span className="text-sm font-semibold text-zinc-300 bg-black px-3 py-1.5 rounded-lg border border-bank-border tabular-nums">
              Showing last {transactions.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-zinc-400 uppercase text-xs border-b border-bank-border">
              <tr>
                <th className="py-3 px-4 font-semibold text-sm">Date & Time</th>
                <th className="py-3 px-4 font-semibold text-sm">Merchant Category</th>
                <th className="py-3 px-4 font-semibold text-sm">Location</th>
                <th className="py-3 px-4 font-semibold text-sm">Terminal</th>
                <th className="py-3 px-4 font-semibold text-sm text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-sm text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bank-border text-zinc-200 tabular-nums">
              {transactions.slice(0, showAllTxns ? 25 : 8).map((tx, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3 px-4 text-zinc-400 font-mono text-sm">
                    {tx.date} {tx.time}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white text-base">{tx.category}</td>
                  <td className="py-3 px-4 text-zinc-300 text-sm">
                    {tx.merchant_city}, {tx.merchant_state}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">{tx.use_chip}</td>
                  <td
                    className={`py-3 px-4 text-right font-bold font-mono text-base ${
                      tx.amount < 0 ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tx.is_fraud ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
                        <span className="status-dot status-dot-rose" />
                        FRAUD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                        <span className="status-dot status-dot-emerald" />
                        CLEARED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length > 8 && (
          <div className="mt-5 text-center pt-3 border-t border-bank-border">
            <button
              onClick={() => setShowAllTxns(!showAllTxns)}
              className="px-5 py-2 rounded-lg bg-bank-panel hover:bg-zinc-800 border border-bank-border text-sm text-zinc-200 hover:text-white font-medium inline-flex items-center gap-2 transition-colors"
            >
              {showAllTxns ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show All 25 Transactions <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

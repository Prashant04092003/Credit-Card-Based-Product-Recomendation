import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  DollarSign, 
  Lock, 
  ArrowUpDown, 
  Download,
  Filter
} from 'lucide-react';
import { getFraudOverview, getFraudTimeline } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';

export default function FraudRadar() {
  const [fraudData, setFraudData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('fraud_volume');
  const [sortAsc, setSortAsc] = useState(false);
  const [timeView, setTimeView] = useState('volume'); // 'volume' or 'cases'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overviewRes, timelineRes] = await Promise.all([
          getFraudOverview(),
          getFraudTimeline()
        ]);
        setFraudData(overviewRes);
        setTimelineData(timelineRes.data || []);
      } catch (err) {
        console.error('Failed to load fraud data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (!fraudData?.fraud_by_category) return;
    const headers = ['Category', 'Total Transactions', 'Fraud Transactions', 'Fraud Volume', 'Fraud Rate Pct', 'Threat Status'];
    const rows = fraudData.fraud_by_category.map((cat) => [
      `"${cat.category}"`,
      cat.total_transactions,
      cat.fraud_transactions,
      cat.fraud_volume,
      cat.fraud_rate_pct,
      cat.fraud_rate_pct > 0.15 ? 'HIGH RISK' : cat.fraud_rate_pct > 0.08 ? 'ELEVATED' : 'STABLE'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'fraud_risk_exposure_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-base">
            Scanning 24,386,900 transactions for ground-truth fraud breaches...
          </p>
        </div>
      </div>
    );
  }

  const kpis = fraudData?.kpis || {};
  const categories = fraudData?.fraud_by_category || [];

  const sortedCategories = [...categories].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Sample timeline for smooth chart rendering
  const sampledTimeline = timelineData.filter((_, idx) => idx % 3 === 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="bank-panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>CUSTOMER RISK PROFILES & DISPUTES · 24.38M TRANSACTIONS</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Customer Risk Profiles & Historical Dispute Activity
            </h1>
            <p className="text-base text-zinc-300 mt-1 max-w-4xl">
              Audit analysis of 29,757 confirmed unauthorized transactions ($3.23M total exposure) and 388,431 decline/error events across all 6,146 portfolio cards.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bank-panel border border-bank-border text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors self-start sm:self-auto shrink-0 font-medium"
            title="Export Category Risk Data (CSV)"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span>Export Risk Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Confirmed Fraud Cases"
          value={kpis.confirmed_fraud_transactions?.toLocaleString() || "29,757"}
          subtitle={`${((kpis.confirmed_fraud_transactions / kpis.total_transactions_analyzed) * 100).toFixed(3)}% breach incidence`}
          icon={ShieldAlert}
          badgeText="CONFIRMED"
          badgeType="danger"
        />
        <StatCard 
          title="Total Fraud Exposure"
          value={`$${(kpis.confirmed_fraud_volume / 1e6).toFixed(2)}M`}
          subtitle={`$${kpis.confirmed_fraud_volume?.toLocaleString()} volume`}
          icon={DollarSign}
          badgeText="EXPOSURE"
          badgeType="warning"
        />
        <StatCard 
          title="Declines & System Errors"
          value={kpis.transaction_errors_count?.toLocaleString() || "388,431"}
          subtitle="Declined, PIN errors & faults"
          icon={AlertTriangle}
          badgeText="SYSTEM ERRORS"
          badgeType="neutral"
        />
        <StatCard 
          title="Monitored Cards"
          value="6,146 Cards"
          subtitle="All cards active under surveillance"
          icon={Lock}
          badgeText="ALL CARDS"
          badgeType="success"
        />
      </div>

      {/* Charts Grid - Large 430px Height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fraud Timeline (6 cols) */}
        <div className="lg:col-span-6 bank-panel p-6">
          <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
            <div>
              <h2 className="text-xl font-bold text-white">Historical Fraud Trend (1996 - 2020)</h2>
              <p className="text-sm text-zinc-300 mt-1">
                Monthly distribution of confirmed malicious transactions
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-black border border-bank-border rounded-lg p-1 text-xs">
              <button
                onClick={() => setTimeView('volume')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  timeView === 'volume' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Volume ($)
              </button>
              <button
                onClick={() => setTimeView('cases')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  timeView === 'cases' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Incidents
              </button>
            </div>
          </div>

          <div className="h-[400px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampledTimeline} margin={{ top: 10, right: 15, left: 15, bottom: 10 }}>
                <defs>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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
                  tickFormatter={(val) => timeView === 'volume' ? `$${(val/1e3).toFixed(0)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090A0D', borderColor: '#1E2028', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', padding: '10px 14px' }}
                  formatter={(val) => [
                    timeView === 'volume' ? `$${Number(val).toLocaleString()}` : `${val} cases`,
                    timeView === 'volume' ? 'Fraud Volume' : 'Fraud Cases'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey={timeView === 'volume' ? 'fraud_volume' : 'fraud_transactions'} 
                  stroke="#f43f5e" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#fraudGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Fraud Rate Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bank-panel p-6">
          <div className="flex items-center justify-between mb-4 border-b border-bank-border pb-3">
            <div>
              <h2 className="text-xl font-bold text-white">Breach Rate by Spending Category (%)</h2>
              <p className="text-sm text-zinc-300 mt-1">
                Relative vulnerability index per commercial merchant sector
              </p>
            </div>
            <span className="px-3 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold">
              Travel & Online Highest Risk
            </span>
          </div>

          <div className="h-[400px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ top: 10, right: 15, left: 15, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" />
                <XAxis 
                  dataKey="category" 
                  stroke="#94A3B8" 
                  tick={{ fill: '#CBD5E1', fontSize: 13 }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tick={{ fill: '#CBD5E1', fontSize: 13 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090A0D', borderColor: '#1E2028', borderRadius: '8px', color: '#F1F5F9', fontSize: '14px', padding: '10px 14px' }}
                  formatter={(val) => [`${val}%`, 'Fraud Rate']}
                />
                <Bar dataKey="fraud_rate_pct" radius={[6, 6, 0, 0]}>
                  {categories.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fraud_rate_pct > 0.15 ? '#f43f5e' : entry.fraud_rate_pct > 0.08 ? '#f59e0b' : '#006FCF'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bank-panel p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-bank-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Fraud Rates & Exposure by Spending Category</h2>
            <p className="text-sm text-zinc-300 mt-1">
              Audit breakdown of verified fraud cases, settled volumes, and exposure rates
            </p>
          </div>
          <span className="text-sm text-zinc-400 font-mono">
            {categories.length} Commercial Sectors Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-zinc-400 uppercase text-xs border-b border-bank-border">
              <tr>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white font-semibold text-sm"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Category</span>
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-white font-semibold text-sm"
                  onClick={() => handleSort('total_transactions')}
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Total Swipes</span>
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-white font-semibold text-sm"
                  onClick={() => handleSort('fraud_transactions')}
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Fraud Cases</span>
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-white font-semibold text-sm"
                  onClick={() => handleSort('fraud_volume')}
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Fraud Exposure</span>
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-white font-semibold text-sm"
                  onClick={() => handleSort('fraud_rate_pct')}
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Breach Rate</span>
                    <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center font-semibold text-sm">Threat Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bank-border text-zinc-200 tabular-nums">
              {sortedCategories.map((cat) => (
                <tr key={cat.category} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white text-base">{cat.category}</td>
                  <td className="py-3.5 px-4 text-right text-zinc-300 text-sm">
                    {cat.total_transactions?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-400 text-sm">
                    {cat.fraud_transactions?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                    ${cat.fraud_volume?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                      cat.fraud_rate_pct > 0.15 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      cat.fraud_rate_pct > 0.08 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}>
                      {cat.fraud_rate_pct}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold">
                      <span className={`status-dot ${
                        cat.fraud_rate_pct > 0.15 ? 'status-dot-rose' :
                        cat.fraud_rate_pct > 0.08 ? 'status-dot-amber' :
                        'status-dot-emerald'
                      }`} />
                      <span className={
                        cat.fraud_rate_pct > 0.15 ? 'text-rose-400' :
                        cat.fraud_rate_pct > 0.08 ? 'text-amber-400' :
                        'text-emerald-400'
                      }>
                        {cat.fraud_rate_pct > 0.15 ? 'HIGH RISK' : cat.fraud_rate_pct > 0.08 ? 'ELEVATED' : 'STABLE'}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

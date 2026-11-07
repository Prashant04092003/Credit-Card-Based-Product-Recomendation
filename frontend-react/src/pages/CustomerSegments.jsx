import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  UserCheck,
  ChevronLeft,
  ArrowRight,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getSegmentsList, getSegmentDetail, getSegmentCustomers } from '../services/api';

export default function CustomerSegments({ onSelectUser, onSelectCustomer }) {
  const handleSelectCustomer = onSelectUser || onSelectCustomer || (() => {});
  const [segments, setSegments] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusterDetail, setClusterDetail] = useState(null);
  const [clusterCustomers, setClusterCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Customer roster pagination & search inside cluster
  const [customerSearch, setCustomerSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total_records: 0, total_pages: 1 });

  // Load all 6 clusters on mount
  useEffect(() => {
    async function loadSegments() {
      setLoading(true);
      try {
        const res = await getSegmentsList();
        setSegments(res.data || []);
      } catch (err) {
        console.error('Failed to load segments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSegments();
  }, []);

  // Fetch customers in current cluster when cluster, page, or search changes
  const fetchCustomers = async (clusterId, pageNum, searchTerm) => {
    setCustomersLoading(true);
    try {
      const res = await getSegmentCustomers(clusterId, {
        page: pageNum,
        limit: 25,
        search: searchTerm || ''
      });
      setClusterCustomers(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load cluster customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleSelectCluster = async (clusterId) => {
    setSelectedCluster(clusterId);
    setPage(1);
    setCustomerSearch('');
    try {
      const resDetail = await getSegmentDetail(clusterId);
      setClusterDetail(resDetail);
      await fetchCustomers(clusterId, 1, '');
    } catch (err) {
      console.error('Failed to load cluster detail:', err);
    }
  };

  const handleSearchChange = (val) => {
    setCustomerSearch(val);
    setPage(1);
    if (selectedCluster !== null) {
      fetchCustomers(selectedCluster, 1, val);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (selectedCluster !== null) {
      fetchCustomers(selectedCluster, newPage, customerSearch);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-base">Synthesizing 6 behavioral persona cohorts across 2,000 customers...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEEP-DIVE VIEW: ALL CUSTOMERS IN THE SELECTED CLUSTER
  // -------------------------------------------------------------
  if (selectedCluster !== null && clusterDetail) {
    return (
      <div className="space-y-8 w-full animate-fadeIn pb-16">
        <button
          onClick={() => setSelectedCluster(null)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All 6 Personas</span>
        </button>

        {/* Cluster Header */}
        <div className="bank-panel p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300">
                  COHORT #{clusterDetail.cluster_id + 1}
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {clusterDetail.persona_name}
                </h1>
              </div>
              <p className="text-base text-zinc-300">
                <strong className="text-white">{clusterDetail.customer_count?.toLocaleString()} Customer Accounts</strong> ({((clusterDetail.customer_count / 2000) * 100).toFixed(1)}% of portfolio) · ${(clusterDetail.total_spend_volume / 1e6).toFixed(2)}M Lifetime Spend
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 text-right tabular-nums">
              <div>
                <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Avg Ticket</span>
                <span className="text-2xl font-extrabold text-white">${clusterDetail.avg_ticket?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Avg Credit Score</span>
                <span className="text-2xl font-extrabold text-emerald-400">{clusterDetail.avg_fico}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Avg Income</span>
                <span className="text-2xl font-extrabold text-zinc-100">${clusterDetail.avg_income?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spend Distribution & Recommended Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Allocation (6 cols) */}
          <div className="lg:col-span-6 bank-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5 border-b border-bank-border pb-3">
              <TrendingUp className="w-5 h-5 text-amex-blue" />
              Top Spending Categories for this Persona
            </h3>
            <div className="space-y-4 pt-1">
              {clusterDetail.category_spend_distribution?.map((c) => (
                <div key={c.category} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-200 font-medium">{c.category}</span>
                    <span className="text-white font-bold tabular-nums">{c.share_pct}%</span>
                  </div>
                  <div className="w-full bg-black border border-bank-border h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amex-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(c.share_pct * 3, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tailored Cards (6 cols) */}
          <div className="lg:col-span-6 bank-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5 border-b border-bank-border pb-3">
              <Award className="w-5 h-5 text-emerald-400" />
              Recommended Card Matches for this Persona
            </h3>
            <div className="space-y-3.5 pt-1">
              {clusterDetail.top_recommended_cards_for_segment?.map((card, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black border border-bank-border flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <h5 className="font-bold text-white text-base">{card.card_name}</h5>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {card.brand} · Tier: {card.tier} · Annual Fee: ${card.annual_fee}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-emerald-400 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 tabular-nums">
                      {card.recommendation_count} users
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complete Customer Roster for this Cluster */}
        <div className="bank-panel p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bank-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Users className="w-5 h-5 text-amex-blue" />
                Customer Accounts in this Persona ({pagination.total_records} Accounts)
              </h3>
              <p className="text-sm text-zinc-300 mt-1">
                Click any customer account row to open their full Customer 360 profile
              </p>
            </div>

            {/* In-Cluster Search Filter */}
            <div className="relative w-full sm:w-96 lg:w-[480px]">
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search account by customer name or ID..."
                className="w-full pl-11 pr-4 py-2.5 bg-black border border-bank-border rounded-xl text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-amex-blue font-medium"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-zinc-400 uppercase text-xs border-b border-bank-border">
                <tr>
                  <th className="py-3 px-4 font-semibold text-sm">Account</th>
                  <th className="py-3 px-4 font-semibold text-sm">Customer Name</th>
                  <th className="py-3 px-4 font-semibold text-sm">Location</th>
                  <th className="py-3 px-4 text-right font-semibold text-sm">Annual Income</th>
                  <th className="py-3 px-4 text-center font-semibold text-sm">FICO</th>
                  <th className="py-3 px-4 text-right font-semibold text-sm">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right font-semibold text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bank-border text-zinc-200 tabular-nums">
                {customersLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-zinc-400 text-sm">
                      <div className="w-8 h-8 border-2 border-amex-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customer accounts...
                    </td>
                  </tr>
                ) : clusterCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-zinc-400 text-sm">
                      No customer accounts matching "{customerSearch}" in this cluster.
                    </td>
                  </tr>
                ) : (
                  clusterCustomers.map((c) => (
                    <tr
                      key={c.user_id}
                      onClick={() => handleSelectCustomer(c.user_id)}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-sm">#{c.user_id}</td>
                      <td className="py-3.5 px-4 font-semibold text-white text-base group-hover:text-blue-300 transition-colors">
                        {c.person}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 text-sm">
                        {c.city}, {c.state}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-zinc-200 text-sm">
                        ${c.yearly_income?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                          c.fico_score >= 740 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          c.fico_score >= 670 ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {c.fico_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                        ${c.total_spend?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(c.user_id);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-bank-panel text-zinc-200 border border-bank-border hover:border-amex-blue hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amex-blue" />
                          View 360
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-bank-border text-sm text-zinc-400">
              <div>
                Showing page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.total_pages}</strong> ({pagination.total_records} total customers)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-3.5 py-1.5 rounded-lg bg-black border border-bank-border text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-3.5 py-1.5 rounded-lg bg-black border border-bank-border text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs font-semibold"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MACRO OVERVIEW: EXACTLY 6 CLUSTERS
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 w-full animate-fadeIn pb-16">
      {/* Header */}
      <div className="bank-panel p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-amex-blue uppercase tracking-wider mb-1.5">
          <Users className="w-4 h-4" />
          <span>CUSTOMER SEGMENTATION · 2,000 ACCOUNTS · 6 MACRO PERSONAS</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Customer Personas & Spending Groups</h1>
        <p className="text-base text-zinc-300 mt-1 max-w-4xl">
          All 2,000 customer accounts partitioned into 6 distinct behavioral spending cohorts. Select any persona to inspect its customer roster and portfolio profile.
        </p>
      </div>

      {/* Population Distribution Chart - Large 400px Height */}
      <div className="bank-panel p-6">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-bank-border pb-3">
          Customer Population by Persona (2,000 Total Population)
        </h3>
        <div className="h-[400px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segments} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" />
              <XAxis
                dataKey="persona_name"
                stroke="#94A3B8"
                fontSize={13}
                tickFormatter={(val) => (val.length > 20 ? val.slice(0, 20) + '...' : val)}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#94A3B8" fontSize={13} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090A0D',
                  borderColor: '#1E2028',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#F1F5F9',
                  padding: '10px 14px'
                }}
                formatter={(val) => [`${val} Customers`, 'Population']}
              />
              <Bar dataKey="customer_count" fill="#006FCF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6 Cluster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((seg) => (
          <div
            key={seg.cluster_id}
            onClick={() => handleSelectCluster(seg.cluster_id)}
            className="p-6 bank-panel hover:border-amex-blue transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-semibold px-2.5 py-1 rounded border border-bank-border bg-black text-zinc-300 text-xs">
                  PERSONA #{seg.cluster_id + 1}
                </span>
                <span className="text-amex-blue font-bold text-sm tabular-nums">{seg.population_share_pct}% of Accounts</span>
              </div>

              <h4 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                {seg.persona_name}
              </h4>
              <p className="text-sm text-zinc-300 mt-1">
                <strong className="text-white">{seg.customer_count} Customers</strong> · ${(seg.total_spend_volume / 1e6).toFixed(1)}M Total Spend
              </p>

              <div className="mt-5 pt-4 border-t border-bank-border grid grid-cols-3 gap-3 text-center tabular-nums">
                <div>
                  <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Avg FICO</span>
                  <span className="text-emerald-400 font-bold text-base">{seg.avg_fico_score}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Avg Ticket</span>
                  <span className="text-zinc-200 font-bold text-base">${seg.avg_transaction_size}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs uppercase font-semibold tracking-wider block">Entropy</span>
                  <span className="text-sky-300 font-bold text-base">{seg.avg_category_entropy > 1.7 ? 'High' : seg.avg_category_entropy > 1.5 ? 'Moderate' : 'Focused'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-bank-border flex items-center justify-between text-sm text-amex-blue font-semibold group-hover:translate-x-1 transition-transform">
              <span>Inspect All {seg.customer_count} Customers</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

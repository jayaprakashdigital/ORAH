import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, CheckCircle2, XCircle, Clock, Sun, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { getTimeCategory, getBudgetRange, formatDateForChart, getHourFromDate } from '../lib/timeClassification';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Lead = Database['public']['Tables']['leads']['Row'];

interface EnrichedLead extends Lead {
  timeCategory: 'Working Hours' | 'Non-Working Hours';
  budgetRange: string;
  successEvaluation: boolean;
  callSummary: string | null;
}

export function Analytics() {
  const { profile } = useAuth();
  const { dateRange, setDateRange, filterByDate } = useDateFilter('Last 30 Days');
  const [allLeads, setAllLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    } else if (profile) {
      setLoading(false);
    }
  }, [profile]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', profile.company_id);

      if (leadsError) throw leadsError;

      const { data: callsData } = await supabase
        .from('calls')
        .select('lead_id, summary, success_evaluation')
        .eq('company_id', profile.company_id);

      const callsMap = new Map(
        callsData?.map(call => [call.lead_id, call]) || []
      );

      const enrichedLeads: EnrichedLead[] = (leadsData || []).map(lead => {
        const call = callsMap.get(lead.id);
        return {
          ...lead,
          timeCategory: getTimeCategory(lead.created_at),
          budgetRange: getBudgetRange(lead.budget),
          successEvaluation: call?.success_evaluation || false,
          callSummary: call?.summary || null,
        };
      });

      setAllLeads(enrichedLeads);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const leads = filterByDate(allLeads);
  const totalLeads = leads.length;
  const successfulLeads = leads.filter(l => l.successEvaluation).length;
  const failedLeads = totalLeads - successfulLeads;
  const workingHoursLeads = leads.filter(l => l.timeCategory === 'Working Hours').length;
  const nonWorkingHoursLeads = leads.filter(l => l.timeCategory === 'Non-Working Hours').length;

  const successRate = totalLeads > 0 ? Math.round((successfulLeads / totalLeads) * 100) : 0;

  const timeDistributionData = [
    { name: 'Working Hours', value: workingHoursLeads, color: '#3b82f6' },
    { name: 'Non-Working Hours', value: nonWorkingHoursLeads, color: '#64748b' },
  ];

  const successDistributionData = [
    { name: 'Qualified', value: successfulLeads, color: '#10b981' },
    { name: 'Nurture', value: failedLeads, color: '#f59e0b' },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    leads: leads.filter(l => getHourFromDate(l.created_at) === hour).length,
  }));

  const dailyData = leads.reduce((acc, lead) => {
    const date = formatDateForChart(lead.created_at);
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.leads += 1;
    } else {
      acc.push({ date, leads: 1 });
    }
    return acc;
  }, [] as { date: string; leads: number }[]).slice(-14);

  const successByTimeData = [
    {
      category: 'Working',
      qualified: leads.filter(l => l.timeCategory === 'Working Hours' && l.successEvaluation).length,
      nurture: leads.filter(l => l.timeCategory === 'Working Hours' && !l.successEvaluation).length,
    },
    {
      category: 'Non-Working',
      qualified: leads.filter(l => l.timeCategory === 'Non-Working Hours' && l.successEvaluation).length,
      nurture: leads.filter(l => l.timeCategory === 'Non-Working Hours' && !l.successEvaluation).length,
    },
  ];

  const unitPreferenceData = leads.reduce((acc, lead) => {
    const unit = lead.unit_preference || 'Not specified';
    const existing = acc.find(d => d.unit === unit);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ unit, count: 1 });
    }
    return acc;
  }, [] as { unit: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);

  const locationData = leads.reduce((acc, lead) => {
    const location = lead.location_preference || 'Not specified';
    const existing = acc.find(d => d.location === location);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ location, count: 1 });
    }
    return acc;
  }, [] as { location: string; count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);

  const budgetData = ['< 70L', '70L - 1Cr', '1Cr - 1.5Cr', '1.5Cr+'].map(range => ({
    range,
    count: leads.filter(l => l.budgetRange === range).length,
  }));

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lead performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 h-9 px-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {totalLeads === 0 ? (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            No leads data in selected date range
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Leads</p>
                  <p className="text-lg font-semibold text-slate-900">{totalLeads}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Qualified</p>
                  <p className="text-lg font-semibold text-emerald-600">{successfulLeads}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <XCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nurture</p>
                  <p className="text-lg font-semibold text-amber-600">{failedLeads}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Sun className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Working Hrs</p>
                  <p className="text-lg font-semibold text-slate-900">{workingHoursLeads}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="text-lg font-semibold text-slate-900">{successRate}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Working vs Non-Working Hours</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={timeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {timeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Qualification Status</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={successDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {successDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Leads by Hour (24h)</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Daily Lead Trend</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Success Rate by Time Category</h3>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={successByTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qualified" fill="#10b981" name="Qualified" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nurture" fill="#f59e0b" name="Nurture" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Unit Preference</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most preferred property types</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={unitPreferenceData} layout="vertical" margin={{ left: 140, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 13 }} />
                  <YAxis type="category" dataKey="unit" width={130} tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Top Locations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most inquired locations</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={locationData} layout="vertical" margin={{ left: 140, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 13 }} />
                  <YAxis type="category" dataKey="location" width={130} tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Budget Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Lead budget ranges</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={budgetData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#64748b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Lead Status Breakdown</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New', value: leads.filter(l => l.status === 'new').length, color: '#3b82f6' },
                        { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
                        { name: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, color: '#10b981' },
                        { name: 'Converted', value: leads.filter(l => l.status === 'converted').length, color: '#059669' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { name: 'New', value: leads.filter(l => l.status === 'new').length, color: '#3b82f6' },
                        { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
                        { name: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, color: '#10b981' },
                        { name: 'Converted', value: leads.filter(l => l.status === 'converted').length, color: '#059669' },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Performance Summary</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                  <span className="text-sm text-emerald-900 font-medium">Qualified Rate</span>
                  <span className="text-lg font-bold text-emerald-700">{successRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <span className="text-sm text-blue-900 font-medium">Working Hours</span>
                  <span className="text-lg font-bold text-blue-700">{workingHoursLeads}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <span className="text-sm text-amber-900 font-medium">Nurture Leads</span>
                  <span className="text-lg font-bold text-amber-700">{failedLeads}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                  <span className="text-sm text-slate-900 font-medium">Total Leads</span>
                  <span className="text-lg font-bold text-slate-700">{totalLeads}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

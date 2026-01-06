import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { DollarSign, TrendingDown, Target, Percent } from 'lucide-react';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function CallAnalytics() {
  const { profile } = useAuth();
  const { dateRange, setDateRange, filterByDate } = useDateFilter('Last 30 Days');
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: callsData } = await supabase
        .from('calls')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      setAllCalls(callsData || []);
    } catch (error) {
      console.error('Error loading call data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calls = filterByDate(allCalls);
  const totalCalls = calls.length;
  const costPerCall = 25;
  const totalCallCost = totalCalls * costPerCall;
  const qualifiedCalls = calls.filter(c => c.success_evaluation).length;
  const costPerQualifiedLead = qualifiedCalls > 0 ? Math.round(totalCallCost / qualifiedCalls) : 0;
  const avgCallDuration = calls.length > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
    : 0;
  const qualificationRate = totalCalls > 0 ? Math.round((qualifiedCalls / totalCalls) * 100) : 0;

  const durationDistribution = [
    { range: '0-30s', count: calls.filter(c => (c.duration || 0) <= 30).length },
    { range: '31-60s', count: calls.filter(c => (c.duration || 0) > 30 && (c.duration || 0) <= 60).length },
    { range: '61-120s', count: calls.filter(c => (c.duration || 0) > 60 && (c.duration || 0) <= 120).length },
    { range: '120s+', count: calls.filter(c => (c.duration || 0) > 120).length },
  ];

  const costBreakdown = [
    { name: 'Call Costs', value: totalCallCost, color: '#3b82f6' },
    { name: 'Qualified Value', value: qualifiedCalls * 500, color: '#10b981' },
  ];

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
          <h1 className="text-xl font-semibold text-slate-900">Call Cost Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">ROI and cost analysis</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {totalCalls === 0 ? (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            No call data in selected date range
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Call Cost</p>
                  <p className="text-lg font-semibold text-slate-900">₹{totalCallCost}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cost Per Call</p>
                  <p className="text-lg font-semibold text-emerald-600">₹{costPerCall}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Target className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cost Per Qualified</p>
                  <p className="text-lg font-semibold text-amber-600">₹{costPerQualifiedLead}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Percent className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Qualification Rate</p>
                  <p className="text-lg font-semibold text-slate-900">{qualificationRate}%</p>
                </div>
              </div>
            </div>
          </div>

          <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Call Performance Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">ROI & efficiency metrics</p>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Cost Efficiency Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                  <div className="text-xs text-slate-600 mb-1">Total Calls Made</div>
                  <div className="text-2xl font-bold text-slate-900 mb-2">{totalCalls}</div>
                  <div className="text-xs text-slate-500">
                    Investment: ₹{totalCallCost} at ₹{costPerCall}/call
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                  <div className="text-xs text-slate-600 mb-1">Qualified Leads</div>
                  <div className="text-2xl font-bold text-emerald-600 mb-2">{qualifiedCalls}</div>
                  <div className="text-xs text-slate-500">
                    Nurturing cost: ₹{costPerQualifiedLead} per qualified lead
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                  <div className="text-xs text-slate-600 mb-1">ROI Efficiency</div>
                  <div className="text-2xl font-bold text-amber-600 mb-2">{qualificationRate}%</div>
                  <div className="text-xs text-slate-500">
                    Qualification rate from total calls
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Call Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Result</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.slice(0, 20).map((call) => (
                    <tr key={call.call_id}>
                      <td className="text-slate-600">
                        {new Date(call.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="text-slate-600">{call.duration || 0}s</td>
                      <td className="text-slate-600">₹{costPerCall}</td>
                      <td>
                        <span className={`status-badge ${
                          call.success_evaluation
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {call.success_evaluation ? 'Qualified' : 'Nurture'}
                        </span>
                      </td>
                      <td className="text-slate-600 max-w-md truncate">
                        {call.summary || 'No summary'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

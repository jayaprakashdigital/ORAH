import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Users, CheckCircle2, XCircle, Clock, Phone } from 'lucide-react';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';

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
  const successfulCalls = calls.filter(c => c.success_evaluation).length;
  const failedCalls = totalCalls - successfulCalls;
  const avgDuration = calls.length > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
    : 0;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

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
          <h1 className="text-xl font-semibold text-slate-900">Call Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Call metrics from your leads</p>
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
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Calls</p>
                  <p className="text-lg font-semibold text-slate-900">{totalCalls}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Successful</p>
                  <p className="text-lg font-semibold text-emerald-600">{successfulCalls}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <XCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Failed</p>
                  <p className="text-lg font-semibold text-amber-600">{failedCalls}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Duration</p>
                  <p className="text-lg font-semibold text-slate-900">{avgDuration}s</p>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Calls</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Status</th>
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
                      <td>
                        <span className={`status-badge ${
                          call.success_evaluation
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {call.success_evaluation ? 'Success' : 'Failed'}
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

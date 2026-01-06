import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, CheckCircle2, XCircle, Phone, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { getTimeCategory } from '../lib/timeClassification';
import { useNavigate } from 'react-router-dom';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';
import { ExecutiveSummary } from '../components/ExecutiveSummary';

type Lead = Database['public']['Tables']['leads']['Row'];

interface DashboardData {
  totalLeads: number;
  successfulLeads: number;
  failedLeads: number;
  workingHoursLeads: number;
  nonWorkingHoursLeads: number;
  recentLeads: Lead[];
  totalCalls: number;
  completedCalls: number;
}

export function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { dateRange, setDateRange, filterByDate } = useDateFilter('All Time');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [leadsResult, callsResult] = await Promise.all([
          supabase
            .from('leads')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false }),
          supabase
            .from('calls')
            .select('lead_id, success_evaluation, status, created_at')
            .eq('company_id', profile.company_id),
        ]);

        setAllLeads(leadsResult.data || []);
        setAllCalls(callsResult.data || []);
      } catch (error) {
        console.error('[DASHBOARD] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.company_id, authLoading]);

  useEffect(() => {
    if (!profile?.company_id) return;

    const interval = setInterval(async () => {
      const [leadsResult, callsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('calls')
          .select('lead_id, success_evaluation, status, created_at')
          .eq('company_id', profile.company_id),
      ]);

      if (JSON.stringify(leadsResult.data) !== JSON.stringify(allLeads)) {
        setAllLeads(leadsResult.data || []);
      }
      if (JSON.stringify(callsResult.data) !== JSON.stringify(allCalls)) {
        setAllCalls(callsResult.data || []);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [profile?.company_id, allLeads, allCalls]);

  const filteredLeads = filterByDate(allLeads);
  const filteredCalls = filterByDate(allCalls);

  const callsMap = new Map(
    filteredCalls.map(call => [call.lead_id, call])
  );

  const successfulLeads = filteredLeads.filter(lead => {
    const call = callsMap.get(lead.id);
    return call?.success_evaluation === true;
  }).length;

  const workingHoursLeads = filteredLeads.filter(lead =>
    getTimeCategory(lead.created_at) === 'Working Hours'
  ).length;

  const data: DashboardData = {
    totalLeads: filteredLeads.length,
    successfulLeads,
    failedLeads: filteredLeads.length - successfulLeads,
    workingHoursLeads,
    nonWorkingHoursLeads: filteredLeads.length - workingHoursLeads,
    recentLeads: filteredLeads.slice(0, 5),
    totalCalls: filteredCalls.length,
    completedCalls: filteredCalls.filter(c => c.status === 'connected').length,
  };

  const successRate = data.totalLeads > 0
    ? Math.round((data.successfulLeads / data.totalLeads) * 100)
    : 0;

  const convertedLeads = filteredLeads.filter(l => l.status === 'converted').length;
  const avgLeadValue = 12000000;
  const totalRevenue = convertedLeads * avgLeadValue;

  const kpis = [
    { title: 'Total Leads', value: data.totalLeads.toString(), icon: Users, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { title: 'Qualified', value: data.successfulLeads.toString(), icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Nurture', value: data.failedLeads.toString(), icon: XCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Total Calls', value: data.totalCalls.toString(), icon: Phone, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { title: 'Working Hours', value: data.workingHoursLeads.toString(), icon: Clock, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your lead management</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{kpi.title}</p>
                <p className="text-lg font-semibold text-slate-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Leads</h3>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No leads in this date range</p>
            ) : (
              <div className="space-y-2">
                {data.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.mobile}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${
                      lead.status === 'new' ? 'bg-blue-50 text-blue-700' :
                      lead.status === 'contacted' ? 'bg-amber-50 text-amber-700' :
                      lead.status === 'qualified' ? 'bg-emerald-50 text-emerald-700' :
                      lead.status === 'converted' ? 'bg-green-50 text-green-700' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Quick Stats</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Working Hours Leads</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.workingHoursLeads}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-600">Non-Working Hours</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.nonWorkingHoursLeads}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Success Rate</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{successRate}%</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Calls Completed</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.completedCalls}</span>
            </div>
          </div>
        </Card>
      </div>

      {allLeads.length > 0 && (
        <>
          <ExecutiveSummary
            totalLeads={data.totalLeads}
            workingHoursLeads={data.workingHoursLeads}
            nonWorkingHoursLeads={data.nonWorkingHoursLeads}
            qualifiedLeads={data.successfulLeads}
            convertedLeads={convertedLeads}
            nurturedLeads={data.successfulLeads + data.failedLeads}
            avgLeadValue={avgLeadValue}
            totalRevenue={totalRevenue}
          />

          <Card>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Detailed Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View comprehensive charts and time-based analysis
                </p>
              </div>
              <button
                onClick={() => navigate('/analytics')}
                className="h-9 px-4 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                View Analytics
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

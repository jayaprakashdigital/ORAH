import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, CheckCircle2, XCircle, Phone, Clock, TrendingUp, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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

  const exportToPDF = () => {
    window.print();
  };

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
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Lead Status Distribution</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'New', value: filteredLeads.filter(l => l.status === 'new').length, color: '#3b82f6' },
                    { name: 'Contacted', value: filteredLeads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
                    { name: 'Qualified', value: filteredLeads.filter(l => l.status === 'qualified').length, color: '#10b981' },
                    { name: 'Converted', value: filteredLeads.filter(l => l.status === 'converted').length, color: '#059669' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {[
                    { name: 'New', value: filteredLeads.filter(l => l.status === 'new').length, color: '#3b82f6' },
                    { name: 'Contacted', value: filteredLeads.filter(l => l.status === 'contacted').length, color: '#f59e0b' },
                    { name: 'Qualified', value: filteredLeads.filter(l => l.status === 'qualified').length, color: '#10b981' },
                    { name: 'Converted', value: filteredLeads.filter(l => l.status === 'converted').length, color: '#059669' },
                  ].map((entry, index) => (
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
            <h3 className="text-sm font-semibold text-slate-900">Lead Performance</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { name: 'Working Hours', count: data.workingHoursLeads },
                { name: 'Non-Working', count: data.nonWorkingHoursLeads },
                { name: 'Qualified', count: data.successfulLeads },
                { name: 'Calls', count: data.totalCalls },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

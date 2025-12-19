import { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Users, CheckCircle2, XCircle, Phone, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { getTimeCategory } from '../lib/timeClassification';
import { useNavigate } from 'react-router-dom';

type Lead = Database['public']['Tables']['leads']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];

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
  const [data, setData] = useState<DashboardData>({
    totalLeads: 0,
    successfulLeads: 0,
    failedLeads: 0,
    workingHoursLeads: 0,
    nonWorkingHoursLeads: 0,
    recentLeads: [],
    totalCalls: 0,
    completedCalls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      if (!profile?.company_id) {
        console.warn('[DASHBOARD] No company_id available');
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
            .select('lead_id, success_evaluation, status')
            .eq('company_id', profile.company_id),
        ]);

        const leads = leadsResult.data || [];
        const calls = callsResult.data || [];

        const callsMap = new Map(
          calls.map(call => [call.lead_id, call])
        );

        const successfulLeads = leads.filter(lead => {
          const call = callsMap.get(lead.id);
          return call?.success_evaluation === true;
        }).length;

        const workingHoursLeads = leads.filter(lead =>
          getTimeCategory(lead.created_at) === 'Working Hours'
        ).length;

        setData({
          totalLeads: leads.length,
          successfulLeads,
          failedLeads: leads.length - successfulLeads,
          workingHoursLeads,
          nonWorkingHoursLeads: leads.length - workingHoursLeads,
          recentLeads: leads.slice(0, 5),
          totalCalls: calls.length,
          completedCalls: calls.filter(c => c.status === 'completed').length,
        });
      } catch (error) {
        console.error('[DASHBOARD] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.company_id, authLoading]);

  const successRate = data.totalLeads > 0
    ? Math.round((data.successfulLeads / data.totalLeads) * 100)
    : 0;

  const kpis = [
    {
      title: 'Total Leads',
      value: data.totalLeads.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Successful Leads',
      value: data.successfulLeads.toString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Failed/Nurture',
      value: data.failedLeads.toString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Calls',
      value: data.totalCalls.toString(),
      icon: Phone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Working Hours Leads',
      value: data.workingHoursLeads.toString(),
      icon: Clock,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-slate-500">Quick overview of your lead management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{kpi.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Leads</h3>
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet. Start by syncing your Google Sheet or adding leads manually.</p>
            ) : (
              <div className="space-y-3">
                {data.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Working Hours Leads</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{data.workingHoursLeads}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Non-Working Hours</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{data.nonWorkingHoursLeads}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Success Rate</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{successRate}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Calls Completed</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{data.completedCalls}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {data.totalLeads > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Want deeper insights?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Visit the Analytics page for detailed charts, time-based analysis, and interactive filters.
                </p>
              </div>
              <button
                onClick={() => navigate('/analytics')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

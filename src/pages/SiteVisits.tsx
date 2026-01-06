import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { DateFilter, useDateFilter, DateRange } from '../components/ui/DateFilter';

type SiteVisit = Database['public']['Tables']['site_visits']['Row'];

interface EnrichedVisit extends SiteVisit {
  lead_name?: string;
}

export function SiteVisits() {
  const { profile } = useAuth();
  const { dateRange, setDateRange } = useDateFilter('This Month');
  const [allVisits, setAllVisits] = useState<EnrichedVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: visitsData } = await supabase
        .from('site_visits')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('visit_date', { ascending: true });

      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name')
        .eq('company_id', profile.company_id);

      const leadsMap = new Map(leadsData?.map(l => [l.id, l.name]) || []);

      const enriched: EnrichedVisit[] = (visitsData || []).map(visit => ({
        ...visit,
        lead_name: leadsMap.get(visit.lead_id) || 'Unknown',
      }));

      setAllVisits(enriched);
    } catch (error) {
      console.error('Error fetching site visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [profile?.company_id]);

  const filterVisitsByDate = (visits: EnrichedVisit[], range: DateRange): EnrichedVisit[] => {
    if (!range.startDate || !range.endDate) return visits;
    return visits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= range.startDate! && visitDate <= range.endDate!;
    });
  };

  const filteredVisits = filterVisitsByDate(allVisits, dateRange);

  const today = new Date().toISOString().split('T')[0];
  const todayCount = allVisits.filter(v => v.visit_date === today).length;

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const weekCount = allVisits.filter(v => v.visit_date >= today && v.visit_date <= weekEndStr).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Site Visits</h2>
          <p className="text-slate-500">Manage and track property site visits</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-500">Today's Visits</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{todayCount}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-500">This Week</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{weekCount}</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Visits ({filteredVisits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">
              Loading site visits...
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No site visits in selected date range
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Lead Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.site_visit_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{visit.lead_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{visit.project}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(visit.visit_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{visit.visit_time}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <User className="w-4 h-4" />
                          {visit.owner}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Visits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisits.slice(0, 10).map((visit) => (
              <div key={visit.site_visit_id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{visit.lead_name}</p>
                    <p className="text-sm text-slate-500 mt-1">{visit.project}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(visit.visit_date)} at {visit.visit_time}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                      <User className="w-3 h-3" />
                      {visit.owner}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredVisits.length > 10 && (
            <p className="text-sm text-slate-500 mt-4">
              Showing 10 of {filteredVisits.length} visits
            </p>
          )}
          {filteredVisits.length === 0 && (
            <p className="text-sm text-slate-500">No visits in selected date range</p>
          )}
        </div>
      </Card>
    </div>
  );
}

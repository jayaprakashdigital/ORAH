import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Calendar, User, MapPin, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { DateFilter, useDateFilter, DateRange } from '../components/ui/DateFilter';
import { useNavigate } from 'react-router-dom';

type SiteVisit = Database['public']['Tables']['site_visits']['Row'];

interface EnrichedVisit extends SiteVisit {
  lead_name?: string;
}

export function SiteVisits() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { dateRange, setDateRange } = useDateFilter('This Month');
  const [allVisits, setAllVisits] = useState<EnrichedVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getVisitsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allVisits.filter(v => v.visit_date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Site Visits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage property site visits</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-lg font-semibold text-slate-900">{todayCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">This Week</p>
              <p className="text-lg font-semibold text-slate-900">{weekCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <MapPin className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">In Range</p>
              <p className="text-lg font-semibold text-slate-900">{filteredVisits.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-semibold text-slate-900">{allVisits.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Scheduled Visits</h3>
          <p className="text-xs text-slate-500 mt-0.5">{filteredVisits.length} visits in selected range</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading site visits...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No site visits in selected date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => (
                  <tr key={visit.site_visit_id}>
                    <td className="font-medium text-slate-900">{visit.lead_name}</td>
                    <td className="text-slate-600">{visit.project}</td>
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(visit.visit_date)}
                      </div>
                    </td>
                    <td className="text-slate-600">{visit.visit_time}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {visit.owner?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-slate-900">{visit.owner}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayVisits = getVisitsForDay(day);
              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-1.5 transition-all ${
                    isToday(day)
                      ? 'border-blue-500 bg-blue-50'
                      : dayVisits.length > 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className={`text-xs font-medium ${isToday(day) ? 'text-blue-700' : 'text-slate-700'}`}>
                    {day}
                  </div>
                  {dayVisits.length > 0 && (
                    <div className="mt-1">
                      {dayVisits.slice(0, 2).map(v => (
                        <div
                          key={v.site_visit_id}
                          onClick={() => navigate(`/leads/${v.lead_id}`)}
                          className="text-[9px] bg-emerald-600 text-white px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer"
                          title={`${v.visit_time} - ${v.lead_name}`}
                        >
                          {v.visit_time}
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <div className="text-[9px] text-emerald-700 font-medium">
                          +{dayVisits.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

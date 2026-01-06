import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  lead_id: string;
  lead_name: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

export function Calendar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      loadAppointments();
    }
  }, [profile, currentDate]);

  const loadAppointments = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, next_follow_up, location_preference')
        .eq('company_id', profile.company_id)
        .not('next_follow_up', 'is', null)
        .order('next_follow_up', { ascending: true });

      const appts: Appointment[] = (leads || []).map(lead => {
        const followUpDate = new Date(lead.next_follow_up);
        return {
          id: lead.id,
          lead_id: lead.id,
          lead_name: lead.name,
          date: followUpDate.toISOString().split('T')[0],
          time: followUpDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          location: lead.location_preference || 'Not specified',
          type: 'Follow-up',
        };
      });

      setAppointments(appts);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
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

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={nextMonth}
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
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayAppointments = getAppointmentsForDay(day);
                  const hasAppointments = dayAppointments.length > 0;

                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-1.5 transition-all cursor-pointer ${
                        isToday(day)
                          ? 'border-blue-500 bg-blue-50'
                          : hasAppointments
                          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`text-xs font-medium ${
                        isToday(day) ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {day}
                      </div>
                      {hasAppointments && (
                        <div className="mt-1 space-y-0.5">
                          {dayAppointments.slice(0, 2).map(apt => (
                            <div
                              key={apt.id}
                              onClick={() => navigate(`/leads/${apt.lead_id}`)}
                              className="text-[9px] bg-emerald-600 text-white px-1 py-0.5 rounded truncate"
                              title={`${apt.time} - ${apt.lead_name}`}
                            >
                              {apt.time}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[9px] text-emerald-700 font-medium">
                              +{dayAppointments.length - 2} more
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

        <div>
          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Appointments</h3>
            </div>
            <div className="p-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/leads/${apt.lead_id}`)}
                      className="p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">{apt.lead_name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {apt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(apt.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {apt.location}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

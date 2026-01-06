import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { ChevronRight, Phone, Mail, IndianRupee, Calendar, MapPin, Home, Edit, CheckCircle2, Play, X, Clock, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];
type Timeline = Database['public']['Tables']['lead_timeline']['Row'];

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [latestCall, setLatestCall] = useState<Call | null>(null);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextVisit, setNextVisit] = useState<any>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    email: '',
    budget: '',
    possession_timeline: '',
    unit_preference: '',
    location_preference: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    project: '',
    visit_date: '',
    visit_time: '',
  });

  const [statusForm, setStatusForm] = useState({
    status: '',
    follow_up_date: '',
  });

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;

      try {
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (leadError) throw leadError;
        setLead(leadData);

        if (leadData) {
          setEditForm({
            name: leadData.name,
            mobile: leadData.mobile,
            email: leadData.email || '',
            budget: leadData.budget || '',
            possession_timeline: leadData.possession_timeline || '',
            unit_preference: leadData.unit_preference || '',
            location_preference: leadData.location_preference || '',
          });
          setStatusForm({
            status: leadData.status || 'new',
            follow_up_date: leadData.next_follow_up || '',
          });
        }

        const { data: callData } = await supabase
          .from('calls')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setLatestCall(callData);

        const { data: visitData } = await supabase
          .from('site_visits')
          .select('*')
          .eq('lead_id', id)
          .order('visit_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        setNextVisit(visitData);

        const { data: timelineData } = await supabase
          .from('lead_timeline')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false });

        setTimeline(timelineData || []);
      } catch (error) {
        console.error('Error fetching lead:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700',
      contacted: 'bg-amber-50 text-amber-700',
      qualified: 'bg-emerald-50 text-emerald-700',
      converted: 'bg-green-50 text-green-700',
      lost: 'bg-red-50 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseTranscript = (transcript: string | null) => {
    if (!transcript) return [];
    const lines = transcript.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const [speaker, ...messageParts] = line.split(':');
      return {
        speaker: speaker.trim(),
        message: messageParts.join(':').trim()
      };
    });
  };

  const getNextOwner = async () => {
    const owners = ['JP', 'Raghu', 'User3', 'User4', 'User5'];
    const { data: visits } = await supabase
      .from('site_visits')
      .select('owner')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastOwner = visits?.[0]?.owner;
    const lastIndex = owners.indexOf(lastOwner);
    return owners[(lastIndex + 1) % owners.length];
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('leads')
        .update({
          name: editForm.name,
          mobile: editForm.mobile,
          email: editForm.email || null,
          budget: editForm.budget || null,
          possession_timeline: editForm.possession_timeline || null,
          unit_preference: editForm.unit_preference || null,
          location_preference: editForm.location_preference || null,
        })
        .eq('id', lead.id);

      if (error) throw error;

      setLead({ ...lead, ...editForm });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !profile?.company_id) return;

    try {
      setSaving(true);
      const owner = await getNextOwner();

      const { error } = await supabase
        .from('site_visits')
        .insert({
          lead_id: lead.id,
          company_id: profile.company_id,
          project: scheduleForm.project,
          visit_date: scheduleForm.visit_date,
          visit_time: scheduleForm.visit_time,
          owner,
        });

      if (error) throw error;

      setShowScheduleModal(false);
      setScheduleForm({ project: '', visit_date: '', visit_time: '' });

      const { data: visitData } = await supabase
        .from('site_visits')
        .select('*')
        .eq('lead_id', lead.id)
        .order('visit_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextVisit(visitData);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      alert(error instanceof Error ? error.message : 'Failed to schedule visit');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !profile?.company_id) return;

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: statusForm.status,
          next_follow_up: statusForm.follow_up_date || null,
        })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      await supabase
        .from('lead_timeline')
        .insert({
          lead_id: lead.id,
          company_id: profile.company_id,
          action_type: 'status_change',
          field_changed: 'status',
          old_value: lead.status,
          new_value: statusForm.status,
          user_name: profile.name || 'Unknown',
        });

      setLead({ ...lead, status: statusForm.status, next_follow_up: statusForm.follow_up_date || null });
      setShowStatusModal(false);

      const { data: timelineData } = await supabase
        .from('lead_timeline')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      setTimeline(timelineData || []);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">Loading lead details...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-600">Lead not found</p>
      </div>
    );
  }

  const transcript = parseTranscript(latestCall?.transcript || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-slate-500">
        <span onClick={() => navigate('/leads')} className="cursor-pointer hover:text-slate-700 transition-colors">Leads</span>
        <ChevronRight className="w-4 h-4 mx-1.5" />
        <span className="text-slate-900 font-medium">{lead.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{lead.name}</h1>
            <span className={`status-badge ${getStatusColor(lead.status)}`}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{lead.mobile}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>
            Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Site Visit
          </Button>
          <Button size="sm">
            <Phone className="w-3.5 h-3.5 mr-1.5" />
            Call
          </Button>
        </div>
      </div>

      {nextVisit && (
        <Card>
          <div className="p-4 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Next Site Visit</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(nextVisit.visit_date)} at {nextVisit.visit_time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="text-sm font-medium text-slate-900">{nextVisit.project}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <p className="text-sm font-medium text-slate-900">{nextVisit.owner}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Timeline
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Lead Information</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Mobile</p>
                      <p className="text-sm font-medium text-slate-900">{lead.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">{lead.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IndianRupee className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="text-sm font-medium text-slate-900">{lead.budget || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Possession Timeline</p>
                      <p className="text-sm font-medium text-slate-900">{lead.possession_timeline || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Unit Preference</p>
                      <p className="text-sm font-medium text-slate-900">{lead.unit_preference || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-medium text-slate-900">{lead.location_preference || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {latestCall && (
              <Card>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Call Intelligence</h3>
                  <div className="flex items-center gap-2">
                    {latestCall.success_evaluation ? (
                      <span className="status-badge bg-emerald-50 text-emerald-700">Qualified</span>
                    ) : (
                      <span className="status-badge bg-slate-50 text-slate-600">Nurture</span>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {latestCall.summary || 'No summary available'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    {latestCall.recording_url && (
                      <Button variant="outline" size="sm">
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Play Recording
                      </Button>
                    )}
                    {transcript.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setShowTranscript(!showTranscript)}>
                        {showTranscript ? 'Hide' : 'Show'} Transcript
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {showTranscript && transcript.length > 0 && (
              <Card>
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Conversation Transcript</h3>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {transcript.map((item, index) => (
                      <div key={index} className={`flex ${item.speaker === 'User' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          item.speaker === 'User'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}>
                          <p className="text-xs font-medium mb-0.5 opacity-70">{item.speaker}</p>
                          <p className="text-sm">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {!latestCall && (
              <Card>
                <div className="p-8 text-center text-sm text-slate-500">
                  No call history available
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Quick Info</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium text-slate-900">{formatDateTime(lead.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Lead ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-slate-600">{lead.id.substring(0, 8)}...</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lead.id);
                        alert('Lead ID copied!');
                      }}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                      title="Copy full ID"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {lead.next_follow_up && (
                  <div>
                    <p className="text-xs text-slate-500">Follow-up</p>
                    <p className="text-sm font-medium text-slate-900">{formatDateTime(lead.next_follow_up)}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setShowScheduleModal(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Site Visit
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setShowStatusModal(true)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Timeline History</h3>
          </div>
          <div className="p-5">
            {timeline.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8">
                No activity recorded
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.timeline_id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                      {index < timeline.length - 1 && <div className="w-px h-10 bg-slate-200 mt-1"></div>}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm text-slate-900">
                        {event.action_type === 'status_change'
                          ? `Status changed from ${event.old_value} to ${event.new_value}`
                          : event.action_type === 'field_edit'
                          ? `${event.field_changed} updated`
                          : event.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {event.user_name} - {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Update Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleStatusChange} className="p-5 space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 bg-white"
                  required
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <Label htmlFor="follow-up-date">Follow-up Date (Optional)</Label>
                <Input
                  id="follow-up-date"
                  type="datetime-local"
                  value={statusForm.follow_up_date}
                  onChange={(e) => setStatusForm({ ...statusForm, follow_up_date: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowStatusModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Edit Lead</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit-mobile">Mobile</Label>
                <Input id="edit-mobile" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-budget">Budget</Label>
                <Input id="edit-budget" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-timeline">Possession Timeline</Label>
                <Input id="edit-timeline" value={editForm.possession_timeline} onChange={(e) => setEditForm({ ...editForm, possession_timeline: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit Preference</Label>
                <Input id="edit-unit" value={editForm.unit_preference} onChange={(e) => setEditForm({ ...editForm, unit_preference: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-location">Location Preference</Label>
                <Input id="edit-location" value={editForm.location_preference} onChange={(e) => setEditForm({ ...editForm, location_preference: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Schedule Site Visit</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Input id="project" value={scheduleForm.project} onChange={(e) => setScheduleForm({ ...scheduleForm, project: e.target.value })} placeholder="e.g., Century Outskill Regalia" required />
              </div>
              <div>
                <Label htmlFor="visit-date">Visit Date</Label>
                <Input id="visit-date" type="date" value={scheduleForm.visit_date} onChange={(e) => setScheduleForm({ ...scheduleForm, visit_date: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="visit-time">Visit Time</Label>
                <Input id="visit-time" type="time" value={scheduleForm.visit_time} onChange={(e) => setScheduleForm({ ...scheduleForm, visit_time: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowScheduleModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Scheduling...' : 'Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

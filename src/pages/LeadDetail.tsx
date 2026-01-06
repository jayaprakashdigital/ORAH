import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { ChevronRight, Phone, Mail, IndianRupee, Calendar, MapPin, Home, Edit, Video, CheckCircle2, Play, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [latestCall, setLatestCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextVisit, setNextVisit] = useState<any>(null);

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
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      qualified: 'bg-green-100 text-green-700 border-green-200',
      converted: 'bg-purple-100 text-purple-700 border-purple-200',
      lost: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading lead details...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Lead not found</p>
      </div>
    );
  }

  const transcript = parseTranscript(latestCall?.transcript || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-slate-500">
        <span onClick={() => navigate('/leads')} className="cursor-pointer hover:text-slate-700">Leads</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-900">Lead Details</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{lead.name}</h1>
          <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(lead.status)}`}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Phone className="w-4 h-4 mr-2" />
            Call Lead
          </Button>
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Site Visit
          </Button>
        </div>
      </div>

      {nextVisit && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Action Intelligence</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Assigned Owner</p>
                  <p className="text-base font-medium text-slate-900">{nextVisit.owner}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Next Site Visit</p>
                  <p className="text-base font-medium text-slate-900">
                    {new Date(nextVisit.visit_date).toLocaleDateString('en-IN')} at {nextVisit.visit_time}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{nextVisit.project}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Lead Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Mobile Number</p>
                <p className="text-base font-medium text-slate-900">{lead.mobile}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Email ID</p>
                <p className="text-base font-medium text-slate-900">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Lead Creation Date & Time</p>
                <p className="text-base font-medium text-slate-900">{formatDate(lead.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IndianRupee className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Budget</p>
                <p className="text-base font-medium text-slate-900">{lead.budget || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Possession Timeline</p>
                <p className="text-base font-medium text-slate-900">{lead.possession_timeline || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Unit Preference</p>
                <p className="text-base font-medium text-slate-900">{lead.unit_preference || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Location Preference</p>
                <p className="text-base font-medium text-slate-900">{lead.location_preference || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {latestCall && (
        <>
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Call Intelligence</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Call Summary</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {latestCall.summary || 'No summary available'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Call Recording</h3>
                    {latestCall.recording_url ? (
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Play Audio
                      </Button>
                    ) : (
                      <p className="text-sm text-slate-400">No call recording available</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Success Evaluation</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 ${latestCall.success_evaluation ? 'text-green-600' : 'text-slate-300'}`} />
                      <span className={`font-medium ${latestCall.success_evaluation ? 'text-green-600' : 'text-slate-400'}`}>
                        {latestCall.success_evaluation ? 'Qualified / Successful Lead' : 'Not Qualified'}
                      </span>
                    </div>
                    {latestCall.success_evaluation && (
                      <p className="text-xs text-slate-500 mt-1">Lead meets budget, location, and intent criteria</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {transcript.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">AI Conversation Transcript</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto bg-slate-50 p-4 rounded-lg">
                  {transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`flex ${item.speaker === 'User' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          item.speaker === 'User'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {item.speaker}
                        </p>
                        <p className="text-sm leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {!latestCall && (
        <Card>
          <div className="p-8 text-center text-slate-500">
            No call history available for this lead
          </div>
        </Card>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Lead</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-mobile">Mobile</Label>
                <Input
                  id="edit-mobile"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-budget">Budget</Label>
                <Input
                  id="edit-budget"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-timeline">Possession Timeline</Label>
                <Input
                  id="edit-timeline"
                  value={editForm.possession_timeline}
                  onChange={(e) => setEditForm({ ...editForm, possession_timeline: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-unit">Unit Preference</Label>
                <Input
                  id="edit-unit"
                  value={editForm.unit_preference}
                  onChange={(e) => setEditForm({ ...editForm, unit_preference: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Location Preference</Label>
                <Input
                  id="edit-location"
                  value={editForm.location_preference}
                  onChange={(e) => setEditForm({ ...editForm, location_preference: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Schedule Site Visit</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={scheduleForm.project}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, project: e.target.value })}
                  placeholder="e.g., Whitefield Plaza"
                  required
                />
              </div>

              <div>
                <Label htmlFor="visit-date">Visit Date</Label>
                <Input
                  id="visit-date"
                  type="date"
                  value={scheduleForm.visit_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, visit_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="visit-time">Visit Time</Label>
                <Input
                  id="visit-time"
                  type="time"
                  value={scheduleForm.visit_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, visit_time: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1"
                >
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

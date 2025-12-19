import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, Phone, Mail, IndianRupee, Calendar, MapPin, Home, Edit, Video, CheckCircle2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [latestCall, setLatestCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

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

        const { data: callData } = await supabase
          .from('calls')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setLatestCall(callData);
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
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Site Visit
          </Button>
        </div>
      </div>

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
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, CheckCircle2, XCircle, X, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { getTimeCategory } from '../lib/timeClassification';
import { useAutoSync } from '../hooks/useAutoSync';

type Lead = Database['public']['Tables']['leads']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];

interface EnrichedLead extends Lead {
  timeCategory: 'Working Hours' | 'Non-Working Hours';
  successEvaluation: boolean;
}

export function Leads() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: 'all',
    timeCategory: 'all',
    success: 'all',
  });

  const { syncing, lastSync } = useAutoSync(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    budget: '',
    unit_preference: '',
    location_preference: '',
    notes: '',
  });

  const fetchLeads = async () => {
    if (authLoading) return;

    if (!profile?.company_id) {
      console.warn('[LEADS] No company_id available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: callsData } = await supabase
        .from('calls')
        .select('lead_id, success_evaluation')
        .eq('company_id', profile.company_id);

      const callsMap = new Map(
        callsData?.map(call => [call.lead_id, call]) || []
      );

      const enrichedLeads: EnrichedLead[] = (leadsData || []).map(lead => {
        const call = callsMap.get(lead.id);
        return {
          ...lead,
          timeCategory: getTimeCategory(lead.created_at),
          successEvaluation: call?.success_evaluation || false,
        };
      });

      setLeads(enrichedLeads);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leads';
      console.error('[LEADS] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [profile?.company_id, authLoading]);

  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.company_id) return;

    try {
      setSaving(true);

      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          company_id: profile.company_id,
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email || null,
          budget: formData.budget || null,
          unit_preference: formData.unit_preference || null,
          location_preference: formData.location_preference || null,
          notes: formData.notes || null,
          status: 'new',
        });

      if (insertError) throw insertError;

      setShowAddModal(false);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        budget: '',
        unit_preference: '',
        location_preference: '',
        notes: '',
      });

      await fetchLeads();
    } catch (err) {
      console.error('[LEADS] Error adding lead:', err);
      alert(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-green-100 text-green-700';
      case 'unqualified': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter.status !== 'all' && lead.status !== filter.status) return false;
    if (filter.timeCategory !== 'all' && lead.timeCategory !== filter.timeCategory) return false;
    if (filter.success === 'true' && !lead.successEvaluation) return false;
    if (filter.success === 'false' && lead.successEvaluation) return false;
    return true;
  });

  const uniqueStatuses = ['new', 'contacted', 'qualified', 'unqualified'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Leads</h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500">Manage your real estate leads</p>
            {syncing && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
            {lastSync && !syncing && (
              <span className="text-xs text-slate-400">
                Last synced: {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            Loading leads...
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-red-600 mb-2">Error loading leads</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </Card>
      ) : leads.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            No leads yet. Click "Add Lead" to get started.
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                <select
                  value={filter.timeCategory}
                  onChange={(e) => setFilter({ ...filter, timeCategory: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Time Categories</option>
                  <option value="Working Hours">Working Hours</option>
                  <option value="Non-Working Hours">Non-Working Hours</option>
                </select>

                <select
                  value={filter.success}
                  onChange={(e) => setFilter({ ...filter, success: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Success Status</option>
                  <option value="true">Successful Only</option>
                  <option value="false">Failed/Nurture Only</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Mobile</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Created At</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Budget</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Unit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Success</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{lead.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{lead.mobile}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{lead.email || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(lead.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.timeCategory === 'Working Hours' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.timeCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{lead.budget || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{lead.unit_preference || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{lead.location_preference || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {lead.successEvaluation ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  No leads match the selected filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter lead name"
                />
              </div>

              <div>
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g., 70L - 1Cr"
                />
              </div>

              <div>
                <Label htmlFor="unit_preference">Unit Preference</Label>
                <Input
                  id="unit_preference"
                  value={formData.unit_preference}
                  onChange={(e) => setFormData({ ...formData, unit_preference: e.target.value })}
                  placeholder="e.g., 3 BHK"
                />
              </div>

              <div>
                <Label htmlFor="location_preference">Location Preference</Label>
                <Input
                  id="location_preference"
                  value={formData.location_preference}
                  onChange={(e) => setFormData({ ...formData, location_preference: e.target.value })}
                  placeholder="e.g., Whitefield"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Adding...' : 'Add Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

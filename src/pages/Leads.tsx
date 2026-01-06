import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, CheckCircle2, XCircle, X, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { getTimeCategory } from '../lib/timeClassification';
import { useAutoSync } from '../hooks/useAutoSync';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';

type Lead = Database['public']['Tables']['leads']['Row'];

interface EnrichedLead extends Lead {
  timeCategory: 'Working Hours' | 'Non-Working Hours';
  successEvaluation: boolean;
}

export function Leads() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { dateRange, setDateRange, filterByDate } = useDateFilter('Last 30 Days');
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      alert(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700';
      case 'contacted': return 'bg-amber-50 text-amber-700';
      case 'qualified': return 'bg-emerald-50 text-emerald-700';
      case 'unqualified': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const dateFilteredLeads = filterByDate(leads);

  const filteredLeads = dateFilteredLeads.filter(lead => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!lead.name.toLowerCase().includes(query) &&
          !lead.mobile.includes(query) &&
          !(lead.email?.toLowerCase().includes(query))) {
        return false;
      }
    }
    if (filter.status !== 'all' && lead.status !== filter.status) return false;
    if (filter.timeCategory !== 'all' && lead.timeCategory !== filter.timeCategory) return false;
    if (filter.success === 'true' && !lead.successEvaluation) return false;
    if (filter.success === 'false' && lead.successEvaluation) return false;
    return true;
  });

  const uniqueStatuses = ['new', 'contacted', 'qualified', 'unqualified'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-slate-500">Manage your real estate leads</p>
            {syncing && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
            {lastSync && !syncing && (
              <span className="text-xs text-slate-400">
                Synced {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Loading leads...
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm">Error loading leads</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        </Card>
      ) : leads.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            No leads yet. Click "Add Lead" to get started.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                <select
                  value={filter.timeCategory}
                  onChange={(e) => setFilter({ ...filter, timeCategory: e.target.value })}
                  className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                >
                  <option value="all">All Hours</option>
                  <option value="Working Hours">Working Hours</option>
                  <option value="Non-Working Hours">Non-Working</option>
                </select>

                <select
                  value={filter.success}
                  onChange={(e) => setFilter({ ...filter, success: e.target.value })}
                  className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                >
                  <option value="all">All Results</option>
                  <option value="true">Qualified</option>
                  <option value="false">Nurture</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">{filteredLeads.length} leads</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Hours</th>
                  <th>Budget</th>
                  <th>Unit</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="font-medium text-slate-900">{lead.name}</td>
                    <td>
                      <div>
                        <p>{lead.mobile}</p>
                        <p className="text-xs text-slate-400">{lead.email || '-'}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        lead.timeCategory === 'Working Hours' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {lead.timeCategory === 'Working Hours' ? 'Working' : 'Non-Working'}
                      </span>
                    </td>
                    <td className="text-slate-500">{lead.budget || '-'}</td>
                    <td className="text-slate-500">{lead.unit_preference || '-'}</td>
                    <td>
                      {lead.successEvaluation ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No leads match the selected filters
              </div>
            )}
          </div>
        </Card>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-5 space-y-4">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
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

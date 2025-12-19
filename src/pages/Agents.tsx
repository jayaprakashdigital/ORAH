import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, Phone, Sparkles, X, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

export function Agents() {
  const { profile, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    greeting: '',
    voice_id: '',
    is_active: true,
  });

  const fetchAgents = async () => {
    if (authLoading) return;

    if (!profile?.company_id) {
      console.warn('[AGENTS] No company_id available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('agents')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setAgents(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agents';
      console.error('[AGENTS] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [profile?.company_id, authLoading]);

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        personality: agent.personality,
        greeting: agent.greeting || '',
        voice_id: agent.voice_id || '',
        is_active: agent.is_active,
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        personality: '',
        greeting: '',
        voice_id: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.company_id) return;

    try {
      setSaving(true);

      if (editingAgent) {
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            name: formData.name,
            personality: formData.personality,
            greeting: formData.greeting || null,
            voice_id: formData.voice_id || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAgent.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('agents')
          .insert({
            company_id: profile.company_id,
            name: formData.name,
            personality: formData.personality,
            greeting: formData.greeting || null,
            voice_id: formData.voice_id || null,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
      }

      setShowModal(false);
      setEditingAgent(null);
      await fetchAgents();
    } catch (err) {
      console.error('[AGENTS] Error saving agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Agents</h2>
          <p className="text-slate-500">Manage your AI voice agents</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            Loading agents...
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-red-600 mb-2">Error loading agents</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </Card>
      ) : agents.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            No agents configured yet. Click "Create Agent" to get started.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.is_active)}`}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal(agent)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-slate-500">Voice:</span>
                    <span className="ml-2 text-slate-900">{agent.voice_id || 'Default'}</span>
                  </div>

                  <div className="text-sm">
                    <span className="text-slate-500">Personality:</span>
                    <p className="mt-1 text-slate-700 line-clamp-3">{agent.personality}</p>
                  </div>

                  {agent.greeting && (
                    <div className="text-sm">
                      <span className="text-slate-500">Greeting:</span>
                      <p className="mt-1 text-slate-700 italic line-clamp-2">"{agent.greeting}"</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Stats</span>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-4 h-4" />
                        <span>Ready for calls</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingAgent ? 'Edit Agent' : 'Create New Agent'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Sales Agent"
                />
              </div>

              <div>
                <Label htmlFor="personality">Personality *</Label>
                <textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  required
                  placeholder="Describe the agent's personality and behavior..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="greeting">Greeting Message</Label>
                <textarea
                  id="greeting"
                  value={formData.greeting}
                  onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                  placeholder="Initial greeting when the call starts..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="voice_id">Voice ID</Label>
                <Input
                  id="voice_id"
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  placeholder="e.g., en-US-Neural2-A"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty for default voice
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (ready to make calls)
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Phone, FileSpreadsheet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Integrations() {
  const { user } = useAuth();
  const [sheetId, setSheetId] = useState('');
  const [tabName, setTabName] = useState('Sheet1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  const [vapiApiKey, setVapiApiKey] = useState('');
  const [vapiLoading, setVapiLoading] = useState(false);
  const [vapiMessage, setVapiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadSyncLogs();
    loadVapiApiKey();
  }, [user]);

  const loadVapiApiKey = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('service', 'vapi')
        .eq('key_type', 'private')
        .maybeSingle();

      if (data) {
        setVapiApiKey(data.encrypted_key);
      }
    } catch (err) {
      console.error('Error loading Vapi API key:', err);
    }
  };

  const loadConfig = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('sheet_configs')
      .select('sheet_id, tab_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSheetId(data.sheet_id);
      setTabName(data.tab_name);
    }
  };

  const loadSyncLogs = async () => {
    const { data } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setSyncLogs(data);
    }
  };

  const handleSaveVapiKey = async () => {
    if (!user || !vapiApiKey.trim()) {
      setVapiMessage({ type: 'error', text: 'Please enter your Vapi API key' });
      return;
    }

    setVapiLoading(true);
    setVapiMessage(null);

    try {
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          service: 'vapi',
          key_type: 'private',
          encrypted_key: vapiApiKey,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,service,key_type'
        });

      if (error) throw error;
      setVapiMessage({ type: 'success', text: 'API key saved successfully' });
      setTimeout(() => setVapiMessage(null), 3000);
    } catch (err) {
      console.error('Error saving Vapi API key:', err);
      setVapiMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setVapiLoading(false);
    }
  };

  const handleSync = async () => {
    if (!sheetId.trim() || !tabName.trim()) {
      setMessage({ type: 'error', text: 'Please enter both Sheet ID and Tab Name' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error: configError } = await supabase.from('sheet_configs').upsert({
        user_id: session.user.id,
        sheet_id: sheetId,
        tab_name: tabName,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

      if (configError) {
        throw new Error(`Failed to save config: ${configError.message}`);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-sheets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sheetId, tabName }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${errorText || response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        if (result.warning) {
          setMessage({ type: 'error', text: result.warning });
        } else {
          setMessage({
            type: 'success',
            text: `Synced ${result.rowsSynced} leads. Auto-sync is now active.`
          });
        }
        loadSyncLogs();
      } else {
        setMessage({ type: 'error', text: result.error || 'Sync failed' });
      }
    } catch (error) {
      console.error('[SYNC] Error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Integrations</h1>
        <p className="text-sm text-slate-500 mt-0.5">Connect your tools and services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Vapi Voice AI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Connect for AI voice calls</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${vapiApiKey ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              <span className="text-xs text-slate-500">{vapiApiKey ? 'Connected' : 'Not Connected'}</span>
            </div>

            <div>
              <Label htmlFor="vapiApiKey">API Key</Label>
              <Input
                id="vapiApiKey"
                type="password"
                placeholder="Enter your Vapi API key"
                value={vapiApiKey}
                onChange={(e) => setVapiApiKey(e.target.value)}
                disabled={vapiLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Get your key from <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dashboard.vapi.ai</a>
              </p>
            </div>

            <Button onClick={handleSaveVapiKey} disabled={vapiLoading} className="w-full">
              {vapiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>

            {vapiMessage && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                vapiMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {vapiMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <p>{vapiMessage.text}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Google Sheets</h3>
                <p className="text-xs text-slate-500 mt-0.5">Import leads from sheets</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <Label htmlFor="sheetId">Sheet ID</Label>
              <Input
                id="sheetId"
                placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Find in URL: docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
              </p>
            </div>

            <div>
              <Label htmlFor="tabName">Tab Name</Label>
              <Input
                id="tabName"
                placeholder="Sheet1"
                value={tabName}
                onChange={(e) => setTabName(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button onClick={handleSync} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>

            {message && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <p>{message.text}</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 font-medium mb-1">Required Columns:</p>
              <p className="text-xs text-slate-500">name, mobile (required), email, budget, possession, unit preference, location preference, notes</p>
              <p className="text-xs text-slate-500 mt-2">
                Share sheet with: <span className="font-mono text-slate-600">orah-sheets-sync@aigf-c4.iam.gserviceaccount.com</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {syncLogs.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Syncs</h3>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-slate-700">
                      {log.status === 'success'
                        ? `${log.rows_synced} leads synced`
                        : log.error_message || 'Failed'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

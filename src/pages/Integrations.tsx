import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
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
      setVapiMessage({ type: 'success', text: 'Vapi API key saved successfully' });
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
          setMessage({
            type: 'error',
            text: result.warning
          });
        } else {
          setMessage({
            type: 'success',
            text: `Config saved! Synced ${result.rowsSynced} leads. Auto-sync is now active.`
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
        <h2 className="text-2xl font-semibold">Integrations</h2>
        <p className="text-slate-500">Connect your tools and services</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Vapi Voice AI</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Connect your Vapi account for AI voice calls</p>
              <p className="text-sm text-slate-400 mt-2">
                Status: {vapiApiKey ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <Label htmlFor="vapiApiKey">Vapi API Key</Label>
            <Input
              id="vapiApiKey"
              type="password"
              placeholder="Enter your Vapi API key"
              value={vapiApiKey}
              onChange={(e) => setVapiApiKey(e.target.value)}
              disabled={vapiLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Get your API key from <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dashboard.vapi.ai</a>
            </p>
          </div>

          <Button onClick={handleSaveVapiKey} disabled={vapiLoading} className="w-full">
            {vapiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save API Key'
            )}
          </Button>

          {vapiMessage && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              vapiMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {vapiMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{vapiMessage.text}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Google Sheets Sync</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Import leads from Google Sheets</p>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-3">
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
                Find this in your Google Sheet URL: docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
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
          </div>

          <Button onClick={handleSync} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </Button>

          {message && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {syncLogs.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Recent Syncs</h4>
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-slate-600">
                        {log.status === 'success'
                          ? `${log.rows_synced} leads synced`
                          : log.error_message || 'Failed'}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 font-medium mb-2">Required Sheet Columns:</p>
            <p className="text-xs text-slate-500">
              name, mobile (required), email, budget, possession, unit preference, location preference, notes
            </p>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Important:</strong> Share your sheet with: orah-sheets-sync@aigf-c4.iam.gserviceaccount.com
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

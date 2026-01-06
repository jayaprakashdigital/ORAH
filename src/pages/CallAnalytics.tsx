import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RefreshCw, TrendingUp, DollarSign, Clock, Phone } from 'lucide-react';
import { DateFilter, useDateFilter } from '../components/ui/DateFilter';

interface VapiAnalyticsData {
  totalCalls: number;
  totalCost: number;
  avgDuration: number;
  successRate: number;
  costBreakdown: {
    llm: number;
    stt: number;
    tts: number;
    vapi: number;
    transport: number;
  };
  callsByStatus: Array<{ group: string; count: number }>;
  callsByAssistant: Array<{ group: string; count: number; avgDuration: number }>;
}

export function CallAnalytics() {
  const { user } = useAuth();
  const { dateRange, setDateRange } = useDateFilter('Last 30 Days');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VapiAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadApiKey();
  }, [user]);

  useEffect(() => {
    if (apiKey && !data && !loading) {
      fetchAnalytics();
    }
  }, [apiKey]);

  const loadApiKey = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('service', 'vapi')
        .eq('key_type', 'private')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setApiKey(data.encrypted_key);
      }
    } catch (err) {
      console.error('Error loading API key:', err);
    }
  };

  const fetchAnalytics = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Vapi API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queries = [
        {
          table: 'call',
          name: 'totalCalls',
          operations: [{ operation: 'count', column: 'id' }],
        },
        {
          table: 'call',
          name: 'totalCost',
          operations: [{ operation: 'sum', column: 'cost' }],
        },
        {
          table: 'call',
          name: 'avgDuration',
          operations: [{ operation: 'avg', column: 'duration' }],
        },
        {
          table: 'call',
          name: 'costBreakdown',
          operations: [
            { operation: 'sum', column: 'costBreakdown.llm' },
            { operation: 'sum', column: 'costBreakdown.stt' },
            { operation: 'sum', column: 'costBreakdown.tts' },
            { operation: 'sum', column: 'costBreakdown.vapi' },
            { operation: 'sum', column: 'costBreakdown.transport' },
          ],
        },
        {
          table: 'call',
          name: 'successRate',
          groupBy: ['analysis.successEvaluation'],
          operations: [{ operation: 'count', column: 'id' }],
        },
        {
          table: 'call',
          name: 'callsByStatus',
          groupBy: ['status'],
          operations: [{ operation: 'count', column: 'id' }],
        },
        {
          table: 'call',
          name: 'callsByAssistant',
          groupBy: ['assistantId'],
          operations: [
            { operation: 'count', column: 'id' },
            { operation: 'avg', column: 'duration' },
          ],
        },
      ];

      const response = await fetch('https://api.vapi.ai/analytics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

      const results = await response.json();

      const analyticsData: VapiAnalyticsData = {
        totalCalls: results.find((r: any) => r.name === 'totalCalls')?.result?.[0]?.count || 0,
        totalCost: results.find((r: any) => r.name === 'totalCost')?.result?.[0]?.sum || 0,
        avgDuration: results.find((r: any) => r.name === 'avgDuration')?.result?.[0]?.avg || 0,
        successRate: 0,
        costBreakdown: {
          llm: results.find((r: any) => r.name === 'costBreakdown')?.result?.[0]?.['sum_costBreakdown.llm'] || 0,
          stt: results.find((r: any) => r.name === 'costBreakdown')?.result?.[0]?.['sum_costBreakdown.stt'] || 0,
          tts: results.find((r: any) => r.name === 'costBreakdown')?.result?.[0]?.['sum_costBreakdown.tts'] || 0,
          vapi: results.find((r: any) => r.name === 'costBreakdown')?.result?.[0]?.['sum_costBreakdown.vapi'] || 0,
          transport: results.find((r: any) => r.name === 'costBreakdown')?.result?.[0]?.['sum_costBreakdown.transport'] || 0,
        },
        callsByStatus: results.find((r: any) => r.name === 'callsByStatus')?.result?.map((item: any) => ({
          group: item.group?.status || 'Unknown',
          count: item.count || 0,
        })) || [],
        callsByAssistant: results.find((r: any) => r.name === 'callsByAssistant')?.result?.map((item: any) => ({
          group: item.group?.assistantId || 'Unknown',
          count: item.count || 0,
          avgDuration: item.avg || 0,
        })) || [],
      };

      const successResults = results.find((r: any) => r.name === 'successRate')?.result || [];
      const successful = successResults.find((r: any) => r.group?.['analysis.successEvaluation'] === true)?.count || 0;
      const failed = successResults.find((r: any) => r.group?.['analysis.successEvaluation'] === false)?.count || 0;
      analyticsData.successRate = successful + failed > 0 ? (successful / (successful + failed)) * 100 : 0;

      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching Vapi analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Call Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vapi call metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchAnalytics} disabled={loading || !apiKey} size="sm">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!apiKey && !loading && (
        <Card>
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600 mb-2">No Vapi API key configured</p>
            <p className="text-xs text-slate-500">Configure your API key in the Integrations page</p>
          </div>
        </Card>
      )}

      {loading && !data && (
        <Card>
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Loading analytics...</p>
          </div>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Calls</p>
                  <p className="text-lg font-semibold text-slate-900">{data.totalCalls}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Cost</p>
                  <p className="text-lg font-semibold text-slate-900">${data.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Duration</p>
                  <p className="text-lg font-semibold text-slate-900">{Math.round(data.avgDuration)}s</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="text-lg font-semibold text-slate-900">{data.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Cost Breakdown</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'LLM', value: data.costBreakdown.llm, color: 'bg-blue-500' },
                  { label: 'Speech-to-Text', value: data.costBreakdown.stt, color: 'bg-emerald-500' },
                  { label: 'Text-to-Speech', value: data.costBreakdown.tts, color: 'bg-amber-500' },
                  { label: 'Vapi Platform', value: data.costBreakdown.vapi, color: 'bg-slate-500' },
                  { label: 'Transport', value: data.costBreakdown.transport, color: 'bg-slate-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">${item.value.toFixed(4)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`${item.color} h-1.5 rounded-full transition-all`}
                        style={{ width: `${data.totalCost > 0 ? (item.value / data.totalCost) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Calls by Status</h3>
              </div>
              <div className="p-5 space-y-2">
                {data.callsByStatus.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No status data</p>
                ) : (
                  data.callsByStatus.map((item) => (
                    <div key={item.group} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 capitalize">{item.group}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Performance by Assistant</h3>
            </div>
            {data.callsByAssistant.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No assistant data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Assistant ID</th>
                      <th>Total Calls</th>
                      <th>Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.callsByAssistant.map((item, index) => (
                      <tr key={index}>
                        <td className="font-mono text-xs text-slate-600">{item.group}</td>
                        <td className="font-medium text-slate-900">{item.count}</td>
                        <td className="text-slate-600">{Math.round(item.avgDuration)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

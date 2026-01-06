import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

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
        console.error('API error response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

      const results = await response.json();
      console.log('API results:', results);

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
          <h2 className="text-2xl font-semibold">Call Analytics</h2>
          <p className="text-slate-500">View your call analytics and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchAnalytics} disabled={loading || !apiKey}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!apiKey && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No Vapi API key configured</p>
              <p className="text-sm text-slate-500">Please configure your API key in the Integrations page</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-400" />
              <p className="text-slate-600">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !data && !error && apiKey && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-slate-500">
              <p>Click "Fetch" to load your analytics data</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Calls</p>
                    <p className="text-2xl font-bold">{data.totalCalls}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Cost</p>
                    <p className="text-2xl font-bold">${data.totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Avg Duration</p>
                    <p className="text-2xl font-bold">{Math.round(data.avgDuration)}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Success Rate</p>
                    <p className="text-2xl font-bold">{data.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'LLM', value: data.costBreakdown.llm, color: 'bg-blue-500' },
                    { label: 'STT (Speech-to-Text)', value: data.costBreakdown.stt, color: 'bg-green-500' },
                    { label: 'TTS (Text-to-Speech)', value: data.costBreakdown.tts, color: 'bg-yellow-500' },
                    { label: 'Vapi Platform', value: data.costBreakdown.vapi, color: 'bg-purple-500' },
                    { label: 'Transport', value: data.costBreakdown.transport, color: 'bg-orange-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium">${item.value.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all`}
                          style={{ width: `${(item.value / data.totalCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calls by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.callsByStatus.map((item) => (
                    <div key={item.group} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium capitalize">{item.group}</span>
                      <span className="text-lg font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance by Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Assistant ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Total Calls</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.callsByAssistant.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-600 font-mono text-xs">{item.group}</td>
                        <td className="py-3 px-4 text-sm font-medium">{item.count}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{Math.round(item.avgDuration)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.callsByAssistant.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    No assistant data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

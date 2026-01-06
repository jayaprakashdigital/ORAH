import { Card } from './ui/Card';
import { TrendingUp, DollarSign, Target, Zap, Moon, PhoneCall } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ExecutiveSummaryProps {
  totalLeads: number;
  workingHoursLeads: number;
  nonWorkingHoursLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  nurturedLeads: number;
  avgLeadValue: number;
  totalRevenue: number;
}

export function ExecutiveSummary({
  totalLeads,
  workingHoursLeads,
  nonWorkingHoursLeads,
  qualifiedLeads,
  convertedLeads,
  nurturedLeads,
  avgLeadValue,
  totalRevenue,
}: ExecutiveSummaryProps) {
  const nonWorkingConversion = nonWorkingHoursLeads > 0
    ? Math.round((qualifiedLeads / nonWorkingHoursLeads) * 100)
    : 0;

  const conversionRate = totalLeads > 0
    ? Math.round((convertedLeads / totalLeads) * 100)
    : 0;

  const roiData = [
    { metric: 'Non-Work Hrs', value: nonWorkingHoursLeads, color: '#64748b' },
    { metric: 'Qualified', value: qualifiedLeads, color: '#10b981' },
    { metric: 'Converted', value: convertedLeads, color: '#3b82f6' },
  ];

  const revenueImpact = [
    { stage: 'Total Leads', value: totalLeads },
    { stage: 'Nurtured', value: nurturedLeads },
    { stage: 'Converted', value: convertedLeads },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Executive Summary</h2>
              <p className="text-sm text-slate-500 mt-1">Platform ROI & Business Impact</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Moon className="w-4 h-4 text-slate-700" />
                </div>
                <p className="text-xs font-medium text-slate-600">24/7 Lead Capture</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{nonWorkingHoursLeads}</p>
              <p className="text-xs text-slate-500">Captured after business hours</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">Auto-Nurtured</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{nurturedLeads}</p>
              <p className="text-xs text-slate-500">{nonWorkingConversion}% qualification rate</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">Conversions</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{convertedLeads}</p>
              <p className="text-xs text-slate-500">{conversionRate}% overall conversion</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">Revenue Generated</p>
              </div>
              <p className="text-3xl font-bold text-amber-600">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
              <p className="text-xs text-slate-500">Avg ₹{(avgLeadValue / 10000000).toFixed(2)}Cr/lead</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Platform Impact Funnel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lead journey through automation</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roiData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="metric" width={110} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {roiData.map((entry, index) => (
                    <rect key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Conversion Pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lead progression metrics</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Key Platform Benefits</h3>
              <p className="text-xs text-slate-500">Quantified value delivered</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
              <div className="text-2xl font-bold text-slate-900 mb-1">{nonWorkingHoursLeads}</div>
              <div className="text-xs font-medium text-slate-600 mb-2">Leads Captured 24/7</div>
              <div className="text-xs text-slate-500">
                Never miss opportunities outside business hours. Automated AI captures & qualifies leads instantly.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{nurturedLeads}</div>
              <div className="text-xs font-medium text-slate-600 mb-2">Instantly Nurtured</div>
              <div className="text-xs text-slate-500">
                AI agents engage leads immediately with personalized conversations, increasing qualification rates.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
              <div className="text-2xl font-bold text-amber-600 mb-1">₹{(totalRevenue / 10000000).toFixed(1)}Cr</div>
              <div className="text-xs font-medium text-slate-600 mb-2">Revenue Impact</div>
              <div className="text-xs text-slate-500">
                Direct revenue attributed to platform-generated conversions with {conversionRate}% success rate.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

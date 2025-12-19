import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VapiWebhookPayload {
  message: {
    type: string;
    call: {
      id: string;
      assistantId?: string;
      customer?: {
        number?: string;
        name?: string;
        email?: string;
      };
      status: string;
      startedAt?: string;
      endedAt?: string;
      duration?: number;
      recordingUrl?: string;
      transcript?: string;
      analysis?: {
        summary?: string;
        successEvaluation?: boolean;
        structuredData?: {
          intent?: string;
          sentiment?: string;
          budget?: string;
          location?: string;
          unitPreference?: string;
          possessionTimeline?: string;
        };
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VapiWebhookPayload = await req.json();
    const { message } = payload;

    console.log('[VAPI_WEBHOOK] Received:', JSON.stringify(message, null, 2));

    if (message.type === 'end-of-call-report') {
      const { call } = message;
      const phoneNumber = call.customer?.number;

      if (!phoneNumber) {
        console.error('[VAPI_WEBHOOK] No phone number in call data');
        return new Response(
          JSON.stringify({ error: 'No phone number provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cleanedPhone = phoneNumber.replace(/\D/g, '');

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, company_id, name, email')
        .ilike('mobile', `%${cleanedPhone}%`)
        .maybeSingle();

      if (leadError) {
        console.error('[VAPI_WEBHOOK] Error finding lead:', leadError);
      }

      if (!lead) {
        const { data: firstCompany } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (firstCompany) {
          const newLead = {
            company_id: firstCompany.id,
            name: call.customer?.name || 'Unknown',
            mobile: phoneNumber,
            email: call.customer?.email || '',
            source: 'Vapi Call',
            status: 'contacted',
            budget: call.analysis?.structuredData?.budget || null,
            location_preference: call.analysis?.structuredData?.location || null,
            unit_preference: call.analysis?.structuredData?.unitPreference || null,
            possession_timeline: call.analysis?.structuredData?.possessionTimeline || null,
          };

          const { data: createdLead, error: createError } = await supabase
            .from('leads')
            .insert(newLead)
            .select('id, company_id')
            .single();

          if (createError) {
            console.error('[VAPI_WEBHOOK] Error creating lead:', createError);
            return new Response(
              JSON.stringify({ error: 'Failed to create lead' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('company_id', createdLead.company_id)
            .maybeSingle();

          const callRecord = {
            lead_id: createdLead.id,
            company_id: createdLead.company_id,
            agent_id: agent?.id || null,
            vapi_call_id: call.id,
            status: 'completed',
            duration: call.duration || 0,
            recording_url: call.recordingUrl || null,
            transcript: call.transcript || null,
            summary: call.analysis?.summary || null,
            success_evaluation: call.analysis?.successEvaluation || false,
            intent: call.analysis?.structuredData?.intent || null,
            sentiment: call.analysis?.structuredData?.sentiment || null,
          };

          const { error: callError } = await supabase.from('calls').insert(callRecord);

          if (callError) {
            console.error('[VAPI_WEBHOOK] Error creating call:', callError);
            return new Response(
              JSON.stringify({ error: 'Failed to create call record' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('[VAPI_WEBHOOK] Created new lead and call record');
        }
      } else {
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('company_id', lead.company_id)
          .maybeSingle();

        const callRecord = {
          lead_id: lead.id,
          company_id: lead.company_id,
          agent_id: agent?.id || null,
          vapi_call_id: call.id,
          status: 'completed',
          duration: call.duration || 0,
          recording_url: call.recordingUrl || null,
          transcript: call.transcript || null,
          summary: call.analysis?.summary || null,
          success_evaluation: call.analysis?.successEvaluation || false,
          intent: call.analysis?.structuredData?.intent || null,
          sentiment: call.analysis?.structuredData?.sentiment || null,
        };

        const { error: callError } = await supabase.from('calls').insert(callRecord);

        if (callError) {
          console.error('[VAPI_WEBHOOK] Error creating call:', callError);
          return new Response(
            JSON.stringify({ error: 'Failed to create call record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (call.analysis?.structuredData) {
          const updates: any = {};
          if (call.analysis.structuredData.budget) updates.budget = call.analysis.structuredData.budget;
          if (call.analysis.structuredData.location) updates.location_preference = call.analysis.structuredData.location;
          if (call.analysis.structuredData.unitPreference) updates.unit_preference = call.analysis.structuredData.unitPreference;
          if (call.analysis.structuredData.possessionTimeline) updates.possession_timeline = call.analysis.structuredData.possessionTimeline;

          if (Object.keys(updates).length > 0) {
            await supabase.from('leads').update(updates).eq('id', lead.id);
          }
        }

        console.log('[VAPI_WEBHOOK] Updated existing lead with call data');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event type not handled' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VAPI_WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
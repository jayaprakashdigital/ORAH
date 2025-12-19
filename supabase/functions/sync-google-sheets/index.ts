import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'aigf-c4',
  private_key_id: 'f73958ed330bb72e03292f4d9669cbcba4f28364',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDC/xVZ0WH3twBd\n2pK+XABqBZfYx1pqL3KmS4At0/NAOQFWu3pDuHa396j8jmXPDWnQJrFS6OW02qr8\ngf2L4TSqZbt//UQib7zC3vlWb3U0nc1VROI7mZ45jTdxHagBD9cdIBi3G65q1mbt\n9bzcFTvrggkGz2ZlRNjUxnnYteCcFEuBO96UiBvnQ4J+g673wiJRPgkLXtkhyoW3\nvgpA86V3H6LCVWweDoZ3wlQsaOvktGV9JV7YUPp1CJHKiW5izrQjQn8H7G7JtYjn\ne26E232ta+s5R9RTdfI1QYfT6tzv9aNjdwBSk4V7ZL6xCvfD2WK7LJEcYpgGbxMv\n1Q0RscvLAgMBAAECggEAJBMmA45hlf8EsdhYkqAZsYOkYoYLG574knxgU9ok5ApH\nzaB0j6fGSuWmHUdI3YPpQgmOf7y3lnxn6rwvyJua7zVP+W9FFive25x9u3h2Ugwp\nqy9JvWX/qD0QdzxZ0wx3qxs/h0y3OWu98iMm0/6XrcvKWLixBGY2yTKI40dOrQEf\nXpb3p1ds4W6eZRqWiwmhghbYqW1kMyRMMO9IblPHDsaaCdpxFyt+7TuENJ36g0dj\nn6TdLrdLi79QJFzGy1KTMD5hlMEIPjV8Er5MnULHa/wtdqsuxsq6LBJPH4xTSxhn\nUqwFkeWh7n8tlTz/+8h7AseE5YWHWHoiyGUqI/kbIQKBgQDtX3wJeo/Ien/SnW9h\nRmRLTfHipDQx/BtOe108Rxc0uNBHhh9HqG0fO3FLDoYFV12Y5szAY8M43ZpPz8Yq\nV31YUrf8FpOOd8FlNUqZhLv58yWYe1UkRBK7NJyM9Ysq9RJ+regy7b1gAC/BRx6J\nY+uRSXsBibdfQwfU7j49pjifoQKBgQDSTE8Az+Dc/MOFknM662qlDUbrPt5wMlT6\nFYHfVGJWyEMSYaBb5IVUbbQ7VY+PUCQzbHSpkfzNG8Ry0t56kdmj90YSwoC1WPVz\n/9dXmf7g66NE8nIPjMj/OQ03jdhVwSrRSP3TnR91cugh29gHs1orniDBZCUmHohr\nNTTpxHxj6wKBgBVm95MPNumXifDeew1lQGO9ymJp9b7QAVJJMzXdHw2E4FqikC1w\n1S3suSFQVOskXm8L2Eg8dnypFmG91Rs6OjX9d1NGYdWFnK1Yabp/ykcWEjy2Wg3k\nCWBRtQ/Mj9i2sg0z9uyonNuMCMI/fFRc6v91hZ604RC4xXsAZCJA23ghAoGBALDk\nCxgtw4FfA7/ZHiATYZMQBfVe3pAVZjEt4h5OxqEktnZBtDdXk2cfGBlIsQblbG3s\n7nysFa8ZijbjdMw43o7zMfgZr1XbTCuUqjg/ior66kzWembmDzPPc3SlVbFcWH3O\nHePgKFQMoYHJgH+Jt3E1A2xopm7YA/vZt3ZjFhadAoGBAOO4XQMLtDWs+64wL71t\nG9Ucnn0mi2Qc3hFV/0jg1iqjsdRCRnSMgynZr/Ek0xAEaADOoiuTZTO9c2f5/sh2\n3mYxBardaEoE1Avqi3vjhvDhN81J0EQbsy8ZxLhOcjQBWwUBfN7lGrJtJLOOKf5c\nudUYdKIrUhg9/luqq6evX/w1\n-----END PRIVATE KEY-----\n',
  client_email: 'orah-sheets-sync@aigf-c4.iam.gserviceaccount.com',
  client_id: '109730867489181535846',
  token_uri: 'https://oauth2.googleapis.com/token',
};

async function getAccessToken(): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: SERVICE_ACCOUNT.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SERVICE_ACCOUNT.private_key);
  
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = SERVICE_ACCOUNT.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${encodedSignature}`;

  const tokenResponse = await fetch(SERVICE_ACCOUNT.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function fetchSheetData(accessToken: string, sheetId: string, tabName: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    const { sheetId, tabName } = await req.json();

    if (!sheetId || !tabName) {
      throw new Error('Missing sheetId or tabName');
    }

    const accessToken = await getAccessToken();
    const sheetData = await fetchSheetData(accessToken, sheetId, tabName);

    const rows = sheetData.values || [];
    if (rows.length === 0) {
      throw new Error('No data found in sheet');
    }

    const headers = rows[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, ' '));
    const dataRows = rows.slice(1);

    console.log('[SYNC] Headers found:', headers);
    console.log('[SYNC] Total data rows:', dataRows.length);

    const leadsToUpsert = dataRows
      .filter((row: any[]) => row.length > 0 && row.some(cell => cell && cell.toString().trim()))
      .map((row: any[]) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header: string, i: number) => {
          const value = row[i];
          if (value !== undefined && value !== null && value !== '') {
            rowData[header] = value.toString().trim();
          }
        });

        const findValue = (...keys: string[]) => {
          for (const key of keys) {
            if (rowData[key]) return rowData[key];
          }
          return null;
        };

        const callSummary = findValue('call summary', 'summary', 'call notes');
        const successEval = findValue('success evaluation', 'success', 'evaluation', 'outcome');
        const leadDate = findValue('lead creation date & time', 'date', 'created date', 'lead date');

        const notes = [
          callSummary ? `Call Summary: ${callSummary}` : '',
          successEval ? `Success: ${successEval}` : '',
          findValue('notes', 'remarks', 'comments', 'description') || ''
        ].filter(Boolean).join('\n\n');

        const lead = {
          company_id: userProfile.company_id,
          name: findValue('name', 'full name', 'fullname', 'customer name') || 'Unknown',
          mobile: findValue('mobile number', 'mobile', 'phone', 'phone number', 'contact') || '',
          email: findValue('email id', 'email', 'email address', 'e-mail') || '',
          budget: findValue('budget', 'price range', 'budget range'),
          possession_timeline: findValue('possession timeline', 'possession', 'timeline', 'possession date'),
          unit_preference: findValue('unit preference', 'unit type', 'unit', 'property type', 'bhk'),
          location_preference: findValue('location preference', 'location', 'area', 'locality', 'location interest'),
          source: 'google_sheets',
          status: 'new',
          notes: notes,
        };

        console.log('[SYNC] Processed lead:', { name: lead.name, mobile: lead.mobile });
        return lead;
      })
      .filter((lead) => {
        const hasMobile = lead.mobile && lead.mobile.trim().length > 0;
        if (!hasMobile) {
          console.log('[SYNC] Filtered out lead without mobile:', lead.name);
        }
        return hasMobile;
      });

    console.log('[SYNC] Leads to upsert:', leadsToUpsert.length);

    if (leadsToUpsert.length === 0) {
      const warningMsg = `No valid leads found. Sheet has ${dataRows.length} rows but none have valid mobile numbers. Headers: ${headers.join(', ')}`;
      console.warn('[SYNC]', warningMsg);

      await supabaseClient.from('sync_logs').insert({
        user_id: user.id,
        status: 'success',
        rows_synced: 0,
        duration_ms: Date.now() - startTime,
        error_message: warningMsg,
      });

      return new Response(
        JSON.stringify({
          success: true,
          rowsSynced: 0,
          duration: Date.now() - startTime,
          warning: warningMsg,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: upsertError } = await supabaseClient
      .from('leads')
      .upsert(leadsToUpsert, {
        onConflict: 'company_id,mobile',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('[SYNC] Upsert error:', upsertError);
      throw upsertError;
    }

    const duration = Date.now() - startTime;

    await supabaseClient.from('sync_logs').insert({
      user_id: user.id,
      status: 'success',
      rows_synced: leadsToUpsert.length,
      duration_ms: duration,
    });

    console.log('[SYNC] Successfully synced', leadsToUpsert.length, 'leads');

    return new Response(
      JSON.stringify({
        success: true,
        rowsSynced: leadsToUpsert.length,
        duration: duration,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: authHeader },
            },
          }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          await supabaseClient.from('sync_logs').insert({
            user_id: user.id,
            status: 'error',
            rows_synced: 0,
            error_message: errorMessage,
          });
        }
      } catch {}
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
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
  private_key_id: 'b3c30679e18a79a7b29f23ed967b8293788bc317',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWnJ4/c0y22Roa\nvhvaa0++RsrHu2NsozMs+ySyDi0pQHUHbqaEGIvnI1DwUjy5E4m6c5MfVOxxsSBx\n0ih1rVkQnj4bnILI6hHoZV3s0NOwL0EL6k/CxNkEvb6jwiPsUhy6L/BXIxNJzPyQ\nH6Dygo31UrZ9o3bPXn9l7Zx8nc4xNggzcnI0ljSiPDkkuft/um/mguUXhFBdDLYj\nK+6cnK/sxhOf2QQ1TkRXlxc6/Kjk0sSoU9EYYA+3eT8hueVdT8/1RryzSpXQSkkT\nbSEsOMzwzxrvgegWon82RmCIifpaulcPnovCxfIf2BKxMCKwLze8N/ctJ2YG8Cqb\nHNsZB82VAgMBAAECggEAKkTBDz6qhJXYZB1+12NM2q1POYzw/V/cT7bsKIyNvQL2\nub7DmZ9LCLxmL9sGni4YsYobVy+u/Qp1mS1a7ih08waztVT7Vk5xtfunBuIvW1NH\nRK1Cxdnm413quw6c7CnVAh+4frUIEsBGmy07kiAADSocCr1EBH44ac8lg87B4mOF\nXKZQm9j9tCwrD75g2wMuOdculkPCd9nimRpW4YzX9LgyzCjLMlDVndvKgcSq6CgL\nyDJjHAqOi/oZ3/oZvjgj2mGvRlPfxBWqy6i3N2Mt3h11Ir4oSzo6lmJZ4klJikCi\n4IHlxEfc29XeyZuaM0xP2ZPeKNQlJdiYzwqxZnUsoQKBgQDuOPQE8KMdQY1/zAAr\nlYJplMFO0xvOQMA+Vn3i81nrwr7uA8gpQQQA1Q7AEzv3Up8H2os0RtQ1Uj4/GZ9g\nYlaa/Dh/nMAwmowGniD0+tIvJ6RhqIgdAxMmnKrhECqqzFKhEhlMZ/MMsJ7eeEcY\ncaTTi+Fs4bL6rVJzHPb7v6EK4QKBgQDmoJoeWLU0y/eKlkOV3aJR88d1gQu9UKBL\nGJjYJuia6QHWFj7Z2fI8b4Jyn3Tg20ho4+8Nh/ouvqUTPQiUwE9EGuUfIovrrwse\nt7A+I8wlhbVP5TU45jOJoo7sZUE7gRf5erTJbIg7Ycq8h8I+1CGPlKyPtIyKr7s0\nl4d8pactNQKBgHI+8hgkZ7WyKHAvn61HSIHmC0cIS3+A4jGDPWBIIMnGXda8DZRr\nT8YuZ6KKFuonv4j+sF/j0AW6aYvNd/e7cZlmeJoKzMkCdUD/OQMD/yUKN/V148E2\nJksQO4swO6Yp0z7X9TYFbDSbx7Udrcr1RX0GypdzLmi2EqKOM4zMfClBAoGBAIH+\nTGCGh7z2qtTG1dmHT5L54Zdt4XwYEgHCH4TWiY2ngI13hH2ux0chY1nQX0TO1QWq\nVHhACNiIROuPH2MY8pTkw/jEtDFoPNBXoVOlQdB0iTo7a8BioPIXWpAMkrRDk4vf\nij9umWs/N9MEgox/bVtM5ecqUX1qiA6gypGLnatxAoGBANGxM2K26pxq/Mp1tMiA\nI0Eg26/wI1c5yYjn4cywNlA6zye6uPBizanl7Tf2/FGXwYDTwi6FqEQdNk7d9oex\nno/f4Pt1Eh5Y/uKsfDsWPKkxNz2szSYTVnrpcsanQYMJvpe9p555VAhk4TnP00Uz\n1FkUvrgTSyPtVNkBfUq15SJ+\n-----END PRIVATE KEY-----\n',
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

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error('[AUTH] Token error:', tokenData);
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  console.log('[AUTH] Access token obtained successfully');
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
    const errorBody = await response.text();
    console.error('[SHEETS_API] Error:', response.status, errorBody);
    throw new Error(`Failed to fetch sheet data: ${response.statusText} - ${errorBody}`);
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

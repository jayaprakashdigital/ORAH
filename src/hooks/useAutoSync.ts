import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SheetConfig {
  sheet_id: string;
  tab_name: string;
}

export function useAutoSync(enabled: boolean = true) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);

  const loadSheetConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[AUTO_SYNC] No session found');
        return;
      }

      const { data, error } = await supabase
        .from('sheet_configs')
        .select('sheet_id, tab_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('[AUTO_SYNC] Error loading config:', error);
        return;
      }

      if (data) {
        console.log('[AUTO_SYNC] Config loaded:', { sheetId: data.sheet_id, tabName: data.tab_name });
        setSheetConfig(data);
      } else {
        console.log('[AUTO_SYNC] No sheet config found. Please configure in Integrations page.');
      }
    } catch (error) {
      console.error('[AUTO_SYNC] Error loading config:', error);
    }
  };

  const syncNow = async () => {
    if (syncing) {
      console.log('[AUTO_SYNC] Sync already in progress');
      return;
    }

    if (!sheetConfig) {
      console.log('[AUTO_SYNC] No sheet config available');
      return;
    }

    try {
      setSyncing(true);
      console.log('[AUTO_SYNC] Starting sync...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[AUTO_SYNC] No session');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-sheets`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: sheetConfig.sheet_id,
          tabName: sheetConfig.tab_name,
        }),
      });

      const result = await response.json();
      console.log('[AUTO_SYNC] Sync result:', result);

      if (result.success) {
        setLastSync(new Date());
        console.log('[AUTO_SYNC] Sync completed successfully. Rows synced:', result.rowsSynced);
      } else {
        console.error('[AUTO_SYNC] Sync failed:', result.error);
      }
    } catch (error) {
      console.error('[AUTO_SYNC] Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadSheetConfig();
  }, []);

  useEffect(() => {
    if (!enabled || !sheetConfig) return;

    syncNow();

    intervalRef.current = setInterval(() => {
      syncNow();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, sheetConfig]);

  return { syncing, lastSync, syncNow };
}

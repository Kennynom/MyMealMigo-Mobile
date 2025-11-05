import contentManifest from '@/assets/data/content_manifest.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

const CACHE_KEY = "dailyContent:cache:v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h

function idxForToday() {
  const d = new Date().getDate(); // 1..31
  return Math.max(0, Math.min(29, d - 1)); // clamp to 0..29
}

export function useDailyContent({ tag = null } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(0);

  const filtered = useMemo(() => {
    if (!tag) return items;
    return items.filter(x => (x.tags || []).includes(tag));
  }, [items, tag]);

  const current = useMemo(() => {
    if (!filtered.length) return null;
    const base = idxForToday() % filtered.length;
    const ix = (base + cursor) % filtered.length;
    return filtered[ix];
  }, [filtered, cursor]);

  const next = () => setCursor(c => (c + 1 + filtered.length) % filtered.length);
  const prev = () => setCursor(c => (c - 1 + filtered.length) % filtered.length);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);

      // cheap cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.ts < CACHE_TTL_MS && cached.data?.length) {
            if (mounted) setItems(cached.data);
          }
        }
      } catch {}

      // bundled JSON (always works, offline too)
      if (mounted && Array.isArray(contentManifest) && contentManifest.length) {
        setItems(contentManifest);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: contentManifest }));
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return { current, all: filtered, loading, next, prev };
}
